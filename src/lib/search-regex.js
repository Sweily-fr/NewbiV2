/**
 * Recherche MongoDB lancée par le serveur Next (espace gestionnaire) : même
 * règle que l'API (newbi-api src/utils/searchRegex.js) et que
 * src/utils/search-text.js côté navigateur. Par défaut insensible aux
 * majuscules ET aux accents (« meta » trouve « Méta »), exacte sur demande.
 *
 * Chaque lettre accentuable de la saisie devient la classe de ses variantes,
 * majuscules comprises, suivie des diacritiques combinants éventuels (texte
 * enregistré en NFD).
 */

const escapeRegex = (text) =>
  String(text ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Caractères réels dans la chaîne : compris par PCRE (MongoDB) comme par
// RegExp (JavaScript).
const COMBINING_MARKS = "[\u0300-\u036f]*";

const LETTER_VARIANTS = {
  a: "aàáâãäåāăą",
  c: "cçćč",
  d: "dď",
  e: "eèéêëēĕėęě",
  g: "gğ",
  i: "iìíîïīĭį",
  l: "lł",
  n: "nñńň",
  o: "oòóôõöøōŏő",
  r: "rř",
  s: "sśšş",
  t: "tťţ",
  u: "uùúûüūŭůű",
  y: "yýÿ",
  z: "zźżž",
};

const LETTER_CLASSES = Object.fromEntries(
  Object.entries(LETTER_VARIANTS).map(([letter, variants]) => [
    letter,
    `[${variants}${variants.toUpperCase()}]${COMBINING_MARKS}`,
  ]),
);

/**
 * RegExp correspondant à la saisie.
 * @param {string} search saisie déjà bornée par l'appelant
 * @param {{ exact?: boolean }} [options] exact : majuscules et accents
 *   respectés à la lettre
 */
export function buildSearchRegExp(search, { exact = false } = {}) {
  const term = String(search ?? "").trim();
  if (exact) return new RegExp(escapeRegex(term.normalize("NFC")));
  let pattern = "";
  for (const ch of term
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()) {
    pattern += LETTER_CLASSES[ch] || escapeRegex(ch);
  }
  return new RegExp(pattern, "i");
}
