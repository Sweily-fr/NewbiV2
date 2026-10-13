/**
 * Espace gestionnaire : une partie du tableau de bord Newbi, même interface,
 * où un cabinet (compte gestionnaire) gère les comptes de ses clients.
 */
export const GESTIONNAIRE_PATH = "/dashboard/gestionnaire";

export function isGestionnairePath(pathname) {
  return (
    pathname === GESTIONNAIRE_PATH ||
    Boolean(pathname?.startsWith(`${GESTIONNAIRE_PATH}/`))
  );
}

// Paramètre de l'espace gestionnaire : le cabinet y a été renvoyé parce que
// l'espace qu'il ouvrait n'a pas d'abonnement (encart d'explication)
export const NO_SUBSCRIPTION_NOTICE = "sans-abonnement";

/**
 * Où renvoyer un cabinet qui ouvre le tableau de bord, ou null pour le
 * laisser où il est. Son espace gestionnaire n'a pas besoin d'abonnement :
 * un espace à lui sans abonnement utilisable n'est jamais une page
 * d'arrivée (ni le dossier d'un client choisi à sa place).
 * - access : accès de l'espace actif (full, readonly ou none)
 * - managedClient : l'espace actif est celui d'un client qu'il suit ; il y
 *   reste, en lecture seule si l'abonnement du client est fini
 * - pathname : inconnu (préchargement, hors middleware) = on ne fait rien
 * - search : retour de paiement Stripe (?subscription_success=true), son
 *   abonnement est en cours d'enregistrement
 */
export function managerLandingRedirect({
  isManager,
  access,
  managedClient,
  pathname,
  search,
}) {
  if (!isManager || access === "full" || managedClient) return null;
  if (!pathname || isGestionnairePath(pathname)) return null;
  const params = new URLSearchParams(search || "");
  if (params.get("subscription_success") === "true") return null;
  return `${GESTIONNAIRE_PATH}?espace=${NO_SUBSCRIPTION_NOTICE}`;
}
