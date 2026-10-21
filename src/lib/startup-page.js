// Page de démarrage choisie dans Paramètres > Préférences
// (user.redirect_after_login) : adresse ouverte après la connexion.
// « Collaborateurs » n'a pas de page : la fenêtre des paramètres s'ouvre
// sur l'onglet Espaces (membres), comme depuis le menu.
export const STARTUP_PAGE_ROUTES = {
  dashboard: "/dashboard",
  outils: "/dashboard",
  kanban: "/dashboard/outils/kanban",
  calendar: "/dashboard/calendar",
  factures: "/dashboard/outils/factures",
  devis: "/dashboard/outils/devis",
  clients: "/dashboard/clients",
  transactions: "/dashboard/outils/transactions",
  depenses: "/dashboard/outils/transactions",
  signatures: "/dashboard/outils/signatures-mail",
  transferts: "/dashboard/outils/transferts-fichiers",
  "documents-partages": "/dashboard/outils/documents-partages",
  catalogues: "/dashboard/catalogues",
  collaborateurs: "/dashboard?openSettings=true&settingsTab=espaces",
  analytics: "/dashboard/analytics",
  favoris: "/dashboard/favoris",
};

/** Adresse de la page de démarrage (accueil pour « dernière page » ou une valeur inconnue). */
export function startupPagePath(page) {
  if (!page || page === "last-page") return "/dashboard";
  return STARTUP_PAGE_ROUTES[page] || "/dashboard";
}
