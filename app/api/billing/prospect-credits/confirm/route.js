import { NextResponse } from "next/server";
import Stripe from "stripe";
import { mongoDb } from "@/src/lib/mongodb";
import {
  apiError,
  requireOrgMembership,
  requireSession,
  withErrorHandler,
} from "@/src/lib/security";
import {
  PROSPECT_CREDITS_PURPOSE,
  recordProspectCreditPurchase,
} from "@/src/lib/prospect-credits";

const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]+$/;

/**
 * POST /api/billing/prospect-credits/confirm
 * Body : { sessionId }. Au retour de Stripe Checkout : relit la session chez
 * Stripe et ajoute les crédits si le paiement est passé, sans attendre le
 * webhook (le premier des deux enregistre, l'autre ne fait rien).
 */
async function handler(request) {
  const { user } = await requireSession(request);
  let body = {};
  try {
    body = (await request.json()) || {};
  } catch {
    body = {};
  }
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  if (!SESSION_ID.test(sessionId)) {
    return apiError(400, "Paiement introuvable");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return apiError(404, "Paiement introuvable");
  }
  if (session.metadata?.purpose !== PROSPECT_CREDITS_PURPOSE) {
    return apiError(404, "Paiement introuvable");
  }
  // Seul un membre de l'espace crédité voit le résultat
  await requireOrgMembership(user.id, session.metadata.organizationId);

  if (session.payment_status !== "paid") {
    return NextResponse.json({ paid: false, credits: 0, pending: false });
  }
  const recorded = await recordProspectCreditPurchase(mongoDb, session);
  return NextResponse.json({
    paid: Boolean(recorded),
    credits: recorded?.credits || 0,
    // Crédits commandés : utilisables une fois la commande activée
    pending: Boolean(recorded?.pending),
  });
}

export const POST = withErrorHandler(handler);
