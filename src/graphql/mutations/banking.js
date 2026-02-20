import { gql } from "@apollo/client";

/**
 * Créer une transaction manuelle
 */
export const CREATE_TRANSACTION = gql`
  mutation CreateTransaction($input: CreateTransactionInput!) {
    createTransaction(input: $input) {
      id
      externalId
      provider
      type
      status
      amount
      currency
      description
      category
      expenseCategory
      date
      metadata
      receiptFile {
        url
        key
        filename
        mimetype
        size
        uploadedAt
      }
      createdAt
      updatedAt
    }
  }
`;

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
      amount
      currency
      date
      status
      metadata
      receiptFile {
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
