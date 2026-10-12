/**
 * Lecture des droits d'un membre : grille page → actions permises renvoyée
 * par la requête `myPermissions`. Mêmes règles que newbi-api
 * (src/config/rolePermissions.js) :
 *   - lire = « view » ;
 *   - écrire = action d'écriture de la page (« edit », « invite » pour les
 *     membres, « manage » pour l'abonnement et les applications) ;
 *   - supprimer = « delete ».
 */

// Anciens noms de ressources → page du catalogue
const RESOURCE_ALIASES = {
  expenses: "purchaseInvoices",
  suppliers: "purchaseInvoices",
  payments: "banking",
  reports: "analytics",
};

// Ancienne fonctionnalité devenue action d'une page
const LEGACY_FEATURES = {
  invoicePayments: { module: "invoices", action: "markPaid" },
};

// Anciens noms d'actions → action du catalogue
const ACTION_ALIASES = {
  read: "view",
  download: "view",
  "mark-paid": "markPaid",
  "set-default": "edit",
  approve: "edit",
  ocr: "create",
  remove: "delete",
};

// Action qui vaut « écrire » quand la page n'a pas d'action « edit »
const WRITE_ACTIONS = {
  team: "invite",
  billing: "manage",
  integrations: "manage",
};

export function resolveModule(resource) {
  return RESOURCE_ALIASES[resource] || resource;
}

function writeActionOf(moduleKey) {
  return WRITE_ACTIONS[moduleKey] || "edit";
}

/** Niveau (`read`, `write`, `delete`) sur une ressource, dérivé des actions. */
export function canLevel(actions, resource, level) {
  if (!actions) return false;
  const legacy = LEGACY_FEATURES[resource];
  if (legacy) {
    const granted = actions[legacy.module] || [];
    return level === "read"
      ? granted.includes("view")
      : granted.includes(legacy.action);
  }
  const moduleKey = resolveModule(resource);
  const granted = actions[moduleKey] || [];
  if (level === "read") return granted.includes("view");
  if (level === "write") return granted.includes(writeActionOf(moduleKey));
  if (level === "delete") return granted.includes("delete");
  return false;
}

/** Action précise (`view`, `create`, `send`, `markPaid`…) sur une ressource. */
export function canAction(actions, resource, action) {
  if (!actions) return false;
  const legacy = LEGACY_FEATURES[resource];
  if (legacy) return (actions[legacy.module] || []).includes(legacy.action);
  const moduleKey = resolveModule(resource);
  const wanted =
    action === "manage"
      ? writeActionOf(moduleKey)
      : ACTION_ALIASES[action] || action;
  return (actions[moduleKey] || []).includes(wanted);
}
