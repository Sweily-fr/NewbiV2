import { gql } from "@apollo/client";

const ABBY_ACCOUNT_FIELDS = gql`
  fragment AbbyAccountFields on AbbyAccount {
    id
    organizationId
    isConnected
    companyName
    abbyCompanyId
    isTestMode
    incomeProductType
    lastSyncAt
    syncStatus
    syncError
    lastImportAt
    importError
    stats {
      invoicesSynced
      quotesSynced
      clientsSynced
      clientInvoicesImported
      quotesImported
    }
    autoSync {
      invoices
      quotes
      importClientInvoices
      importQuotes
    }
    createdAt
    updatedAt
  }
`;

// Récupérer le compte Abby de l'organisation (query)
export const MY_ABBY_ACCOUNT = gql`
  ${ABBY_ACCOUNT_FIELDS}
  query MyAbbyAccount {
    myAbbyAccount {
      ...AbbyAccountFields
    }
  }
`;

// Tester la clé API Abby (sans sauvegarder)
export const TEST_ABBY_CONNECTION = gql`
  mutation TestAbbyConnection($apiKey: String!) {
    testAbbyConnection(apiKey: $apiKey) {
      success
      message
      companyName
      companyId
      isTestMode
    }
  }
`;

// Connecter Abby à l'organisation
export const CONNECT_ABBY = gql`
  ${ABBY_ACCOUNT_FIELDS}
  mutation ConnectAbby($apiKey: String!) {
    connectAbby(apiKey: $apiKey) {
      success
      message
      account {
        ...AbbyAccountFields
      }
    }
  }
`;

// Déconnecter Abby
export const DISCONNECT_ABBY = gql`
  mutation DisconnectAbby {
    disconnectAbby {
      success
      message
    }
  }
`;

// Mettre à jour les préférences de sync automatique
export const UPDATE_ABBY_AUTO_SYNC = gql`
  mutation UpdateAbbyAutoSync($autoSync: AbbyAutoSyncInput!) {
    updateAbbyAutoSync(autoSync: $autoSync) {
      success
      message
      account {
        id
        autoSync {
          invoices
          quotes
          importClientInvoices
          importQuotes
        }
      }
    }
  }
`;

// Type de produit Abby des recettes créées par Newbi
export const UPDATE_ABBY_INCOME_PRODUCT_TYPE = gql`
  mutation UpdateAbbyIncomeProductType($productType: Int!) {
    updateAbbyIncomeProductType(productType: $productType) {
      success
      message
      account {
        id
        incomeProductType
      }
    }
  }
`;

// Enregistrer une facture encaissée dans le livre des recettes Abby
export const SYNC_INVOICE_TO_ABBY = gql`
  mutation SyncInvoiceToAbby($invoiceId: ID!) {
    syncInvoiceToAbby(invoiceId: $invoiceId) {
      success
      message
      abbyId
    }
  }
`;

// Créer un devis Newbi dans Abby
export const SYNC_QUOTE_TO_ABBY = gql`
  mutation SyncQuoteToAbby($quoteId: ID!) {
    syncQuoteToAbby(quoteId: $quoteId) {
      success
      message
      abbyId
    }
  }
`;

// Lancer une synchronisation complète
export const SYNC_ALL_TO_ABBY = gql`
  mutation SyncAllToAbby {
    syncAllToAbby {
      success
      message
      invoicesSynced
      invoicesErrors
      quotesSynced
      quotesErrors
    }
  }
`;

// Importer maintenant les documents finalisés dans Abby vers Newbi
export const IMPORT_FROM_ABBY = gql`
  mutation ImportFromAbby {
    importFromAbby {
      success
      message
      clientInvoicesImported
      clientInvoicesUpdated
      clientInvoicesErrors
      quotesImported
      quotesUpdated
      quotesErrors
    }
  }
`;
