import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  MY_PENNYLANE_ACCOUNT,
  TEST_PENNYLANE_CONNECTION,
  CONNECT_PENNYLANE,
  DISCONNECT_PENNYLANE,
  UPDATE_PENNYLANE_AUTO_SYNC,
  SYNC_INVOICE_TO_PENNYLANE,
  SYNC_EXPENSE_TO_PENNYLANE,
  SYNC_ALL_TO_PENNYLANE,
} from "@/src/graphql/mutations/pennylane";

export const usePennylane = (organizationId) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Query pour récupérer le compte Pennylane
  const {
    data: pennylaneData,
    loading: statusLoading,
    refetch: refetchStatus,
  } = useQuery(MY_PENNYLANE_ACCOUNT, {
    skip: !organizationId,
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
  });

  // Mutations
  const [testConnectionMutation] = useMutation(TEST_PENNYLANE_CONNECTION);
  const [connectMutation] = useMutation(CONNECT_PENNYLANE);
  const [disconnectMutation] = useMutation(DISCONNECT_PENNYLANE);
  const [updateAutoSyncMutation] = useMutation(UPDATE_PENNYLANE_AUTO_SYNC);
  const [syncInvoiceMutation] = useMutation(SYNC_INVOICE_TO_PENNYLANE);
  const [syncExpenseMutation] = useMutation(SYNC_EXPENSE_TO_PENNYLANE);
  const [syncAllMutation] = useMutation(SYNC_ALL_TO_PENNYLANE);

  // Tester la connexion (sans sauvegarder)
  const testConnection = useCallback(
    async (apiToken) => {
      setIsLoading(true);
      setError(null);

      try {
        const { data } = await testConnectionMutation({
          variables: { apiToken },
        });

        const result = data.testPennylaneConnection;
        if (!result.success) {
          setError(result.message);
        }
        return result;
      } catch (err) {
        setError(err.message);
        return { success: false, message: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [testConnectionMutation]
  );

  // Connecter Pennylane
  const connect = useCallback(
    async (apiToken, environment) => {
      setIsLoading(true);
      setError(null);

      try {
        const { data } = await connectMutation({
          variables: { apiToken, environment },
        });

        const result = data.connectPennylane;
        if (!result.success) {
          setError(result.message);
        } else {
          await refetchStatus();
        }
        return result;
      } catch (err) {
        setError(err.message);
        return { success: false, message: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [connectMutation, refetchStatus]
  );

  // Déconnecter Pennylane
  const disconnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await disconnectMutation();

      if (!data.disconnectPennylane.success) {
        throw new Error(data.disconnectPennylane.message);
      }

      await refetchStatus();
      return data.disconnectPennylane;
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [disconnectMutation, refetchStatus]);

  // Mettre à jour les préférences auto-sync
  const updateAutoSync = useCallback(
    async (autoSync) => {
      setError(null);

      try {
        const { data } = await updateAutoSyncMutation({
          variables: { autoSync },
        });

        const result = data.updatePennylaneAutoSync;
        if (!result.success) {
          setError(result.message);
        } else {
          await refetchStatus();
        }
        return result;
      } catch (err) {
        setError(err.message);
        return { success: false, message: err.message };
      }
    },
    [updateAutoSyncMutation, refetchStatus]
  );

  // Sync une facture
  const syncInvoice = useCallback(
    async (invoiceId) => {
      setError(null);

      try {
        const { data } = await syncInvoiceMutation({
          variables: { invoiceId },
        });
        return data.syncInvoiceToPennylane;
      } catch (err) {
        setError(err.message);
        return { success: false, message: err.message };
      }
    },
    [syncInvoiceMutation]
  );

  // Sync une dépense
  const syncExpense = useCallback(
    async (expenseId) => {
      setError(null);

      try {
        const { data } = await syncExpenseMutation({
          variables: { expenseId },
        });
        return data.syncExpenseToPennylane;
      } catch (err) {
        setError(err.message);
        return { success: false, message: err.message };
      }
    },
    [syncExpenseMutation]
  );

  // Sync complète
  const syncAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await syncAllMutation();

      const result = data.syncAllToPennylane;
      if (!result.success) {
        setError(result.message);
      } else {
        await refetchStatus();
      }
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [syncAllMutation, refetchStatus]);

  // Calculer l'état
  const account = pennylaneData?.myPennylaneAccount;
  const isConnected = !!account?.isConnected;
  const syncStatus = account?.syncStatus || "IDLE";
  const lastSyncAt = account?.lastSyncAt;

  return {
    // États
    isConnected,
    syncStatus,
    lastSyncAt,
    isLoading: isLoading || statusLoading,
    error,

    // Données du compte
    account,

    // Actions
    testConnection,
    connect,
    disconnect,
    updateAutoSync,
    syncInvoice,
    syncExpense,
    syncAll,
    refetchStatus,

    // Utilitaires
    clearError: () => setError(null),
  };
};
