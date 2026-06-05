import { useMutation } from "@apollo/client";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { ARCHIVE_INVOICE_PDF } from "@/src/graphql/eInvoicingQueries";
import { buildFacturXFile } from "@/src/utils/archive-invoice-facturx";

/**
 * Hook d'archivage du PDF Factur-X d'une facture sur Cloudflare R2.
 *
 * Génère le PDF/A-3 Factur-X (pipeline frontend existant) puis l'upload via la
 * mutation archiveInvoicePdf. L'opération est NON BLOQUANTE : tout échec est
 * silencieux (l'affichage retombera sur la preview client live).
 *
 * Les brouillons ne sont jamais archivés.
 */
export function useArchiveInvoicePdf() {
  const { workspaceId } = useRequiredWorkspace();
  const [archiveMutation] = useMutation(ARCHIVE_INVOICE_PDF);

  const archiveInvoicePdf = async (invoice, type = "invoice") => {
    try {
      if (!invoice || invoice.status === "DRAFT") return;
      const invoiceId = invoice.id || invoice._id;
      if (!invoiceId || !workspaceId) return;

      const file = await buildFacturXFile(invoice, type);
      if (!file) return;

      await archiveMutation({
        variables: { workspaceId, invoiceId, file },
      });
    } catch (error) {
      // Archivage non bloquant : on n'interrompt jamais le flux de facturation
      console.warn(
        "[useArchiveInvoicePdf] archivage ignoré:",
        error?.message || error,
      );
    }
  };

  return { archiveInvoicePdf };
}
