/**
 * Nombre saisi à la française : « 1 200 », « 1 200,50 » (espaces de
 * milliers, y compris insécables), « 1.200,50 » (points de milliers avec une
 * virgule décimale), « 1.200.000 ». Un seul point sans virgule reste un
 * séparateur décimal (« 12.5 »). Une saisie illisible vaut 0.
 */
export function parseNombre(valeur) {
  let texte = String(valeur ?? "").replace(/\s/g, "");
  if (texte.includes(",")) {
    // Virgule décimale : les points sont des séparateurs de milliers
    texte = texte.replace(/\./g, "").replace(",", ".");
  } else if ((texte.match(/\./g) || []).length > 1) {
    texte = texte.replace(/\./g, "");
  }
  const n = Number.parseFloat(texte);
  return Number.isFinite(n) ? n : 0;
}
