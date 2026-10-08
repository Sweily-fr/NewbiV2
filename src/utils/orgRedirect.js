/**
 * Utilitaires de redirection lors d'un changement d'organisation.
 *
 * Problème : les pages de détail ont un ID de ressource dans l'URL
 * (ex. /dashboard/clients/<id>). Cet ID appartient à l'organisation
 * courante ; après un changement d'organisation il n'existe plus dans la
 * nouvelle org, ce qui provoque une erreur "ressource introuvable".
 *
 * Solution : quand on change d'organisation, on retire le(s) segment(s) d'ID
 * de l'URL pour retomber sur la page liste correspondante.
 *   /dashboard/clients/<id>                  -> /dashboard/clients
 *   /dashboard/outils/factures/<id>          -> /dashboard/outils/factures
 *   /dashboard/outils/factures/<id>/avoir/<id> -> /dashboard/outils/factures
 */

/**
 * Détermine si un segment d'URL ressemble à un identifiant de ressource.
 *
 * Les noms de route de l'app sont des mots (éventuellement avec des tirets)
 * et ne contiennent jamais de chiffre : "clients", "outils", "factures",
 * "bons-commande", "signatures-mail", "transferts-fichiers"…
 * Les IDs eux sont des ObjectId Mongo, des UUID ou des tokens.
 */
export function isIdSegment(segment) {
  if (!segment) return false;
  // ObjectId Mongo (24 caractères hexadécimaux) — clients, factures, devis,
  // bons de commande, kanban, signatures, avoirs…
  if (/^[a-f0-9]{24}$/i.test(segment)) return true;
  // UUID v4
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      segment,
    )
  ) {
    return true;
  }
  // Token / nanoid / shareLink : long et contenant au moins un chiffre.
  // Aucun nom de route ne contient de chiffre, donc c'est un signal fiable.
  if (segment.length >= 8 && /\d/.test(segment)) return true;
  return false;
}

/**
 * Retourne le chemin "sans ID" : tronque le pathname au premier segment qui
 * ressemble à un identifiant. Si aucun segment d'ID n'est présent, renvoie le
 * pathname inchangé (pas de redirection nécessaire).
 */
export function stripIdFromPathname(pathname) {
  if (!pathname) return pathname;
  const segments = pathname.split("/");
  const idx = segments.findIndex((segment, i) => i > 0 && isIdSegment(segment));
  if (idx === -1) return pathname;
  const base = segments.slice(0, idx).join("/");
  return base || "/";
}

// Toast à afficher après le rechargement qui termine un changement d'espace
// (sessionStorage : propre à l'onglet, survit au rechargement).
const SWITCH_TOAST_KEY = "workspace_switch_toast";

/**
 * Termine un changement d'espace par un rechargement complet, sur la page
 * liste si l'on était sur une page de détail.
 *
 * Vider le cache Apollo à chaud ne suffit pas : clearStore() rejette les
 * requêtes encore en vol (« Store reset while query was in flight », affiché
 * « Erreur de chargement » par les tableaux), et l'espace suivi par l'onglet
 * (store Better Auth, en-tête x-organization-id, variables des requêtes) se
 * met à jour en plusieurs temps, pendant lesquels l'API reçoit un espace
 * différent dans l'en-tête et dans les variables. Le rechargement repart d'un
 * état cohérent. `replace` retire aussi la page de détail de l'historique.
 */
export function reloadIntoWorkspace(pathname, toastData) {
  try {
    if (toastData) {
      sessionStorage.setItem(SWITCH_TOAST_KEY, JSON.stringify(toastData));
    }
  } catch {
    // sessionStorage indisponible : le changement se fait sans toast
  }
  window.location.replace(stripIdFromPathname(pathname) || "/dashboard");
}

/**
 * Lit (et efface) le toast laissé par reloadIntoWorkspace avant le
 * rechargement. Retourne { type, message } ou null.
 */
export function consumeWorkspaceSwitchToast() {
  try {
    const raw = sessionStorage.getItem(SWITCH_TOAST_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SWITCH_TOAST_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
