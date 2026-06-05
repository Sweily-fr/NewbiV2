/**
 * Génération du PDF Factur-X (PDF/A-3 + XML EN16931) d'une facture en vue de son
 * archivage sur Cloudflare R2.
 *
 * Réutilise le pipeline EXISTANT :
 *   1. /api/invoices/generate-pdf  → PDF visuel (rendu serveur Puppeteer, par invoiceId)
 *   2. generateFacturXXML()        → XML EN16931 (à partir de l'objet facture)
 *   3. /api/generate-facturx       → embarque le XML dans un PDF/A-3 conforme
 *
 * Renvoie un objet File (application/pdf) prêt à être uploadé via la mutation
 * archiveInvoicePdf, ou null si la génération échoue (archivage non bloquant).
 */

function base64ToFile(base64, fileName) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], fileName, { type: "application/pdf" });
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000; // évite "Maximum call stack" sur les gros buffers
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/**
 * Construit le fichier PDF Factur-X d'une facture.
 * @param {Object} invoice - L'objet facture (même shape que la preview)
 * @param {string} type - "invoice" | "creditNote"
 * @returns {Promise<File|null>}
 */
export async function buildFacturXFile(invoice, type = "invoice") {
  try {
    const invoiceId = invoice?.id || invoice?._id;
    if (!invoiceId) return null;

    // 1. PDF visuel via le générateur serveur (Puppeteer) — source unique de rendu
    const pdfResponse = await fetch("/api/invoices/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });
    if (!pdfResponse.ok) {
      throw new Error(`generate-pdf: ${pdfResponse.status}`);
    }
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = arrayBufferToBase64(pdfArrayBuffer);

    const fileName = `facture_${invoice.prefix || ""}${invoice.number || invoiceId}.pdf`;

    // 2. XML Factur-X (validation préalable des données)
    const { generateFacturXXML, validateFacturXData } =
      await import("@/src/utils/facturx-generator");
    const validation = validateFacturXData(invoice);
    if (!validation.isValid) {
      // Données incomplètes : on archive le PDF visuel sans XML embarqué (fallback)
      console.warn(
        "[archive-facturx] Données Factur-X incomplètes, archivage du PDF simple:",
        validation.errors?.slice(0, 3),
      );
      return base64ToFile(pdfBase64, fileName);
    }

    const xmlString = generateFacturXXML(invoice, type);

    // 3. Embarquement XML → PDF/A-3 conforme
    const facturxResponse = await fetch("/api/generate-facturx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pdfBase64,
        xmlString,
        invoiceNumber: invoice.number,
        documentType: type,
      }),
    });
    if (!facturxResponse.ok) {
      throw new Error(`generate-facturx: ${facturxResponse.status}`);
    }
    const result = await facturxResponse.json();
    if (!result.success || !result.pdfBase64) {
      throw new Error(result.error || "Factur-X non généré");
    }

    return base64ToFile(result.pdfBase64, fileName);
  } catch (error) {
    console.error("[archive-facturx] Échec génération PDF Factur-X:", error);
    return null;
  }
}
