import { gql } from "@apollo/client";

const QONTO_ACCOUNT_FIELDS = gql`
  fragment QontoAccountFields on QontoAccount {
    id
    organizationId
    login
    isConnected
    organizationName
    qontoOrganizationId
    slug
    environment
    bankAccounts {
      qontoId
      name
      iban
      bic
      currency
      main
      status
    }
    selectedBankAccountId
    lastSyncAt
    syncStatus
    syncError
    stats {
      invoicesSynced
      expensesSynced
      clientsSynced
    }
    autoSync {
      invoices
      supplierInvoices
    }
    createdAt
    updatedAt
  }
`;

// Récupérer le compte Qonto de l'organisation (query)
export const MY_QONTO_ACCOUNT = gql`
  ${QONTO_ACCOUNT_FIELDS}
  query MyQontoAccount {
    myQontoAccount {
      ...QontoAccountFields
    }
  }
`;

// Tester les identifiants Qonto (sans sauvegarder)
export const TEST_QONTO_CONNECTION = gql`
  mutation TestQontoConnection(
    $login: String!
    $secretKey: String!
    $environment: String
  ) {
    testQontoConnection(
      login: $login
      secretKey: $secretKey
      environment: $environment
    ) {
      success
      message
      organizationName
      organizationId
      slug
      bankAccounts {
        qontoId
        name
        iban
        bic
        currency
        main
        status
      }
    }
  }
`;

// Connecter Qonto à l'organisation
export const CONNECT_QONTO = gql`
  ${QONTO_ACCOUNT_FIELDS}
  mutation ConnectQonto(
    $login: String!
    $secretKey: String!
    $environment: String
    $bankAccountId: String
  ) {
    connectQonto(
      login: $login
      secretKey: $secretKey
      environment: $environment
      bankAccountId: $bankAccountId
    ) {
      success
      message
      account {
        ...QontoAccountFields
      }
    }
  }
`;

// Déconnecter Qonto
export const DISCONNECT_QONTO = gql`
  mutation DisconnectQonto {
    disconnectQonto {
      success
      message
    }
  }
`;

// Mettre à jour les préférences de sync automatique
export const UPDATE_QONTO_AUTO_SYNC = gql`
  mutation UpdateQontoAutoSync($autoSync: QontoAutoSyncInput!) {
    updateQontoAutoSync(autoSync: $autoSync) {
      success
      message
      account {
        id
        autoSync {
          invoices
          supplierInvoices
        }
      }
    }
  }
`;

// Choisir le compte bancaire (IBAN) affiché sur les factures
export const UPDATE_QONTO_BANK_ACCOUNT = gql`
  mutation UpdateQontoBankAccount($bankAccountId: String!) {
    updateQontoBankAccount(bankAccountId: $bankAccountId) {
      success
      message
      account {
        id
        selectedBankAccountId
      }
    }
  }
`;

// Rafraîchir la liste des comptes bancaires
export const REFRESH_QONTO_BANK_ACCOUNTS = gql`
  ${QONTO_ACCOUNT_FIELDS}
  mutation RefreshQontoBankAccounts {
    refreshQontoBankAccounts {
      success
      message
      account {
        ...QontoAccountFields
      }
    }
  }
`;

// Synchroniser une facture vers Qonto
export const SYNC_INVOICE_TO_QONTO = gql`
  mutation SyncInvoiceToQonto($invoiceId: ID!) {
    syncInvoiceToQonto(invoiceId: $invoiceId) {
      success
      message
      qontoId
    }
  }
`;

// Synchroniser une facture d'achat vers Qonto
export const SYNC_PURCHASE_INVOICE_TO_QONTO = gql`
  mutation SyncPurchaseInvoiceToQonto($purchaseInvoiceId: ID!) {
    syncPurchaseInvoiceToQonto(purchaseInvoiceId: $purchaseInvoiceId) {
      success
      message
      qontoId
    }
  }
`;

// Synchroniser une dépense vers Qonto
export const SYNC_EXPENSE_TO_QONTO = gql`
  mutation SyncExpenseToQonto($expenseId: ID!) {
    syncExpenseToQonto(expenseId: $expenseId) {
      success
      message
      qontoId
    }
  }
`;

// Lancer une synchronisation complète
export const SYNC_ALL_TO_QONTO = gql`
  mutation SyncAllToQonto {
    syncAllToQonto {
      success
      message
      invoicesSynced
      invoicesErrors
      expensesSynced
      expensesErrors
    }
  }
`;
