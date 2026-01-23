import { gql } from "@apollo/client";

// ==================== QUERIES ====================

/**
 * Récupérer tous les comptes bancaires du workspace
 */
export const GET_BANKING_ACCOUNTS = gql`
  query GetBankingAccounts($workspaceId: ID!) {
    bankingAccounts(workspaceId: $workspaceId) {
      id
      externalId
      provider
      type
      status
      balance {
        available
        current
        currency
      }
      accountNumber
      iban
      bic
      bankName
      accountHolder {
        name
        email
      }
      lastSyncAt
      createdAt
      updatedAt
    }
  }
`;

/**
 * Récupérer un compte bancaire par ID
 */
export const GET_BANKING_ACCOUNT = gql`
  query GetBankingAccount($id: ID!) {
    bankingAccount(id: $id) {
      id
      externalId
      provider
      type
      status
      balance {
        available
        current
        currency
      }
      accountNumber
      iban
      bic
      bankName
      accountHolder {
        name
        email
      }
      lastSyncAt
      createdAt
      updatedAt
    }
  }
`;

/**
 * Récupérer les transactions (bancaires + manuelles)
 */
export const GET_TRANSACTIONS = gql`
  query GetTransactions(
    $workspaceId: ID!
    $filters: TransactionFiltersInput
    $limit: Int
    $offset: Int
  ) {
    transactions(
      workspaceId: $workspaceId
      filters: $filters
      limit: $limit
      offset: $offset
    ) {
      id
      externalId
      provider
      type
      status
      amount
      currency
      description
      fromAccount
      toAccount
      processedAt
      failureReason
      fees {
        amount
        currency
        provider
      }
      metadata
      receiptFile {
        url
        key
        filename
        mimetype
        size
        uploadedAt
      }
      receiptRequired
      createdAt
      updatedAt
    }
  }
`;

/**
 * Récupérer une transaction par ID
 */
export const GET_TRANSACTION = gql`
  query GetTransaction($id: ID!) {
    transaction(id: $id) {
      id
      externalId
      provider
      type
      status
      amount
      currency
      description
      fromAccount
      toAccount
      processedAt
      failureReason
      fees {
        amount
        currency
        provider
      }
      metadata
      receiptFile {
        url
        key
        filename
        mimetype
        size
        uploadedAt
      }
      receiptRequired
      createdAt
      updatedAt
    }
  }
`;

/**
 * Récupérer le solde d'un compte
 */
export const GET_ACCOUNT_BALANCE = gql`
  query GetAccountBalance($accountId: String!) {
    accountBalance(accountId: $accountId) {
      available
      current
      currency
    }
  }
`;

/**
 * Récupérer l'historique des transactions d'un compte
 */
export const GET_TRANSACTION_HISTORY = gql`
  query GetTransactionHistory(
    $accountId: String!
    $filters: TransactionFiltersInput
  ) {
    transactionHistory(accountId: $accountId, filters: $filters) {
      id
      externalId
      provider
      type
      status
      amount
      currency
      description
      fromAccount
      toAccount
      processedAt
      createdAt
      updatedAt
    }
  }
`;

// ==================== MUTATIONS ====================

/**
 * Synchroniser le solde d'un compte
 */
export const SYNC_ACCOUNT_BALANCE = gql`
  mutation SyncAccountBalance($accountId: String!) {
    syncAccountBalance(accountId: $accountId) {
      available
      current
      currency
    }
  }
`;

/**
 * Synchroniser l'historique des transactions
 */
export const SYNC_TRANSACTION_HISTORY = gql`
  mutation SyncTransactionHistory($accountId: String!) {
    syncTransactionHistory(accountId: $accountId) {
      id
      externalId
      provider
      type
      status
      amount
      currency
      description
      processedAt
      createdAt
    }
  }
`;

/**
 * Upload de justificatif pour une transaction
 */
export const UPLOAD_TRANSACTION_RECEIPT = gql`
  mutation UploadTransactionReceipt(
    $transactionId: ID!
    $workspaceId: ID!
    $file: Upload!
  ) {
    uploadTransactionReceipt(
      transactionId: $transactionId
      workspaceId: $workspaceId
      file: $file
    ) {
      success
      message
      receiptFile {
        url
        key
        filename
        mimetype
        size
        uploadedAt
      }
      transaction {
        id
        receiptFile {
          url
          filename
        }
        receiptRequired
      }
    }
  }
`;
