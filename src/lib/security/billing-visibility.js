import { mongoDb } from "@/src/lib/mongodb";
import { getModuleActions } from "@/src/lib/organization-roles";
import { apiError } from "./api-error";

/**
 * Lecture de l'abonnement d'un espace : tout membre a besoin du statut, du
 * plan et des limites (accès aux fonctionnalités, bannières d'essai,
 * invitations), mais seul un rôle qui a « Voir l'abonnement » (page
 * Abonnement Newbi) reçoit les identifiants Stripe, montants et détails de
 * facturation.
 *
 * @param {string|import("mongodb").ObjectId} userId - utilisateur de la session
 * @param {string|import("mongodb").ObjectId} orgId - espace visé
 * @returns {Promise<{ role: string, canViewBilling: boolean }>}
 * @throws {NextResponse} 403 si l'utilisateur n'est pas membre de l'espace
 */
export async function requireOrgBillingVisibility(userId, orgId) {
  const { role, canViewBilling } = await getOrgBillingVisibility(userId, orgId);
  if (!role) {
    throw apiError(403, "Non autorisé");
  }
  return { role, canViewBilling };
}

/**
 * Même calcul sans lever d'erreur (routes qui gèrent elles-mêmes leurs
 * réponses) : `role` vaut null si l'utilisateur n'est pas membre.
 *
 * @returns {Promise<{ role: string|null, canViewBilling: boolean }>}
 */
export async function getOrgBillingVisibility(userId, orgId) {
  const { role, actions } = await getModuleActions(mongoDb, {
    userId,
    organizationId: orgId,
    moduleKey: "billing",
  });
  return { role, canViewBilling: Boolean(role) && actions.includes("view") };
}

/**
 * Copie des seuls champs listés (liste blanche : un champ ajouté plus tard
 * à la réponse complète n'est jamais exposé par défaut).
 *
 * @param {Object} source
 * @param {string[]} fields
 * @returns {Object}
 */
export function pickFields(source, fields) {
  const picked = {};
  for (const field of fields) {
    if (source && Object.prototype.hasOwnProperty.call(source, field)) {
      picked[field] = source[field];
    }
  }
  return picked;
}
