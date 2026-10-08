import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

/**
 * Rôles des espaces côté Better Auth (plugin organisation).
 *
 * Better Auth ne sert qu'à valider le nom d'un rôle (invitation, changement de
 * rôle) et ses propres droits (membres, invitations, mise à jour de
 * l'organisation). Les droits Newbi (pages et fonctionnalités) vivent dans
 * l'API : catalogue `src/config/rolePermissions.js` de newbi-api, lu par le
 * front via la requête GraphQL `myPermissions`.
 *
 * Clés techniques → libellés :
 *   owner → Super admin, admin → Administrateur, member → Éditeur,
 *   viewer → Membre, accountant → Comptable, role_xxx → rôle personnalisé.
 */
export const organizationAc = createAccessControl(defaultStatements);

export const organizationRoles = {
  owner: organizationAc.newRole(ownerAc.statements),
  admin: organizationAc.newRole(adminAc.statements),
  member: organizationAc.newRole(memberAc.statements),
  viewer: organizationAc.newRole(memberAc.statements),
  accountant: organizationAc.newRole(memberAc.statements),
};

/**
 * Niveaux par défaut des modules du compte qu'un hook Better Auth doit
 * vérifier (mêmes valeurs que les grilles prédéfinies de l'API). Un rôle
 * ajusté ou personnalisé a sa grille dans `organizationRole.levels`.
 */
const DEFAULT_ACCOUNT_LEVELS = {
  owner: { team: "write", orgSettings: "write" },
  admin: { team: "read", orgSettings: "write" },
  member: { team: "read", orgSettings: "read" },
  viewer: { team: "read", orgSettings: "read" },
  accountant: { team: "read", orgSettings: "read" },
};

function toObjectId(ObjectId, id) {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  return ObjectId.isValid(String(id)) ? new ObjectId(String(id)) : null;
}

/**
 * Rôle d'un utilisateur dans un espace et son niveau sur un module du
 * compte (`team` ou `orgSettings`). Renvoie `{ role: null }` si l'utilisateur
 * n'est pas membre.
 */
export async function getAccountLevel(
  db,
  { userId, organizationId, moduleKey },
) {
  const { ObjectId } = await import("mongodb");
  const orgId = toObjectId(ObjectId, organizationId);
  const uid = toObjectId(ObjectId, userId);
  if (!orgId || !uid) return { role: null, level: "none" };

  const member = await db
    .collection("member")
    .findOne({ organizationId: orgId, userId: uid });
  if (!member) return { role: null, level: "none" };

  const roles = String(member.role || "")
    .toLowerCase()
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
  if (roles.includes("owner")) return { role: "owner", level: "write" };

  const stored = await db
    .collection("organizationRole")
    .find({ organizationId: orgId, role: { $in: roles } })
    .toArray();
  const byRole = new Map(stored.map((d) => [String(d.role).toLowerCase(), d]));

  const rank = { none: 0, read: 1, write: 2, delete: 3 };
  let level = "none";
  for (const role of roles) {
    const candidate =
      byRole.get(role)?.levels?.[moduleKey] ??
      DEFAULT_ACCOUNT_LEVELS[role]?.[moduleKey] ??
      "none";
    if ((rank[candidate] ?? 0) > rank[level]) level = candidate;
  }
  return { role: roles.join(","), level };
}

export function isOwnerRole(role) {
  return String(role || "")
    .toLowerCase()
    .split(",")
    .map((r) => r.trim())
    .includes("owner");
}
