import { ObjectId } from "mongodb";
import { ManagedClientError } from "./managed-client-error.js";
import { isAppTrialEnabled } from "./feature-flags.js";
import { countAdditionalSeats } from "./cabinet-members.js";

/**
 * Abonnements payés par un gestionnaire (cabinet) pour les espaces de ses
 * clients dont il a coché « Je paierai ».
 *
 * Un abonnement Stripe par espace, comme partout dans Newbi : le document
 * `subscription` de l'espace (referenceId = id de l'espace) est le même que
 * pour un client qui paie lui-même, donc tous les contrôles d'accès restent
 * inchangés. Ce qui change :
 * - le client Stripe est celui du cabinet (`accountmanagers.stripeCustomerId`),
 *   distinct de son compte Newbi personnel : factures au nom du cabinet, et
 *   le webhook natif de Better Auth (qui cherche un utilisateur par client
 *   Stripe) ne crée pas de doublon ;
 * - la remise du cabinet s'applique par un coupon Stripe « pour toujours » ;
 * - pendant l'essai de l'espace, rien n'est prélevé avant sa fin (même
 *   conversion que pour un client, « Pattern A » de create-org-subscription).
 *
 * La première fois, le cabinet passe par Stripe Checkout (sa carte est
 * enregistrée) ; ensuite l'abonnement est créé directement avec sa carte,
 * sauf si sa banque demande une validation (page de facture Stripe).
 */

export const MANAGED_PLANS = ["freelance", "pme", "entreprise"];

// Abonnement Stripe en cours (pas encore terminé ou abandonné)
export const LIVE_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "incomplete",
  "unpaid",
];

/** Offre d'un abonnement Stripe d'après son prix (métadonnées absentes). */
export function planFromPriceId(priceId) {
  if (!priceId) return null;
  return (
    MANAGED_PLANS.find((plan) =>
      [priceIdFor(plan, false), priceIdFor(plan, true)].includes(priceId),
    ) || null
  );
}

export function priceIdFor(plan, isAnnual) {
  const prices = {
    freelance: [
      process.env.STRIPE_FREELANCE_MONTHLY_PRICE_ID,
      process.env.STRIPE_FREELANCE_YEARLY_PRICE_ID,
    ],
    pme: [
      process.env.STRIPE_PME_MONTHLY_PRICE_ID,
      process.env.STRIPE_PME_YEARLY_PRICE_ID,
    ],
    entreprise: [
      process.env.STRIPE_ENTREPRISE_MONTHLY_PRICE_ID,
      process.env.STRIPE_ENTREPRISE_YEARLY_PRICE_ID,
    ],
  };
  return prices[plan]?.[isAnnual ? 1 : 0] || null;
}

const asObjectId = (value) =>
  value instanceof ObjectId
    ? value
    : typeof value === "string" && /^[0-9a-f]{24}$/i.test(value)
      ? new ObjectId(value)
      : null;

const toDate = (unix) => (unix ? new Date(unix * 1000) : null);

// Période en cours : sur l'abonnement (API Stripe < 2025-03) ou sur sa
// première ligne (versions récentes)
export function currentPeriod(stripeSubscription) {
  const item = stripeSubscription.items?.data?.[0];
  return {
    start: toDate(
      stripeSubscription.current_period_start ?? item?.current_period_start,
    ),
    end: toDate(
      stripeSubscription.current_period_end ?? item?.current_period_end,
    ),
  };
}

/**
 * Ce client Stripe est-il celui d'un gestionnaire ? Sert à empêcher un
 * client d'agir sur l'abonnement que son cabinet paie (portail, factures,
 * résiliation, changement d'offre).
 */
export async function findManagerByStripeCustomerId(mongoDb, customerId) {
  if (typeof customerId !== "string" || !customerId) return null;
  return mongoDb
    .collection("accountmanagers")
    .findOne(
      { stripeCustomerId: customerId },
      { projection: { name: 1, userId: 1, status: 1 } },
    );
}

/**
 * Abonnement en cours d'un espace payé par un gestionnaire, avec ce
 * gestionnaire ; null si l'espace paie lui-même ou n'a pas d'abonnement.
 */
export async function findManagerPaidSubscription(mongoDb, organizationId) {
  if (typeof organizationId !== "string" || !organizationId) return null;
  // Tous les documents vivants : si l'un d'eux est sur le client Stripe
  // d'un cabinet, l'espace est payé par ce cabinet (le portail Stripe de
  // Better Auth prend le premier document actif, pas le plus récent)
  const subscriptions = await mongoDb
    .collection("subscription")
    .find(
      { referenceId: organizationId, status: { $in: LIVE_STATUSES } },
      {
        projection: {
          stripeCustomerId: 1,
          stripeSubscriptionId: 1,
          status: 1,
          plan: 1,
          cancelAtPeriodEnd: 1,
          currentPeriodEnd: 1,
          periodEnd: 1,
        },
      },
    )
    .toArray();
  for (const subscription of subscriptions) {
    if (!subscription.stripeCustomerId) continue;
    const manager = await findManagerByStripeCustomerId(
      mongoDb,
      subscription.stripeCustomerId,
    );
    if (manager) return { subscription, manager };
  }
  return null;
}

