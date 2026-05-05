import { NextResponse } from "next/server";
import Stripe from "stripe";
import { mongoDb } from "@/src/lib/mongodb";
import { withErrorHandler } from "@/src/lib/security";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

async function handler(request) {
  const { accountId } = await request.json();

  if (!accountId) {
    return NextResponse.json(
      { success: false, message: "accountId est requis" },
      { status: 400 },
    );
  }

  console.log(`🔍 Vérification du statut du compte Stripe: ${accountId}`);

  // Récupérer les informations du compte depuis Stripe
  const account = await stripe.accounts.retrieve(accountId);

  console.log(`📋 Compte Stripe récupéré:`, {
    id: account.id,
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
  });

  // Mettre à jour la base de données
  const updateResult = await mongoDb
    .collection("stripeconnectaccounts")
    .updateOne(
      { accountId: accountId },
      {
        $set: {
          isOnboarded: account.details_submitted,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          updatedAt: new Date(),
        },
      },
    );

  console.log(`✅ Base de données mise à jour:`, {
    matched: updateResult.matchedCount,
    modified: updateResult.modifiedCount,
  });

  return NextResponse.json({
    success: true,
    message: "Statut mis à jour avec succès",
    isOnboarded: account.details_submitted,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    accountStatus: account.charges_enabled ? "active" : "pending",
  });
}

export const POST = withErrorHandler(handler);
