import { gql } from '@apollo/client';

/**
 * Mutation pour créer ou récupérer un utilisateur Bridge
 */
export const CREATE_BRIDGE_USER = gql`
  mutation CreateBridgeUser {
    createBridgeUser {
      success
      bridgeUserId
      message
    }
  }
`;

/**
 * Mutation pour déconnecter Bridge
 */
export const DISCONNECT_BRIDGE = gql`
  mutation DisconnectBridge {
    disconnectBridge {
      success
      message
    }
  }
`;

/**
 * Mutation pour créer une session de connexion Bridge
 */
export const CREATE_BRIDGE_CONNECT_SESSION = gql`
  mutation CreateBridgeConnectSession($input: BridgeConnectSessionInput!) {
    createBridgeConnectSession(input: $input) {
      success
      redirectUrl
      sessionId
      message
    }
  }
`;

/**
 * Mutation pour synchroniser les transactions Bridge
 */
export const SYNC_BRIDGE_TRANSACTIONS = gql`
  mutation SyncBridgeTransactions {
    syncBridgeTransactions {
      success
      message
      stats {
        created
        updated
        errors
      }
    }
  }
`;
