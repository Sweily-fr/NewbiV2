import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  requireSession,
  requireOrgStripeCustomer,
  resolveBillingOrgId,
  withErrorHandler,
} from "@/src/lib/security";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

/**
 * GET /api/stripe/customer?customerId=&organizationId=
 *
 * Coordonnées de facturation du client Stripe de l'espace actif (ou de
 * l'espace passé dans `organizationId`), avec le droit « Voir » sur
 * l'abonnement. Un `customerId` qui n'appartient pas à l'espace est refusé.
 */
async function handler(request) {
  const { user, session } = await requireSession(request);

  const url = new URL(request.url);
  const orgId = resolveBillingOrgId(
    session,
    url.searchParams.get("organizationId"),
  );
  const stripeCustomerId = await requireOrgStripeCustomer({
    userId: user.id,
    orgId,
    action: "view",
    customerId: url.searchParams.get("customerId"),
  });

  // Espace sans client Stripe (essai, abonnement jamais souscrit) : pas de
  // coordonnées de facturation, ce n'est pas une erreur.
  if (!stripeCustomerId) {
    return NextResponse.json({ success: true, customer: null });
  }

  try {
    const [customer, taxIds] = await Promise.all([
      stripe.customers.retrieve(stripeCustomerId),
      stripe.customers
        .listTaxIds(stripeCustomerId, { limit: 1 })
        .catch(() => ({ data: [] })),
    ]);

    if (customer.deleted) {
      return NextResponse.json(
        { success: false, message: "Customer supprimé" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        vatNumber: taxIds?.data?.[0]?.value || null,
        taxIdType: taxIds?.data?.[0]?.type || null,
      },
    });
  } catch (error) {
    // Customer introuvable dans le mode Stripe courant (ex: customer créé en
    // mode test alors que la prod tourne en live, customer migré ou supprimé).
    // C'est un état récupérable : on renvoie "pas de données de facturation"
    // plutôt qu'une erreur, pour ne pas casser l'historique côté UI.
    if (
      error.code === "resource_missing" ||
      error.type === "StripeInvalidRequestError"
    ) {
      console.warn(
        "Customer Stripe introuvable pour cette organisation:",
        stripeCustomerId,
      );
      return NextResponse.json({ success: true, customer: null });
    }

    console.error("Erreur récupération customer Stripe:", error);
    return NextResponse.json(
      { success: false, message: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}

export const GET = withErrorHandler(handler);
