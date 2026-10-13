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
 * Pages dont le site vérifie lui-même les droits côté serveur (hooks Better
 * Auth, routes API) : celles du compte et celles des documents de vente
 * lus par les routes PDF. Copie partielle du catalogue de l'API
 * (`src/config/rolePermissions.js` de newbi-api), à garder alignée : pour
 * chaque action, le niveau (read < write < delete) qui l'accordait dans les
 * grilles enregistrées avant les actions (champ `levels`).
 *
 * `parent` : partie d'une page (les avoirs dépendent des factures) ; sans
 * « Voir » sur la page parente, la partie n'a aucune action.
 */
const MODULE_CATALOG = {
  invoices: {
    actions: {
      view: "read",
      create: "write",
      edit: "write",
      delete: "delete",
      send: "write",
      export: "read",
      // Ancienne fonctionnalité séparée (`levels.invoicePayments`)
      markPaid: "write",
      status: "write",
      recurring: "write",
      reminders: "write",
    },
  },
  creditNotes: {
    parent: "invoices",
    actions: {
      view: "read",
      create: "write",
      edit: "write",
      delete: "delete",
      send: "write",
    },
  },
  quotes: {
    actions: {
      view: "read",
      create: "write",
      edit: "write",
      delete: "delete",
      send: "write",
      export: "read",
      status: "write",
      convert: "write",
      sign: "write",
    },
  },
  purchaseOrders: {
    actions: {
      view: "read",
      create: "write",
      edit: "write",
      delete: "delete",
      send: "write",
      export: "read",
      status: "write",
      convert: "write",
    },
  },
  deliveryNotes: {
    actions: {
      view: "read",
      create: "write",
      edit: "write",
      delete: "delete",
      send: "write",
      export: "read",
      status: "write",
      convert: "write",
    },
  },
  team: {
    account: true,
    actions: {
      view: "read",
      invite: "write",
      changeRole: "write",
      remove: "write",
    },
  },
  orgSettings: { account: true, actions: { view: "read", edit: "write" } },
  integrations: { account: true, actions: { view: "read", manage: "write" } },
  billing: { account: true, actions: { view: "read", manage: "write" } },
};

const LEVEL_RANK = { none: 0, read: 1, write: 2, delete: 3 };

function moduleActionKeys(moduleKey) {
  return Object.keys(MODULE_CATALOG[moduleKey]?.actions || {});
}

/**
 * Droits par défaut des rôles prédéfinis, mêmes règles que l'API :
 *   - Administrateur : tout, sauf gérer les membres et l'abonnement ;
 *   - Éditeur : pas de suppression, ni annulation de facture ni relances,
 *     et du compte il ne voit que les membres et les informations ;
 *   - Membre : « Voir » partout, sauf l'abonnement et les applications ;
 *   - Comptable : ce qu'accordait le niveau « lecture » (voir, exporter),
 *     plus l'encaissement des factures.
 */
const PREDEFINED_RULES = {
  owner: () => true,
  admin: (moduleKey, action) =>
    !["team", "billing"].includes(moduleKey) || action === "view",
  member: (moduleKey, action) => {
    if (MODULE_CATALOG[moduleKey].account) {
      return ["team", "orgSettings"].includes(moduleKey) && action === "view";
    }
    if (moduleKey === "invoices" && ["status", "reminders"].includes(action)) {
      return false;
    }
    return action !== "delete";
  },
  viewer: (moduleKey, action) =>
    action === "view" && !["billing", "integrations"].includes(moduleKey),
  accountant: (moduleKey, action) =>
    MODULE_CATALOG[moduleKey].actions[action] === "read" ||
    (moduleKey === "invoices" && action === "markPaid"),
};

function defaultActions(role, moduleKey) {
  const rule = PREDEFINED_RULES[role];
  if (!rule) return null;
  return moduleActionKeys(moduleKey).filter((a) => rule(moduleKey, a));
}

/**
 * Actions gardées d'une grille enregistrée : actions inconnues ignorées,
 * « Voir » ajouté dès qu'une autre action est cochée (normalizeActions de
 * l'API).
 */
function normalizeModuleActions(moduleKey, raw) {
  const kept = moduleActionKeys(moduleKey).filter((a) => raw.includes(a));
  if (kept.length && !kept.includes("view")) kept.unshift("view");
  return kept;
}

/** Grille par niveaux (rôles enregistrés avant les actions) → actions. */
function actionsFromLevel(moduleKey, levels) {
  const { account, actions } = MODULE_CATALOG[moduleKey];
  const clamp = (level) =>
    account && level === "delete" ? "write" : level || "none";
  return Object.entries(actions)
    .filter(([key, actionLevel]) => {
      const source =
        moduleKey === "invoices" && key === "markPaid"
          ? levels.invoicePayments
          : levels[moduleKey];
      return (
        (LEVEL_RANK[clamp(source)] ?? 0) >=
        (LEVEL_RANK[clamp(actionLevel)] ?? 99)
      );
    })
    .map(([key]) => key);
}

