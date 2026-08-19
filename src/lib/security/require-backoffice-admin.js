import { requireSession } from "./require-session";
import { apiError } from "./api-error";

/**
 * Mini back-office interne : accès restreint à une liste blanche d'ids
 * utilisateurs (variable d'environnement BACKOFFICE_ADMIN_USER_IDS, ids
 * séparés par des virgules, côté serveur uniquement).
 *
 * Fail-closed : variable absente ou vide = back-office désactivé pour tous.
 * La même variable doit être posée côté newbi-api (VPS), qui re-vérifie
 * l'allowlist sur chaque requête : le front n'est qu'une première barrière.
 */
export function isBackofficeAdmin(userId) {
  const allowlist = (process.env.BACKOFFICE_ADMIN_USER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allowlist.length > 0 && allowlist.includes(String(userId));
}

/**
 * Version route API : session valide + membre de l'allowlist.
 * Répond 404 (et non 403) pour ne pas révéler l'existence du back-office.
 *
 * @returns {Promise<{ user, session, cookieHeader }>}
 */
export async function requireBackofficeAdmin(request) {
  const sessionData = await requireSession(request);
  if (!isBackofficeAdmin(sessionData.user.id)) {
    throw apiError(404, "Introuvable");
  }
  return sessionData;
}
