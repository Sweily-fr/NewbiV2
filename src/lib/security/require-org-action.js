import { mongoDb } from "@/src/lib/mongodb";
import { getModuleActions } from "@/src/lib/organization-roles";
import { apiError } from "./api-error";

/**
 * Vérifie qu'un utilisateur est membre de l'espace ET que son rôle
 * (prédéfini, ajusté ou personnalisé) permet une action sur une page :
 * page du compte (`integrations` manage, `billing` view/manage,
 * `orgSettings` edit, `team`) ou document de vente (`invoices`,
 * `creditNotes`, `quotes`, `purchaseOrders`, `deliveryNotes`, action
 * « view » pour lire). Un rôle qui n'a que « Voir » est refusé pour toute
 * autre action ; un rôle sans « Voir » ne lit rien.
 *
 * @param {string|import("mongodb").ObjectId} userId - ID de l'utilisateur (session)
 * @param {string|import("mongodb").ObjectId} orgId - ID de l'espace
 * @param {string} moduleKey - page (grille des rôles)
 * @param {string} action - action exigée (ex. "view", "manage")
 * @returns {Promise<{ role: string }>}
 * @throws {NextResponse} 403 si l'utilisateur n'est pas membre ou si son
 *   rôle ne permet pas l'action
 */
export async function requireOrgAction(userId, orgId, moduleKey, action) {
  const { role, actions } = await getModuleActions(mongoDb, {
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
      action === "view"
        ? "Votre rôle ne permet pas de consulter ces informations."
        : "Votre rôle ne permet pas d'effectuer cette action.",
      `Action ${moduleKey}.${action} refusée au rôle ${role}`,
    );
  }
  return { role };
}
