import { ObjectId } from "mongodb";
import { ManagedClientError } from "./managed-client-error.js";
import { isAppTrialEnabled } from "./feature-flags.js";

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
const LIVE_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "incomplete",
  "unpaid",
];

function priceIdFor(plan, isAnnual) {
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
function currentPeriod(stripeSubscription) {
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
  const subscription = await mongoDb.collection("subscription").findOne(
    { referenceId: organizationId, status: { $in: LIVE_STATUSES } },
    {
      projection: { stripeCustomerId: 1, status: 1, plan: 1 },
      sort: { updatedAt: -1 },
    },
  );
  if (!subscription?.stripeCustomerId) return null;
  const manager = await findManagerByStripeCustomerId(
    mongoDb,
    subscription.stripeCustomerId,
  );
  return manager ? { subscription, manager } : null;
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

/** Carte enregistrée du cabinet, ou null. */
async function savedCard(stripe, customerId) {
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
 * Écrit (ou met à jour) le document `subscription` de l'espace à partir de
 * l'abonnement Stripe, comme le fait le webhook : la souscription est
 * visible tout de suite, sans attendre le webhook (qui retrouvera ce
 * document par stripeSubscriptionId et le mettra à jour).
 */
export async function syncManagedSubscription(mongoDb, stripeSubscription) {
  const referenceId =
    stripeSubscription.metadata?.referenceId ||
    stripeSubscription.metadata?.organizationId;
  const orgOid = asObjectId(referenceId);
  if (!orgOid) return null;

  const now = new Date();
  const period = currentPeriod(stripeSubscription);
  const price = stripeSubscription.items?.data?.[0]?.price;
  const fields = {
    plan: stripeSubscription.metadata?.planName || "freelance",
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
  const existing = await subscriptions.findOne(
    { referenceId },
    { projection: { _id: 1 }, sort: { updatedAt: -1 } },
  );
  if (existing) {
    await subscriptions.updateOne({ _id: existing._id }, { $set: fields });
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
  const priceId = priceIdFor(plan, Boolean(isAnnual));
  if (!priceId) {
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
  const current = await mongoDb
    .collection("subscription")
    .findOne(
      { referenceId: organizationId, status: { $in: LIVE_STATUSES } },
      { projection: { _id: 1 } },
    );
  if (current) {
    throw new ManagedClientError(409, "Cet espace a déjà un abonnement.");
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
  const trialEndUnix =
    isAppTrialEnabled() &&
    org.isTrialActive === true &&
    trialEnd &&
    trialEnd.getTime() > Date.now() + 60_000
      ? Math.floor(trialEnd.getTime() / 1000)
      : null;

  const [customerId, coupon] = await Promise.all([
    getOrCreateManagerCustomer({ mongoDb, stripe, manager }),
    getManagerCoupon({ stripe, percent: manager.discountPercent }),
  ]);

  const metadata = {
    referenceId: organizationId,
    organizationId: organizationId,
    planName: plan,
    isAnnual: isAnnual ? "true" : "false",
    isNewOrganization: "false",
    paidByAccountManagerId: String(manager._id),
    managedClientId: String(link._id),
    discountPercent: String(Number(manager.discountPercent) || 0),
    convertedFromAppTrial: trialEndUnix ? "true" : "false",
    appTrialEndDate: trialEndUnix ? trialEnd.toISOString() : "",
  };
  const discounts = coupon ? [{ coupon }] : undefined;
  const orgName = org.companyName || org.name || "Espace";

  const paymentMethod = await savedCard(stripe, customerId);
  if (paymentMethod) {
    const subscription = await stripe.subscriptions.create(
      {
        customer: customerId,
        items: [{ price: priceId }],
        default_payment_method: paymentMethod,
        discounts,
        description: `Newbi ${orgName}`,
        metadata,
        ...(trialEndUnix ? { trial_end: trialEndUnix } : {}),
        expand: ["latest_invoice"],
      },
      {
        idempotencyKey: `managed-sub-${link._id}-${plan}-${metadata.isAnnual}-${Math.floor(Date.now() / 60_000)}`,
      },
    );
    await syncManagedSubscription(mongoDb, subscription);
    if (subscription.status === "incomplete") {
      // La banque demande une validation : le cabinet la fait sur la page
      // de facture Stripe
      const url = subscription.latest_invoice?.hosted_invoice_url;
      if (url) return { status: "redirect", url };
    }
    return {
      status: subscription.status === "incomplete" ? "incomplete" : "active",
    };
  }

  const root = String(baseUrl || "").replace(/\/+$/, "");
  const checkout = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    payment_method_collection: "always",
    line_items: [{ price: priceId, quantity: 1 }],
    discounts,
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    customer_update: { name: "auto", address: "auto" },
    success_url: `${root}/dashboard/gestionnaire?abonnement={CHECKOUT_SESSION_ID}`,
    cancel_url: `${root}/dashboard/gestionnaire`,
    metadata,
    subscription_data: {
      description: `Newbi ${orgName}`,
      metadata,
      ...(trialEndUnix ? { trial_end: trialEndUnix } : {}),
    },
    custom_text: {
      submit: {
        message: trialEndUnix
          ? `Abonnement de ${orgName}. Aucun prélèvement avant la fin de son essai (${trialEnd.toLocaleDateString("fr-FR")}).`
          : `Abonnement de ${orgName}.`,
      },
    },
  });
  return { status: "redirect", url: checkout.url };
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
  const organizationId = await syncManagedSubscription(mongoDb, subscription);
  return { status: "active", organizationId };
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
      stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 100,
      }),
      stripe.invoices.list({ customer: customerId, limit: 24 }),
      stripe.customers.retrieve(customerId, {
        expand: ["invoice_settings.default_payment_method"],
      }),
    ]);
    subscriptions = subs.data.filter((s) => LIVE_STATUSES.includes(s.status));
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
    const price = s.items?.data?.[0]?.price;
    const unitAmount = price?.unit_amount ?? 0;
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
