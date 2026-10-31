import { getNumberFormat } from "@/src/lib/intl-cache";

/**
 * Écritures d'un montant que la recherche d'une liste de documents doit
 * reconnaître : tel qu'affiché (« 1 080,00 », « 840,00 »), avec un point
 * (« 840.00 »), sans décimales inutiles (« 840 », « 12,5 ») et sans
 * séparateur de milliers (« 1080,00 »). « 840,00 », copié depuis la liste,
 * ne trouvait rien : seuls « 840 » et « 84000 » étaient reconnus.
 *
 * @param {number|string|null|undefined} amount
 * @returns {string[]} écritures distinctes (vide si le montant est inconnu)
 */
export function amountSearchTexts(amount) {
  if (amount === null || amount === undefined || amount === "") return [];
  const value = typeof amount === "number" ? amount : parseFloat(amount);
  if (Number.isNaN(value)) return [];

  const withDot = value.toFixed(2); // « 1080.00 »
  const withComma = withDot.replace(".", ","); // « 1080,00 »
  const short = withDot.replace(/\.?0+$/, ""); // « 1080 », « 12.5 »
  // Format de la liste, espaces fines ou insécables remplacées par des espaces
  const displayed = getNumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace(/\s/g, " "); // « 1 080,00 »

  return [
    ...new Set([displayed, withComma, withDot, short, short.replace(".", ",")]),
  ];
}
