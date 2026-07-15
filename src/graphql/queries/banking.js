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
      name
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
      institutionName
      institutionLogo
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
      category
      expenseCategory
      pcgAccount {
        numero
        intitule
        confidence
        isManual
        manuallySetAt
      }
      fromAccount
      toAccount
      date
      processedAt
      failureReason
      fees {
        amount
        currency
        provider
      }
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
      receiptRequired
      # Champs de rapprochement bancaire (N↔N)
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
      reconciliationStatus
      reconciliationDate
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
      category
      expenseCategory
      pcgAccount {
        numero
        intitule
        confidence
        isManual
        manuallySetAt
      }
      fromAccount
      toAccount
      date
      processedAt
      failureReason
      fees {
        amount
        currency
        provider
      }
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
      receiptRequired
      # Champs de rapprochement bancaire (N↔N)
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
      reconciliationStatus
      reconciliationDate
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
      category
      expenseCategory
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
 * Upload de justificatifs (multi-fichiers) pour une transaction
 */
export const UPLOAD_TRANSACTION_RECEIPT = gql`
  mutation UploadTransactionReceipt(
    $transactionId: ID!
    $workspaceId: ID!
    $files: [Upload!]!
  ) {
    uploadTransactionReceipt(
      transactionId: $transactionId
      workspaceId: $workspaceId
      files: $files
    ) {
      success
      message
      receiptFiles {
        id
        url
        key
        filename
        mimetype
        size
        uploadedAt
      }
      transaction {
        id
        receiptFiles {
          id
          url
          filename
        }
        receiptRequired
      }
    }
  }
`;

/**
 * Suppression d'un justificatif d'une transaction
 */
export const REMOVE_TRANSACTION_RECEIPT_FILE = gql`
  mutation RemoveTransactionReceiptFile(
    $transactionId: ID!
    $workspaceId: ID!
    $fileId: ID!
  ) {
    removeTransactionReceiptFile(
      transactionId: $transactionId
      workspaceId: $workspaceId
      fileId: $fileId
    ) {
      success
      message
      receiptFiles {
        id
        url
        key
        filename
        mimetype
        size
        uploadedAt
      }
      transaction {
        id
        receiptFiles {
          id
          url
          filename
        }
        receiptRequired
      }
    }
  }
`;

/**
 * Mettre à jour une transaction (catégorie, description, etc.)
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
      processedAt
      status
      metadata
      updatedAt
    }
  }
`;

/**
 * Table de correspondance Bridge → PCG
 */
export const GET_PCG_MAPPING_TABLE = gql`
  query GetPCGMappingTable {
    pcgMappingTable {
      bridgeCategoryId
      bridgeLabel
      parentCategory
      pcgNumero
      pcgIntitule
      confidence
      alternatives {
        numero
        intitule
      }
      rules
    }
  }
`;

/**
 * Liste de tous les comptes PCG disponibles
 */
export const GET_PCG_ACCOUNTS = gql`
  query GetPCGAccounts {
    pcgAccounts {
      numero
      intitule
    }
  }
`;
