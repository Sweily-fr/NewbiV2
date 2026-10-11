import { NextResponse } from "next/server";
import {
  apiError,
  requireOrgAction,
  requireSession,
  withErrorHandler,
} from "@/src/lib/security";
import { findOrgStripeConnectAccount } from "@/src/lib/stripe-connect-account";

/**
 * GET /api/stripe/connect/account?organizationId=
 *
 * Compte Stripe Connect de l'espace actif (ou de l'espace passé dans
 * `organizationId`), avec le droit « Gérer » sur les applications. Le
 * paramètre `userId` des anciens appels est ignoré : on ne lit plus le
 * compte d'un utilisateur désigné par la requête, seulement celui de
 * l'espace (ou l'ancien compte personnel de l'utilisateur de la session).
 */
async function handler(request) {
  const { user, session } = await requireSession(request);

  const { searchParams } = new URL(request.url);
  const orgId =
    searchParams.get("organizationId") || session?.activeOrganizationId;
  if (!orgId) {
    return apiError(400, "Aucun espace actif");
  }

  await requireOrgAction(user.id, orgId, "integrations", "manage");

  const stripeAccount = await findOrgStripeConnectAccount({
    orgId,
    userId: user.id,
  });

  if (!stripeAccount) {
    return NextResponse.json({
      success: false,
      message: "Aucun compte Stripe Connect trouvé",
    });
  }

  return NextResponse.json({
    success: true,
    accountId: stripeAccount.accountId,
    isOnboarded: stripeAccount.isOnboarded,
    chargesEnabled: stripeAccount.chargesEnabled,
    payoutsEnabled: stripeAccount.payoutsEnabled,
  });
}

export const GET = withErrorHandler(handler);
