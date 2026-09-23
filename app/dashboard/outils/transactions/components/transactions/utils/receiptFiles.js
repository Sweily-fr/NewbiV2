/**
 * Justificatifs « autonomes » d'une transaction.
 *
 * Un justificatif déposé sur la transaction peut devenir (ou être rattaché à)
 * une facture d'achat par la lecture automatique : l'API note alors
 * `receiptFiles[].purchaseInvoiceId` et la facture reprend le même fichier
 * (même URL R2). La carte « Facture d'achat liée » porte déjà ce document
 * (étiquette « Justificatif déposé », œil sur le fichier) : on ne le compte
 * ni ne le liste une deuxième fois. Repli sur l'URL pour les liens créés
 * avant l'exposition du champ.
 */
export const findCarryingPurchaseInvoice = (
  receipt,
  linkedPurchaseInvoices,
) => {
  if (!receipt || !Array.isArray(linkedPurchaseInvoices)) return null;
  return (
    linkedPurchaseInvoices.find((pi) => {
      if (!pi) return false;
      if (
        receipt.purchaseInvoiceId &&
        String(receipt.purchaseInvoiceId) === String(pi.id)
      ) {
        return true;
      }
      return (
        !!receipt.url &&
        (pi.files || []).some((f) => f?.url && f.url === receipt.url)
      );
    }) || null
  );
};

export const isReceiptCarriedByPurchaseInvoice = (
  receipt,
  linkedPurchaseInvoices,
) => Boolean(findCarryingPurchaseInvoice(receipt, linkedPurchaseInvoices));

/**
 * Fichiers déposés sur la transaction (legacy `files[]` en repli), sans ceux
 * déjà portés par une facture d'achat liée. Chaque entrée garde
 * `receiptIndex`, sa position d'origine dans `receiptFiles` (proxy d'aperçu).
 */
export const getStandaloneReceipts = (transaction) => {
  if (!transaction) return [];
  const linked = transaction.linkedPurchaseInvoices || [];
  const receiptFiles = Array.isArray(transaction.receiptFiles)
    ? transaction.receiptFiles
    : [];
  if (receiptFiles.length > 0) {
    return receiptFiles
      .map((r, idx) => ({ ...r, receiptIndex: idx }))
      .filter((r) => !isReceiptCarriedByPurchaseInvoice(r, linked));
  }
  return Array.isArray(transaction.files)
    ? transaction.files.filter(
        (f) => !isReceiptCarriedByPurchaseInvoice(f, linked),
      )
    : [];
};
