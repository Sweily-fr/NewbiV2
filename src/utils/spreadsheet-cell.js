/**
 * Cellules des exports ouverts dans un tableur (CSV, tableau HTML .xls).
 *
 * Un texte qui commence par =, +, -, @ (ou par une tabulation, un retour
 * chariot) y devient une formule active : un nom de contact ou un libellé
 * saisi ainsi s'exécuterait chez la personne qui ouvre l'export. On le
 * préfixe d'une apostrophe pour qu'il reste du texte. Un nombre écrit en
 * texte (« -12,50 », « -1 234,56 € », « +5 % ») ne peut rien exécuter et
 * n'est pas touché.
 */
const FORMULA_START = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^[+-]?\d[\d\s  .,]*(\s?(€|%))?$/;

export function neutralizeFormula(value) {
  if (typeof value !== "string") return value;
  if (!FORMULA_START.test(value) || PLAIN_NUMBER.test(value)) return value;
  return `'${value}`;
}

/**
 * Valeur prête pour une ligne CSV : neutralisée, entre guillemets si elle
 * contient le séparateur, un guillemet ou un saut de ligne (sinon le saut
 * de ligne ouvrirait une nouvelle ligne, dont la première cellule pourrait
 * être une formule).
 */
export function toCsvCell(value, separator = ";") {
  const text = String(neutralizeFormula(value ?? ""));
  if (text.includes(separator) || /["\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Variante toujours entre guillemets (exports qui citent chaque cellule). */
export function toQuotedCsvCell(value) {
  return `"${String(neutralizeFormula(value ?? "")).replace(/"/g, '""')}"`;
}

/** Valeur prête pour une cellule de tableau HTML (export .xls). */
export function toHtmlCell(value) {
  return String(neutralizeFormula(value ?? ""))
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