/**
 * Actions d'un rôle (sans le parent) sur une page : grille enregistrée
 * (`actions`, ou ancien champ `levels`), complétée pour une page absente
 * par les droits par défaut d'un rôle prédéfini ajusté. Un rôle
 * personnalisé sans grille n'a aucune action.
 */
function roleModuleActionsOwn(role, doc, moduleKey) {
  const defaults = defaultActions(role, moduleKey);
  if (doc?.actions) {
    const raw = doc.actions[moduleKey];
    return Array.isArray(raw)
      ? normalizeModuleActions(moduleKey, raw)
      : defaults || [];
  }
  if (doc?.levels) {
    const levels = doc.levels;
    const present =
      moduleKey in levels ||
      (moduleKey === "invoices" && "invoicePayments" in levels);
    return present
      ? normalizeModuleActions(moduleKey, actionsFromLevel(moduleKey, levels))
      : defaults || [];
  }
  return defaults || [];
}

function roleModuleActions(role, doc, moduleKey) {
  const parent = MODULE_CATALOG[moduleKey].parent;
  if (parent && !roleModuleActionsOwn(role, doc, parent).includes("view")) {
    return [];
  }
  return roleModuleActionsOwn(role, doc, moduleKey);
}

function toObjectId(ObjectId, id) {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  return ObjectId.isValid(String(id)) ? new ObjectId(String(id)) : null;
}

/**
 * Rôle d'un utilisateur dans un espace et ses actions sur une page vérifiée
 * par le site : compte (`team`, `orgSettings`, `integrations`, `billing`) ou
 * documents de vente (`invoices`, `creditNotes`, `quotes`, `purchaseOrders`,
 * `deliveryNotes`). Rôle prédéfini, ajusté ou personnalisé ; plusieurs rôles
 * séparés par des virgules = union de leurs actions. Renvoie
 * `{ role: null, actions: [] }` si l'utilisateur n'est pas membre.
 */
export async function getModuleActions(
  db,
  { userId, organizationId, moduleKey },
) {
  if (!MODULE_CATALOG[moduleKey]) {
    throw new Error(`Page inconnue pour les droits : ${moduleKey}`);
  }
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
    return { role: "owner", actions: moduleActionKeys(moduleKey) };
  }

  const stored = await db
    .collection("organizationRole")
    .find({ organizationId: orgId, role: { $in: roles } })
    .toArray();
  const byRole = new Map(stored.map((d) => [String(d.role).toLowerCase(), d]));

  const granted = new Set();
  for (const role of roles) {
    for (const a of roleModuleActions(role, byRole.get(role), moduleKey)) {
      granted.add(a);
    }
  }
  return {
    role: roles.join(","),
    actions: moduleActionKeys(moduleKey).filter((a) => granted.has(a)),
  };
}

/** Ancien nom, pour les pages du compte. */
export const getAccountActions = getModuleActions;

/**
 * Droits d'un utilisateur sur un module dans plusieurs espaces, à partir de
 * ses adhésions déjà lues : une seule requête pour les rôles stockés, au lieu
 * de deux par espace avec getModuleActions (listes de l'espace gestionnaire).
 * @param {import("mongodb").Db} db
 * @param {{ memberships: Array<{ organizationId: any, role: string }>, moduleKey: string }} params
 * @returns {Promise<Map<string, string[]>>} id d'espace → actions
 */
export async function getModuleActionsForMemberships(
  db,
  { memberships, moduleKey },
) {
  if (!MODULE_CATALOG[moduleKey]) {
    throw new Error(`Page inconnue pour les droits : ${moduleKey}`);
  }
  const parsed = memberships.map((m) => ({
    organizationId: m.organizationId,
    roles: String(m.role || "")
      .toLowerCase()
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean),
  }));
  const customRoles = [
    ...new Set(
      parsed.filter((m) => !m.roles.includes("owner")).flatMap((m) => m.roles),
    ),
  ];
  const stored = customRoles.length
    ? await db
        .collection("organizationRole")
        .find({
          organizationId: { $in: parsed.map((m) => m.organizationId) },
          role: { $in: customRoles },
        })
        .toArray()
    : [];
  const byOrgRole = new Map(
    stored.map((d) => [
      `${String(d.organizationId)}:${String(d.role).toLowerCase()}`,
      d,
    ]),
  );

  const result = new Map();
  for (const m of parsed) {
    const key = String(m.organizationId);
    if (m.roles.includes("owner")) {
      result.set(key, moduleActionKeys(moduleKey));
      continue;
    }
    const granted = new Set();
    for (const role of m.roles) {
      const doc = byOrgRole.get(`${key}:${role}`);
      for (const a of roleModuleActions(role, doc, moduleKey)) granted.add(a);
    }
    result.set(
      key,
      moduleActionKeys(moduleKey).filter((a) => granted.has(a)),
    );
  }
  return result;
}

export function isOwnerRole(role) {
  return String(role || "")
    .toLowerCase()
    .split(",")
    .map((r) => r.trim())
    .includes("owner");
}
