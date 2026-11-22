import { ObjectId } from "mongodb";

/**
 * Crédits de prospection achetés à l'unité (paiement Stripe ponctuel).
 *
 * Ouvert à l'offre Entreprise seulement : en Standard et en Premium, on passe
 * d'abord à l'offre au-dessus. Le prix est celui du tarif Stripe
 * STRIPE_PROSPECT_CREDIT_PRICE_ID (paiement unique, prix d'UN crédit) :
 * sans lui, l'achat n'est pas proposé.
 *
 * L'achat est enregistré une seule fois par session de paiement, par le
 * webhook Stripe ou au retour de Checkout (le premier arrivé), dans
 * `prospect_credit_purchases`, que l'API lit pour le solde de l'espace.
 */
export const PROSPECT_CREDIT_PURCHASES = "prospect_credit_purchases";
export const PROSPECT_CREDITS_PURPOSE = "prospect_credits";
export const PROSPECT_CREDITS_PLAN = "entreprise";
export const MIN_PROSPECT_CREDITS = 25;
export const MAX_PROSPECT_CREDITS = 1000;

export class ProspectCreditsError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function prospectCreditPriceId() {
  return process.env.STRIPE_PROSPECT_CREDIT_PRICE_ID || null;
}

// Prix d'un crédit relu chez Stripe au plus toutes les 10 minutes
let priceCache = { at: 0, id: null, value: null };

/** { unitAmount (centimes), currency, taxBehavior } ou null si non configuré. */
export async function getProspectCreditPrice(stripe) {
  const id = prospectCreditPriceId();
  if (!id) return null;
  if (priceCache.id === id && Date.now() - priceCache.at < 10 * 60 * 1000) {
    return priceCache.value;
  }
  const price = await stripe.prices.retrieve(id);
  const value =
    price?.active && price.type === "one_time" && price.unit_amount > 0
      ? {
          unitAmount: price.unit_amount,
          currency: price.currency,
          taxBehavior: price.tax_behavior || null,
        }
      : null;
  priceCache = { at: Date.now(), id, value };
  return value;
}

/** Nombre de crédits demandé, entier et dans les bornes, sinon null. */
export function readCreditQuantity(value) {
  const n = Number(value);
  return Number.isInteger(n) &&
    n >= MIN_PROSPECT_CREDITS &&
    n <= MAX_PROSPECT_CREDITS
    ? n
    : null;
}

const PAID_STATUSES = ["active", "past_due"];

/**
 * Offre payée de l'espace (« freelance », « pme », « entreprise »), null
 * pendant l'essai ou sans abonnement. Même règle que l'API
 * (prospectQuota.getPaidPlan) : résilié mais encore dans la période payée,
 * le plan reste acquis.
 */
export async function getPaidPlan(mongoDb, organizationId) {
  const id = String(organizationId || "");
  if (!id) return null;
  const refs = [{ referenceId: id }, { organizationId: id }];
  if (ObjectId.isValid(id)) {
    const oid = new ObjectId(id);
    refs.push({ referenceId: oid }, { organizationId: oid });
  }
  const subscriptions = await mongoDb
    .collection("subscription")
    .find({ $or: refs }, { projection: { plan: 1, status: 1, periodEnd: 1 } })
    .toArray();
  const now = new Date();
  const paid =
    subscriptions.find((s) => PAID_STATUSES.includes(s.status)) ||
    subscriptions.find(
      (s) =>
        s.status === "canceled" && s.periodEnd && new Date(s.periodEnd) > now,
    );
  return paid?.plan?.toLowerCase() || null;
}

/**
 * Enregistre les crédits d'une session Checkout payée, une seule fois
 * (index unique sur la session). Renvoie { credits, created } ou null si la
 * session n'est pas un achat de crédits payé.
 */
export async function recordProspectCreditPurchase(mongoDb, session) {
  const meta = session?.metadata || {};
  if (
    meta.purpose !== PROSPECT_CREDITS_PURPOSE ||
    session.mode !== "payment" ||
    session.payment_status !== "paid"
  ) {
    return null;
  }
  const credits = Number(meta.credits);
  if (!Number.isInteger(credits) || credits < 1) return null;
  if (!ObjectId.isValid(meta.organizationId)) return null;

  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;
  const now = new Date();
  const result = await mongoDb.collection(PROSPECT_CREDIT_PURCHASES).updateOne(
    { stripeCheckoutSessionId: session.id },
    {
      $setOnInsert: {
        stripeCheckoutSessionId: session.id,
        workspaceId: new ObjectId(meta.organizationId),
        credits,
        amountTotal: session.amount_total ?? null,
        currency: session.currency || "eur",
        status: "paid",
        stripePaymentIntentId: paymentIntent,
        userId: ObjectId.isValid(meta.userId)
          ? new ObjectId(meta.userId)
          : null,
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true },
  );
  return { credits, created: Boolean(result.upsertedCount) };
}

/**
 * Achat de crédits remboursé en entier (`charge.refunded`) ou contesté par
 * la banque du client (`charge.dispute.created`) : l'achat passe en
 * « refunded » et ses crédits sortent du solde de l'espace (ceux déjà
 * dépensés le restent). Contestation gagnée ensuite ou remboursement
 * partiel : rien d'automatique, à traiter à la main.
 * Renvoie null si le paiement n'est pas un achat de crédits.
 */
export async function handleProspectCreditsRefund(mongoDb, event) {
  const object = event?.data?.object || {};
  const paymentIntentId =
    typeof object.payment_intent === "string"
      ? object.payment_intent
      : object.payment_intent?.id || null;
  if (!paymentIntentId) return null;

  const purchases = mongoDb.collection(PROSPECT_CREDIT_PURCHASES);
  const purchase = await purchases.findOne({
    stripePaymentIntentId: paymentIntentId,
  });
  if (!purchase) return null;

  const full =
    event.type === "charge.dispute.created" ||
    (Number.isFinite(object.amount) &&
      Number(object.amount_refunded) >= object.amount);
  if (!full) {
    return { credits: purchase.credits, refunded: false, partial: true };
  }
  if (purchase.status !== "refunded") {
    const now = new Date();
    await purchases.updateOne(
      { _id: purchase._id, status: { $ne: "refunded" } },
      { $set: { status: "refunded", refundedAt: now, updatedAt: now } },
    );
  }
  return { credits: purchase.credits, refunded: true, partial: false };
}
