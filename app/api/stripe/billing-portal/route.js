import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  apiError,
  requireSession,
  requireOrgStripeCustomer,
  resolveBillingOrgId,
  withErrorHandler,
} from "@/src/lib/security";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

/**
 * POST /api/stripe/billing-portal
 *
 * Ouvre le portail de facturation Stripe du client de l'espace actif (ou de
 * l'espace passé dans `organizationId`), avec le droit « Gérer
 * l'abonnement ». Le `customerId` éventuellement envoyé par le front n'est
 * accepté que s'il appartient à cet espace ; sans lui, on prend le client
 * de l'abonnement de l'espace.
 *
 * Body (facultatif) : { customerId?, organizationId? }
 */
async function handler(request) {
  const { user, session } = await requireSession(request);

  // Body facultatif : la boîte « abonnement inactif » appelle la route sans
  // body, la page Facturation envoie le client Stripe affiché.
  let body = {};
  try {
    body = (await request.json()) || {};
  } catch {
    body = {};
  }

  const orgId = resolveBillingOrgId(session, body.organizationId);
  const customerId = await requireOrgStripeCustomer({
    userId: user.id,
    orgId,
    action: "manage",
    customerId: body.customerId || null,
  });

  if (!customerId) {
    return apiError(
      400,
      "Aucune facturation Stripe associée à cette organisation",
    );
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin")}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    // Customer introuvable dans le mode Stripe courant (org de test en prod,
    // customer migré/supprimé) : pas de portail possible, on le dit clairement.
    if (
      error.code === "resource_missing" ||
      error.type === "StripeInvalidRequestError"
    ) {
      console.warn(
        "Customer Stripe introuvable pour le portail de facturation:",
        customerId,
      );
      return NextResponse.json(
        { error: "Aucune facturation Stripe associée à cette organisation" },
        { status: 400 },
      );
    }

    console.error("Erreur création session billing portal:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session" },
      { status: 500 },
    );
  }
}

export const POST = withErrorHandler(handler);
