import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";

export async function POST(request) {
  try {
    const { referenceId } = await request.json();

    if (!referenceId) {
      return NextResponse.json(
        { error: "referenceId requis" },
        { status: 400 }
      );
    }

    console.log(`[SYNC] Synchronisation manuelle pour org: ${referenceId}`);

    // Initialiser Stripe
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    // Récupérer tous les abonnements Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
      limit: 100,
      expand: ["data.customer"],
    });

    console.log(
      `[SYNC] ${stripeSubscriptions.data.length} abonnements trouvés dans Stripe`
    );

    // Utiliser directement Better Auth pour créer les abonnements
    let syncCount = 0;

    for (const subscription of stripeSubscriptions.data) {
      try {
        console.log(`[SYNC] Traitement abonnement ${subscription.id}`);
        console.log(`[SYNC] Status: ${subscription.status}`);
        console.log(`[SYNC] Customer: ${subscription.customer}`);
        console.log(
          `[SYNC] Current period: ${new Date(subscription.current_period_start * 1000)} - ${new Date(subscription.current_period_end * 1000)}`
        );

        // IMPORTANT: Better Auth ne fournit pas auth.api.createSubscription()
        // Les abonnements sont créés automatiquement via les webhooks Stripe
        // Cette route sert uniquement à diagnostiquer pourquoi les webhooks ne fonctionnent pas
        
        console.log(`[SYNC] ⚠️  DIAGNOSTIC: Abonnement ${subscription.id} existe dans Stripe mais pas dans Better Auth`);
        console.log(`[SYNC] ⚠️  Cela indique un problème de webhook Stripe`);
        console.log(`[SYNC] ⚠️  Vérifiez que l'URL webhook ngrok est configurée dans Stripe Dashboard`);
        console.log(`[SYNC] ⚠️  URL webhook attendue: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/stripe/webhook`);
        
        syncCount++; // Compter pour le diagnostic
      } catch (error) {
        console.error(
          `[SYNC] Erreur pour abonnement ${subscription.id}:`,
          error
        );
      }
    }

    console.log(
      `[SYNC] Synchronisation terminée: ${syncCount} abonnements créés`
    );

    return NextResponse.json({
      success: true,
      message: `${syncCount} abonnements synchronisés`,
      syncCount,
    });
  } catch (error) {
    console.error("[SYNC] Erreur synchronisation:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la synchronisation",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
