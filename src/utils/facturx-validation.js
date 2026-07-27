/**
 * Validation des données Factur-X.
 * Volontairement séparé de facturx-generator.js : ce module n'importe pas
 * pdf-lib (~500 KB) et peut donc être chargé dans le bundle des pages listes.
 */

/**
 * Vérifie si les données de facture sont complètes pour Factur-X
 */
export function validateFacturXData(invoiceData) {
  const errors = [];

  if (!invoiceData.number) errors.push("Numéro de facture manquant");
  if (!invoiceData.issueDate) errors.push("Date d'émission manquante");
  if (!invoiceData.companyInfo?.name)
    errors.push("Nom de l'entreprise manquant");
  if (!invoiceData.companyInfo?.vatNumber)
    errors.push("Numéro de TVA manquant");
  if (!invoiceData.companyInfo?.siret) errors.push("SIRET vendeur manquant");
  if (!invoiceData.companyInfo?.address?.postalCode)
    errors.push("Code postal vendeur manquant");
  if (!invoiceData.client?.name) errors.push("Nom du client manquant");
  if (!invoiceData.client?.address?.postalCode)
    errors.push("Code postal acheteur manquant");
  if (!invoiceData.items || invoiceData.items.length === 0)
    errors.push("Aucun article dans la facture");

  if (errors.length > 0) {
    console.warn("Validation Factur-X échouée:");
    errors.forEach((error, index) => {
      console.warn(`  ${index + 1}. ${error}`);
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
