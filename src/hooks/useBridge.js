import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useSession } from "../../src/lib/auth-client";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

import {
  CREATE_BRIDGE_USER,
  DISCONNECT_BRIDGE,
  CREATE_BRIDGE_CONNECT_SESSION,
  SYNC_BRIDGE_TRANSACTIONS,
} from "@/src/graphql/mutations/bridge";
import {
  GET_BRIDGE_USER_ID,
  GET_RECENT_TRANSACTIONS,
  GET_TRANSACTION_STATS,
  GET_BRIDGE_ACCOUNTS,
  SYNC_BRIDGE_ACCOUNTS,
} from "@/src/graphql/queries/bridge";
import { toast } from "@/src/components/ui/sonner";

/**
 * Hook pour gérer l'intégration Bridge API
 */
export const useBridge = () => {
  console.log("🗣️ useBridge HOOK APPELÉ !");

  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { workspaceId } = useRequiredWorkspace();

  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingAccounts, setIsSyncingAccounts] = useState(false);

  // Query pour récupérer l'ID Bridge existant
  const {
    data: bridgeData,
    loading: loadingBridgeId,
    error: bridgeError,
    refetch: refetchBridgeId,
  } = useQuery(GET_BRIDGE_USER_ID, {
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  });

  // Mutation pour créer un utilisateur Bridge
  const [createBridgeUserMutation] = useMutation(CREATE_BRIDGE_USER, {
    errorPolicy: "all",
    onCompleted: (data) => {
      if (data.createBridgeUser.success) {
        console.log(
          "✅ Utilisateur Bridge créé/récupéré:",
          data.createBridgeUser.bridgeUserId
        );
        toast.success(
          data.createBridgeUser.message || "Utilisateur Bridge créé avec succès"
        );
      }
    },
    onError: (error) => {
      console.error("❌ Erreur création utilisateur Bridge:", error);
      toast.error("Erreur lors de la création de l'utilisateur Bridge");
    },
  });

  // Mutation pour déconnecter Bridge
  const [disconnectBridgeMutation] = useMutation(DISCONNECT_BRIDGE, {
    errorPolicy: "all",
    onCompleted: (data) => {
      if (data.disconnectBridge.success) {
        console.log("✅ Bridge déconnecté");
        toast.success(
          data.disconnectBridge.message || "Connexion Bridge supprimée"
        );
        refetchBridgeId(); // Rafraîchir les données
      }
    },
    onError: (error) => {
      console.error("❌ Erreur déconnexion Bridge:", error);
      toast.error("Erreur lors de la déconnexion Bridge");
    },
  });

  // Mutation pour créer une session de connexion Bridge
  const [createConnectSessionMutation] = useMutation(
    CREATE_BRIDGE_CONNECT_SESSION,
    {
      errorPolicy: "all",
      onError: (error) => {
        console.error("❌ Erreur création session Bridge:", error);
        toast.error("Erreur lors de la création de la session de connexion");
      },
    }
  );

  // Mutation pour synchroniser les transactions Bridge
  const [syncTransactionsMutation] = useMutation(SYNC_BRIDGE_TRANSACTIONS, {
    errorPolicy: "all",
    onCompleted: (data) => {
      if (data.syncBridgeTransactions.success) {
        console.log(
          "✅ Transactions synchronisées:",
          data.syncBridgeTransactions.stats
        );
        toast.success(
          data.syncBridgeTransactions.message ||
            "Transactions synchronisées avec succès"
        );
        refetchTransactions(); // Rafraîchir les transactions
      }
    },
    onError: (error) => {
      console.error("❌ Erreur synchronisation transactions:", error);
      toast.error("Erreur lors de la synchronisation des transactions");
    },
  });

  // Mutation pour synchroniser les comptes bancaires
  const [syncAccountsMutation] = useMutation(SYNC_BRIDGE_ACCOUNTS, {
    onCompleted: (data) => {
      if (data.syncBridgeAccounts.success) {
        console.log(
          "✅ Comptes synchronisés:",
          data.syncBridgeAccounts.accounts.length
        );
        toast.success(
          data.syncBridgeAccounts.message || "Comptes synchronisés avec succès"
        );
        refetchAccounts(); // Rafraîchir les comptes
      }
    },
    onError: (error) => {
      console.error("❌ Erreur synchronisation comptes:", error);
      toast.error("Erreur lors de la synchronisation des comptes");
    },
  });

  // Query pour récupérer les transactions récentes
  const {
    data: transactionsData,
    loading: loadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useQuery(GET_RECENT_TRANSACTIONS, {
    variables: {
      workspaceId,
      limit: 1000, // Pas de limite pour voir toutes les transactions
    },
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    skip: !workspaceId || !bridgeData?.getBridgeUserId?.bridgeUserId, // Skip si pas de workspace ou pas connecté à Bridge
  });

  // Query pour récupérer les statistiques des transactions
  const {
    data: statsData,
    loading: loadingStats,
    error: statsError,
    refetch: refetchStats,
  } = useQuery(GET_TRANSACTION_STATS, {
    variables: {
      workspaceId,
    },
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    skip: !workspaceId || !bridgeData?.getBridgeUserId?.bridgeUserId, // Skip si pas de workspace ou pas connecté à Bridge
  });

  // Query pour récupérer les comptes bancaires
  const {
    data: accountsData,
    loading: accountsLoading,
    error: accountsError,
    refetch: refetchAccounts,
  } = useQuery(GET_BRIDGE_ACCOUNTS, {
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    skip: !bridgeData?.getBridgeUserId?.bridgeUserId, // Skip si pas connecté à Bridge
  });

  /**
   * Crée ou récupère un utilisateur Bridge
   * @returns {Promise<string|null>} - Bridge User ID ou null en cas d'erreur
   */
  const createBridgeUser = async () => {
    try {
      setIsConnecting(true);
      console.log("🌉 Création/récupération utilisateur Bridge...");

      const result = await createBridgeUserMutation();

      if (result.data?.createBridgeUser?.success) {
        const bridgeUserId = result.data.createBridgeUser.bridgeUserId;
        await refetchBridgeId(); // Rafraîchir les données
        return bridgeUserId;
      }

      return null;
    } catch (error) {
      console.error("❌ Erreur lors de la création Bridge:", error);
      toast.error("Erreur lors de la connexion à Bridge");
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Déconnecte l'utilisateur de Bridge
   * @returns {Promise<boolean>} - Succès de la déconnexion
   */
  const disconnectBridge = async () => {
    try {
      setIsDisconnecting(true);
      console.log("🔌 Déconnexion Bridge...");

      const result = await disconnectBridgeMutation();

      if (result.data?.disconnectBridge?.success) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("❌ Erreur lors de la déconnexion Bridge:", error);
      toast.error("Erreur lors de la déconnexion Bridge");
      return false;
    } finally {
      setIsDisconnecting(false);
    }
  };

  /**
   * Crée une session de connexion Bridge et redirige vers l'interface Bridge
   * @param {Object} options - Options de la session
   * @param {Function} onSuccess - Callback de succès
   * @param {Function} onError - Callback d'erreur
   */
  const initializeBridgeConnection = async (
    options = {},
    onSuccess,
    onError
  ) => {
    try {
      console.log("🔗 Création session de connexion Bridge...");

      // Créer la session de connexion
      const result = await createConnectSessionMutation({
        variables: {
          input: {
            redirectUrl:
              options.redirectUrl ||
              `${window.location.origin}/dashboard?bridge_success=true`,
            context: options.context || "connect_bank_account",
            capabilities: options.capabilities || ["aggregation"],
            types_de_comptes: options.types_de_comptes || ["paiement"],
          },
        },
      });

      if (result.data?.createBridgeConnectSession?.success) {
        const { redirectUrl, sessionId } =
          result.data.createBridgeConnectSession;

        console.log("✅ Session Bridge créée, redirection vers:", redirectUrl);
        toast.success("Redirection vers Bridge pour la connexion bancaire...");

        // Rediriger vers l'interface Bridge
        window.location.href = redirectUrl;

        // Appeler le callback de succès
        if (onSuccess) {
          onSuccess({
            type: "bridge_session_created",
            redirectUrl: redirectUrl,
            sessionId: sessionId,
            message: "Session de connexion créée avec succès",
          });
        }
      } else {
        throw new Error("Impossible de créer la session de connexion");
      }
    } catch (error) {
      console.error("❌ Erreur création session Bridge:", error);
      toast.error("Erreur lors de la création de la session de connexion");
      if (onError) onError(error);
    }
  };

  /**
   * Synchronise les transactions Bridge avec la base de données locale
   * @returns {Promise<Object|null>} - Résultat de la synchronisation ou null en cas d'erreur
   */
  const syncBridgeTransactions = async () => {
    try {
      setIsSyncing(true);
      console.log("🔄 Synchronisation des transactions Bridge...");

      const result = await syncTransactionsMutation();

      if (result.data?.syncBridgeTransactions?.success) {
        const stats = result.data.syncBridgeTransactions.stats;
        await refetchStats(); // Rafraîchir les statistiques
        return stats;
      }

      return null;
    } catch (error) {
      console.error("❌ Erreur lors de la synchronisation:", error);
      toast.error("Erreur lors de la synchronisation des transactions");
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    // Données Bridge
    bridgeUserId: bridgeData?.getBridgeUserId?.bridgeUserId || null,
    isConnected: !!bridgeData?.getBridgeUserId?.bridgeUserId,

    // Données Transactions
    transactions: transactionsData?.getRecentTransactions?.transactions || [],
    transactionStats: statsData?.getTransactionStats?.stats || null,

    // Données Comptes bancaires
    accounts: accountsData?.getBridgeAccounts?.accounts || [],
    accountsMessage: accountsData?.getBridgeAccounts?.message || null,

    // États de chargement
    loading: loadingBridgeId,
    loadingTransactions,
    loadingStats,
    loadingAccounts: accountsLoading,
    isConnecting,
    isDisconnecting,
    isSyncing,
    isSyncingAccounts,

    // Erreurs
    error: bridgeError,
    transactionsError,
    statsError,
    accountsError,

    // Actions Bridge
    createBridgeUser,
    disconnectBridge,
    initializeBridgeConnection,
    refetchBridgeId,

    // Actions Transactions
    syncBridgeTransactions,
    refetchTransactions,
    refetchStats,

    // Actions Comptes
    syncBridgeAccounts: async () => {
      setIsSyncingAccounts(true);
      try {
        await syncAccountsMutation();
      } finally {
        setIsSyncingAccounts(false);
      }
    },
    refetchAccounts,
  };
};