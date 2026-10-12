import { NextResponse } from "next/server";
import Stripe from "stripe";
import { mongoDb } from "@/src/lib/mongodb";
import { withErrorHandler } from "@/src/lib/security";
import { requireAccountManager } from "@/src/lib/gestionnaire-auth";
import { getManagerBillingSummary } from "@/src/lib/manager-billing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * GET /api/gestionnaire/depenses
 *
 * Récapitulatif des abonnements que le cabinet paie pour ses clients :
 * total par mois, détail par espace, offres à choisir, factures, carte.
 */
async function handler(request) {
  const { manager } = await requireAccountManager(request);
  const summary = await getManagerBillingSummary({ mongoDb, stripe, manager });
  return NextResponse.json(summary);
}

export const GET = withErrorHandler(handler);
