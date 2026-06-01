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
