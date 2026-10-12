import { NextResponse } from "next/server";
import Stripe from "stripe";
import { mongoDb } from "@/src/lib/mongodb";
import { apiError, withErrorHandler } from "@/src/lib/security";
import { requireAccountManager } from "@/src/lib/gestionnaire-auth";
import { ManagedClientError } from "@/src/lib/managed-clients";
import { startManagedSubscription } from "@/src/lib/manager-billing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/gestionnaire/clients/:id/abonnement
 *
 * Le cabinet choisit l'offre d'un espace qu'il paie (:id = fiche
 * managedclients). Corps : { plan, isAnnual }.
 * → { status: "active" } (carte enregistrée) ou { status: "redirect", url }
 *   (Stripe Checkout, ou validation demandée par la banque).
 */
async function handler(request, { params }) {
  const { manager } = await requireAccountManager(request);
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return apiError(400, "Requête invalide");
  }
  try {
    const result = await startManagedSubscription({
      mongoDb,
      stripe,
      manager,
      linkId: id,
      plan: body.plan,
      isAnnual: body.isAnnual === true,
      baseUrl:
        request.headers.get("origin") ||
        process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
        "http://localhost:3000",
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
