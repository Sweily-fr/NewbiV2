import { useMutation } from "@apollo/client";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { ARCHIVE_QUOTE_PDF } from "@/src/graphql/quoteQueries";
import { ARCHIVE_CREDIT_NOTE_PDF } from "@/src/graphql/creditNoteQueries";
import { ARCHIVE_PURCHASE_ORDER_PDF } from "@/src/graphql/purchaseOrderQueries";
import { buildDocumentPdfFile } from "@/src/utils/build-document-pdf";

const MUTATIONS = {
  quote: ARCHIVE_QUOTE_PDF,
  creditNote: ARCHIVE_CREDIT_NOTE_PDF,
  purchaseOrder: ARCHIVE_PURCHASE_ORDER_PDF,
};
// nom de la variable id par type
const ID_VAR = {
  quote: "quoteId",
  creditNote: "creditNoteId",
  purchaseOrder: "purchaseOrderId",
};
// statut brouillon non archivable (null = pas de brouillon → toujours archiver)
const DRAFT_STATUS = {
  quote: "DRAFT",
  creditNote: null,
  purchaseOrder: "DRAFT",
};

/**
 * Hook générique d'archivage du PDF d'un document (devis / avoir / bon de commande)
 * sur Cloudflare R2. Génère le PDF (Factur-X pour les avoirs), puis l'upload.
 * NON BLOQUANT : tout échec est silencieux.
 *
 * @param {"quote"|"creditNote"|"purchaseOrder"} type
 */
export function useArchiveDocumentPdf(type) {
  const { workspaceId } = useRequiredWorkspace();
  const [archiveMutation] = useMutation(MUTATIONS[type]);

  const archiveDocument = async (doc) => {
    try {
      if (!doc) return;
      const draft = DRAFT_STATUS[type];
      if (draft && doc.status === draft) return;

      const docId = doc.id || doc._id;
      if (!docId || !workspaceId) return;

      const file = await buildDocumentPdfFile(doc, type);
      if (!file) return;

      await archiveMutation({
        variables: { workspaceId, [ID_VAR[type]]: docId, file },
      });
    } catch (error) {
      console.warn("[useArchiveDocumentPdf] archivage ignoré:", error?.message);
    }
  };

  return { archiveDocument };
}
