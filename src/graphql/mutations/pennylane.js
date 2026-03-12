import { gql } from "@apollo/client";

// Récupérer le compte Pennylane de l'organisation (query)
export const MY_PENNYLANE_ACCOUNT = gql`
  query MyPennylaneAccount {
    myPennylaneAccount {
      id
      organizationId
      isConnected
      companyName
      companyId
      environment
      lastSyncAt
      syncStatus
      syncError
      stats {
        invoicesSynced
        expensesSynced
        clientsSynced
        productsSynced
      }
      autoSync {
        invoices
        expenses
        clients
      }
      createdAt
      updatedAt
    }
  }
`;

// Tester la connexion Pennylane (sans sauvegarder)
export const TEST_PENNYLANE_CONNECTION = gql`
  mutation TestPennylaneConnection($apiToken: String!) {
    testPennylaneConnection(apiToken: $apiToken) {
      success
      message
      companyName
      companyId
    }
  }
`;

// Connecter Pennylane à l'organisation
export const CONNECT_PENNYLANE = gql`
  mutation ConnectPennylane($apiToken: String!, $environment: String) {
    connectPennylane(apiToken: $apiToken, environment: $environment) {
      success
      message
      account {
        id
        organizationId
        isConnected
        companyName
        companyId
        environment
        syncStatus
      }
    }
  }
`;

// Déconnecter Pennylane
export const DISCONNECT_PENNYLANE = gql`
  mutation DisconnectPennylane {
    disconnectPennylane {
      success
      message
    }
  }
`;

// Mettre à jour les préférences de sync automatique
export const UPDATE_PENNYLANE_AUTO_SYNC = gql`
  mutation UpdatePennylaneAutoSync($autoSync: PennylaneAutoSyncInput!) {
    updatePennylaneAutoSync(autoSync: $autoSync) {
      success
      message
      account {
        id
        autoSync {
          invoices
          expenses
          clients
        }
      }
    }
  }
`;

// Synchroniser une facture vers Pennylane
export const SYNC_INVOICE_TO_PENNYLANE = gql`
  mutation SyncInvoiceToPennylane($invoiceId: ID!) {
    syncInvoiceToPennylane(invoiceId: $invoiceId) {
      success
      message
      pennylaneId
    }
  }
`;

// Synchroniser une dépense vers Pennylane
export const SYNC_EXPENSE_TO_PENNYLANE = gql`
  mutation SyncExpenseToPennylane($expenseId: ID!) {
    syncExpenseToPennylane(expenseId: $expenseId) {
      success
      message
      pennylaneId
    }
  }
`;

// Lancer une synchronisation complète
export const SYNC_ALL_TO_PENNYLANE = gql`
  mutation SyncAllToPennylane {
    syncAllToPennylane {
      success
      message
      invoicesSynced
      invoicesErrors
      expensesSynced
      expensesErrors
      clientsSynced
      clientsErrors
      productsSynced
      productsErrors
    }
  }
`;
