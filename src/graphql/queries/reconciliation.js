import { gql } from "@apollo/client";

// ==================== QUERIES ====================

/**
 * Récupérer les suggestions de rapprochement
 */
export const GET_RECONCILIATION_SUGGESTIONS = gql`
  query GetReconciliationSuggestions {
    reconciliationSuggestions {
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
