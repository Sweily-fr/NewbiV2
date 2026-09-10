/**
 * Facture d'achat créée depuis un justificatif sans extraction IA complète :
 * - "partial" : champs devinés par le moteur gratuit (Tesseract + regex)
 * - "none"    : aucune donnée lue, facture construite depuis la transaction
 * Dans les deux cas l'utilisateur doit vérifier et compléter la facture.
 */
export const OCR_REVIEW_TITLE =
  "Créée sans extraction IA complète (moteurs indisponibles) : vérifiez le fournisseur, le numéro et les montants.";

export function needsReview(invoice) {
  const quality = invoice?.ocrMetadata?.extractionQuality;
  return quality === "partial" || quality === "none";
}
