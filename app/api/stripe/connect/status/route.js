import { NextResponse } from "next/server";
import Stripe from "stripe";
import { mongoDb } from "@/src/lib/mongodb";
import {
  apiError,
  requireOrgAction,
  requireSession,
  withErrorHandler,
} from "@/src/lib/security";
import { findOrgStripeConnectAccount } from "@/src/lib/stripe-connect-account";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

/**
 * POST /api/stripe/connect/status
 *
 * Recopie depuis Stripe le statut du compte Stripe Connect de l'espace
 * actif (ou de l'espace passé dans `organizationId`), avec le droit
 * « Gérer » sur les applications. Le compte demandé doit être celui de
 * l'espace (ou l'ancien compte personnel de l'utilisateur de la session) :
 * sans ce contrôle, n'importe qui pouvait lire le statut d'un compte Stripe
 * Connect et réécrire sa fiche en donnant son id.
 *
 * Body : { accountId, organizationId? }
 */
async function handler(request) {
  const { user, session } = await requireSession(request);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Body JSON invalide");
  }
  const { accountId, organizationId } = body || {};

  if (!accountId || typeof accountId !== "string") {
    return NextResponse.json(
      { success: false, message: "accountId est requis" },
      { status: 400 },
    );
  }

  const orgId = organizationId || session?.activeOrganizationId;
  if (!orgId || typeof orgId !== "string") {
    return apiError(400, "Aucun espace actif");
  }

  await requireOrgAction(user.id, orgId, "integrations", "manage");

  const account = await findOrgStripeConnectAccount({
    orgId,
    userId: user.id,
    accountId,
  });
  if (!account) {
    return apiError(
      404,
      "Compte Stripe Connect introuvable pour cet espace",
      `Compte ${accountId} absent de l'espace ${orgId}`,
    );
  }

  // Récupérer les informations du compte depuis Stripe
  const stripeAccount = await stripe.accounts.retrieve(account.accountId);

  await mongoDb.collection("stripeconnectaccounts").updateOne(
    { _id: account._id },
    {
      $set: {
        isOnboarded: stripeAccount.details_submitted,
        chargesEnabled: stripeAccount.charges_enabled,
        payoutsEnabled: stripeAccount.payouts_enabled,
        updatedAt: new Date(),
      },
    },
  );

  return NextResponse.json({
    success: true,
    message: "Statut mis à jour avec succès",
    isOnboarded: stripeAccount.details_submitted,
    chargesEnabled: stripeAccount.charges_enabled,
    payoutsEnabled: stripeAccount.payouts_enabled,
    accountStatus: stripeAccount.charges_enabled ? "active" : "pending",
  });
}

export const POST = withErrorHandler(handler);
