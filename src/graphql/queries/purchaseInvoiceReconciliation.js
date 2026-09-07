import { gql } from "@apollo/client";

/**
 * Suggestions de rapprochement transaction (débit) -> facture d'achat.
 * Miroir de GET_RECONCILIATION_SUGGESTIONS (factures client), alimente le
 * toast PurchaseInvoiceReconciliationToast (polling 60s).
 */
export const GET_PURCHASE_INVOICE_RECONCILIATION_SUGGESTIONS = gql`
  query GetPurchaseInvoiceReconciliationSuggestions($workspaceId: ID!) {
    purchaseInvoiceReconciliationSuggestions(workspaceId: $workspaceId) {
      success
      suggestions {
        transaction {
          id
          amount
          description
          date
          reconciliationStatus
        }
        matchingPurchaseInvoices {
          id
          invoiceNumber
          supplierName
          amountTTC
          issueDate
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
 * Transactions (débits) rattachables à une facture d'achat : rattachement
 * manuel depuis le drawer facture d'achat. search contourne la fenêtre de
 * dates et inclut les transactions déjà rapprochées (relevé couvrant
 * plusieurs prélèvements, facture créée après le paiement).
 */
export const GET_TRANSACTIONS_FOR_PURCHASE_INVOICE = gql`
  query GetTransactionsForPurchaseInvoice(
    $purchaseInvoiceId: ID!
    $search: String
  ) {
    transactionsForPurchaseInvoice(
      purchaseInvoiceId: $purchaseInvoiceId
      search: $search
    ) {
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
 * Factures d'achat rattachables à une transaction : rattachement manuel
 * depuis le drawer transaction. isReconciled = déjà liée à une autre
 * transaction (rattachable quand même).
 */
export const GET_PURCHASE_INVOICES_FOR_TRANSACTION = gql`
  query GetPurchaseInvoicesForTransaction(
    $transactionId: ID!
    $search: String
  ) {
    purchaseInvoicesForTransaction(
      transactionId: $transactionId
      search: $search
    ) {
      success
      purchaseInvoices {
        id
        invoiceNumber
        supplierName
        amountTTC
        issueDate
        status
        isReconciled
        score
      }
      transactionAmount
    }
  }
`;

/**
 * Doublons probables avant création manuelle d'une facture d'achat.
 */
export const GET_PURCHASE_INVOICE_DUPLICATES = gql`
  query GetPurchaseInvoiceDuplicates(
    $workspaceId: ID!
    $input: PurchaseInvoiceDuplicateCheckInput!
  ) {
    purchaseInvoiceDuplicates(workspaceId: $workspaceId, input: $input) {
      id
      invoiceNumber
      supplierName
      amountTTC
      issueDate
      status
    }
  }
`;
