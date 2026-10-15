import { ObjectId } from "mongodb";
import { ManagedClientError } from "./managed-client-error.js";
import { isAppTrialEnabled } from "./feature-flags.js";
import { countAdditionalSeats } from "./cabinet-members.js";
import {
  LIVE_STATUSES,
  MANAGED_PLANS,
  createCabinetSubscription,
  currentPeriod,
  findManagerByStripeCustomerId,
  priceIdFor,
  savedCard,
  syncManagedSubscription,
} from "./manager-billing.js";

/**
 * Changement de payeur de l'abonnement d'un espace suivi par un cabinet
 * (compte gestionnaire), quand le contrat entre eux évolue.
 *
 * Reprise par le cabinet (« Prendre en charge l'abonnement ») : directe, le
 * client est seulement prévenu. Le cabinet paie (Stripe Checkout la première
 * fois, sa carte ensuite) un abonnement sur son propre client Stripe, avec
 * sa remise ; celui du client s'arrête, sans double prélèvement :
 * - client en essai, ou sans abonnement : rien à arrêter ;
 * - offre choisie pendant l'essai (rien de prélevé) : arrêtée, le cabinet
 *   paie à la fin de l'essai ;
 * - période payée en cours, au choix du cabinet : « tout de suite » (le
 *   client est remboursé au prorata par un avoir Stripe, le cabinet paie dès
 *   aujourd'hui) ou « à l'échéance » (l'abonnement du client n'est pas
 *   renouvelé, le cabinet paie à partir de cette date) ;
 * - paiement du client en échec : arrêté tout de suite, facture en attente
 *   annulée.
 * Tant que le cabinet n'a pas payé (Checkout, validation bancaire), rien ne
 * change pour le client : la reprise se termine dans finalizeTakeover, au
 * retour de Stripe ou par le webhook.
 *
 * Retour au client (« Ne plus payer l'abonnement ») : le cabinet décide, le
 * client est prévenu. Une période déjà payée par le cabinet va à son terme ;
 * le client peut choisir son offre tout de suite, premier prélèvement à la
 * fin de cette période (getCabinetHandBack, create-org-subscription).
 *
 * Un espace n'a qu'un document `subscription` : il passe d'un abonnement
 * Stripe à l'autre au moment où le payeur change. L'abonnement qui s'arrête
 * porte `payerHandover` dans ses métadonnées : le webhook n'envoie alors ni
 * e-mail de résiliation ni ne rouvre l'essai.
 */

const DAY_MS = 86_400_000;
// Reprise en attente du paiement du cabinet (une session Checkout dure 24 h)
const PENDING_TAKEOVER_MS = DAY_MS;
// Reprise interrompue en plein traitement : peut être reprise après ce délai
const PROCESSING_STALE_MS = 5 * 60_000;
// Stripe Checkout refuse une fin d'essai à moins de 48 h
const CHECKOUT_MIN_TRIAL_MS = 49 * 3600_000;

export const TAKEOVER_TIMINGS = ["now", "renewal"];

const asObjectId = (value) =>
  value instanceof ObjectId
    ? value
    : typeof value === "string" && /^[0-9a-f]{24}$/i.test(value)
      ? new ObjectId(value)
      : null;

const toDate = (unix) => (unix ? new Date(unix * 1000) : null);
const customerIdOf = (subscription) =>
  typeof subscription?.customer === "string"
    ? subscription.customer
    : subscription?.customer?.id || null;
const intervalOf = (subscription) =>
  subscription?.items?.data?.[0]?.price?.recurring?.interval === "year"
    ? "year"
    : "month";
const frenchDate = (date) =>
  date.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });

const appBaseUrl = (baseUrl) =>
  String(
    baseUrl ||
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
      process.env.BETTER_AUTH_URL ||
      "https://www.newbi.fr",
  ).replace(/\/+$/, "");

async function retrieveSubscription(stripe, id) {
  if (!id) return null;
  try {
    return await stripe.subscriptions.retrieve(id);
  } catch (error) {
    if (error?.code === "resource_missing") return null;
    throw error;
  }
}

const isLive = (subscription) =>
  Boolean(subscription && LIVE_STATUSES.includes(subscription.status));

async function loadActiveLink(mongoDb, managerId, linkId) {
  const linkOid = asObjectId(linkId);
  const link = linkOid
    ? await mongoDb
        .collection("managedclients")
        .findOne({ _id: linkOid, managerId, status: "active" })
    : null;
  if (!link?.organizationId) {
    throw new ManagedClientError(404, "Client introuvable.");
  }
  return link;
}

