/**
 * « Dupliquer » une facture (menu de sa consultation) : ce que la nouvelle
 * facture reprend (client, articles, remises, frais de port, notes et
 * conditions), sans son numéro, ses dates, son statut ni ses liens (devis,
 * bon de commande, paiement). L'éditeur de création le lit depuis
 * sessionStorage (clé « duplicateInvoiceData »), comme la conversion d'un
 * devis.
 *
 * @param {Object} invoice - facture consultée (GET_INVOICE)
 * @returns {Object} données de pré-remplissage
 */
export function duplicateInvoiceData(invoice) {
  return {
    client: invoice.client,
    items: invoice.items,
    discount: invoice.discount,
    discountType: invoice.discountType,
    customFields: invoice.customFields,
    shipping: invoice.shipping,
    isReverseCharge: invoice.isReverseCharge,
    isVatExempt: invoice.isVatExempt,
    retenueGarantie: invoice.retenueGarantie,
    escompte: invoice.escompte,
    headerNotes: invoice.headerNotes,
    footerNotes: invoice.footerNotes,
    termsAndConditions: invoice.termsAndConditions,
  };
}
