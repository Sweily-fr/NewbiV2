/**
 * Un seul abonnement en cours par espace.
 *
 * Un paiement Stripe Checkout crée toujours un NOUVEL abonnement Stripe. Sur
 * un espace qui en a déjà un en cours, l'espace pointerait sur le nouveau et
 * l'ancien continuerait d'être prélevé. Avant de créer un Checkout pour un
 * espace existant (create-org-subscription type « existing »,
 * billing/subscribe), on refuse donc s'il a un abonnement en cours, et on
 * ferme les Checkout encore ouverts de cet espace (autre onglet). Le
 * changement d'offre passe par /api/change-subscription-plan, le paiement en
 * retard par le portail Stripe.
 *
 * Exception, gérée par l'appelant : la reprise de l'abonnement par le client
 * quand son cabinet arrête de le payer (getCabinetHandBack).
 */

// Abonnement qui prélève (ou prélèvera) encore l'espace. « incomplete »
// n'en fait pas partie : premier paiement non abouti, l'abonnement expire
// seul et l'utilisateur doit pouvoir recommencer.
export const BLOCKING_SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "unpaid",
];

const isBlocking = (status) => BLOCKING_SUBSCRIPTION_STATUSES.includes(status);

/**
 * Abonnement en cours enregistré pour l'espace (document `subscription`).
 * Les documents archivés lors d'un remplacement ont un autre referenceId.
 *
 * @returns {Promise<{ status: string } | null>}
 */
export async function findLiveWorkspaceSubscription(mongoDb, organizationId) {
  const orgId = String(organizationId || "");
  if (!orgId) return null;
  const doc = await mongoDb
    .collection("subscription")
    .findOne(
      { referenceId: orgId, status: { $in: BLOCKING_SUBSCRIPTION_STATUSES } },
      { projection: { status: 1, referenceId: 1, stripeSubscriptionId: 1 } },
    );
  if (doc && String(doc.referenceId) === orgId && isBlocking(doc.status)) {
    return { status: doc.status };
  }
  return null;
}

// Abonnement Stripe rattaché à l'espace par ses métadonnées. Celui d'un
// NOUVEL espace porte d'abord l'espace actif de son créateur dans
// organizationId, puis le nouvel espace dans referenceId (webhook).
function belongsToWorkspace(subscription, orgId) {
  const meta = subscription?.metadata || {};
  if (meta.referenceId) return meta.referenceId === orgId;
  return meta.organizationId === orgId && meta.isNewOrganization !== "true";
}

/**
 * Abonnement en cours de l'espace chez Stripe, sur le client qui va payer :
 * couvre un paiement déjà fait dont le webhook n'est pas encore arrivé. En
 * cas d'erreur Stripe, le contrôle du document de l'espace reste seul.
 *
 * @returns {Promise<{ status: string } | null>}
 */
export async function findLiveStripeSubscription(
  stripe,
  customerId,
  organizationId,
) {
  const orgId = String(organizationId || "");
  if (!customerId || !orgId) return null;
  try {
    const { data } = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 100,
    });
    const live = (data || []).find(
      (subscription) =>
        isBlocking(subscription.status) &&
        belongsToWorkspace(subscription, orgId),
    );
    return live ? { status: live.status } : null;
  } catch (error) {
    console.warn(
      "[SUBSCRIPTION-GUARD] Abonnements Stripe non relus:",
      error?.message,
    );
    return null;
  }
}

/**
 * Ferme les paiements Checkout encore ouverts pour cet espace existant : un
 * seul peut aboutir (deux onglets, double clic).
 */
export async function expireOpenWorkspaceCheckouts(
  stripe,
  customerId,
  organizationId,
) {
  const orgId = String(organizationId || "");
  if (!customerId || !orgId) return;
  try {
    const { data } = await stripe.checkout.sessions.list({
      customer: customerId,
      status: "open",
      limit: 100,
    });
    await Promise.all(
      (data || [])
        .filter(
          (session) =>
            session.metadata?.organizationId === orgId &&
            session.metadata?.isNewOrganization === "false",
        )
        .map((session) => stripe.checkout.sessions.expire(session.id)),
    );
  } catch (error) {
    console.warn(
      "[SUBSCRIPTION-GUARD] Paiements ouverts non fermés:",
      error?.message,
    );
  }
}

/** Message affiché quand l'espace a déjà un abonnement en cours. */
export function liveSubscriptionMessage(status) {
  if (status === "past_due" || status === "unpaid") {
    return "Le paiement de l'abonnement de cet espace est en attente. Mettez à jour votre moyen de paiement dans les paramètres, rubrique Facturation.";
  }
  return "Cet espace a déjà un abonnement en cours.";
}
