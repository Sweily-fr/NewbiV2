/**
 * Mutations GraphQL pour l'upload de documents vers Cloudflare
 */

import { gql } from '@apollo/client';

export const UPLOAD_DOCUMENT = gql`
  mutation UploadDocument($file: Upload!, $folderType: String) {
    uploadDocument(file: $file, folderType: $folderType) {
      success
      key
      url
      contentType
      fileName
      fileSize
      message
    }
  }
`;

export const DELETE_DOCUMENT = gql`
  mutation DeleteDocument($key: String!) {
    deleteDocument(key: $key) {
      success
      message
    }
  }
`;
