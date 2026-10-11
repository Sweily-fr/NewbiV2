import { mongoDb } from "@/src/lib/mongodb";
import { getAccountActions } from "@/src/lib/organization-roles";
import { apiError } from "./api-error";

/**
 * Vérifie qu'un utilisateur est membre de l'espace ET que son rôle
 * (prédéfini, ajusté ou personnalisé) permet une action d'une page du
 * compte : `integrations` (manage), `billing` (manage), `orgSettings`
 * (edit) ou `team`. Un rôle qui n'a que « Voir » est refusé.
 *
 * @param {string} userId - ID de l'utilisateur (session)
 * @param {string} orgId - ID de l'espace
 * @param {"team"|"orgSettings"|"integrations"|"billing"} moduleKey - page
 * @param {string} action - action exigée (ex. "manage")
 * @returns {Promise<{ role: string }>}
 * @throws {NextResponse} 403 si l'utilisateur n'est pas membre ou si son
 *   rôle ne permet pas l'action
 */
export async function requireOrgAction(userId, orgId, moduleKey, action) {
  const { role, actions } = await getAccountActions(mongoDb, {
    userId,
    organizationId: orgId,
    moduleKey,
  });
  if (!role) {
    throw apiError(403, "Non autorisé");
  }
  if (!actions.includes(action)) {
    throw apiError(
      403,
      "Votre rôle ne permet pas d'effectuer cette action.",
      `Action ${moduleKey}.${action} refusée au rôle ${role}`,
    );
  }
  return { role };
}
