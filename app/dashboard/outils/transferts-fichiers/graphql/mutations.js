import { gql } from "@apollo/client";

// Nouvelles mutations pour le workflow en chunks
// Étape 1 : Upload des chunks
export const UPLOAD_FILE_CHUNK = gql`
  mutation UploadFileChunk(
    $chunk: Upload!
    $fileId: String!
    $chunkIndex: Int!
    $totalChunks: Int!
    $fileName: String!
    $fileSize: Int!
  ) {
    uploadFileChunk(
      chunk: $chunk
      fileId: $fileId
      chunkIndex: $chunkIndex
      totalChunks: $totalChunks
      fileName: $fileName
      fileSize: $fileSize
    ) {
      chunkReceived
      fileCompleted
      fileId
      fileName
      filePath
      fileTransferId
    }
  }
`;

// Étape 2 : Créer le transfert avec les IDs de fichiers
export const CREATE_FILE_TRANSFER_WITH_IDS = gql`
  mutation CreateFileTransferWithIds(
    $fileIds: [String!]!
    $input: FileTransferInput
  ) {
    createFileTransferWithIds(fileIds: $fileIds, input: $input) {
      fileTransfer {
        id
        shareLink
        accessKey
        expiryDate
        status
        isPaymentRequired
        paymentAmount
        paymentCurrency
        totalSize
        files {
          id
          fileName
          originalName
          size
          mimeType
        }
      }
      shareLink
      accessKey
    }
  }
`;

// ANCIENNE MÉTHODE - À SUPPRIMER QUAND LE NOUVEAU WORKFLOW FONCTIONNE
// Pour l'upload de fichiers standards
export const CREATE_FILE_TRANSFER = gql`
  mutation CreateFileTransfer($files: [Upload!]!, $input: FileTransferInput) {
    createFileTransfer(files: $files, input: $input) {
      fileTransfer {
        id
        shareLink
        accessKey
        expiryDate
        status
        isPaymentRequired
        paymentAmount
        paymentCurrency
        isPaid
        totalSize
        files {
          id
          fileName
          originalName
          mimeType
          size
        }
      }
      shareLink
      accessKey
    }
  }
`;

export const CREATE_FILE_TRANSFER_BASE64 = gql`
  mutation CreateFileTransferBase64(
    $files: [Base64FileInput!]!
    $input: FileTransferInput
  ) {
    createFileTransferBase64(files: $files, input: $input) {
      success
      message
      fileTransfer {
        id
        shareLink
        accessKey
        expiryDate
        status
        isPaymentRequired
        paymentAmount
        paymentCurrency
        isPaid
        totalSize
        files {
          id
          fileName
          originalName
          mimeType
          size
        }
      }
      shareLink
      accessKey
    }
  }
`;

// Pour récupérer les transferts de l'utilisateur
export const GET_MY_TRANSFERS = gql`
  query GetMyTransfers($page: Int, $limit: Int) {
    myFileTransfers(page: $page, limit: $limit) {
      items {
        id
        files {
          id
          fileName
          originalName
          size
          mimeType
        }
        totalSize
        shareLink
        accessKey
        expiryDate
        downloadCount
        status
        isPaymentRequired
        paymentAmount
        paymentCurrency
        recipientEmail
        createdAt
      }
      totalItems
      currentPage
      totalPages
      hasNextPage
    }
  }
`;

// Pour accéder à un transfert via un lien de partage
export const GET_TRANSFER_BY_LINK = gql`
  query GetFileTransferByLink($shareLink: String!, $accessKey: String!) {
    getFileTransferByLink(shareLink: $shareLink, accessKey: $accessKey) {
      success
      message
      fileTransfer {
        id
        files {
          id
          originalName
          fileName
          filePath
          mimeType
          size
        }
        totalSize
        expiryDate
        isPaymentRequired
        paymentAmount
        paymentCurrency
        status
        downloadCount
      }
    }
  }
`;

// Pour supprimer un transfert
export const DELETE_FILE_TRANSFER = gql`
  mutation DeleteFileTransfer($id: ID!) {
    deleteFileTransfer(id: $id)
  }
`;

// Pour générer un lien de paiement
export const GENERATE_FILE_TRANSFER_PAYMENT_LINK = gql`
  mutation GenerateFileTransferPaymentLink(
    $shareLink: String!
    $accessKey: String!
  ) {
    generateFileTransferPaymentLink(
      shareLink: $shareLink
      accessKey: $accessKey
    ) {
      success
      message
      checkoutUrl
    }
  }
`;
