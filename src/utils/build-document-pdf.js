/**
 * Génération du PDF d'un document (devis, avoir, bon de commande) en vue de son
 * archivage sur Cloudflare R2 — version générique.
 *
 * - Devis & bons de commande → PDF visuel simple (route serveur Puppeteer).
 * - Avoirs → PDF/A-3 Factur-X (PDF visuel + XML EN16931 embarqué, typeCode 381).
 *
 * Renvoie un objet File (application/pdf) prêt à uploader, ou null si échec
 * (archivage non bloquant).
 */

// type → { endpoint de génération PDF serveur, nom du champ id }
const GENERATE_PDF = {
  quote: { endpoint: "/api/quotes/generate-pdf", idKey: "quoteId" },
  creditNote: {
    endpoint: "/api/credit-notes/generate-pdf",
    idKey: "creditNoteId",
  },
  purchaseOrder: {
    endpoint: "/api/purchase-orders/generate-pdf",
    idKey: "purchaseOrderId",
  },
};

function base64ToFile(base64, fileName) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], fileName, { type: "application/pdf" });
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/**
 * Construit le fichier PDF d'un document.
 * @param {Object} doc - L'objet document (même shape que la preview)
 * @param {string} type - "quote" | "creditNote" | "purchaseOrder"
 * @returns {Promise<File|null>}
 */
export async function buildDocumentPdfFile(doc, type) {
  try {
    const cfg = GENERATE_PDF[type];
    if (!cfg) return null;
    const docId = doc?.id || doc?._id;
    if (!docId) return null;

    // 1. PDF visuel via le générateur serveur (Puppeteer)
    const pdfResponse = await fetch(cfg.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [cfg.idKey]: docId }),
    });
    if (!pdfResponse.ok) {
      throw new Error(`${cfg.endpoint}: ${pdfResponse.status}`);
    }
    const pdfBase64 = arrayBufferToBase64(await pdfResponse.arrayBuffer());

    const fileName = `${type}_${doc.prefix || ""}${doc.number || docId}.pdf`;

    // Devis & bons de commande : PDF simple, pas de Factur-X
    if (type !== "creditNote") {
      return base64ToFile(pdfBase64, fileName);
    }

    // Avoir : embarquer le XML Factur-X (typeCode 381)
    const { generateFacturXXML, validateFacturXData } =
      await import("@/src/utils/facturx-generator");
    const validation = validateFacturXData(doc);
    if (!validation.isValid) {
      console.warn(
        "[build-document-pdf] Données Factur-X incomplètes (avoir), archivage du PDF simple:",
        validation.errors?.slice(0, 3),
      );
      return base64ToFile(pdfBase64, fileName);
    }

    const xmlString = generateFacturXXML(doc, "creditNote");
    const facturxResponse = await fetch("/api/generate-facturx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pdfBase64,
        xmlString,
        invoiceNumber: doc.number,
        documentType: "creditNote",
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
    console.error("[build-document-pdf] Échec génération PDF:", error);
    return null;
  }
}
