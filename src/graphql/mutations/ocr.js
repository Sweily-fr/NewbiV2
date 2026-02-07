import { gql } from "@apollo/client";

/**
 * Mutations GraphQL pour l'OCR avec Mistral
 */

// Mutation OCR direct — envoie le fichier directement au backend (pas de pré-upload Cloudflare)
export const PROCESS_DOCUMENT_OCR = gql`
  mutation ProcessDocumentOcr($file: Upload!, $workspaceId: String!, $options: OcrOptions) {
    processDocumentOcr(file: $file, workspaceId: $workspaceId, options: $options) {
      success
      extractedText
      financialAnalysis
      data
      metadata {
        fileName
        mimeType
        fileSize
        processedAt
        documentUrl
        cloudflareKey
        documentId
      }
      message
    }
  }
`;

// Nouvelle mutation qui fait l'OCR à partir d'une URL Cloudflare existante
export const PROCESS_DOCUMENT_OCR_FROM_URL = gql`
  mutation ProcessDocumentOcrFromUrl(
    $cloudflareUrl: String!
    $fileName: String!
    $mimeType: String!
    $fileSize: Float
    $workspaceId: String!
    $options: OcrOptions
  ) {
    processDocumentOcrFromUrl(
      cloudflareUrl: $cloudflareUrl
      fileName: $fileName
      mimeType: $mimeType
      fileSize: $fileSize
      workspaceId: $workspaceId
      options: $options
    ) {
      success
      extractedText
      financialAnalysis
      data
      metadata {
        fileName
        mimeType
        fileSize
        processedAt
        documentUrl
        cloudflareKey
        documentId
      }
      message
    }
  }
`;