/**
 * L'abonnement de l'espace est-il (ou sera-t-il) payé par un cabinet ? Soit
 * un abonnement en cours sur le client Stripe d'un cabinet, soit une fiche
 * active où le cabinet a coché « Je paierai » (offre pas encore choisie).
 * Sert à refuser au client de souscrire lui-même (double abonnement).
 */
export async function isOrgPaidByManager(mongoDb, organizationId) {
  const orgOid = asObjectId(organizationId);
  if (!orgOid) return false;
  const link = await mongoDb
    .collection("managedclients")
    .findOne(
      { organizationId: orgOid, status: "active", payer: "manager" },
      { projection: { _id: 1 } },
    );
  if (link) return true;
  return Boolean(await findManagerPaidSubscription(mongoDb, String(orgOid)));
}

/** Retire de la liste les clients Stripe des gestionnaires. */
export async function withoutManagerCustomers(mongoDb, customerIds) {
  if (customerIds.length === 0) return customerIds;
  const managers = await mongoDb
    .collection("accountmanagers")
    .find(
      { stripeCustomerId: { $in: customerIds } },
      { projection: { stripeCustomerId: 1 } },
    )
    .toArray();
  const excluded = new Set(managers.map((m) => m.stripeCustomerId));
  return customerIds.filter((id) => !excluded.has(id));
}

/**
 * Client Stripe du cabinet, créé à la première souscription. La clé
 * d'idempotence évite deux clients Stripe si deux souscriptions partent en
 * même temps ; en base, le premier enregistré l'emporte.
 */
export async function getOrCreateManagerCustomer({ mongoDb, stripe, manager }) {
  if (manager.stripeCustomerId) return manager.stripeCustomerId;

  const stored = await mongoDb
    .collection("accountmanagers")
    .findOne({ _id: manager._id }, { projection: { stripeCustomerId: 1 } });
  if (stored?.stripeCustomerId) return stored.stripeCustomerId;

  const user = await mongoDb
    .collection("user")
    .findOne({ _id: manager.userId }, { projection: { email: 1 } });
  const customer = await stripe.customers.create(
    {
      name: manager.name,
      email: user?.email || undefined,
      preferred_locales: ["fr"],
      metadata: { accountManagerId: String(manager._id) },
    },
    { idempotencyKey: `account-manager-customer-${manager._id}` },
  );

  const result = await mongoDb
    .collection("accountmanagers")
    .updateOne(
      { _id: manager._id, stripeCustomerId: { $in: [null, ""] } },
      { $set: { stripeCustomerId: customer.id, updatedAt: new Date() } },
    );
  if (result.matchedCount === 0) {
    const winner = await mongoDb
      .collection("accountmanagers")
      .findOne({ _id: manager._id }, { projection: { stripeCustomerId: 1 } });
    if (winner?.stripeCustomerId) return winner.stripeCustomerId;
  }
  return customer.id;
}

/**
 * Coupon Stripe de la remise du cabinet (un par pourcentage, partagé par
 * tous les cabinets qui ont ce pourcentage). null sans remise.
 */
export async function getManagerCoupon({ stripe, percent }) {
  const value = Number(percent) || 0;
  if (value <= 0) return null;
  const pct = Math.min(100, Math.round(value * 100) / 100);
  const id = `NEWBI_CABINET_${String(pct).replace(".", "_")}`;
  try {
    await stripe.coupons.retrieve(id);
    return id;
  } catch (error) {
    if (error?.code !== "resource_missing") throw error;
  }
  try {
    await stripe.coupons.create({
      id,
      percent_off: pct,
      duration: "forever",
      name: `Remise cabinet ${String(pct).replace(".", ",")} %`,
    });
  } catch (error) {
    // Créé entre-temps par une autre souscription
    if (error?.code !== "resource_already_exists") throw error;
  }
  return id;
}

/** Ferme les paiements Stripe encore ouverts pour ce client du cabinet. */
async function expireOpenCheckouts(stripe, customerId, managedClientId) {
  try {
    const { data } = await stripe.checkout.sessions.list({
      customer: customerId,
      status: "open",
      limit: 100,
    });
    await Promise.all(
      data
        .filter(
          (session) => session.metadata?.managedClientId === managedClientId,
        )
        .map((session) => stripe.checkout.sessions.expire(session.id)),
    );
  } catch (error) {
    console.error(
      "[MANAGER-BILLING] Paiements ouverts non fermés:",
      error?.message,
    );
  }
}

