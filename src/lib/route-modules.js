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
 * que le Comptable garde ce niveau par défaut ; un niveau plus haut donné par
 * le super admin les fait apparaître. `page: false` : la page elle-même
 * restait fermée (transferts de fichiers).
 */
const ACCOUNTANT_HIDDEN_BY_DEFAULT = {
  purchaseOrders: { level: "read", page: true },
  deliveryNotes: { level: "read", page: true },
  products: { level: "read", page: true },
  fileTransfers: { level: "write", page: false },
};

/**
 * Le module est-il masqué pour ce rôle (menu, ou page si `page`) alors que
 * sa grille le permet ?
 */
export function isHiddenForRole(
  role,
  levels,
  moduleKey,
  { page = false } = {},
) {
  if (role !== "accountant" || !levels) return false;
  const rule = ACCOUNTANT_HIDDEN_BY_DEFAULT[moduleKey];
  if (!rule || levels[moduleKey] !== rule.level) return false;
  return page ? !rule.page : true;
}
