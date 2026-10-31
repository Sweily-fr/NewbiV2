// Origine de repli hors navigateur (rendu serveur, tests) : seule compte la
// comparaison avec l'origine obtenue après résolution
const FALLBACK_ORIGIN = "http://newbi.invalid";

/**
 * Chemin interne utilisable pour une redirection demandée dans l'URL (par
 * exemple ?callbackUrl= de la page de connexion).
 *
 * Accepté : un chemin relatif du site, qui commence par une seule « / ».
 * Refusé (null) : URL absolue d'un autre site, URL sans protocole
 * (« //hote », « /\hote »), schémas javascript:, data: et autres, caractères
 * de contrôle (tabulation, retour à la ligne, que le navigateur supprime
 * avant de lire l'URL), barres obliques inverses. La décision finale porte
 * sur l'origine obtenue après résolution par le parseur d'URL du navigateur,
 * pas sur le texte.
 *
 * @param {unknown} value valeur reçue (paramètre d'URL, stockage local…)
 * @param {string} [origin] origine du site (window.location.origin par défaut)
 * @returns {string|null} chemin + paramètres + ancre, ou null
 */
export function safeInternalPath(value, origin) {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;

  if (/[\u0000-\u001f\u007f\\]/.test(value)) return null;

  const base =
    origin ||
    (typeof window !== "undefined" && window.location?.origin) ||
    FALLBACK_ORIGIN;
  try {
    const expected = new URL(base).origin;
    const target = new URL(value, base);
    if (target.origin !== expected) return null;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
}
