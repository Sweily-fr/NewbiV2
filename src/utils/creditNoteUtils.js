/**
 * Utilitaires pour la gestion des avoirs
 */

/**
 * Vérifie si une facture a atteint sa limite d'avoirs
 * @param {Object} invoice - La facture
 * @param {Array} creditNotes - Les avoirs existants pour cette facture
 * @returns {boolean} - true si la limite est atteinte
 */
export function hasReachedCreditNoteLimit(invoice, creditNotes) {
  if (!invoice || !creditNotes) {
    return false;
  }

  // Montant total de la facture
  const invoiceAmount = invoice.finalTotalTTC || 0;
  
  // Si le montant de la facture est 0 ou négatif, pas de limite
  if (invoiceAmount <= 0) {
    return false;
  }

  // Calculer la somme des avoirs existants (valeurs absolues car les avoirs sont négatifs)
  const totalCreditNotesAmount = creditNotes.reduce((sum, creditNote) => {
    return sum + Math.abs(creditNote.finalTotalTTC || 0);
  }, 0);

  // Vérifier si la somme des avoirs atteint ou dépasse le montant de la facture
  return totalCreditNotesAmount >= invoiceAmount;
}

/**
 * Calcule le montant restant disponible pour les avoirs
 * @param {Object} invoice - La facture
 * @param {Array} creditNotes - Les avoirs existants pour cette facture
 * @returns {number} - Le montant restant disponible
 */
export function getRemainingCreditNoteAmount(invoice, creditNotes) {
  if (!invoice || !creditNotes) {
    return 0;
  }

  // Montant total de la facture
  const invoiceAmount = invoice.finalTotalTTC || 0;
  
  // Calculer la somme des avoirs existants (valeurs absolues car les avoirs sont négatifs)
  const totalCreditNotesAmount = creditNotes.reduce((sum, creditNote) => {
    return sum + Math.abs(creditNote.finalTotalTTC || 0);
  }, 0);

  // Retourner le montant restant (minimum 0)
  return Math.max(0, invoiceAmount - totalCreditNotesAmount);
}
