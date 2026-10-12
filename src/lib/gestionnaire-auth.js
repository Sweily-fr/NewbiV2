import { mongoDb } from "@/src/lib/mongodb";
import { requireSession, apiError } from "@/src/lib/security";
import { findAccountManagerByUserId } from "@/src/lib/managed-clients";

/**
 * Routes de l'espace gestionnaire : utilisateur connecté ET compte
 * gestionnaire actif. Le gestionnaire vient toujours de la session, jamais
 * de la requête.
 *
 * allowSuspended : un cabinet suspendu par Newbi garde l'accès à ce qu'il
 * paie déjà (dépenses, portail Stripe) pour gérer sa carte ou résilier.
 * @returns {Promise<{ user: object, manager: object }>}
 * @throws {NextResponse} 401 / 403
 */
export async function requireAccountManager(
  request,
  { allowSuspended = false } = {},
) {
  const { user } = await requireSession(request);
  const manager = await findAccountManagerByUserId(mongoDb, user.id);
  if (!manager) throw apiError(403, "Réservé aux comptes gestionnaires");
  if (manager.status !== "active" && !allowSuspended) {
    throw apiError(
      403,
      "Votre compte gestionnaire est suspendu : contactez Newbi pour le réactiver.",
    );
  }
  return { user, manager };
}
