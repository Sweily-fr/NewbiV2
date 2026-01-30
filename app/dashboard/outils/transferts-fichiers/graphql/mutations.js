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
    $fileSize: Float!
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

// Mutation pour démarrer un multipart upload natif
export const START_MULTIPART_UPLOAD = gql`
  mutation StartMultipartUpload(
    $transferId: String!
    $fileId: String!
    $fileName: String!
    $fileSize: Float!
    $mimeType: String
    $totalParts: Int!
  ) {
    startMultipartUpload(
      transferId: $transferId
      fileId: $fileId
      fileName: $fileName
      fileSize: $fileSize
      mimeType: $mimeType
      totalParts: $totalParts
    ) {
      uploadId
      key
      presignedUrls {
        partNumber
        uploadUrl
      }
    }
  }
`;

// Mutation pour compléter un multipart upload
export const COMPLETE_MULTIPART_UPLOAD = gql`
  mutation CompleteMultipartUpload(
    $uploadId: String!
    $key: String!
    $parts: [PartInput!]!
    $transferId: String
    $fileId: String!
  ) {
    completeMultipartUpload(
      uploadId: $uploadId
      key: $key
      parts: $parts
      transferId: $transferId
      fileId: $fileId
    ) {
      success
      key
      url
      size
      etag
      fileId
    }
  }
`;

// Nouvelle mutation pour générer des URLs signées (upload direct)
export const GENERATE_PRESIGNED_UPLOAD_URLS = gql`
  mutation GeneratePresignedUploadUrls(
    $fileId: String!
    $totalChunks: Int!
    $fileName: String!
  ) {
    generatePresignedUploadUrls(
      fileId: $fileId
      totalChunks: $totalChunks
      fileName: $fileName
    ) {
      fileId
      transferId
      uploadUrls {
        chunkIndex
        uploadUrl
        key
      }
      expiresIn
    }
  }
`;

// Nouvelle mutation pour confirmer l'upload d'un chunk
export const CONFIRM_CHUNK_UPLOADED = gql`
  mutation ConfirmChunkUploadedToR2(
    $fileId: String!
    $chunkIndex: Int!
    $totalChunks: Int!
    $fileName: String!
    $fileSize: Float!
  ) {
    confirmChunkUploadedToR2(
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
      storageType
    }
  }
`;

export const UPLOAD_FILE_CHUNK_TO_R2 = gql`
  mutation UploadFileChunkToR2(
    $chunk: Upload!
    $fileId: String!
    $chunkIndex: Int!
    $totalChunks: Int!
    $fileName: String!
    $fileSize: Float!
  ) {
    uploadFileChunkToR2(
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
      storageType
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
        files {
          originalName
          fileName
          filePath
          mimeType
          size
        }
        totalSize
        shareLink
        accessKey
        expiryDate
        isPaymentRequired
        paymentAmount
        paymentCurrency
        status
        createdAt
      }
      shareLink
      accessKey
    }
  }
`;

export const CREATE_FILE_TRANSFER_WITH_IDS_R2 = gql`
  mutation CreateFileTransferWithIdsR2(
    $fileIds: [String!]!
    $input: FileTransferInput
  ) {
    createFileTransferWithIdsR2(fileIds: $fileIds, input: $input) {
      fileTransfer {
        id
        files {
          originalName
          displayName
          fileName
          filePath
          r2Key
          mimeType
          size
          storageType
          fileId
        }
        totalSize
        shareLink
        accessKey
        expiryDate
        isPaymentRequired
        paymentAmount
        paymentCurrency
        status
        createdAt
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
          fileId
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
          downloadUrl
          mimeType
          size
          storageType
          r2Key
          fileId
        }
        totalSize
        expiryDate
        isPaymentRequired
        paymentAmount
        paymentCurrency
        isPaid
        status
        downloadCount
        recipientEmail
        # Nouvelles options
        passwordProtected
        allowPreview
        hasWatermark
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
