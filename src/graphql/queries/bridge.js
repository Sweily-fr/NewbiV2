import { gql } from "@apollo/client";

/**
 * Query pour récupérer l'ID utilisateur Bridge existant
 */
export const GET_BRIDGE_USER_ID = gql`
  query GetBridgeUserId {
    getBridgeUserId {
      success
      bridgeUserId
      message
    }
  }
`;

/**
 * Query pour récupérer les transactions récentes
 */
export const GET_RECENT_TRANSACTIONS = gql`
  query GetRecentTransactions($workspaceId: ID!, $limit: Int) {
    getRecentTransactions(workspaceId: $workspaceId, limit: $limit) {
      success
      message
      transactions {
        id
        amount
        currency
        description
        date
        type
        category
        status
        formattedAmount
        formattedDate
        bridgeTransactionId
        bridgeAccountId
      }
    }
  }
`;

/**
 * Query pour récupérer les statistiques des transactions
 */
export const GET_TRANSACTION_STATS = gql`
  query GetTransactionStats($workspaceId: ID!) {
    getTransactionStats(workspaceId: $workspaceId) {
      success
      stats {
        totalIncome
        totalExpenses
        balance
        transactionCount
        categoryBreakdown {
          category
          amount
          percentage
        }
      }
    }
  }
`;

// Query pour récupérer les comptes bancaires
export const GET_BRIDGE_ACCOUNTS = gql`
  query GetBridgeAccounts {
    getBridgeAccounts {
      success
      message
      accounts {
        id
        name
        balance
        currency
        type
        status
        iban
        bank {
          name
          logo
        }
        lastRefreshedAt
        createdAt
      }
    }
  }
`;

// Mutation pour forcer la synchronisation des comptes bancaires
export const SYNC_BRIDGE_ACCOUNTS = gql`
  mutation SyncBridgeAccounts {
    syncBridgeAccounts {
      success
      message
      accounts {
        id
        name
        balance
        currency
        type
        status
        iban
        bank {
          name
          logo
        }
        lastRefreshedAt
        createdAt
      }
    }
  }
`;