async function loadOrg(mongoDb, organizationId) {
  const org = await mongoDb.collection("organization").findOne(
    { _id: organizationId },
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
  return org;
}

// Essai de l'application en cours : sa date de fin, sinon null
function activeTrialEnd(org) {
  const end = org?.trialEndDate ? new Date(org.trialEndDate) : null;
  return isAppTrialEnabled() &&
    org?.isTrialActive === true &&
    end &&
    end.getTime() > Date.now() + 60_000
    ? end
    : null;
}

async function requireCabinetMembership(mongoDb, manager, link) {
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
}

/**
 * Documents d'abonnement en cours de l'espace, rangés par payeur : ce
 * cabinet, un autre cabinet, le client (son propre client Stripe), ou un
 * abonnement offert par Newbi (sans Stripe).
 */
async function classifySubscriptions(mongoDb, manager, organizationId) {
  const docs = await mongoDb
    .collection("subscription")
    .find(
      { referenceId: String(organizationId), status: { $in: LIVE_STATUSES } },
      {
        projection: {
          stripeSubscriptionId: 1,
          stripeCustomerId: 1,
          status: 1,
          plan: 1,
          cancelAtPeriodEnd: 1,
          currentPeriodEnd: 1,
          periodEnd: 1,
        },
      },
    )
    .toArray();
  const result = {
    cabinetDoc: null,
    otherCabinetDoc: null,
    clientDoc: null,
    grantedDoc: null,
  };
  for (const doc of docs) {
    if (!doc.stripeSubscriptionId) {
      result.grantedDoc ||= doc;
    } else if (
      manager.stripeCustomerId &&
      doc.stripeCustomerId === manager.stripeCustomerId
    ) {
      result.cabinetDoc ||= doc;
    } else if (
      await findManagerByStripeCustomerId(mongoDb, doc.stripeCustomerId)
    ) {
      result.otherCabinetDoc ||= doc;
    } else {
      result.clientDoc ||= doc;
    }
  }
  return result;
}

/**
 * Montant (centimes) de la période non utilisée d'un abonnement, s'il
 * s'arrêtait maintenant : le prorata calculé par Stripe (remise et
 * utilisateurs supplémentaires compris), net de ce que le client doit
 * encore. Sans aperçu Stripe, prorata local du montant récurrent.
 */
export async function unusedPeriodCredit(stripe, subscription) {
  const now = Math.floor(Date.now() / 1000);
  try {
    const preview = await stripe.invoices.createPreview({
      customer: customerIdOf(subscription),
      subscription: subscription.id,
      subscription_details: {
        cancel_now: true,
        proration_behavior: "create_prorations",
        proration_date: now,
      },
    });
    return preview.total < 0 ? -preview.total : 0;
  } catch (error) {
    console.error(
      "[PAYER-SWITCH] Aperçu Stripe du prorata impossible, calcul local:",
      error?.message,
    );
    const { start, end } = currentPeriod(subscription);
    if (!start || !end || end <= start) return 0;
    const remaining =
      Math.max(0, end.getTime() - Date.now()) /
      (end.getTime() - start.getTime());
    const recurring = (subscription.items?.data || []).reduce(
      (sum, item) =>
        sum + (item.price?.unit_amount ?? 0) * (item.quantity ?? 1),
      0,
    );
    const percentOff =
      subscription.discounts?.[0]?.coupon?.percent_off ??
      subscription.discount?.coupon?.percent_off ??
      0;
    return Math.floor(recurring * (1 - percentOff / 100) * remaining);
  }
}

/**
 * Rembourse au client la période non utilisée : avoir Stripe (document
 * envoyé au client) avec remboursement sur sa carte, réparti sur les
 * factures payées de la période en cours, la plus récente d'abord. Jamais
 * plus que ce qui a été payé.
 * @returns {Promise<{ amount: number, creditNoteIds: string[] } | null>}
 */
async function refundUnusedPeriod({
  stripe,
  subscription,
  amount,
  memo,
  metadata,
}) {
  if (!(amount > 0)) return null;
  const { start } = currentPeriod(subscription);
  const { data: invoices } = await stripe.invoices.list({
    subscription: subscription.id,
    status: "paid",
    limit: 10,
  });
  let remaining = amount;
  const creditNoteIds = [];
  for (const invoice of invoices) {
    if (remaining <= 0) break;
    if (!(invoice.amount_paid > 0)) continue;
    // Facture d'une période précédente : rien à y rembourser
    if (start && invoice.created * 1000 < start.getTime() - DAY_MS) break;
    const refundable =
      invoice.amount_paid - (invoice.post_payment_credit_notes_amount || 0);
    const part = Math.min(remaining, refundable);
    if (part <= 0) continue;
    const creditNote = await stripe.creditNotes.create(
      {
        invoice: invoice.id,
        amount: part,
        refund_amount: part,
        reason: "order_change",
        memo,
        metadata,
      },
      {
        idempotencyKey: `payer-handover-refund-${subscription.id}-${invoice.id}`,
      },
    );
    creditNoteIds.push(creditNote.id);
    remaining -= part;
  }
  return { amount: amount - remaining, creditNoteIds };
}

/** Annule les factures impayées d'un abonnement (rien ne reste à régler). */
async function voidUnpaidInvoices(stripe, subscriptionId) {
  for (const status of ["open", "draft"]) {
    const { data } = await stripe.invoices.list({
      subscription: subscriptionId,
      status,
      limit: 20,
    });
    for (const invoice of data) {
      try {
        if (status === "open") await stripe.invoices.voidInvoice(invoice.id);
        else await stripe.invoices.del(invoice.id);
      } catch (error) {
        console.error(
          `[PAYER-SWITCH] Facture ${invoice.id} non annulée:`,
          error?.message,
        );
      }
    }
  }
}

/**
 * Arrête l'abonnement du client quand le cabinet a pris le relais. Ce que
 * l'on fait dépend de l'abonnement du cabinet : en « trialing », il démarre
 * à la fin de la période déjà payée par le client (échéance) ; actif, il
 * est payé dès aujourd'hui, la période non utilisée du client lui est
 * remboursée.
 * @returns {Promise<{ mode: string, effectiveAt: Date, refund: object|null, hadOffer?: boolean }>}
 */
async function phaseOutClientSubscription({
  stripe,
  clientSub,
  cabinetSub,
  manager,
  link,
}) {
  const now = new Date();
  if (!isLive(clientSub)) {
    // Client en essai (le cabinet paiera à sa fin) ou sans accès
    return {
      mode: cabinetSub.status === "trialing" ? "trial" : "start",
      effectiveAt: now,
      refund: null,
    };
  }
  const marker = {
    payerHandover: "to_manager",
    takenOverByAccountManagerId: String(manager._id),
  };

  // Offre choisie pendant l'essai : rien n'a été prélevé
  if (clientSub.status === "trialing") {
    await stripe.subscriptions.update(clientSub.id, { metadata: marker });
    await stripe.subscriptions.cancel(clientSub.id, { prorate: false });
    return {
      mode: "trial",
      effectiveAt: now,
      refund: null,
      hadOffer: true,
    };
  }

  if (clientSub.status === "active") {
    if (cabinetSub.status === "trialing") {
      // À l'échéance : le client garde la période qu'il a payée
      await stripe.subscriptions.update(clientSub.id, {
        cancel_at_period_end: true,
        metadata: marker,
      });
      return {
        mode: "renewal",
        effectiveAt:
          currentPeriod(clientSub).end || toDate(cabinetSub.trial_end),
        refund: null,
      };
    }
    // Tout de suite : prorata calculé avant l'arrêt, remboursé ensuite
    const credit = await unusedPeriodCredit(stripe, clientSub);
    await stripe.subscriptions.update(clientSub.id, { metadata: marker });
    await stripe.subscriptions.cancel(clientSub.id, { prorate: false });
    let refund = null;
    try {
      refund = await refundUnusedPeriod({
        stripe,
        subscription: clientSub,
        amount: credit,
        memo: `Abonnement repris par ${manager.name} le ${frenchDate(now)} : période non utilisée remboursée.`,
        metadata: {
          reason: "payer_handover",
          managedClientId: String(link._id),
          accountManagerId: String(manager._id),
        },
      });
    } catch (error) {
      // L'abonnement est repris : le remboursement se refait à la main
      console.error(
        `[PAYER-SWITCH] Remboursement de ${credit} centimes non fait sur ${clientSub.id}:`,
        error?.message,
      );
      refund = {
        amount: 0,
        creditNoteIds: [],
        error: error?.message,
        due: credit,
      };
    }
    return { mode: "now", effectiveAt: now, refund };
  }

  // Paiement en échec ou jamais validé : la période en cours n'est pas
  // payée, le client n'a plus rien à régler
  await stripe.subscriptions.update(clientSub.id, { metadata: marker });
  await voidUnpaidInvoices(stripe, clientSub.id);
  await stripe.subscriptions.cancel(clientSub.id, { prorate: false });
  return { mode: "unpaid", effectiveAt: now, refund: null };
}

const EMAIL_KINDS = {
  start: "takeover_start",
  pending: "takeover_pending",
  trial: "takeover_trial",
  renewal: "takeover_renewal",
  now: "takeover_now",
  unpaid: "takeover_unpaid",
  resumed: "takeover_resumed",
  scheduled: "handback_scheduled",
  restored: "handback_restored",
  "trial-restored": "handback_trial",
  ended: "handback_now",
};

/**
 * Prévient le super admin de l'espace du changement de payeur. Ne lève
 * pas : renvoie si l'e-mail est parti.
 */
async function notifyClient({ mongoDb, link, manager, outcome, baseUrl }) {
  try {
    const [owner, org] = await Promise.all([
      mongoDb
        .collection("member")
        .findOne(
          { organizationId: link.organizationId, role: "owner" },
          { projection: { userId: 1 } },
        ),
      mongoDb
        .collection("organization")
        .findOne(
          { _id: link.organizationId },
          { projection: { name: 1, companyName: 1 } },
        ),
    ]);
    const user = owner?.userId
      ? await mongoDb
          .collection("user")
          .findOne(
            { _id: asObjectId(String(owner.userId)) },
            { projection: { email: 1 } },
          )
      : null;
    if (!user?.email) return false;

    const params = {
      kind: EMAIL_KINDS[outcome.mode] || "handback_now",
      managerName: manager.name,
      companyName: org?.companyName || org?.name,
      effectiveAt: outcome.effectiveAt,
      refundAmount: outcome.refund?.amount || 0,
      hadOffer: Boolean(outcome.hadOffer),
      trialEndsAt: outcome.trialEndsAt,
      nextChargeAt: outcome.nextChargeAt,
      url: `${appBaseUrl(baseUrl)}/dashboard?parametres=subscription`,
    };
    // Chargés ici : getCabinetHandBack sert aussi aux routes d'abonnement
    const [
      { sendEmail },
      { emailTemplates },
      { managedClientPayerChangeContent },
    ] = await Promise.all([
      import("./auth-utils.js"),
      import("./email-templates/index.js"),
      import("./email-templates/organization/managed-client-payer-change.js"),
    ]);
    const result = await sendEmail({
      to: user.email,
      subject: managedClientPayerChangeContent(params).subject,
      html: emailTemplates.managedClientPayerChange(params),
    });
    if (result?.error) throw new Error(result.error.message || "Envoi refusé");
    return true;
  } catch (error) {
    console.error(
      "[PAYER-SWITCH] E-mail de changement de payeur non envoyé:",
      error?.message,
    );
    return false;
  }
}

// Trace du changement sur la fiche (qui, quand, comment)
function historyEntry({
  from,
  to,
  outcome,
  by,
  fromSubscriptionId,
  toSubscriptionId,
}) {
  return {
    from,
    to,
    at: new Date(),
    effectiveAt: outcome.effectiveAt || new Date(),
    mode: outcome.mode,
    by: by || null,
    fromSubscriptionId: fromSubscriptionId || null,
    toSubscriptionId: toSubscriptionId || null,
    refundAmount: outcome.refund?.amount || 0,
    creditNoteIds: outcome.refund?.creditNoteIds || [],
  };
}

// Changement à venir, affiché au cabinet (« Vous, à partir du… »)
const upcomingChange = (to, effectiveAt) =>
  effectiveAt && new Date(effectiveAt).getTime() > Date.now() + 60_000
    ? { to, effectiveAt: new Date(effectiveAt) }
    : null;

/**
 * Termine une reprise quand l'abonnement du cabinet est en place (créé
 * directement, retour de Checkout, ou webhook après une validation
 * bancaire) : le document de l'espace passe sur l'abonnement du cabinet,
 * celui du client s'arrête, la fiche dit que le cabinet paie, le client est
 * prévenu. Sans effet si la reprise est déjà terminée.
 * @returns {Promise<{ status: "done"|"pending"|"ignored"|"orphan", mode?: string, effectiveAt?: Date, refund?: object }>}
 */
export async function finalizeTakeover({
  mongoDb,
  stripe,
  stripeSubscription,
  baseUrl,
}) {
  const sub = stripeSubscription;
  if (sub?.metadata?.payerHandover !== "from_client") {
    return { status: "ignored" };
  }
  if (!["active", "trialing"].includes(sub.status))
    return { status: "pending" };
  const linkOid = asObjectId(sub.metadata?.managedClientId);
  const managerOid = asObjectId(sub.metadata?.paidByAccountManagerId);
  if (!linkOid || !managerOid) return { status: "ignored" };

  const now = new Date();
  // Une seule finalisation à la fois (retour de Checkout et webhook)
  const claimed = await mongoDb.collection("managedclients").findOneAndUpdate(
    {
      _id: linkOid,
      managerId: managerOid,
      status: "active",
      $or: [
        { "handover.status": "awaiting_payment" },
        {
          "handover.status": "processing",
          "handover.processingAt": {
            $lt: new Date(now.getTime() - PROCESSING_STALE_MS),
          },
        },
      ],
    },
    {
      $set: {
        "handover.status": "processing",
        "handover.processingAt": now,
        "handover.toSubscriptionId": sub.id,
      },
    },
    { returnDocument: "after" },
  );
  const link = claimed?.value ?? claimed;
  if (!link?._id) {
    const current = await mongoDb
      .collection("managedclients")
      .findOne({ _id: linkOid }, { projection: { payer: 1, status: 1 } });
    if (current?.status === "active" && current.payer === "manager") {
      // Déjà terminée par l'autre appel : le document reste à jour
      await syncManagedSubscription(mongoDb, sub, {
        replaceSubscriptionId: sub.metadata?.handoverFrom || null,
      });
      return { status: "done", alreadyDone: true };
    }
    console.error(
      `[PAYER-SWITCH] Abonnement ${sub.id} payé par le cabinet sans reprise en attente (fiche ${linkOid}) : à vérifier`,
    );
    return { status: "orphan" };
  }

  const manager = await mongoDb
    .collection("accountmanagers")
    .findOne({ _id: managerOid });
  const handover = link.handover || {};
  const fromId =
    handover.fromSubscriptionId || sub.metadata?.handoverFrom || null;
  const clientSub = fromId ? await retrieveSubscription(stripe, fromId) : null;

  // 1. L'espace passe sur l'abonnement du cabinet
  await syncManagedSubscription(mongoDb, sub, {
    replaceSubscriptionId: fromId,
  });

  // 2. L'abonnement du client s'arrête
  let outcome;
  let issue = null;
  try {
    outcome = await phaseOutClientSubscription({
      stripe,
      clientSub,
      cabinetSub: sub,
      manager,
      link,
    });
  } catch (error) {
    // Le cabinet paie déjà : l'abonnement du client est à arrêter à la main
    console.error(
      `[PAYER-SWITCH] Abonnement ${fromId} du client non arrêté:`,
      error?.message,
    );
    issue = {
      at: now,
      message: error?.message || "Erreur Stripe",
      subscriptionId: fromId,
    };
    outcome = { mode: "now", effectiveAt: now, refund: null };
  }
  if (outcome.refund?.error) {
    issue = {
      at: now,
      message: outcome.refund.error,
      subscriptionId: fromId,
      refundDue: outcome.refund.due,
    };
  }

  // 3. La fiche dit que le cabinet paie
  await mongoDb.collection("managedclients").updateOne(
    { _id: link._id },
    {
      $set: {
        payer: "manager",
        payerChangedAt: now,
        payerChange: upcomingChange("manager", outcome.effectiveAt),
        updatedAt: now,
        ...(issue ? { payerSwitchIssue: issue } : {}),
      },
      $unset: { handover: "" },
      $push: {
        payerHistory: historyEntry({
          from: "client",
          to: "manager",
          outcome,
          by: handover.requestedBy,
          fromSubscriptionId: fromId,
          toSubscriptionId: sub.id,
        }),
      },
    },
  );

  // 4. Le client est prévenu
  await notifyClient({ mongoDb, link, manager, outcome, baseUrl });
  return {
    status: "done",
    mode: outcome.mode,
    effectiveAt: outcome.effectiveAt,
    refund: outcome.refund
      ? { amount: outcome.refund.amount, error: Boolean(outcome.refund.error) }
      : null,
  };
}

/**
 * Le cabinet annule l'arrêt programmé de sa prise en charge (il avait rendu
 * l'abonnement au client, qui n'a pas encore repris le sien) : son
 * abonnement continue.
 */
async function resumeCabinetSubscription({
  mongoDb,
  stripe,
  manager,
  link,
  cabinetDoc,
  actor,
  baseUrl,
}) {
  const now = new Date();
  const cabinetSub = await retrieveSubscription(
    stripe,
    cabinetDoc.stripeSubscriptionId,
  );
  if (!isLive(cabinetSub)) {
    throw new ManagedClientError(
      409,
      "Votre abonnement pour ce client est terminé : choisissez de nouveau son offre.",
    );
  }
  if (cabinetSub.cancel_at_period_end) {
    await stripe.subscriptions.update(cabinetSub.id, {
      cancel_at_period_end: false,
      metadata: { payerHandover: "" },
    });
  }
  await mongoDb
    .collection("subscription")
    .updateOne(
      { _id: cabinetDoc._id },
      { $set: { cancelAtPeriodEnd: false, updatedAt: now } },
    );
  const outcome = { mode: "resumed", effectiveAt: now, refund: null };
  await mongoDb.collection("managedclients").updateOne(
    { _id: link._id },
    {
      $set: {
        payer: "manager",
        payerChangedAt: now,
        payerChange: null,
        updatedAt: now,
      },
      $unset: { handover: "" },
      $push: {
        payerHistory: historyEntry({
          from: "client",
          to: "manager",
          outcome,
          by: actor,
          toSubscriptionId: cabinetSub.id,
        }),
      },
    },
  );
  await notifyClient({ mongoDb, link, manager, outcome, baseUrl });
  return { status: "active", mode: "resumed", effectiveAt: now };
}

/**
 * Le cabinet prend en charge l'abonnement d'un client qui le payait (ou
 * qui n'en avait pas encore). Directe : le client est seulement prévenu.
 * @param {{ plan: string, isAnnual: boolean, timing?: "now"|"renewal", actor: object }} params
 * @returns {Promise<{ status: "active", mode, effectiveAt, refund } | { status: "redirect", url } | { status: "incomplete" }>}
 */
export async function takeOverSubscription({
  mongoDb,
  stripe,
  manager,
  linkId,
  plan,
  isAnnual,
  timing,
  baseUrl,
  actor,
}) {
  if (!MANAGED_PLANS.includes(plan)) {
    throw new ManagedClientError(400, "Offre inconnue.");
  }
  if (!priceIdFor(plan, Boolean(isAnnual))) {
    throw new ManagedClientError(500, "Cette offre n'est pas configurée.");
  }
  const link = await loadActiveLink(mongoDb, manager._id, linkId);
  if (link.payer === "manager") {
    throw new ManagedClientError(
      409,
      "Vous payez déjà l'abonnement de ce client.",
    );
  }
  await requireCabinetMembership(mongoDb, manager, link);
  const org = await loadOrg(mongoDb, link.organizationId);
  const { cabinetDoc, otherCabinetDoc, clientDoc, grantedDoc } =
    await classifySubscriptions(mongoDb, manager, link.organizationId);

  // Arrêt programmé de sa prise en charge : le cabinet la garde
  if (cabinetDoc) {
    return resumeCabinetSubscription({
      mongoDb,
      stripe,
      manager,
      link,
      cabinetDoc,
      actor,
      baseUrl,
    });
  }
  if (otherCabinetDoc) {
    throw new ManagedClientError(
      409,
      "L'abonnement de cet espace est encore payé par un autre cabinet jusqu'à la fin de sa période.",
    );
  }

  const clientSub = clientDoc
    ? await retrieveSubscription(stripe, clientDoc.stripeSubscriptionId)
    : null;
  const clientLive = isLive(clientSub);
  // Abonnement du client remplacé dans le document de l'espace (même
  // terminé côté Stripe, s'il y est encore noté en cours)
  const replacedId = clientDoc?.stripeSubscriptionId || null;
  if (!clientLive && grantedDoc) {
    throw new ManagedClientError(
      409,
      "Cet espace a un abonnement offert par Newbi : il n'y a rien à reprendre.",
    );
  }

  // Premier prélèvement du cabinet
  let billingStartsAt = null;
  let convertedFromAppTrial = false;
  if (!clientLive) {
    billingStartsAt = activeTrialEnd(org);
    convertedFromAppTrial = Boolean(billingStartsAt);
  } else if (clientSub.status === "trialing") {
    billingStartsAt = toDate(clientSub.trial_end);
  } else if (clientSub.status === "active") {
    if (!TAKEOVER_TIMINGS.includes(timing)) {
      throw new ManagedClientError(
        400,
        "Choisissez quand vous reprenez l'abonnement : tout de suite ou à son échéance.",
      );
    }
    if (timing === "renewal") billingStartsAt = currentPeriod(clientSub).end;
  }

  // Reprise précédente restée en attente (paiement abandonné ou à valider)
  const previous = link.handover;
  if (previous?.toSubscriptionId) {
    const pending = await retrieveSubscription(
      stripe,
      previous.toSubscriptionId,
    );
    if (pending?.status === "incomplete") {
      await stripe.subscriptions
        .cancel(pending.id)
        .catch((error) =>
          console.error(
            "[PAYER-SWITCH] Reprise incomplète non annulée:",
            error?.message,
          ),
        );
    }
  }

  const now = new Date();
  await mongoDb.collection("managedclients").updateOne(
    { _id: link._id },
    {
      $set: {
        handover: {
          direction: "to_manager",
          status: "awaiting_payment",
          fromSubscriptionId: replacedId,
          timing: clientSub?.status === "active" ? timing : null,
          plan,
          isAnnual: Boolean(isAnnual),
          requestedAt: now,
          requestedBy: actor || null,
          expiresAt: new Date(now.getTime() + PENDING_TAKEOVER_MS),
        },
        updatedAt: now,
      },
    },
  );

  let result;
  try {
    result = await createCabinetSubscription({
      mongoDb,
      stripe,
      manager,
      link,
      org,
      plan,
      isAnnual,
      baseUrl,
      billingStartsAt,
      convertedFromAppTrial,
      metadata: {
        payerHandover: "from_client",
        handoverFrom: replacedId || "",
      },
      describeFirstCharge: ({ orgName, firstChargeAt }) =>
        firstChargeAt
          ? `Reprise de l'abonnement de ${orgName}. Premier prélèvement le ${frenchDate(firstChargeAt)}.`
          : `Reprise de l'abonnement de ${orgName}, à partir d'aujourd'hui.`,
    });
  } catch (error) {
    await mongoDb
      .collection("managedclients")
      .updateOne(
        { _id: link._id, "handover.status": "awaiting_payment" },
        { $unset: { handover: "" } },
      );
    throw error;
  }

  if (
    result.subscription &&
    ["active", "trialing"].includes(result.subscription.status)
  ) {
    const done = await finalizeTakeover({
      mongoDb,
      stripe,
      stripeSubscription: result.subscription,
      baseUrl,
    });
    return {
      status: "active",
      mode: done.mode,
      effectiveAt: done.effectiveAt,
      refund: done.refund || null,
    };
  }
  if (result.subscription) {
    // Validation bancaire demandée : la reprise se termine au paiement
    await mongoDb
      .collection("managedclients")
      .updateOne(
        { _id: link._id, "handover.status": "awaiting_payment" },
        { $set: { "handover.toSubscriptionId": result.subscription.id } },
      );
  }
  return result.url
    ? { status: "redirect", url: result.url }
    : { status: result.status };
}

// Le document de l'espace suit un abonnement arrêté tout de suite
async function endSubscriptionDoc(mongoDb, doc, now) {
  await mongoDb.collection("subscription").updateOne(
    { _id: doc._id },
    {
      $set: {
        status: "canceled",
        cancelAtPeriodEnd: false,
        periodEnd: now,
        currentPeriodEnd: now,
        updatedAt: now,
      },
    },
  );
}

/**
 * Arrête la prise en charge par le cabinet de son abonnement en cours.
 * @returns {Promise<{ mode: string, effectiveAt: Date, trialEndsAt?: Date, nextChargeAt?: Date }>}
 */
async function releaseCabinetSubscription({
  mongoDb,
  stripe,
  cabinetDoc,
  link,
}) {
  const now = new Date();
  const cabinetSub = await retrieveSubscription(
    stripe,
    cabinetDoc.stripeSubscriptionId,
  );
  if (!isLive(cabinetSub)) {
    await endSubscriptionDoc(mongoDb, cabinetDoc, now);
    return { mode: "ended", effectiveAt: now };
  }
  const marker = { payerHandover: "to_client" };

  if (cabinetSub.status === "trialing") {
    // Reprise « à l'échéance » pas encore commencée : le client retrouve
    // son abonnement, qui n'avait pas été renouvelé
    const clientSub = await retrieveSubscription(
      stripe,
      cabinetSub.metadata?.handoverFrom,
    );
    if (
      clientSub &&
      ["active", "past_due"].includes(clientSub.status) &&
      clientSub.cancel_at_period_end
    ) {
      const restored = await stripe.subscriptions.update(clientSub.id, {
        cancel_at_period_end: false,
        metadata: { payerHandover: "", takenOverByAccountManagerId: "" },
      });
      const clientSubscription = {
        ...clientSub,
        ...restored,
        cancel_at_period_end: false,
      };
      clientSubscription.metadata = {
        ...clientSubscription.metadata,
        referenceId: String(link.organizationId),
      };
      // L'espace repasse sur l'abonnement du client avant que celui du
      // cabinet s'arrête
      await syncManagedSubscription(mongoDb, clientSubscription, {
        replaceSubscriptionId: cabinetSub.id,
      });
      await stripe.subscriptions.update(cabinetSub.id, { metadata: marker });
      await stripe.subscriptions.cancel(cabinetSub.id, { prorate: false });
      return {
        mode: "restored",
        effectiveAt: now,
        nextChargeAt: currentPeriod(clientSub).end,
      };
    }

    // Rien n'a encore été prélevé au cabinet : son abonnement s'arrête tout
    // de suite, le client retrouve l'essai qui lui restait
    await stripe.subscriptions.update(cabinetSub.id, { metadata: marker });
    await stripe.subscriptions.cancel(cabinetSub.id, { prorate: false });
    await endSubscriptionDoc(mongoDb, cabinetDoc, now);
    const trialEnd = toDate(cabinetSub.trial_end);
    if (
      isAppTrialEnabled() &&
      trialEnd &&
      trialEnd.getTime() > now.getTime() + 60_000
    ) {
      await mongoDb.collection("organization").updateOne(
        { _id: link.organizationId },
        {
          $set: {
            isTrialActive: true,
            trialEndDate: trialEnd.toISOString(),
            stripeTrialActive: false,
            updatedAt: now,
          },
          $unset: { convertedTrialBillingStartsAt: "" },
        },
      );
      return {
        mode: "trial-restored",
        effectiveAt: now,
        trialEndsAt: trialEnd,
      };
    }
    return { mode: "ended", effectiveAt: now };
  }

  if (cabinetSub.status === "incomplete") {
    // Premier paiement jamais validé : rien n'est dû
    await stripe.subscriptions.update(cabinetSub.id, { metadata: marker });
    await voidUnpaidInvoices(stripe, cabinetSub.id);
    await stripe.subscriptions.cancel(cabinetSub.id, { prorate: false });
    await endSubscriptionDoc(mongoDb, cabinetDoc, now);
    return { mode: "ended", effectiveAt: now };
  }

  // Période en cours (payée, ou due par le cabinet) : elle va à son terme
  await stripe.subscriptions.update(cabinetSub.id, {
    cancel_at_period_end: true,
    metadata: marker,
  });
  await mongoDb
    .collection("subscription")
    .updateOne(
      { _id: cabinetDoc._id },
      { $set: { cancelAtPeriodEnd: true, updatedAt: now } },
    );
  return {
    mode: "scheduled",
    effectiveAt: currentPeriod(cabinetSub).end || now,
  };
}

/**
 * Le cabinet ne paie plus l'abonnement d'un client : le client le reprend.
 * Une période déjà payée par le cabinet va à son terme ; le client est
 * prévenu et peut choisir son offre tout de suite.
 * @param {{ manager: object, linkId: string, actor: object }} params
 */
export async function handBackSubscription({
  mongoDb,
  stripe,
  manager,
  linkId,
  actor,
  baseUrl,
}) {
  const link = await loadActiveLink(mongoDb, manager._id, linkId);
  if (link.payer !== "manager") {
    throw new ManagedClientError(
      409,
      "Ce client paie déjà lui-même son abonnement.",
    );
  }
  const org = await loadOrg(mongoDb, link.organizationId);
  const { cabinetDoc } = await classifySubscriptions(
    mongoDb,
    manager,
    link.organizationId,
  );

  const now = new Date();
  let outcome;
  if (cabinetDoc) {
    outcome = await releaseCabinetSubscription({
      mongoDb,
      stripe,
      cabinetDoc,
      link,
    });
  } else {
    const trialEnd = activeTrialEnd(org);
    outcome = trialEnd
      ? { mode: "trial-restored", effectiveAt: now, trialEndsAt: trialEnd }
      : { mode: "ended", effectiveAt: now };
  }

  await mongoDb.collection("managedclients").updateOne(
    { _id: link._id },
    {
      $set: {
        payer: "client",
        payerChangedAt: now,
        payerChange:
          outcome.mode === "scheduled"
            ? upcomingChange("client", outcome.effectiveAt)
            : null,
        updatedAt: now,
      },
      $unset: { handover: "" },
      $push: {
        payerHistory: historyEntry({
          from: "manager",
          to: "client",
          outcome,
          by: actor,
          fromSubscriptionId: cabinetDoc?.stripeSubscriptionId,
        }),
      },
    },
  );
  await notifyClient({ mongoDb, link, manager, outcome, baseUrl });
  return {
    status: "done",
    mode: outcome.mode,
    effectiveAt: outcome.effectiveAt,
    trialEndsAt: outcome.trialEndsAt || null,
    nextChargeAt: outcome.nextChargeAt || null,
  };
}

/**
 * Le cabinet a arrêté sa prise en charge, sa dernière période court
 * encore : le client peut choisir son offre dès maintenant, premier
 * prélèvement à la fin de cette période. null sinon (le cabinet paie
 * toujours, ou rien ne court).
 * @returns {Promise<{ endsAt: Date|null, managerName: string, subscriptionId: string } | null>}
 */
export async function getCabinetHandBack(mongoDb, organizationId) {
  const orgOid = asObjectId(organizationId ? String(organizationId) : null);
  if (!orgOid) return null;
  const paying = await mongoDb
    .collection("managedclients")
    .findOne(
      { organizationId: orgOid, status: "active", payer: "manager" },
      { projection: { _id: 1 } },
    );
  if (paying) return null;
  const docs = await mongoDb
    .collection("subscription")
    .find(
      { referenceId: String(orgOid), status: { $in: LIVE_STATUSES } },
      {
        projection: {
          stripeCustomerId: 1,
          stripeSubscriptionId: 1,
          cancelAtPeriodEnd: 1,
          currentPeriodEnd: 1,
          periodEnd: 1,
        },
      },
    )
    .toArray();
  for (const doc of docs) {
    if (!doc.stripeCustomerId || !doc.cancelAtPeriodEnd) continue;
    const manager = await findManagerByStripeCustomerId(
      mongoDb,
      doc.stripeCustomerId,
    );
    if (manager) {
      const end = doc.currentPeriodEnd || doc.periodEnd;
      return {
        endsAt: end ? new Date(end) : null,
        managerName: manager.name,
        subscriptionId: doc.stripeSubscriptionId,
      };
    }
  }
  return null;
}

/**
 * Premier prélèvement différé de l'abonnement que le client prend pendant
 * la dernière période payée par son cabinet (Stripe Checkout : au moins
 * 48 h). null : prélèvement immédiat.
 */
export function deferredClientBilling(handBack) {
  const end = handBack?.endsAt ? new Date(handBack.endsAt) : null;
  return end && end.getTime() > Date.now() + CHECKOUT_MIN_TRIAL_MS ? end : null;
}

/**
 * Webhook Stripe pour un abonnement payé par un cabinet : la reprise d'un
 * client se termine quand le paiement du cabinet est passé, sinon le
 * document de l'espace est mis à jour comme au retour de Checkout.
 */
export async function handleCabinetSubscriptionEvent({
  mongoDb,
  stripe,
  subscription,
}) {
  if (subscription?.metadata?.payerHandover === "from_client") {
    return finalizeTakeover({
      mongoDb,
      stripe,
      stripeSubscription: subscription,
    });
  }
  const organizationId = await syncManagedSubscription(mongoDb, subscription);
  return { status: organizationId ? "synced" : "ignored" };
}

/**
 * Ce que le cabinet voit avant de changer le payeur : l'abonnement en
 * cours, ce qui se passera et quand, le remboursement éventuel du client.
 */
export async function getPayerSwitchPreview({
  mongoDb,
  stripe,
  manager,
  linkId,
}) {
  const link = await loadActiveLink(mongoDb, manager._id, linkId);
  const org = await loadOrg(mongoDb, link.organizationId);
  const { cabinetDoc, otherCabinetDoc, clientDoc, grantedDoc } =
    await classifySubscriptions(mongoDb, manager, link.organizationId);
  const hasSavedCard = manager.stripeCustomerId
    ? Boolean(
        await savedCard(stripe, manager.stripeCustomerId).catch(() => null),
      )
    : false;
  const additionalSeats = Object.fromEntries(
    await Promise.all(
      MANAGED_PLANS.map(async (plan) => [
        plan,
        await countAdditionalSeats(mongoDb, link.organizationId, plan).catch(
          () => 0,
        ),
      ]),
    ),
  );
  const trialEnd = activeTrialEnd(org);
  const base = {
    id: String(link._id),
    name: org.companyName || org.name || null,
    payer: link.payer,
    discountPercent: Number(manager.discountPercent) || 0,
    hasSavedCard,
    trialEndsAt: trialEnd,
    additionalSeats,
  };

  const describe = (subscription, doc) => ({
    plan: subscription?.metadata?.planName || doc?.plan || null,
    interval: intervalOf(subscription),
    status: subscription?.status || doc?.status,
    periodEnd: currentPeriod(subscription || {}).end,
    trialEnd: toDate(subscription?.trial_end),
    cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
  });

  if (link.payer === "client") {
    if (cabinetDoc) {
      const cabinetSub = await retrieveSubscription(
        stripe,
        cabinetDoc.stripeSubscriptionId,
      );
      return {
        ...base,
        action: "resume",
        cabinet: describe(cabinetSub, cabinetDoc),
      };
    }
    if (otherCabinetDoc)
      return { ...base, action: "blocked", reason: "other_cabinet" };
    const clientSub = clientDoc
      ? await retrieveSubscription(stripe, clientDoc.stripeSubscriptionId)
      : null;
    if (!isLive(clientSub)) {
      if (grantedDoc) return { ...base, action: "blocked", reason: "granted" };
      return { ...base, action: "takeover", client: null };
    }
    const client = describe(clientSub, clientDoc);
    if (clientSub.status === "active") {
      client.refundNow = await unusedPeriodCredit(stripe, clientSub);
      // Sans carte enregistrée, Stripe Checkout ne peut pas reporter le
      // premier prélèvement à moins de 48 h : c'est alors « tout de suite »
      client.renewalChargesNow =
        !hasSavedCard &&
        (!client.periodEnd ||
          client.periodEnd.getTime() < Date.now() + CHECKOUT_MIN_TRIAL_MS);
    }
    return { ...base, action: "takeover", client };
  }

  // Le cabinet paie : ce qui se passera s'il arrête
  if (!cabinetDoc) {
    return {
      ...base,
      action: "handback",
      cabinet: null,
      outcome: trialEnd ? "trial-restored" : "ended",
    };
  }
  const cabinetSub = await retrieveSubscription(
    stripe,
    cabinetDoc.stripeSubscriptionId,
  );
  const cabinet = describe(cabinetSub, cabinetDoc);
  let outcome = "scheduled";
  let clientRestore = null;
  if (!isLive(cabinetSub) || cabinetSub.status === "incomplete") {
    outcome = "ended";
  } else if (cabinetSub.status === "trialing") {
    const clientSub = await retrieveSubscription(
      stripe,
      cabinetSub.metadata?.handoverFrom,
    );
    if (
      clientSub &&
      ["active", "past_due"].includes(clientSub.status) &&
      clientSub.cancel_at_period_end
    ) {
      outcome = "restored";
      clientRestore = describe(clientSub, null);
    } else {
      const end = toDate(cabinetSub.trial_end);
      outcome =
        isAppTrialEnabled() && end && end.getTime() > Date.now() + 60_000
          ? "trial-restored"
          : "ended";
    }
  }
  return { ...base, action: "handback", cabinet, outcome, clientRestore };
}

/**
 * Changement de payeur demandé par l'équipe Newbi (admin.newbi.fr). Vers le
 * client : comme le cabinet. Vers le cabinet : seulement si le client ne
 * paie rien en ce moment (le cabinet choisit ensuite l'offre et la paie
 * depuis son espace) ; un abonnement en cours se reprend depuis l'espace du
 * cabinet, qui seul peut payer.
 */
export async function changePayerByAdmin({
  mongoDb,
  stripe,
  linkId,
  payer,
  adminEmail,
  baseUrl,
}) {
  if (!["client", "manager"].includes(payer)) {
    throw new ManagedClientError(400, "Payeur inconnu.");
  }
  const linkOid = asObjectId(linkId);
  const link = linkOid
    ? await mongoDb
        .collection("managedclients")
        .findOne({ _id: linkOid, status: "active" })
    : null;
  if (!link?.organizationId) {
    throw new ManagedClientError(404, "Client introuvable.");
  }
  const manager = await mongoDb
    .collection("accountmanagers")
    .findOne({ _id: link.managerId });
  if (!manager) throw new ManagedClientError(404, "Gestionnaire introuvable.");
  const actor = { type: "admin", email: adminEmail || null };

  if (payer === "client") {
    return handBackSubscription({
      mongoDb,
      stripe,
      manager,
      linkId: String(link._id),
      actor,
      baseUrl,
    });
  }

  if (link.payer === "manager") {
    throw new ManagedClientError(409, "Le cabinet paie déjà cet abonnement.");
  }
  const { cabinetDoc, clientDoc, grantedDoc } = await classifySubscriptions(
    mongoDb,
    manager,
    link.organizationId,
  );
  if (cabinetDoc) {
    return resumeCabinetSubscription({
      mongoDb,
      stripe,
      manager,
      link,
      cabinetDoc,
      actor,
      baseUrl,
    });
  }
  if (clientDoc || grantedDoc) {
    throw new ManagedClientError(
      409,
      "Le client a un abonnement en cours : c'est au cabinet de le reprendre depuis son espace (Clients, « Prendre en charge l'abonnement »), pour le payer avec sa carte.",
    );
  }
  const now = new Date();
  const org = await loadOrg(mongoDb, link.organizationId);
  const outcome = {
    mode: activeTrialEnd(org) ? "trial" : "pending",
    effectiveAt: now,
    refund: null,
  };
  await mongoDb.collection("managedclients").updateOne(
    { _id: link._id },
    {
      $set: {
        payer: "manager",
        payerChangedAt: now,
        payerChange: null,
        updatedAt: now,
      },
      $unset: { handover: "" },
      $push: {
        payerHistory: historyEntry({
          from: "client",
          to: "manager",
          outcome,
          by: actor,
        }),
      },
    },
  );
  await notifyClient({ mongoDb, link, manager, outcome, baseUrl });
  return { status: "done", mode: "pending_offer", effectiveAt: now };
}