// Liste Stripe complète (au-delà de 100) ; les simulations de test
// renvoient une simple page
async function listAll(list) {
  if (typeof list?.autoPagingToArray === "function") {
    return list.autoPagingToArray({ limit: 1000 });
  }
  return (await list).data;
}

/** Carte enregistrée du cabinet, ou null. */
export async function savedCard(stripe, customerId) {
  const customer = await stripe.customers.retrieve(customerId);
  const defaultMethod = customer?.invoice_settings?.default_payment_method;
  if (defaultMethod) {
    return typeof defaultMethod === "string" ? defaultMethod : defaultMethod.id;
  }
  const { data } = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
    limit: 1,
  });
  return data[0]?.id || null;
}

/**
 * Garde la trace d'un abonnement Stripe encore en cours que le document de
 * l'espace ne suit plus (le payeur a changé) : ses derniers événements
 * Stripe (fin de période, résiliation) retrouvent ce document. Sans lui, le
 * webhook natif de Better Auth, qui ne trouve pas l'abonnement, prend le
 * document d'un autre espace du même client Stripe (un cabinet en paie
 * plusieurs) et l'écrase. Invisible pour l'espace : referenceId propre
 * (index unique), sans organizationId.
 */
export async function archiveReplacedSubscription(mongoDb, doc, replacedBy) {
  if (!doc?.stripeSubscriptionId || !doc.referenceId) return;
  const subscriptions = mongoDb.collection("subscription");
  const exists = await subscriptions.findOne(
    { stripeSubscriptionId: doc.stripeSubscriptionId },
    { projection: { _id: 1 } },
  );
  if (exists) return;
  const now = new Date();
  const _id = new ObjectId();
  try {
    await subscriptions.insertOne({
      _id,
      id: _id.toString(),
      referenceId: `replaced:${doc.referenceId}:${doc.stripeSubscriptionId}`,
      replacedOrganizationId: String(doc.referenceId),
      replacedBy: replacedBy || null,
      plan: doc.plan || null,
      stripeCustomerId: doc.stripeCustomerId || null,
      stripeSubscriptionId: doc.stripeSubscriptionId,
      status: doc.status,
      seats: doc.seats || 1,
      cancelAtPeriodEnd: Boolean(doc.cancelAtPeriodEnd),
      periodStart: doc.periodStart || null,
      periodEnd: doc.periodEnd || null,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    // Course avec un autre appel : la trace existe déjà
    if (error?.code !== 11000) throw error;
  }
}

/**
 * Écrit (ou met à jour) le document `subscription` de l'espace à partir de
 * l'abonnement Stripe, comme le fait le webhook : la souscription est
 * visible tout de suite, sans attendre le webhook (qui retrouvera ce
 * document par stripeSubscriptionId et le mettra à jour).
 *
 * Un espace n'a qu'un document `subscription` (toutes les lectures le
 * prennent sans tri) : quand le payeur change, le document passe d'un
 * abonnement Stripe à l'autre. `replaceSubscriptionId` est l'abonnement
 * encore vivant que celui-ci remplace (sinon, un abonnement vivant n'est
 * jamais écrasé).
 */
export async function syncManagedSubscription(
  mongoDb,
  stripeSubscription,
  { replaceSubscriptionId = null } = {},
) {
  const referenceId =
    stripeSubscription.metadata?.referenceId ||
    stripeSubscription.metadata?.organizationId;
  const orgOid = asObjectId(referenceId);
  if (!orgOid) return null;

  const now = new Date();
  const period = currentPeriod(stripeSubscription);
  const price = stripeSubscription.items?.data?.[0]?.price;
  const fields = {
    plan:
      stripeSubscription.metadata?.planName ||
      planFromPriceId(price?.id) ||
      "freelance",
    referenceId,
    stripeCustomerId:
      typeof stripeSubscription.customer === "string"
        ? stripeSubscription.customer
        : stripeSubscription.customer?.id,
    stripeSubscriptionId: stripeSubscription.id,
    status: stripeSubscription.status,
    seats: 1,
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
    periodStart: period.start || now,
    periodEnd: period.end,
    currentPeriodStart: period.start || now,
    currentPeriodEnd: period.end,
    billingInterval: price?.recurring?.interval || null,
    paidByAccountManagerId: asObjectId(
      stripeSubscription.metadata?.paidByAccountManagerId,
    ),
    updatedAt: now,
  };

  const subscriptions = mongoDb.collection("subscription");
  // Un document par espace (index unique sur referenceId). Même abonnement
  // Stripe : mise à jour. Sinon, on ne remplace qu'un document terminé, ou
  // l'abonnement nommé par replaceSubscriptionId : un autre abonnement
  // encore vivant (celui du client, un second paiement du cabinet) n'est
  // jamais écrasé.
  const elsewhere = await subscriptions.findOne(
    {
      stripeSubscriptionId: stripeSubscription.id,
      referenceId: { $ne: referenceId },
      replacedOrganizationId: { $exists: false },
    },
    { projection: { referenceId: 1 } },
  );
  if (elsewhere) {
    console.error(
      `[MANAGER-BILLING] Abonnement ${stripeSubscription.id} déjà enregistré pour l'espace ${elsewhere.referenceId}, pas pour ${referenceId}`,
    );
    return null;
  }
  const current = await subscriptions.findOne(
    { referenceId },
    { sort: { updatedAt: -1 } },
  );
  const replacing =
    current &&
    current.stripeSubscriptionId &&
    current.stripeSubscriptionId !== stripeSubscription.id;
  if (
    replacing &&
    LIVE_STATUSES.includes(current.status) &&
    current.stripeSubscriptionId !== replaceSubscriptionId
  ) {
    console.error(
      `[MANAGER-BILLING] Espace ${referenceId} déjà abonné : abonnement ${stripeSubscription.id} non enregistré (double paiement à vérifier)`,
    );
    return null;
  }
  // Abonnement repris (retour au client) : sa trace d'abonnement remplacé
  // s'efface, l'identifiant Stripe est unique
  await subscriptions.deleteMany({
    stripeSubscriptionId: stripeSubscription.id,
    replacedOrganizationId: { $exists: true },
  });
  if (current) {
    await subscriptions.updateOne({ _id: current._id }, { $set: fields });
    if (replacing && LIVE_STATUSES.includes(current.status)) {
      await archiveReplacedSubscription(
        mongoDb,
        current,
        stripeSubscription.id,
      );
    }
  } else {
    const _id = new ObjectId();
    await subscriptions.insertOne({
      _id,
      id: _id.toString(),
      ...fields,
      createdAt: now,
    });
  }

  // Choisie pendant l'essai : l'essai Newbi s'arrête, l'abonnement Stripe
  // reste « trialing » jusqu'à la même date (aucun prélèvement avant)
  if (
    stripeSubscription.status === "trialing" &&
    stripeSubscription.metadata?.convertedFromAppTrial === "true"
  ) {
    await mongoDb.collection("organization").updateOne(
      { _id: orgOid },
      {
        $set: {
          isTrialActive: false,
          hasUsedTrial: true,
          stripeTrialActive: false,
          convertedTrialBillingStartsAt: toDate(
            stripeSubscription.trial_end,
          )?.toISOString(),
          updatedAt: now,
        },
      },
    );
  }
  return referenceId;
}

const frenchDate = (date) =>
  date.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });

