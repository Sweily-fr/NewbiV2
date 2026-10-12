import { NextResponse } from "next/server";
import Stripe from "stripe";
import { mongoDb } from "@/src/lib/mongodb";
import { apiError, withErrorHandler } from "@/src/lib/security";
import { requireAccountManager } from "@/src/lib/gestionnaire-auth";
import { ManagedClientError } from "@/src/lib/managed-clients";
import { confirmManagedCheckout } from "@/src/lib/manager-billing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/gestionnaire/abonnements/confirmer
 *
 * Retour de Stripe Checkout : { sessionId }. Enregistre l'abonnement de
 * l'espace sans attendre le webhook.
 */
async function handler(request) {
  const { manager } = await requireAccountManager(request);
  const body = await request.json().catch(() => null);
  try {
    const result = await confirmManagedCheckout({
      mongoDb,
      stripe,
      manager,
      sessionId: body?.sessionId,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ManagedClientError) {
      return apiError(error.status, error.message);
    }
    throw error;
  }
}

export const POST = withErrorHandler(handler);
