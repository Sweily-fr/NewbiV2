/**
 * Recherche texte des listes et des sélecteurs : par défaut insensible aux
 * majuscules ET aux accents (« meta » trouve « Méta », « Meta » et « META »),
 * exacte quand l'utilisateur coche le bouton « Aa » de la barre de recherche
 * (cf. SearchExactToggle).
 *
 * Ticket 17/10/2026 : 13 factures d'achat renommées « Méta » à la main étaient
 * introuvables en tapant « meta », la recherche ne retirait pas les accents.
 */

const DIACRITICS = /[\u0300-\u036f]/g;

/** Texte comparable : sans accents (NFD), en minuscules. */
export const normalizeSearchText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toLowerCase();

/**
 * Prépare la recherche une fois pour toute une liste : renvoie une fonction
 * `(…valeurs) => booléen`, vraie si l'une des valeurs contient la saisie.
 * Saisie vide = tout correspond.
 *
 * @param {string} query saisie de l'utilisateur
 * @param {{ exact?: boolean }} [options] exact : majuscules et accents
 *   respectés à la lettre
 */
export function createSearchMatcher(query, { exact = false } = {}) {
  const raw = String(query ?? "").trim();
  if (!raw) return () => true;

  if (exact) {
    const needle = raw.normalize("NFC");
    return (...values) =>
      values.some(
        (v) => v != null && String(v).normalize("NFC").includes(needle),
      );
  }

  const needle = normalizeSearchText(raw);
  return (...values) =>
    values.some((v) => v != null && normalizeSearchText(v).includes(needle));
}

/** Variante ponctuelle : une valeur, une saisie. */
export const matchesSearch = (value, query, options) =>
  createSearchMatcher(query, options)(value);
