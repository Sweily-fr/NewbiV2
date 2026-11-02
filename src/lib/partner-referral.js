/**
 * Programme partenaire : code ?partner= rattaché au compte à l'inscription,
 * puis commission à chaque paiement d'abonnement du filleul.
 *
 * Les commissions sont écrites dans la collection lue par l'API
 * (newbi-api, modèle PartnerCommission : statistiques et retraits des
 * partenaires). Paliers identiques à ceux de l'API (resolvers/partner.js).
 */
import { ObjectId } from "mongodb";
import { normalizePartnerCode } from "./partner-code";

export { normalizePartnerCode };

export const COMMISSION_TIERS = [
  { name: "Bronze", percentage: 20, minRevenue: 0, maxRevenue: 1000 },
  { name: "Argent", percentage: 25, minRevenue: 1001, maxRevenue: 5000 },
  { name: "Or", percentage: 30, minRevenue: 5001, maxRevenue: 10000 },
  { name: "Platine", percentage: 50, minRevenue: 10000, maxRevenue: null },
];

export function calculateCommissionTier(totalRevenue) {
  for (let i = COMMISSION_TIERS.length - 1; i >= 0; i--) {
    const tier = COMMISSION_TIERS[i];
    if (
      totalRevenue >= tier.minRevenue &&
      (tier.maxRevenue === null || totalRevenue < tier.maxRevenue)
    ) {
      return tier;
    }
  }
  return COMMISSION_TIERS[0];
}

/** Code d'un partenaire existant, sinon null. */
export async function resolvePartnerCode(mongoDb, raw) {
  const code = normalizePartnerCode(raw);
  if (!code) return null;
  const partner = await mongoDb
    .collection("user")
    .findOne(
      { referralCode: code, isPartner: true },
      { projection: { _id: 1 } },
    );
  return partner ? code : null;
}

/**
 * Commission du partenaire qui a apporté le propriétaire de l'espace
 * abonné. Appelée sur invoice.paid (déjà dédupliqué par événement) ; une
 * facture Stripe ne donne jamais deux commissions.
 */
export async function recordPartnerCommission({
  mongoDb,
  invoice,
  subscription = null,
}) {
  const amountPaid = Number(invoice?.amount_paid);
  if (
    !invoice?.subscription ||
    !Number.isFinite(amountPaid) ||
    amountPaid <= 0
  ) {
    return { status: "ignored" };
  }
  const commissions = mongoDb.collection("partnercommissions");
  if (await commissions.findOne({ stripeInvoiceId: invoice.id })) {
    return { status: "duplicate" };
  }

  const sub = await mongoDb
    .collection("subscription")
    .findOne({ stripeSubscriptionId: invoice.subscription });
  if (!sub?.referenceId || !ObjectId.isValid(String(sub.referenceId))) {
    return { status: "ignored" };
  }
  const owner = await mongoDb.collection("member").findOne({
    organizationId: new ObjectId(String(sub.referenceId)),
    role: "owner",
  });
  if (!owner?.userId) return { status: "ignored" };
  const referral = await mongoDb
    .collection("user")
    .findOne(
      { _id: new ObjectId(String(owner.userId)) },
      { projection: { _id: 1, referredBy: 1 } },
    );
  const code = normalizePartnerCode(referral?.referredBy);
  if (!code) return { status: "ignored" };
  const partner = await mongoDb
    .collection("user")
    .findOne(
      { referralCode: code, isPartner: true },
      { projection: { _id: 1 } },
    );
  if (!partner || String(partner._id) === String(referral._id)) {
    return { status: "ignored" };
  }

  const confirmed = await commissions
    .find(
      { partnerId: partner._id, status: { $in: ["confirmed", "paid"] } },
      { projection: { paymentAmount: 1 } },
    )
    .toArray();
  const totalRevenue = confirmed.reduce(
    (sum, c) => sum + (Number(c.paymentAmount) || 0),
    0,
  );
  const tier = calculateCommissionTier(totalRevenue);
  const paymentAmount = amountPaid / 100;
  const interval =
    subscription?.items?.data?.[0]?.price?.recurring?.interval || "month";
  const now = new Date();
  await commissions.insertOne({
    partnerId: partner._id,
    referralId: referral._id,
    subscriptionId: sub._id,
    stripeInvoiceId: invoice.id,
    paymentAmount,
    commissionRate: tier.percentage,
    commissionAmount: Math.round(paymentAmount * tier.percentage) / 100,
    subscriptionType: interval === "year" ? "annual" : "monthly",
    status: "confirmed",
    generatedAt: now,
    confirmedAt: now,
    notes: `Paiement Stripe: ${invoice.id}`,
    createdAt: now,
    updatedAt: now,
  });
  return { status: "created", rate: tier.percentage };
}
