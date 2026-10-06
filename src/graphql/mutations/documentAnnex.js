import { gql } from "@apollo/client";

// Envoi d'une annexe PDF (ex : CGV) : la référence renvoyée est ensuite
// enregistrée avec le document (champ annex) ou comme annexe par défaut
export const UPLOAD_DOCUMENT_ANNEX = gql`
  mutation UploadDocumentAnnex(
    $workspaceId: ID!
    $documentType: AnnexDocumentType!
    $file: Upload!
  ) {
    uploadDocumentAnnex(
      workspaceId: $workspaceId
      documentType: $documentType
      file: $file
    ) {
      success
      message
      annex {
        key
        fileName
        size
        pageCount
      }
    }
  }
`;
