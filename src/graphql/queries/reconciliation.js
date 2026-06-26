import { gql } from "@apollo/client";

// ==================== QUERIES ====================

/**
 * Récupérer les suggestions de rapprochement
 */
export const GET_RECONCILIATION_SUGGESTIONS = gql`
  query GetReconciliationSuggestions($workspaceId: ID!) {
    reconciliationSuggestions(workspaceId: $workspaceId) {
      success
      suggestions {
        transaction {
          id
          amount
          description
          date
          reconciliationStatus
        }
        matchingInvoices {
          id
          number
          clientName
          totalTTC
          dueDate
          status
          documentType
        }
        confidence
      }
      unmatchedCount
      pendingInvoicesCount
    }
  }
`;

/**
 * Récupérer les transactions pour une facture spécifique
 */
export const GET_TRANSACTIONS_FOR_INVOICE = gql`
  query GetTransactionsForInvoice($invoiceId: ID!) {
    transactionsForInvoice(invoiceId: $invoiceId) {
      success
      transactions {
        id
        amount
        description
        date
        reconciliationStatus
        score
      }
      invoiceAmount
    }
  }
`;

// ==================== MUTATIONS ====================

/**
 * Lier une transaction à une facture
 */
export const LINK_TRANSACTION_TO_INVOICE = gql`
  mutation LinkTransactionToInvoice($input: ReconciliationLinkInput!) {
    linkTransactionToInvoice(input: $input) {
      success
      message
      transaction {
        id
        amount
        description
        date
        reconciliationStatus
        reconciliationDate
        linkedInvoiceId
        linkedInvoice {
          id
          number
          status
          clientName
          totalTTC
          issueDate
          dueDate
        }
      }
      invoice {
        id
        number
        clientName
        totalTTC
        dueDate
        status
      }
    }
  }
`;

/**
 * Délier une transaction d'une facture
 */
export const UNLINK_TRANSACTION_FROM_INVOICE = gql`
  mutation UnlinkTransactionFromInvoice($input: ReconciliationUnlinkInput!) {
    unlinkTransactionFromInvoice(input: $input) {
      success
      message
      transaction {
        id
        reconciliationStatus
        reconciliationDate
        linkedInvoiceId
        linkedInvoice {
          id
          number
          status
          clientName
          totalTTC
          issueDate
          dueDate
        }
      }
    }
  }
`;

/**
 * Récupérer les transactions candidates pour une facture de CA importée
 */
export const GET_TRANSACTIONS_FOR_IMPORTED_INVOICE = gql`
  query GetTransactionsForImportedInvoice($importedInvoiceId: ID!) {
    transactionsForImportedInvoice(importedInvoiceId: $importedInvoiceId) {
      success
      transactions {
        id
        amount
        description
        date
        reconciliationStatus
        score
      }
      invoiceAmount
    }
  }
`;

/**
 * Lier une transaction à une facture de CA importée
 */
export const LINK_TRANSACTION_TO_IMPORTED_INVOICE = gql`
  mutation LinkTransactionToImportedInvoice(
    $input: ImportedInvoiceReconciliationLinkInput!
  ) {
    linkTransactionToImportedInvoice(input: $input) {
      success
      message
      transaction {
        id
        amount
        description
        date
        reconciliationStatus
        reconciliationDate
        linkedImportedInvoiceId
      }
      invoice {
        id
        number
        clientName
        totalTTC
        dueDate
        status
      }
    }
  }
`;

/**
 * Délier une transaction d'une facture de CA importée
 */
export const UNLINK_TRANSACTION_FROM_IMPORTED_INVOICE = gql`
  mutation UnlinkTransactionFromImportedInvoice(
    $input: ImportedInvoiceReconciliationUnlinkInput!
  ) {
    unlinkTransactionFromImportedInvoice(input: $input) {
      success
      message
      transaction {
        id
        reconciliationStatus
        reconciliationDate
        linkedImportedInvoiceId
      }
    }
  }
`;

/**
 * Ignorer une transaction (ne plus la suggérer)
 */
export const IGNORE_TRANSACTION = gql`
  mutation IgnoreTransaction($input: ReconciliationIgnoreInput!) {
    ignoreTransaction(input: $input) {
      success
      message
    }
  }
`;
