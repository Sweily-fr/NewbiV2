/**
 * Tri de la liste des factures (factures Newbi et factures importées) :
 * fonctions de tri TanStack et montant TTC affiché, partagés par les
 * colonnes, la recherche et les tests.
 */

// Tri par client à la française : « à » rangé avec « a », sans tenir compte
// des majuscules ni des accents (l'ordre des codes plaçait « à » après « z »).
const clientNameCollator = new Intl.Collator("fr", {
  sensitivity: "base",
  numeric: true,
});
export const clientSortingFn = (rowA, rowB) =>
  clientNameCollator.compare(
    rowA.original.client?.name || "",
    rowB.original.client?.name || "",
  );

/**
 * Montant TTC affiché dans la liste : total d'une facture importée, total
 * après remise et escompte d'une facture Newbi. null si inconnu.
 */
export function displayedTotalTTC(invoice) {
  if (invoice._type === "imported") {
    return invoice.totalTTC || invoice.total || 0;
  }
  const amount = invoice.finalTotalTTC;
  if (amount === undefined || amount === null || isNaN(amount)) return null;

  // Appliquer uniquement l'escompte pour afficher le Total TTC
  const escompteValue = parseFloat(invoice.escompte) || 0;
  if (escompteValue <= 0) return amount;
  const totalHT =
    invoice.finalTotalHT !== undefined && invoice.finalTotalHT !== null
      ? invoice.finalTotalHT
      : invoice.totalHT || 0;
  const totalVAT =
    invoice.finalTotalVAT !== undefined && invoice.finalTotalVAT !== null
      ? invoice.finalTotalVAT
      : invoice.totalVAT || 0;

  // Appliquer l'escompte sur HT
  const escompteAmount = (totalHT * escompteValue) / 100;
  const htAfterEscompte = totalHT - escompteAmount;
  const tvaAfterEscompte = invoice.isReverseCharge
    ? 0
    : (htAfterEscompte / totalHT) * totalVAT;
  return htAfterEscompte + tvaAfterEscompte;
}

// Tri par montant TTC sur le montant affiché : les factures importées
// (totalTTC, sans finalTotalTTC) restaient en fin de liste quel que soit
// l'ordre.
export const totalTTCSortingFn = (rowA, rowB) =>
  (displayedTotalTTC(rowA.original) ?? 0) -
  (displayedTotalTTC(rowB.original) ?? 0);
