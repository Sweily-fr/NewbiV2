import { gql } from "@apollo/client";

// === FRAGMENTS ===

const SIGNATURE_REQUEST_FIELDS = gql`
  fragment SignatureRequestFields on SignatureRequest {
    id
    organizationId
    workspaceId
    documentType
    documentId
    documentNumber
    signatureProvider
    externalSignatureId
    signatureType
    status
    signers {
      name
      surname
      email
      mobile
      authentication
      signedAt
    }
    signingUrl
    signedDocumentUrl
    auditTrailUrl
    errorMessage
    callbackReceived
    createdBy
    createdAt
    updatedAt
  }
`;

// === QUERIES ===

export const GET_SIGNATURE_REQUEST = gql`
  ${SIGNATURE_REQUEST_FIELDS}
  query GetSignatureRequest($id: ID!) {
    getSignatureRequest(id: $id) {
      ...SignatureRequestFields
    }
  }
`;

export const GET_SIGNATURE_REQUESTS = gql`
  ${SIGNATURE_REQUEST_FIELDS}
  query GetSignatureRequests(
    $documentId: ID
    $documentType: String
    $status: String
  ) {
    getSignatureRequests(
      documentId: $documentId
      documentType: $documentType
      status: $status
    ) {
      ...SignatureRequestFields
    }
  }
`;

export const GET_DOCUMENT_SIGNATURE_STATUS = gql`
  ${SIGNATURE_REQUEST_FIELDS}
  query GetDocumentSignatureStatus($documentType: String!, $documentId: ID!) {
    getDocumentSignatureStatus(
      documentType: $documentType
      documentId: $documentId
    ) {
      ...SignatureRequestFields
    }
  }
`;

// === MUTATIONS ===

export const REQUEST_DOCUMENT_SIGNATURE = gql`
  ${SIGNATURE_REQUEST_FIELDS}
  mutation RequestDocumentSignature($input: RequestSignatureInput!) {
    requestDocumentSignature(input: $input) {
      success
      message
      signatureRequest {
        ...SignatureRequestFields
      }
    }
  }
`;

export const SEAL_QUOTE_DOCUMENT = gql`
  ${SIGNATURE_REQUEST_FIELDS}
  mutation SealQuoteDocument($quoteId: ID!) {
    sealQuoteDocument(quoteId: $quoteId) {
      success
      message
      signatureRequest {
        ...SignatureRequestFields
      }
    }
  }
`;

export const CANCEL_SIGNATURE = gql`
  ${SIGNATURE_REQUEST_FIELDS}
  mutation CancelSignature($signatureId: ID!) {
    cancelSignature(signatureId: $signatureId) {
      success
      message
      signatureRequest {
        ...SignatureRequestFields
      }
    }
  }
`;

export const RETRY_SIGNATURE = gql`
  ${SIGNATURE_REQUEST_FIELDS}
  mutation RetrySignature($signatureId: ID!) {
    retrySignature(signatureId: $signatureId) {
      success
      message
      signatureRequest {
        ...SignatureRequestFields
      }
    }
  }
`;

// === SUBSCRIPTIONS ===

export const SIGNATURE_STATUS_UPDATED = gql`
  subscription SignatureStatusUpdated($documentId: ID!) {
    signatureStatusUpdated(documentId: $documentId) {
      documentId
      documentType
      status
      signatureType
    }
  }
`;
