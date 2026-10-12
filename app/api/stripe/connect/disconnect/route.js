import { NextResponse } from "next/server";
import {
  apiError,
  requireOrgAction,
  requireSession,
  withErrorHandler,
} from "@/src/lib/security";

/**
 * POST /api/stripe/connect/disconnect (retirée)
 *
 * Ancienne route sans authentification qui répondait « déconnecté avec
 * succès » sans rien faire. Plus aucun écran ni l'app mobile ne l'appelle :
 * la déconnexion passe par la mutation GraphQL `disconnectStripe` de l'API,
 * qui vérifie déjà le droit « Gérer » sur les applications de l'espace.
 *
 * On exige la session et ce même droit, puis on renvoie 410 au lieu d'un
 * faux succès.
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
        "Route retirée : déconnectez Stripe depuis Paramètres, Applications.",
    },
    { status: 410 },
  );
}

export const POST = withErrorHandler(handler);
