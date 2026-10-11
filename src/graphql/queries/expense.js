import { gql } from "@apollo/client";

/**
 * Queries GraphQL pour la gestion des dépenses
 */

// Query pour récupérer la liste des dépenses avec pagination et filtres
export const GET_EXPENSES = gql`
  query GetExpenses(
    $workspaceId: ID!
    $startDate: String
    $endDate: String
    $category: ExpenseCategory
    $status: ExpenseStatus
    $search: String
    $tags: [String!]
    $page: Int = 1
    $limit: Int = 10
  ) {
    expenses(
      workspaceId: $workspaceId
      startDate: $startDate
      endDate: $endDate
      category: $category
      status: $status
      search: $search
      tags: $tags
      page: $page
      limit: $limit
    ) {
      expenses {
        id
        title
        description
        amount
        currency
        category
        date
        vendor
        vendorVatNumber
        invoiceNumber
        documentNumber
        vatAmount
        vatRate
        status
        paymentMethod
        paymentDate
        notes
        tags
        isVatDeductible
        expenseType
        assignedMember {
          userId
          name
          email
          image
        }
        taskId
        files {
          id
          filename
          originalFilename
          mimetype
          size
          url
          ocrProcessed
          ocrData
        }
        ocrMetadata {
          vendorName
          vendorAddress
          vendorVatNumber
          invoiceNumber
          invoiceDate
          totalAmount
          vatAmount
          currency
          confidenceScore
        }
        createdAt
        updatedAt
      }
      totalCount
      hasNextPage
    }
  }
`;

// Query pour les statistiques des dépenses
export const GET_EXPENSE_STATS = gql`
  query GetExpenseStats(
    $workspaceId: ID!
    $startDate: String
    $endDate: String
  ) {
    expenseStats(
      workspaceId: $workspaceId
      startDate: $startDate
      endDate: $endDate
    ) {
      totalAmount
      totalCount
      byCategory {
        category
        amount
        count
      }
      byMonth {
        month
        amount
        count
      }
      byStatus {
        status
        amount
        count
      }
    }
  }
`;
