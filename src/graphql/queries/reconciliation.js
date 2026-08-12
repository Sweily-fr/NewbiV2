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
  query GetTransactionsForInvoice($invoiceId: ID!, $search: String) {
    transactionsForInvoice(invoiceId: $invoiceId, search: $search) {
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
 * Récupérer les factures rattachables à une transaction : PENDING, ou
 * COMPLETED sans transaction liée (marquée payée à la main).
 * (rattachement manuel depuis le drawer transaction)
 */
export const GET_INVOICES_FOR_TRANSACTION = gql`
  query GetInvoicesForTransaction($transactionId: ID!, $search: String) {
    invoicesForTransaction(transactionId: $transactionId, search: $search) {
      success
      invoices {
        id
        number
        clientName
        totalTTC
        dueDate
        status
        score
      }
      transactionAmount
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
        linkedInvoiceIds
        linkedInvoices {
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
        linkedInvoiceIds
        linkedInvoices {
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

/**
 * Réintégrer au rapprochement une transaction ignorée
 */
export const UNIGNORE_TRANSACTION = gql`
  mutation UnignoreTransaction($input: ReconciliationIgnoreInput!) {
    unignoreTransaction(input: $input) {
      success
      message
    }
  }
`;
