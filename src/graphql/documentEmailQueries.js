import { gql, useMutation } from "@apollo/client";

// Mutation pour envoyer une facture par email
export const SEND_INVOICE_EMAIL = gql`
  mutation SendInvoiceEmail($workspaceId: ID!, $input: SendDocumentEmailInput!) {
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
  mutation SendCreditNoteEmail($workspaceId: ID!, $input: SendDocumentEmailInput!) {
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
