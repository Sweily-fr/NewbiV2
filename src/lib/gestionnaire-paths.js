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
