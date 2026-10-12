import { NextResponse } from "next/server";
import {
  apiError,
  requireOrgAction,
  requireSession,
  withErrorHandler,
} from "@/src/lib/security";

/**
 * POST /api/stripe/connect/onboard (retirée)
 *
 * Ancienne route sans authentification : elle créait un compte Stripe
 * Connect Express pour n'importe quel `userId`/`email` du body, sans
 * l'enregistrer nulle part. Plus aucun écran ni l'app mobile ne l'appelle :
 * la connexion passe par les mutations GraphQL de l'API
 * (`createStripeConnectAccount`, `generateStripeOnboardingLink`), qui
 * vérifient déjà le droit « Gérer » sur les applications de l'espace.
 *
 * On exige la session et ce même droit, puis on renvoie 410 : plus aucun
 * compte Stripe n'est créé par cette route.
 */
async function handler(request) {
  const { user, session } = await requireSession(request);

  const orgId = session?.activeOrganizationId;
  if (!orgId) {
    return apiError(400, "Aucun espace actif");
  }
  await requireOrgAction(user.id, orgId, "integrations", "manage");

  return NextResponse.json(
    {
      error:
        "Route retirée : connectez Stripe depuis Paramètres, Applications.",
    },
    { status: 410 },
  );
}

export const POST = withErrorHandler(handler);