/**
 * Crée l'abonnement Stripe d'un espace au nom du cabinet : son client
 * Stripe, sa remise (coupon « pour toujours ») et les utilisateurs
 * supplémentaires de l'espace. Avec la carte enregistrée du cabinet,
 * l'abonnement est créé directement ; sinon, le cabinet passe par Stripe
 * Checkout (sa carte y est enregistrée pour les fois suivantes).
 *
 * `billingStartsAt` reporte le premier prélèvement (fin de l'essai de
 * l'espace, fin de la période que le client a déjà payée) : l'abonnement
 * reste « trialing » jusque-là, l'accès est complet tout de suite.
 *
 * N'écrit rien en base : l'appelant enregistre l'abonnement (choix d'une
 * offre) ou termine la reprise (changement de payeur).
 * @returns {Promise<
 *   { status: "active" | "incomplete", subscription: object } |
 *   { status: "redirect", url: string, subscription?: object }
 * >} « redirect » : Stripe Checkout, ou page de facture Stripe quand la
 *   banque demande une validation (l'abonnement est alors « incomplete »).
 */
export async function createCabinetSubscription({
  mongoDb,
  stripe,
  manager,
  link,
  org,
  plan,
  isAnnual,
  baseUrl,
  billingStartsAt = null,
  convertedFromAppTrial = false,
  metadata: extraMetadata = {},
  describeFirstCharge = null,
}) {
  const priceId = priceIdFor(plan, Boolean(isAnnual));
  if (!priceId) {
    throw new ManagedClientError(500, "Cette offre n'est pas configurée.");
  }
  const organizationId = String(link.organizationId);
  const trialEndUnix =
    billingStartsAt && billingStartsAt.getTime() > Date.now() + 60_000
      ? Math.floor(billingStartsAt.getTime() / 1000)
      : null;

  const seatPriceId = process.env.STRIPE_SEAT_PRICE_ID;
  const [customerId, coupon, seats] = await Promise.all([
    getOrCreateManagerCustomer({ mongoDb, stripe, manager }),
    getManagerCoupon({ stripe, percent: manager.discountPercent }),
    // Utilisateurs au-delà de l'offre, au même prix mensuel que pour un
    // client (une offre annuelle ne peut pas porter un prix mensuel : ils
    // sont alors ajoutés par la synchronisation des sièges, comme ailleurs)
    !isAnnual && seatPriceId
      ? countAdditionalSeats(mongoDb, organizationId, plan).catch((error) => {
          console.error(
            "[MANAGER-BILLING] Utilisateurs supplémentaires non comptés:",
            error?.message,
          );
          return 0;
        })
      : 0,
  ]);
  const seatItems = seats > 0 ? [{ price: seatPriceId, quantity: seats }] : [];

  const metadata = {
    referenceId: organizationId,
    organizationId: organizationId,
    planName: plan,
    isAnnual: isAnnual ? "true" : "false",
    isNewOrganization: "false",
    paidByAccountManagerId: String(manager._id),
    managedClientId: String(link._id),
    discountPercent: String(Number(manager.discountPercent) || 0),
    convertedFromAppTrial:
      trialEndUnix && convertedFromAppTrial ? "true" : "false",
    appTrialEndDate:
      trialEndUnix && convertedFromAppTrial
        ? billingStartsAt.toISOString()
        : "",
    ...extraMetadata,
  };
  const discounts = coupon ? [{ coupon }] : undefined;
  const orgName = org?.companyName || org?.name || "Espace";

  // Un seul paiement Stripe ouvert par client : celui d'un autre onglet est
  // fermé, il ne pourra plus aboutir à un second abonnement
  await expireOpenCheckouts(stripe, customerId, String(link._id));

  const paymentMethod = await savedCard(stripe, customerId);
  if (paymentMethod) {
    const subscription = await stripe.subscriptions.create(
      {
        customer: customerId,
        items: [{ price: priceId }, ...seatItems],
        default_payment_method: paymentMethod,
        discounts,
        description: `Newbi ${orgName}`,
        metadata,
        ...(trialEndUnix ? { trial_end: trialEndUnix } : {}),
        expand: ["latest_invoice"],
      },
      {
        idempotencyKey: `managed-sub-${link._id}-${plan}-${metadata.isAnnual}${extraMetadata.payerHandover ? `-${extraMetadata.payerHandover}` : ""}-${Math.floor(Date.now() / 60_000)}`,
      },
    );
    if (subscription.status === "incomplete") {
      // La banque demande une validation : le cabinet la fait sur la page
      // de facture Stripe
      const url = subscription.latest_invoice?.hosted_invoice_url;
      if (url) return { status: "redirect", url, subscription };
      return { status: "incomplete", subscription };
    }
    return { status: "active", subscription };
  }

  // Stripe Checkout refuse une fin d'essai à moins de 48 h : le premier
  // prélèvement a alors lieu dès la validation
  const checkoutTrialEnd =
    trialEndUnix && trialEndUnix * 1000 > Date.now() + 49 * 3600_000
      ? trialEndUnix
      : null;
  const checkoutMetadata = {
    ...metadata,
    convertedFromAppTrial:
      checkoutTrialEnd && convertedFromAppTrial ? "true" : "false",
    appTrialEndDate:
      checkoutTrialEnd && convertedFromAppTrial ? metadata.appTrialEndDate : "",
  };
  const firstChargeAt = checkoutTrialEnd
    ? new Date(checkoutTrialEnd * 1000)
    : null;

  const root = String(baseUrl || "").replace(/\/+$/, "");
  const checkout = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    payment_method_collection: "always",
    line_items: [
      { price: priceId, quantity: 1 },
      ...seatItems.map((item) => ({ ...item })),
    ],
    discounts,
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    customer_update: { name: "auto", address: "auto" },
    success_url: `${root}/dashboard/gestionnaire?abonnement={CHECKOUT_SESSION_ID}`,
    cancel_url: `${root}/dashboard/gestionnaire`,
    metadata: checkoutMetadata,
    subscription_data: {
      description: `Newbi ${orgName}`,
      metadata: checkoutMetadata,
      ...(checkoutTrialEnd ? { trial_end: checkoutTrialEnd } : {}),
    },
    custom_text: {
      submit: {
        message: describeFirstCharge
          ? describeFirstCharge({ orgName, firstChargeAt })
          : firstChargeAt
            ? `Abonnement de ${orgName}. Aucun prélèvement avant la fin de son essai (${frenchDate(firstChargeAt)}).`
            : `Abonnement de ${orgName}.`,
      },
    },
  });
  return { status: "redirect", url: checkout.url };
}

