import { getModuleActions, isOwnerRole } from "@/src/lib/organization-roles";

/**
 * Visibilité des membres et des invitations d'un espace dans les réponses du
 * plugin organisation de Better Auth (get-full-organization, list-members,
 * list-invitations, get-active-member-role). Même règle que la route
 * GET /api/organizations/[organizationId]/members :
 *
 *   - avec « Voir les membres » (page Membres), réponse complète ;
 *   - sans, l'identité des autres membres seulement (nom, e-mail, photo) et
 *     le rôle du seul super admin, sans dates ni invitations en attente.
 *
 * L'appelant garde toujours sa propre adhésion entière : son rôle sert au
 * calcul de ses droits côté client (usePermissions, useWorkspace, app
 * mobile). Les invitations suivent « Voir les membres » ou « Inviter des
 * membres » (cette case coche « Voir » d'office dans les grilles).
 */

/** Champs d'identité de l'utilisateur d'un membre (liste blanche). */
const IDENTITY_USER_FIELDS = ["id", "name", "email", "image"];

/**
 * Champs d'un membre sur lesquels un rôle sans « Voir les membres » peut
 * filtrer ou trier list-members : trier ou filtrer sur le rôle ou la date
 * d'arrivée les révélerait par le nombre ou l'ordre des résultats.
 */
export const IDENTITY_MEMBER_QUERY_FIELDS = new Set([
  "id",
  "userId",
  "organizationId",
]);

function pick(source, fields) {
  const picked = {};
  for (const field of fields) {
    if (source && Object.prototype.hasOwnProperty.call(source, field)) {
      picked[field] = source[field];
    }
  }
  return picked;
}

/**
 * Droits de l'appelant sur les membres d'un espace.
 *
 * @param {import("mongodb").Db} db
 * @param {{ userId: string, organizationId: string }} params
 * @returns {Promise<{ role: string|null, canViewTeam: boolean, canViewInvitations: boolean }>}
 */
export async function getMembersVisibility(db, { userId, organizationId }) {
  const { role, actions } = await getModuleActions(db, {
    userId,
    organizationId,
    moduleKey: "team",
  });
  const canViewTeam = Boolean(role) && actions.includes("view");
  return {
    role,
    canViewTeam,
    canViewInvitations:
      canViewTeam || (Boolean(role) && actions.includes("invite")),
  };
}

/** Visibilité la plus restreinte (droits illisibles : on refuse). */
export const RESTRICTED_VISIBILITY = Object.freeze({
  role: null,
  canViewTeam: false,
  canViewInvitations: false,
});

/**
 * Identité seule d'un membre au format Better Auth : de quoi l'afficher,
 * l'assigner ou le mentionner, et reconnaître le super admin.
 */
export function memberIdentity(member) {
  const identity = pick(member, ["id", "organizationId", "userId"]);
  if (member?.user) identity.user = pick(member.user, IDENTITY_USER_FIELDS);
  if (isOwnerRole(member?.role)) identity.role = "owner";
  return identity;
}

/**
 * Liste de membres vue par l'appelant : complète avec « Voir les membres »,
 * sinon identité des autres et sa propre adhésion entière.
 */
export function filterMembers(members, { userId, canViewTeam }) {
  if (canViewTeam || !Array.isArray(members)) return members;
  return members.map((member) =>
    userId && String(member?.userId) === String(userId)
      ? member
      : memberIdentity(member),
  );
}

/** Invitations vues par l'appelant : aucune sans le droit. */
export function filterInvitations(invitations, { canViewInvitations }) {
  if (canViewInvitations || !Array.isArray(invitations)) return invitations;
  return [];
}

/** Réponse de get-full-organization vue par l'appelant. */
export function filterFullOrganization(organization, visibility) {
  if (!organization || typeof organization !== "object") return organization;
  const filtered = { ...organization };
  if (Array.isArray(organization.members)) {
    filtered.members = filterMembers(organization.members, visibility);
  }
  if (Array.isArray(organization.invitations)) {
    filtered.invitations = filterInvitations(
      organization.invitations,
      visibility,
    );
  }
  return filtered;
}

/** Réponse de list-members ({ members, total }) vue par l'appelant. */
export function filterMemberList(result, visibility) {
  if (!result || typeof result !== "object" || !Array.isArray(result.members)) {
    return result;
  }
  return { ...result, members: filterMembers(result.members, visibility) };
}

/**
 * Rôle d'un AUTRE membre (get-active-member-role?userId=…) : visible avec
 * « Voir les membres » ; sans, seul le super admin est désigné comme tel.
 * Renvoie null quand le rôle doit rester caché.
 */
export function visibleRoleOfOtherMember(role, { canViewTeam }) {
  if (canViewTeam) return role;
  return isOwnerRole(role) ? "owner" : null;
}
