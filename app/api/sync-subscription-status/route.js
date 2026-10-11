import { ObjectId } from "mongodb";
import Stripe from "stripe";
import { mongoDb } from "@/src/lib/mongodb";
import {
  apiError,
  requireOrgAction,
  requireSession,
  resolveBillingOrgId,
  withErrorHandler,
} from "@/src/lib/security";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

/**
 * POST /api/sync-subscription-status
 *
 * Recopie depuis Stripe le statut d'un abonnement de l'espace (retour de
 * résiliation). L'abonnement doit appartenir à l'espace passé dans
 * `organizationId` (ou à l'espace actif de la session) et l'utilisateur doit
 * avoir le droit « Voir » sur l'abonnement de cet espace : sans ces
 * contrôles, n'importe quel utilisateur connecté pouvait lire et réécrire
 * l'abonnement d'un autre espace en donnant son id Stripe.
 *
 * Body : { stripeSubscriptionId, organizationId? }
 */
async function handler(request) {
  const { user, session } = await requireSession(request);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Body JSON invalide");
  }
  const { stripeSubscriptionId, organizationId } = body || {};

  if (!stripeSubscriptionId || typeof stripeSubscriptionId !== "string") {
    return apiError(400, "stripeSubscriptionId requis");
  }

  const orgId = resolveBillingOrgId(session, organizationId);
  await requireOrgAction(user.id, orgId, "billing", "view");

  // L'abonnement doit être un abonnement de cet espace, vérifié AVANT tout
  // appel à Stripe.
  const orgFilter = [{ referenceId: orgId }];
  if (ObjectId.isValid(orgId)) {
    orgFilter.push({ organizationId: new ObjectId(orgId) });
  }
  const subscriptionDoc = await mongoDb
    .collection("subscription")
    .findOne(
      { stripeSubscriptionId, $or: orgFilter },
      { projection: { _id: 1 } },
    );

  if (!subscriptionDoc) {
    return apiError(
      404,
      "Abonnement introuvable pour cet espace",
      `Abonnement ${stripeSubscriptionId} absent de l'espace ${orgId}`,
    );
  }

  // Récupérer le statut actuel de l'abonnement depuis Stripe
  const stripeSubscription =
    await stripe.subscriptions.retrieve(stripeSubscriptionId);

  console.log(`🔄 [SYNC] Statut Stripe pour ${stripeSubscriptionId}:`, {
    status: stripeSubscription.status,
    cancel_at_period_end: stripeSubscription.cancel_at_period_end,
    current_period_end: stripeSubscription.current_period_end,
  });

  const updateResult = await mongoDb.collection("subscription").updateOne(
    { _id: subscriptionDoc._id },
    {
      $set: {
        status: stripeSubscription.status,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
        currentPeriodEnd: new Date(
          stripeSubscription.current_period_end * 1000,
        ),
        currentPeriodStart: new Date(
          stripeSubscription.current_period_start * 1000,
        ),
        periodEnd: new Date(stripeSubscription.current_period_end * 1000),
        updatedAt: new Date(),
      },
    },
  );

  console.log(
    `✅ [SYNC] Base de données mise à jour:`,
    updateResult.modifiedCount > 0 ? "succès" : "aucune modification",
  );

  return Response.json({
    success: true,
    status: stripeSubscription.status,
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    periodEnd: new Date(stripeSubscription.current_period_end * 1000),
    modified: updateResult.modifiedCount > 0,
  });
}

export const POST = withErrorHandler(handler);
