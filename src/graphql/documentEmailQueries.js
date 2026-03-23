import { gql, useMutation, useSubscription } from "@apollo/client";

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
