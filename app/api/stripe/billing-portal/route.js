import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  apiError,
  requireSession,
  requireOrgStripeCustomer,
  resolveBillingOrgId,
  withErrorHandler,
} from "@/src/lib/security";
import {
  canOpenBillingPortal,
  SHARED_PAYER_PORTAL_MESSAGE,
} from "@/src/lib/security/billing-portal-access";

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
 * Le portail Stripe couvre tout le client (abonnements, factures, carte).
 * Quand ce client règle aussi d'autres espaces, seul le payeur l'ouvre : un
 * autre membre qui gère l'abonnement de cet espace ne doit ni voir ni
 * résilier ceux des autres espaces.
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

  if (!(await canOpenBillingPortal({ stripe, user, orgId, customerId }))) {
    return apiError(403, SHARED_PAYER_PORTAL_MESSAGE);
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
