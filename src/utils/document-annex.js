/**
 * Annexe PDF des devis, factures et bons de commande (ex : CGV).
 *
 * Le PDF joint par l'utilisateur est stocké par l'API (bucket R2 privé, clé
 * `annexes/{workspaceId}/{uuid}.pdf`) ; le document n'en garde que la
 * référence `annex = { key, fileName, size, pageCount }`. Ses pages sont
 * ajoutées à la fin du PDF du document à chaque génération : rendu serveur
 * (routes /api/<type>/generate-pdf, donc archive R2, Factur-X et emails) et
 * replis navigateur (téléchargement, envoi depuis l'éditeur, signature).
 *
 * Module utilisable côté serveur comme navigateur (pdf-lib chargé à la demande).
 */

export const ANNEX_MAX_BYTES = 2 * 1024 * 1024;
export const ANNEX_MAX_PAGES = 20;

const ANNEX_KEY_RE =
  /^annexes\/([0-9a-f]{24})\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf)$/;

// Champ de l'organisation qui porte l'annexe par défaut de chaque type
export const ORGANIZATION_ANNEX_FIELDS = {
  invoice: "invoiceAnnex",
  quote: "quoteAnnex",
  purchaseOrder: "purchaseOrderAnnex",
};

// Valeur de l'enum GraphQL AnnexDocumentType
export const ANNEX_DOCUMENT_TYPES = {
  invoice: "INVOICE",
  quote: "QUOTE",
  purchaseOrder: "PURCHASE_ORDER",
};

/** Découpe une clé d'annexe en { workspaceId, fileId }, ou null. */
export function parseAnnexKey(key) {
  const match = typeof key === "string" ? ANNEX_KEY_RE.exec(key) : null;
  return match ? { workspaceId: match[1], fileId: match[2] } : null;
}

export function annexKeyBelongsTo(key, workspaceId) {
  const parsed = parseAnnexKey(key);
  return Boolean(parsed && workspaceId && parsed.workspaceId === String(workspaceId));
}

/**
 * Normalise une annexe (document, GraphQL ou JSON de l'organisation) en
 * { key, fileName, size, pageCount }, sans __typename. null si absente.
 */
export function normalizeAnnex(value) {
  let annex = value;
  if (typeof annex === "string") {
    try {
      annex = JSON.parse(annex);
    } catch {
      return null;
    }
  }
  if (!annex || !parseAnnexKey(annex.key)) return null;
  return {
    key: annex.key,
    fileName: annex.fileName || "annexe.pdf",
    size: Number(annex.size) || null,
    pageCount: Number(annex.pageCount) || null,
  };
}

/** Annexe par défaut de l'organisation pour ce type de document, ou null. */
export function getOrganizationAnnex(organization, documentType) {
  const field = ORGANIZATION_ANNEX_FIELDS[documentType];
  return field ? normalizeAnnex(organization?.[field]) : null;
}

/** Valeur à enregistrer dans le champ de l'organisation ("" = aucune). */
export function serializeOrganizationAnnex(annex) {
  const normalized = normalizeAnnex(annex);
  return normalized ? JSON.stringify(normalized) : "";
}

/** Entrée GraphQL DocumentAnnexInput (null retire l'annexe). */
export function toAnnexInput(annex) {
  const normalized = normalizeAnnex(annex);
  if (!normalized) return null;
  return {
    key: normalized.key,
    fileName: normalized.fileName,
    ...(normalized.size ? { size: normalized.size } : {}),
    ...(normalized.pageCount ? { pageCount: normalized.pageCount } : {}),
  };
}

/** URL same-origin (proxy Next) qui sert le PDF de l'annexe au navigateur. */
export function annexProxyUrl(annex) {
  const parsed = parseAnnexKey(annex?.key);
  return parsed
    ? `/api/document-annex/${parsed.workspaceId}/${parsed.fileId}`
    : null;
}

export function formatAnnexSummary(annex) {
  if (!annex) return "";
  const parts = [];
  if (annex.pageCount) {
    parts.push(`${annex.pageCount} page${annex.pageCount > 1 ? "s" : ""}`);
  }
  if (annex.size) {
    parts.push(
      annex.size >= 1024 * 1024
        ? `${(annex.size / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`
        : `${Math.max(1, Math.round(annex.size / 1024))} Ko`,
    );
  }
  return parts.join(" · ");
}

/**
 * Ajoute toutes les pages de l'annexe à la fin du PDF.
 * @param {Uint8Array|ArrayBuffer|Buffer} pdfBytes
 * @param {Uint8Array|ArrayBuffer|Buffer} annexBytes
 * @returns {Promise<Uint8Array>}
 */
export async function appendAnnexPages(pdfBytes, annexBytes) {
  const { PDFDocument } = await import("pdf-lib");
  // updateMetadata: false garde le producteur et les dates du PDF d'origine
  const target = await PDFDocument.load(pdfBytes, { updateMetadata: false });
  const annex = await PDFDocument.load(annexBytes, { updateMetadata: false });
  const pages = await target.copyPages(annex, annex.getPageIndices());
  pages.forEach((page) => target.addPage(page));
  return target.save();
}

/**
 * Côté navigateur : télécharge l'annexe via le proxy same-origin et l'ajoute
 * au PDF. Sans annexe, renvoie le PDF tel quel. Une annexe illisible
 * n'empêche jamais d'obtenir le document : on renvoie alors le PDF seul.
 * @param {Uint8Array|ArrayBuffer} pdfBytes
 * @param {object|null} annex
 * @returns {Promise<Uint8Array|ArrayBuffer>}
 */
export async function appendAnnexInBrowser(pdfBytes, annex) {
  const url = annexProxyUrl(normalizeAnnex(annex));
  if (!url) return pdfBytes;
  try {
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const annexBytes = new Uint8Array(await response.arrayBuffer());
    return await appendAnnexPages(pdfBytes, annexBytes);
  } catch (error) {
    console.error("[annexe] Impossible d'ajouter l'annexe au PDF:", error);
    return pdfBytes;
  }
}

/** Encode des octets en base64 (par blocs : pas de dépassement de pile). */
export function uint8ArrayToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
