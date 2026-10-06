import { useMutation } from "@apollo/client";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { UPLOAD_DOCUMENT_ANNEX } from "@/src/graphql/mutations/documentAnnex";
import {
  ANNEX_DOCUMENT_TYPES,
  ANNEX_MAX_BYTES,
  normalizeAnnex,
} from "@/src/utils/document-annex";

// Envoi d'une annexe PDF : renvoie sa référence, ou null en cas d'échec
// (message d'erreur affiché ici)
export const useUploadDocumentAnnex = (documentType) => {
  const { workspaceId } = useRequiredWorkspace();
  const [uploadDocumentAnnex, { loading }] = useMutation(UPLOAD_DOCUMENT_ANNEX);

  return {
    uploadAnnex: async (file) => {
      if (!file) return null;
      if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
        toast.error("L'annexe doit être un fichier PDF");
        return null;
      }
      if (file.size > ANNEX_MAX_BYTES) {
        toast.error("PDF trop volumineux (2 Mo maximum)");
        return null;
      }
      try {
        const { data } = await uploadDocumentAnnex({
          variables: {
            workspaceId,
            documentType: ANNEX_DOCUMENT_TYPES[documentType],
            file,
          },
        });
        const result = data?.uploadDocumentAnnex;
        const annex = normalizeAnnex(result?.annex);
        if (!result?.success || !annex) {
          toast.error(result?.message || "Impossible d'envoyer l'annexe");
          return null;
        }
        return annex;
      } catch (error) {
        toast.error(error.message || "Impossible d'envoyer l'annexe");
        return null;
      }
    },
    loading,
  };
};
