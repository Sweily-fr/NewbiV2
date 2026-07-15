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