/**
 * Le cabinet choisit l'offre d'un espace qu'il paie.
 * @returns {Promise<{ status: "active" } | { status: "redirect", url: string }>}
 *   « redirect » : Stripe Checkout (première carte) ou page de facture
 *   Stripe (validation demandée par la banque).
 */
export async function startManagedSubscription({
  mongoDb,
  stripe,
  manager,
  linkId,
  plan,
  isAnnual,
  baseUrl,
}) {
  if (!MANAGED_PLANS.includes(plan)) {
    throw new ManagedClientError(400, "Offre inconnue.");
  }
  if (!priceIdFor(plan, Boolean(isAnnual))) {
    throw new ManagedClientError(500, "Cette offre n'est pas configurée.");
  }

  const linkOid = asObjectId(linkId);
  const link = linkOid
    ? await mongoDb
        .collection("managedclients")
        .findOne({ _id: linkOid, managerId: manager._id, status: "active" })
    : null;
  if (!link?.organizationId) {
    throw new ManagedClientError(404, "Client introuvable.");
  }
  if (link.payer !== "manager") {
    throw new ManagedClientError(
      409,
      "Ce client paie lui-même son abonnement.",
    );
  }

  const organizationId = String(link.organizationId);
  // Le client a pu retirer le cabinet de ses membres entre-temps
  const membership = await mongoDb
    .collection("member")
    .findOne(
      { userId: manager.userId, organizationId: link.organizationId },
      { projection: { _id: 1 } },
    );
  if (!membership) {
    throw new ManagedClientError(
      409,
      "Vous n'avez plus accès à l'espace de ce client.",
    );
  }

  const current = await mongoDb.collection("subscription").findOne(
    { referenceId: organizationId, status: { $in: LIVE_STATUSES } },
    {
      projection: {
        _id: 1,
        status: 1,
        stripeSubscriptionId: 1,
        stripeCustomerId: 1,
      },
    },
  );
  if (current) {
    // Paiement laissé à valider (banque) par ce cabinet : on l'abandonne
    // pour en relancer un, au lieu de bloquer l'espace jusqu'à expiration
    const abandoned =
      current.status === "incomplete" &&
      manager.stripeCustomerId &&
      current.stripeCustomerId === manager.stripeCustomerId;
    if (!abandoned) {
      throw new ManagedClientError(409, "Cet espace a déjà un abonnement.");
    }
    if (current.stripeSubscriptionId) {
      await stripe.subscriptions
        .cancel(current.stripeSubscriptionId)
        .catch((error) =>
          console.error(
            "[MANAGER-BILLING] Abonnement incomplet non annulé:",
            error?.message,
          ),
        );
    }
    await mongoDb
      .collection("subscription")
      .updateOne(
        { _id: current._id },
        { $set: { status: "incomplete_expired", updatedAt: new Date() } },
      );
  }

  const org = await mongoDb.collection("organization").findOne(
    { _id: link.organizationId },
    {
      projection: {
        name: 1,
        companyName: 1,
        isTrialActive: 1,
        trialEndDate: 1,
      },
    },
  );
  if (!org) throw new ManagedClientError(404, "Espace introuvable.");

  // Essai en cours : premier prélèvement à la fin de l'essai
  const trialEnd = org.trialEndDate ? new Date(org.trialEndDate) : null;
  const billingStartsAt =
    isAppTrialEnabled() &&
    org.isTrialActive === true &&
    trialEnd &&
    trialEnd.getTime() > Date.now() + 60_000
      ? trialEnd
      : null;

  const result = await createCabinetSubscription({
    mongoDb,
    stripe,
    manager,
    link,
    org,
    plan,
    isAnnual,
    baseUrl,
    billingStartsAt,
    convertedFromAppTrial: true,
  });
  if (result.subscription) {
    await syncManagedSubscription(mongoDb, result.subscription);
  }
  return result.url
    ? { status: "redirect", url: result.url }
    : { status: result.status };
}

