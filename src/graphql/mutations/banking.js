import { gql } from "@apollo/client";

/**
 * Mettre à jour une transaction
 */
export const UPDATE_TRANSACTION = gql`
  mutation UpdateTransaction($id: ID!, $input: UpdateTransactionInput!) {
    updateTransaction(id: $id, input: $input) {
      id
      description
      category
      expenseCategory
      pcgAccount {
        numero
        intitule
        confidence
        isManual
      }
      amount
      currency
      date
      status
      metadata
      receiptFiles {
        id
        url
        key
        filename
        mimetype
        size
        uploadedAt
      }
      updatedAt
    }
  }
`;

/**
 * Supprimer une transaction manuelle
 */
export const DELETE_TRANSACTION = gql`
  mutation DeleteTransaction($id: ID!) {
    deleteTransaction(id: $id)
  }
`;
