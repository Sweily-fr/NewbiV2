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
 * Actions par défaut des pages du compte qu'un hook Better Auth doit
 * vérifier (mêmes valeurs que les grilles prédéfinies de l'API). Un rôle
 * ajusté ou personnalisé a sa grille dans `organizationRole.actions` (ou
 * `levels` s'il a été enregistré avant les actions).
 */
const ACCOUNT_ACTIONS = {
  team: ["view", "invite", "changeRole", "remove"],
  orgSettings: ["view", "edit"],
};

const DEFAULT_ACCOUNT_ACTIONS = {
  owner: ACCOUNT_ACTIONS,
  admin: { team: ["view"], orgSettings: ["view", "edit"] },
  member: { team: ["view"], orgSettings: ["view"] },
  viewer: { team: ["view"], orgSettings: ["view"] },
  accountant: { team: ["view"], orgSettings: ["view"] },
};

/** Actions d'une page du compte dans un document `organizationRole`. */
function storedAccountActions(doc, moduleKey) {
  if (!doc) return null;
  if (doc.actions) return doc.actions[moduleKey] || [];
  const level = doc.levels?.[moduleKey];
  if (!level) return null;
  if (level === "write" || level === "delete")
    return ACCOUNT_ACTIONS[moduleKey];
  return level === "read" ? ["view"] : [];
}

function toObjectId(ObjectId, id) {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  return ObjectId.isValid(String(id)) ? new ObjectId(String(id)) : null;
}

/**
 * Rôle d'un utilisateur dans un espace et ses actions sur une page du compte
 * (`team` ou `orgSettings`). Renvoie `{ role: null, actions: [] }` si
 * l'utilisateur n'est pas membre.
 */
export async function getAccountActions(
  db,
  { userId, organizationId, moduleKey },
) {
  const { ObjectId } = await import("mongodb");
  const orgId = toObjectId(ObjectId, organizationId);
  const uid = toObjectId(ObjectId, userId);
  if (!orgId || !uid) return { role: null, actions: [] };

  const member = await db
    .collection("member")
    .findOne({ organizationId: orgId, userId: uid });
  if (!member) return { role: null, actions: [] };

  const roles = String(member.role || "")
    .toLowerCase()
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
  if (roles.includes("owner")) {
    return { role: "owner", actions: ACCOUNT_ACTIONS[moduleKey] || [] };
  }

  const stored = await db
    .collection("organizationRole")
    .find({ organizationId: orgId, role: { $in: roles } })
    .toArray();
  const byRole = new Map(stored.map((d) => [String(d.role).toLowerCase(), d]));

  const actions = new Set();
  for (const role of roles) {
    const granted =
      storedAccountActions(byRole.get(role), moduleKey) ??
      DEFAULT_ACCOUNT_ACTIONS[role]?.[moduleKey] ??
      [];
    for (const a of granted) actions.add(a);
  }
  return { role: roles.join(","), actions: [...actions] };
}

export function isOwnerRole(role) {
  return String(role || "")
    .toLowerCase()
    .split(",")
    .map((r) => r.trim())
    .includes("owner");
}