/**
 * Retour de Stripe Checkout : enregistre l'abonnement sans attendre le
 * webhook. La session doit être celle de ce cabinet.
 */
export async function confirmManagedCheckout({
  mongoDb,
  stripe,
  manager,
  sessionId,
}) {
  if (typeof sessionId !== "string" || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    throw new ManagedClientError(400, "Session de paiement invalide.");
  }
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });
  if (
    session.metadata?.paidByAccountManagerId !== String(manager._id) ||
    !manager.stripeCustomerId ||
    session.customer !== manager.stripeCustomerId
  ) {
    throw new ManagedClientError(404, "Session de paiement introuvable.");
  }
  if (session.status !== "complete" || !session.subscription) {
    return { status: "pending" };
  }
  const subscription =
    typeof session.subscription === "string"
      ? await stripe.subscriptions.retrieve(session.subscription)
      : session.subscription;
  if (!subscription.metadata?.referenceId) {
    subscription.metadata = { ...session.metadata, ...subscription.metadata };
  }
  // Reprise de l'abonnement d'un client : son abonnement est remplacé
  if (subscription.metadata?.payerHandover === "from_client") {
    const { finalizeTakeover } = await import("./payer-switch.js");
    const result = await finalizeTakeover({
      mongoDb,
      stripe,
      stripeSubscription: subscription,
    });
    return result.status === "done"
      ? {
          status: "active",
          organizationId: subscription.metadata.referenceId,
          takeover: result,
        }
      : { status: "pending" };
  }
  const organizationId = await syncManagedSubscription(mongoDb, subscription);
  if (!organizationId) {
    // L'espace avait déjà un abonnement (autre onglet, client) : ce second
    // abonnement n'est pas gardé ; en essai, rien n'a encore été prélevé
    if (subscription.status === "trialing") {
      await stripe.subscriptions.cancel(subscription.id).catch(() => {});
      throw new ManagedClientError(
        409,
        "Cet espace avait déjà un abonnement : ce second paiement a été annulé, rien ne vous sera prélevé.",
      );
    }
    throw new ManagedClientError(
      409,
      "Cet espace avait déjà un abonnement : écrivez-nous pour éviter un double prélèvement.",
    );
  }
  return { status: "active", organizationId };
}

