import { gql } from '@apollo/client';

/**
 * Mutation pour créer une dépense
 */
export const CREATE_EXPENSE = gql`
  mutation CreateExpense($input: CreateExpenseInput!) {
    createExpense(input: $input) {
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
      files {
        id
        filename
        originalFilename
        url
        ocrProcessed
      }
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation pour ajouter un fichier à une dépense
 */
export const ADD_EXPENSE_FILE = gql`
  mutation AddExpenseFile($expenseId: ID!, $input: FileUploadInput!) {
    addExpenseFile(expenseId: $expenseId, input: $input) {
      id
      title
      files {
        id
        filename
        originalFilename
        url
        ocrProcessed
        ocrData
      }
    }
  }
`;

/**
 * Mutation pour mettre à jour les métadonnées OCR d'une dépense
 */
export const UPDATE_EXPENSE_OCR_METADATA = gql`
  mutation UpdateExpenseOCRMetadata($expenseId: ID!, $metadata: OCRMetadataInput!) {
    updateExpenseOCRMetadata(expenseId: $expenseId, metadata: $metadata) {
      id
      title
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
    }
  }
`;

/**
 * Mutation pour appliquer les données OCR aux champs de la dépense
 */
export const APPLY_OCR_DATA_TO_EXPENSE = gql`
  mutation ApplyOCRDataToExpense($expenseId: ID!) {
    applyOCRDataToExpense(expenseId: $expenseId) {
      id
      title
      description
      amount
      currency
      vendor
      vendorVatNumber
      invoiceNumber
      vatAmount
      vatRate
    }
  }
`;

/**
 * Mutation pour supprimer une dépense
 */
export const DELETE_EXPENSE = gql`
  mutation DeleteExpense($id: ID!) {
    deleteExpense(id: $id) {
      success
      message
    }
  }
`;

/**
 * Mutation pour supprimer plusieurs dépenses
 */
export const DELETE_MULTIPLE_EXPENSES = gql`
  mutation DeleteMultipleExpenses($ids: [ID!]!) {
    deleteMultipleExpenses(ids: $ids) {
      success
      message
      deletedCount
      failedCount
      errors {
        id
        error
      }
    }
  }
`;
