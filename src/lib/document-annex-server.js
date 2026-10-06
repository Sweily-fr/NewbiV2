import { mongoDb } from "@/src/lib/mongodb";
import { toObjectId } from "@/src/lib/security";
import {
  annexKeyBelongsTo,
  appendAnnexPages,
  parseAnnexKey,
} from "@/src/utils/document-annex";

/**
 * Ajoute l'annexe PDF du document (s'il en a une) à la fin du PDF généré par
 * les routes /api/<type>/generate-pdf. Ce PDF alimente l'archive R2 (aperçu,
 * téléchargement), la Factur-X, les emails, relances et automatisations : les
 * pages d'annexe y figurent donc partout.
 *
 * Le fichier est lu via l'API (bucket R2 privé) avec le secret interne ; le
 * cookie de session est aussi transmis quand la génération vient du
 * navigateur. Une annexe introuvable ou illisible ne bloque jamais le
 * document : il est renvoyé sans annexe et l'erreur est journalisée.
 *
 * @param {Buffer} pdfBuffer
 * @param {{ collection: string, id: string, cookie?: string|null }} params
 * @returns {Promise<Buffer>}
 */
export async function appendDocumentAnnex(pdfBuffer, { collection, id, cookie }) {
  let doc;
  try {
    doc = await mongoDb
      .collection(collection)
      .findOne(
        { _id: toObjectId(id) },
        { projection: { annex: 1, workspaceId: 1 } },
      );
  } catch (error) {
    console.error("[annexe] Lecture du document impossible:", error);
    return pdfBuffer;
  }

  const key = doc?.annex?.key;
  if (!key) return pdfBuffer;

  // Seules les annexes rangées sous l'organisation du document sont lues
  if (!annexKeyBelongsTo(key, doc.workspaceId)) {
    console.warn(`[annexe] Annexe ignorée (autre organisation) : ${collection}/${id}`);
    return pdfBuffer;
  }

  try {
    const { workspaceId, fileId } = parseAnnexKey(key);
    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/$/, "");
    const headers = {};
    if (process.env.INTERNAL_API_SECRET) {
      headers["x-internal-secret"] = process.env.INTERNAL_API_SECRET;
    }
    if (cookie) headers.cookie = cookie;

    const response = await fetch(
      `${backendUrl}/document-annexes/${workspaceId}/${fileId}`,
      { headers, signal: AbortSignal.timeout(20000) },
    );
    if (!response.ok) {
      throw new Error(`API ${response.status}`);
    }
    const annexBytes = new Uint8Array(await response.arrayBuffer());
    const merged = await appendAnnexPages(pdfBuffer, annexBytes);
    console.log(
      `📎 [PDF API] Annexe ajoutée (${collection}/${id}, ${merged.length} bytes)`,
    );
    return Buffer.from(merged);
  } catch (error) {
    console.error(
      `[annexe] Annexe non ajoutée au PDF (${collection}/${id}):`,
      error,
    );
    return pdfBuffer;
  }
}
