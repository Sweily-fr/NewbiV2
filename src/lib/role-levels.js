/**
 * Lecture des droits d'un membre (grille module → niveau renvoyée par la
 * requête `myPermissions`). Les règles sont celles de newbi-api
 * (src/config/rolePermissions.js) : seuls les alias et le niveau requis par
 * action sont repris ici, pour les appels existants de usePermissions.
 */

const LEVEL_RANK = { none: 0, read: 1, write: 2, delete: 3 };

const ACCOUNT_MODULES = new Set([
  "team",
  "billing",
  "orgSettings",
  "integrations",
]);

// Anciens noms de ressources → module du catalogue
const RESOURCE_ALIASES = {
  importedQuotes: "quotes",
  importedPurchaseOrders: "purchaseOrders",
  expenses: "purchaseInvoices",
  suppliers: "purchaseInvoices",
  payments: "banking",
  reports: "analytics",
};

const ACTION_LEVEL = {
  view: "read",
  read: "read",
  export: "read",
  download: "read",
  delete: "delete",
  remove: "delete",
};

export const LEVEL_LABELS = {
  none: "Aucun accès",
  read: "Lecture",
  write: "Écriture",
  delete: "Écriture et suppression",
};

// Modules du compte : « write » couvre aussi les suppressions
export const ACCOUNT_LEVEL_LABELS = {
  none: "Aucun accès",
  read: "Lecture",
  write: "Gérer",
};

export function levelLabel(moduleKey, level) {
  return (ACCOUNT_MODULES.has(moduleKey) ? ACCOUNT_LEVEL_LABELS : LEVEL_LABELS)[
    level
  ];
}

export function resolveModule(resource) {
  return RESOURCE_ALIASES[resource] || resource;
}

function clamp(moduleKey, level) {
  if (ACCOUNT_MODULES.has(moduleKey) && level === "delete") return "write";
  return level;
}

/** Le niveau accordé couvre-t-il le niveau demandé ? */
export function levelAllows(granted, required) {
  return (LEVEL_RANK[granted] ?? 0) >= (LEVEL_RANK[required] ?? 99);
}

/** Niveau (`read`, `write`, `delete`) sur une ressource. */
export function canLevel(levels, resource, level) {
  const moduleKey = resolveModule(resource);
  if (!levels || !moduleKey) return false;
  return levelAllows(levels[moduleKey], clamp(moduleKey, level));
}

/** Action précise (`view`, `create`, `delete`, `mark-paid`…) sur une ressource. */
export function canAction(levels, resource, action) {
  const moduleKey = resolveModule(resource);
  return canLevel(levels, moduleKey, ACTION_LEVEL[action] || "write");
}