/**
 * Fin du lien entre un cabinet et l'espace d'un client, quand le cabinet
 * n'en est plus membre (le client l'a retiré, ou il est parti). La fiche
 * passe « ended » ; si le cabinet payait, son abonnement s'arrête à la fin
 * de la période en cours, après quoi l'espace passe en lecture seule.
 * @returns {Promise<boolean>} true si un lien a été terminé
 */
export async function endManagedClientLink({
  mongoDb,
  stripe,
  organizationId,
  userId,
  endedBy = "member_removed",
}) {
  const orgOid = asObjectId(organizationId ? String(organizationId) : null);
  const uid = asObjectId(userId ? String(userId) : null);
  if (!orgOid || !uid) return false;

  const manager = await mongoDb
    .collection("accountmanagers")
    .findOne({ userId: uid }, { projection: { stripeCustomerId: 1 } });
  if (!manager) return false;

  const now = new Date();
  const link = await mongoDb
    .collection("managedclients")
    .findOneAndUpdate(
      { managerId: manager._id, organizationId: orgOid, status: "active" },
      { $set: { status: "ended", endedAt: now, endedBy, updatedAt: now } },
    );
  const ended = link?.value ?? link;
  if (!ended?._id) return false;

  // Cabinet suspendu : son rôle temporaire « lecture seule » part avec lui
  if (ended.suspension?.roleKey) {
    await mongoDb
      .collection("organizationRole")
      .deleteOne({ organizationId: orgOid, role: ended.suspension.roleKey })
      .catch(() => {});
  }

  if (ended.payer === "manager" && manager.stripeCustomerId) {
    const subscriptions = await mongoDb
      .collection("subscription")
      .find({
        referenceId: String(orgOid),
        stripeCustomerId: manager.stripeCustomerId,
        status: { $in: LIVE_STATUSES },
      })
      .toArray();
    for (const sub of subscriptions) {
      if (!sub.stripeSubscriptionId) continue;
      try {
        await stripe.subscriptions.update(sub.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
        await mongoDb
          .collection("subscription")
          .updateOne(
            { _id: sub._id },
            { $set: { cancelAtPeriodEnd: true, updatedAt: now } },
          );
      } catch (error) {
        console.error(
          `[MANAGER-BILLING] Résiliation de ${sub.stripeSubscriptionId} impossible:`,
          error?.message,
        );
      }
    }
  }
  return true;
}

/**
 * Récapitulatif des dépenses du cabinet : abonnements des espaces qu'il
 * paie, espaces dont l'offre reste à choisir, factures Stripe et carte.
 * Montants en centimes, TTC (les prix Newbi sont TTC).
 */
export async function getManagerBillingSummary({ mongoDb, stripe, manager }) {
  const links = await mongoDb
    .collection("managedclients")
    .find(
      { managerId: manager._id, status: "active", payer: "manager" },
      { projection: { organizationId: 1 } },
    )
    .toArray();
  const orgIds = links.map((l) => l.organizationId).filter(Boolean);
  const orgs = await mongoDb
    .collection("organization")
    .find(
      { _id: { $in: orgIds } },
      {
        projection: {
          name: 1,
          companyName: 1,
          isTrialActive: 1,
          trialEndDate: 1,
        },
      },
    )
    .toArray();
  const orgById = new Map(orgs.map((o) => [String(o._id), o]));
  const orgName = (id) => {
    const org = orgById.get(String(id));
    return org?.companyName || org?.name || null;
  };

  let subscriptions = [];
  let invoices = [];
  let card = null;
  const customerId = manager.stripeCustomerId || null;
  if (customerId) {
    const [subs, invs, customer] = await Promise.all([
      listAll(
        stripe.subscriptions.list({
          customer: customerId,
          status: "all",
          limit: 100,
        }),
      ),
      stripe.invoices.list({ customer: customerId, limit: 24 }),
      stripe.customers.retrieve(customerId, {
        expand: ["invoice_settings.default_payment_method"],
      }),
    ]);
    subscriptions = subs.filter((s) => LIVE_STATUSES.includes(s.status));
    invoices = invs.data.filter((i) => i.status !== "draft");

    let method = customer?.invoice_settings?.default_payment_method;
    if (!method || typeof method === "string") {
      const { data } = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
        limit: 1,
      });
      method = data[0] || null;
    }
    if (method?.card) {
      card = {
        brand: method.card.brand,
        last4: method.card.last4,
        expMonth: method.card.exp_month,
        expYear: method.card.exp_year,
      };
    }
  }

  const paidOrgIds = new Set();
  const items = subscriptions.map((s) => {
    const referenceId = s.metadata?.referenceId || null;
    if (referenceId) paidOrgIds.add(referenceId);
    const items = s.items?.data || [];
    const price = items[0]?.price;
    // Offre + utilisateurs supplémentaires éventuels, ajoutés par le client
    const unitAmount = items.reduce(
      (sum, item) =>
        sum + (item.price?.unit_amount ?? 0) * (item.quantity ?? 1),
      0,
    );
    const discountPercent = Number(s.metadata?.discountPercent) || 0;
    const amount = Math.round(unitAmount * (1 - discountPercent / 100));
    const interval = price?.recurring?.interval === "year" ? "year" : "month";
    const period = currentPeriod(s);
    return {
      organizationId: referenceId,
      name: orgName(referenceId) || s.description || "Espace",
      plan: s.metadata?.planName || null,
      interval,
      status: s.status,
      unitAmount,
      discountPercent,
      amount,
      monthlyAmount: interval === "year" ? Math.round(amount / 12) : amount,
      cancelAtPeriodEnd: Boolean(s.cancel_at_period_end),
      nextPaymentAt: s.status === "trialing" ? toDate(s.trial_end) : period.end,
    };
  });

  const toChoose = links
    .filter(
      (l) => l.organizationId && !paidOrgIds.has(String(l.organizationId)),
    )
    .map((l) => {
      const org = orgById.get(String(l.organizationId));
      const trialEnd =
        org?.isTrialActive && org.trialEndDate
          ? new Date(org.trialEndDate)
          : null;
      return {
        linkId: String(l._id),
        organizationId: String(l.organizationId),
        name: orgName(l.organizationId) || "Espace",
        trialEndsAt: trialEnd && trialEnd > new Date() ? trialEnd : null,
      };
    });

  // Ce qui est facturé aujourd'hui (hors essais et résiliations), ramené
  // au mois pour les abonnements annuels
  const billed = items.filter(
    (i) =>
      ["active", "past_due", "unpaid"].includes(i.status) &&
      !i.cancelAtPeriodEnd,
  );
  const upcoming = items.filter(
    (i) => i.status === "trialing" && !i.cancelAtPeriodEnd,
  );

  return {
    suspended: manager.status !== "active",
    discountPercent: Number(manager.discountPercent) || 0,
    currency: "eur",
    monthlyTotal: billed.reduce((sum, i) => sum + i.monthlyAmount, 0),
    upcomingMonthlyTotal: upcoming.reduce((sum, i) => sum + i.monthlyAmount, 0),
    subscriptions: items.sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", "fr"),
    ),
    toChoose,
    invoices: invoices.map((i) => {
      // Espace facturé : métadonnées de l'abonnement recopiées sur la
      // facture (emplacement selon la version de l'API Stripe)
      const meta =
        i.parent?.subscription_details?.metadata ||
        i.subscription_details?.metadata ||
        {};
      return {
        id: i.id,
        number: i.number,
        createdAt: toDate(i.created),
        total: i.total,
        status: i.status,
        name:
          orgName(meta.referenceId) || i.lines?.data?.[0]?.description || null,
        url: i.hosted_invoice_url || null,
        pdf: i.invoice_pdf || null,
      };
    }),
    card,
    hasCustomer: Boolean(customerId),
  };
}

/** Portail Stripe du cabinet : carte, adresse, factures. */
export async function createManagerPortalSession({
  stripe,
  manager,
  returnUrl,
}) {
  if (!manager.stripeCustomerId) {
    throw new ManagedClientError(
      409,
      "Aucun paiement enregistré : choisissez d'abord l'offre d'un client.",
    );
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: manager.stripeCustomerId,
    return_url: returnUrl,
    locale: "fr",
  });
  return { url: session.url };
}
