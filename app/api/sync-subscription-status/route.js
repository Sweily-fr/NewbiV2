import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import Stripe from "stripe";
import { withErrorHandler } from "@/src/lib/security";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

async function handler(request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { stripeSubscriptionId } = await request.json();

  if (!stripeSubscriptionId) {
    return Response.json(
      { error: "stripeSubscriptionId requis" },
      { status: 400 },
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

  // Mettre à jour la base de données via l'adapter Better Auth
  const { mongoDb } = await import("@/src/lib/mongodb");

  const updateResult = await mongoDb.collection("subscription").updateOne(
    { stripeSubscriptionId: stripeSubscriptionId },
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
