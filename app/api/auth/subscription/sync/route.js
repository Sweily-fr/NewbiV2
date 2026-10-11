import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  apiError,
  getOrgStripeCustomerIds,
  requireOrgMembership,
  requireSession,
  withErrorHandler,
} from "@/src/lib/security";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/auth/subscription/sync
 *
 * Diagnostic : compte les abonnements Stripe d'un espace (les abonnements
 * eux-mêmes sont créés par les webhooks Stripe, Better Auth n'exposant pas
 * de création directe).
 *
 * Auparavant sans authentification, la route listait les 100 derniers
 * abonnements de TOUTE la plateforme Stripe pour n'importe quel appelant.
 * Elle exige maintenant la session, l'appartenance à l'espace `referenceId`,
 * et ne regarde que les clients Stripe de cet espace.
 *
 * Body : { referenceId } (id de l'espace)
 */
async function handler(request) {
  const { user } = await requireSession(request);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Body JSON invalide");
  }
  const { referenceId } = body || {};

  if (!referenceId || typeof referenceId !== "string") {
    return NextResponse.json({ error: "referenceId requis" }, { status: 400 });
  }

  await requireOrgMembership(user.id, referenceId);

  // Seuls les clients Stripe de cet espace, et parmi leurs abonnements ceux
  // rattachés à cet espace (un même client peut payer plusieurs espaces).
  const customerIds = await getOrgStripeCustomerIds(referenceId);
  let syncCount = 0;

  for (const customer of customerIds) {
    const { data } = await stripe.subscriptions.list({
      customer,
      status: "all",
      limit: 100,
    });
    syncCount += data.filter(
      (subscription) =>
        subscription.metadata?.referenceId === referenceId ||
        subscription.metadata?.organizationId === referenceId,
    ).length;
  }

  return NextResponse.json({
    success: true,
    message: `${syncCount} abonnements synchronisés`,
    syncCount,
  });
}

export const POST = withErrorHandler(handler);
