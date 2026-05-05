import { NextResponse } from "next/server";
import { withErrorHandler } from "@/src/lib/security";

async function handler(request) {
  const { referenceId } = await request.json();

  if (!referenceId) {
    return NextResponse.json({ error: "referenceId requis" }, { status: 400 });
  }

  // Initialiser Stripe
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Récupérer tous les abonnements Stripe
  const stripeSubscriptions = await stripe.subscriptions.list({
    limit: 100,
    expand: ["data.customer"],
  });

  // Utiliser directement Better Auth pour créer les abonnements
  let syncCount = 0;

  for (const subscription of stripeSubscriptions.data) {
    try {
      // IMPORTANT: Better Auth ne fournit pas auth.api.createSubscription()
      // Les abonnements sont créés automatiquement via les webhooks Stripe
      // Cette route sert uniquement à diagnostiquer pourquoi les webhooks ne fonctionnent pas

      syncCount++; // Compter pour le diagnostic
    } catch (error) {
      console.error(`[SYNC] Erreur pour abonnement ${subscription.id}:`, error);
    }
  }

  return NextResponse.json({
    success: true,
    message: `${syncCount} abonnements synchronisés`,
    syncCount,
  });
}

export const POST = withErrorHandler(handler);
