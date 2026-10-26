import { gql, useMutation, useQuery, useSubscription } from "@apollo/client";

// Mutation pour envoyer une facture par email
export const SEND_INVOICE_EMAIL = gql`
  mutation SendInvoiceEmail(
    $workspaceId: ID!
    $input: SendDocumentEmailInput!
  ) {
    sendInvoiceEmail(workspaceId: $workspaceId, input: $input) {
      success
      messageId
      recipientEmail
    }
  }
`;

// Mutation pour envoyer un devis par email
export const SEND_QUOTE_EMAIL = gql`
  mutation SendQuoteEmail($workspaceId: ID!, $input: SendDocumentEmailInput!) {
    sendQuoteEmail(workspaceId: $workspaceId, input: $input) {
      success
      messageId
      recipientEmail
    }
  }
`;

// Mutation pour envoyer un avoir par email
export const SEND_CREDIT_NOTE_EMAIL = gql`
  mutation SendCreditNoteEmail(
    $workspaceId: ID!
    $input: SendDocumentEmailInput!
  ) {
    sendCreditNoteEmail(workspaceId: $workspaceId, input: $input) {
      success
      messageId
      recipientEmail
    }
  }
`;

// Hook pour envoyer une facture par email
export function useSendInvoiceEmail() {
  return useMutation(SEND_INVOICE_EMAIL);
}

// Hook pour envoyer un devis par email
export function useSendQuoteEmail() {
  return useMutation(SEND_QUOTE_EMAIL);
}

// Hook pour envoyer un avoir par email
export function useSendCreditNoteEmail() {
  return useMutation(SEND_CREDIT_NOTE_EMAIL);
}

// Mutation pour envoyer un bon de commande par email
export const SEND_PURCHASE_ORDER_EMAIL = gql`
  mutation SendPurchaseOrderEmail(
    $workspaceId: ID!
    $input: SendDocumentEmailInput!
  ) {
    sendPurchaseOrderEmail(workspaceId: $workspaceId, input: $input) {
      success
      messageId
      recipientEmail
    }
  }
`;

// Hook pour envoyer un bon de commande par email
export function useSendPurchaseOrderEmail() {
  return useMutation(SEND_PURCHASE_ORDER_EMAIL);
}

export const SEND_DELIVERY_NOTE_EMAIL = gql`
  mutation SendDeliveryNoteEmail(
    $workspaceId: ID!
    $input: SendDocumentEmailInput!
  ) {
    sendDeliveryNoteEmail(workspaceId: $workspaceId, input: $input) {
      success
      messageId
      recipientEmail
    }
  }
`;

// Hook pour envoyer un bon de livraison par email
export function useSendDeliveryNoteEmail() {
  return useMutation(SEND_DELIVERY_NOTE_EMAIL);
}

// Subscription pour le tracking d'ouverture d'email en temps réel
export const EMAIL_TRACKING_UPDATED_SUBSCRIPTION = gql`
  subscription EmailTrackingUpdated($workspaceId: ID!) {
    emailTrackingUpdated(workspaceId: $workspaceId) {
      documentId
      documentType
      workspaceId
      emailTracking {
        emailSentAt
        emailOpenedAt
        emailOpenCount
        emailClickedAt
        emailClickCount
        deliveryStatus
        deliveredAt
        deliveryFailedAt
        deliveryFailureReason
        recipientEmail
      }
    }
  }
`;

// Hook pour écouter les mises à jour de tracking en temps réel
export function useEmailTrackingSubscription({ workspaceId, onUpdate }) {
  return useSubscription(EMAIL_TRACKING_UPDATED_SUBSCRIPTION, {
    variables: { workspaceId },
    skip: !workspaceId,
    onData: ({ data }) => {
      if (data?.data?.emailTrackingUpdated) {
        onUpdate?.(data.data.emailTrackingUpdated);
      }
    },
  });
}

const DOCUMENT_EMAIL_LOG_FRAGMENT = gql`
  fragment DocumentEmailLogFields on DocumentEmailLog {
    id
    workspaceId
    documentType
    documentId
    documentNumber
    originalInvoiceId
    sentAt
    senderEmail
    from
    replyTo
    to
    cc
    bcc
    subject
    attachments {
      filename
      size
      isDocument
    }
    deliveryStatus
    deliveredAt
    deliveryFailedAt
    deliveryFailureReason
    openedAt
  }
`;

// Envoi tel que le client l'a reçu (lien du reçu à l'émetteur). Lu dans
// l'espace de l'envoi, même si un autre espace est actif.
export const GET_DOCUMENT_EMAIL_LOG = gql`
  query DocumentEmailLog($id: ID!) {
    documentEmailLog(id: $id) {
      ...DocumentEmailLogFields
      workspaceName
      html
    }
  }
  ${DOCUMENT_EMAIL_LOG_FRAGMENT}
`;

// Envois d'un document, du plus récent au plus ancien
export const GET_DOCUMENT_EMAIL_LOGS = gql`
  query DocumentEmailLogs(
    $workspaceId: ID!
    $documentType: String!
    $documentId: ID!
  ) {
    documentEmailLogs(
      workspaceId: $workspaceId
      documentType: $documentType
      documentId: $documentId
    ) {
      ...DocumentEmailLogFields
    }
  }
  ${DOCUMENT_EMAIL_LOG_FRAGMENT}
`;

export function useDocumentEmailLog(id) {
  return useQuery(GET_DOCUMENT_EMAIL_LOG, {
    variables: { id },
    skip: !id,
    fetchPolicy: "cache-and-network",
  });
}

export function useDocumentEmailLogs({
  workspaceId,
  documentType,
  documentId,
  skip = false,
}) {
  return useQuery(GET_DOCUMENT_EMAIL_LOGS, {
    variables: { workspaceId, documentType, documentId },
    skip: skip || !workspaceId || !documentId,
    fetchPolicy: "cache-and-network",
  });
}
