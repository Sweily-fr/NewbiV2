import { NextResponse } from "next/server";
import Stripe from "stripe";
import { apiError, withErrorHandler } from "@/src/lib/security";
import { requireAccountManager } from "@/src/lib/gestionnaire-auth";
import { ManagedClientError } from "@/src/lib/managed-clients";
import { createManagerPortalSession } from "@/src/lib/manager-billing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/gestionnaire/portail
 *
 * Portail Stripe du cabinet (carte, adresse de facturation, factures).
 */
async function handler(request) {
  const { manager } = await requireAccountManager(request, {
    allowSuspended: true,
  });
  const origin =
    request.headers.get("origin") ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    "http://localhost:3000";
  try {
    const result = await createManagerPortalSession({
      stripe,
      manager,
      returnUrl: `${origin.replace(/\/+$/, "")}/dashboard/gestionnaire?parametres=depenses-clients`,
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
