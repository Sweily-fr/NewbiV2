/**
 * Page du tableau de bord → module de la grille des rôles (newbi-api,
 * src/config/rolePermissions.js). Une page absente de la liste (accueil,
 * favoris, paramètres…) n'est pas filtrée par rôle.
 */
const ROUTE_MODULES = [
  ["/dashboard/outils/transactions", "banking"],
  ["/dashboard/outils/analytiques/vue-densemble", "overview"],
  ["/dashboard/outils/analytiques", "analytics"],
  ["/dashboard/outils/prevision", "forecast"],
  ["/dashboard/analytics", "analytics"],
  ["/dashboard/outils/factures-achat", "purchaseInvoices"],
  ["/dashboard/outils/factures", "invoices"],
  ["/dashboard/outils/devis", "quotes"],
  ["/dashboard/outils/bons-commande", "purchaseOrders"],
  ["/dashboard/outils/bons-de-livraison", "deliveryNotes"],
  ["/dashboard/catalogues", "products"],
  ["/dashboard/clients/listes", "clientLists"],
  ["/dashboard/clients/segments", "clientSegments"],
  ["/dashboard/clients", "clients"],
  ["/dashboard/automatisation", "automations"],
  ["/dashboard/calendar", "calendar"],
  ["/dashboard/outils/kanban", "kanban"],
  ["/dashboard/outils/transferts-fichiers", "fileTransfers"],
  ["/dashboard/outils/documents-partages", "sharedDocuments"],
  ["/dashboard/outils/signatures-mail", "signatures"],
];

// Avoirs : pages sous une facture (/factures/<id>/avoir/…)
const CREDIT_NOTE_PATH = /^\/dashboard\/outils\/factures\/[^/]+\/avoir(\/|$)/;

/** Page d'accueil d'un module (lien « Voir les … » de la page refusée). */
export function pathForModule(moduleKey) {
  if (moduleKey === "creditNotes") return "/dashboard/outils/factures";
  return ROUTE_MODULES.find(([, key]) => key === moduleKey)?.[0] || null;
}

export function moduleForPath(pathname) {
  if (!pathname) return null;
  const path = String(pathname).split(/[?#]/)[0];
  if (CREDIT_NOTE_PATH.test(path)) return "creditNotes";
  for (const [prefix, moduleKey] of ROUTE_MODULES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return moduleKey;
  }
  return null;
}

/** Action demandée par une page : créer (/new), modifier (/editer), voir. */
export function actionForPath(pathname) {
  const path = String(pathname || "").split(/[?#]/)[0];
  if (/\/(new|nouveau)(\/|$)/.test(path)) return "create";
  if (/\/editer(\/|$)/.test(path)) return "edit";
  return "view";
}

/**
 * Comptable : pages absentes de son menu avant les rôles personnalisés, alors
 * que leurs données restaient accessibles ailleurs (recherche, documents
 * liés, transfert depuis les documents partagés). Elles restent masquées tant
 * que le super admin ne lui accorde rien de plus que ses droits par défaut
 * sur la page (`actions`, ceux du catalogue de l'API) ; une action en plus
 * les fait apparaître, en retirer une ne les ouvre pas. `page: false` : la
 * page elle-même restait fermée (transferts de fichiers).
 */
export const ACCOUNTANT_HIDDEN_BY_DEFAULT = {
  purchaseOrders: { actions: ["view", "export"], page: true },
  deliveryNotes: { actions: ["view", "export"], page: true },
  products: { actions: ["view", "export"], page: true },
  fileTransfers: { actions: ["view", "create", "edit"], page: false },
};

/**
 * Le module est-il masqué pour ce rôle (menu, ou page si `page`) alors que
 * sa grille (page → actions, `myPermissions.actions`) le permet ?
 */
export function isHiddenForRole(
  role,
  actions,
  moduleKey,
  { page = false } = {},
) {
  if (role !== "accountant" || !actions) return false;
  const rule = ACCOUNTANT_HIDDEN_BY_DEFAULT[moduleKey];
  if (!rule) return false;
  const granted = actions[moduleKey] || [];
  if (granted.some((a) => !rule.actions.includes(a))) return false;
  return page ? !rule.page : true;
}
