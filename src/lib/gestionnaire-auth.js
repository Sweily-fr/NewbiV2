import { mongoDb } from "@/src/lib/mongodb";
import { requireSession, apiError } from "@/src/lib/security";
import { findActiveAccountManagerByUserId } from "@/src/lib/managed-clients";

/**
 * Routes de l'espace gestionnaire : utilisateur connecté ET compte
 * gestionnaire actif. Le gestionnaire vient toujours de la session, jamais
 * de la requête.
 * @returns {Promise<{ user: object, manager: object }>}
 * @throws {NextResponse} 401 / 403
 */
export async function requireAccountManager(request) {
  const { user } = await requireSession(request);
  const manager = await findActiveAccountManagerByUserId(mongoDb, user.id);
  if (!manager) throw apiError(403, "Réservé aux comptes gestionnaires");
  return { user, manager };
}
