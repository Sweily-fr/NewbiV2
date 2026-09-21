import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  MY_ABBY_ACCOUNT,
  TEST_ABBY_CONNECTION,
  CONNECT_ABBY,
  DISCONNECT_ABBY,
  UPDATE_ABBY_AUTO_SYNC,
  UPDATE_ABBY_INCOME_PRODUCT_TYPE,
  SYNC_INVOICE_TO_ABBY,
  SYNC_QUOTE_TO_ABBY,
  SYNC_ALL_TO_ABBY,
  IMPORT_FROM_ABBY,
} from "@/src/graphql/mutations/abby";

/**
 * Hook d'intégration Abby — même contrat que useQonto.
 * La connexion se fait par clé API générée dans Abby → Paramètres →
 * Intégrations → Clés API.
 */
export const useAbby = (organizationId) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    data: abbyData,
    loading: statusLoading,
    refetch: refetchStatus,
  } = useQuery(MY_ABBY_ACCOUNT, {
    skip: !organizationId,
    errorPolicy: "all",
  });

  const [testConnectionMutation] = useMutation(TEST_ABBY_CONNECTION);
  const [connectMutation] = useMutation(CONNECT_ABBY);
  const [disconnectMutation] = useMutation(DISCONNECT_ABBY);
  const [updateAutoSyncMutation] = useMutation(UPDATE_ABBY_AUTO_SYNC);
  const [updateIncomeProductTypeMutation] = useMutation(
    UPDATE_ABBY_INCOME_PRODUCT_TYPE,
  );
  const [syncInvoiceMutation] = useMutation(SYNC_INVOICE_TO_ABBY);
  const [syncQuoteMutation] = useMutation(SYNC_QUOTE_TO_ABBY);
  const [syncAllMutation] = useMutation(SYNC_ALL_TO_ABBY);
  const [importFromAbbyMutation] = useMutation(IMPORT_FROM_ABBY);

  // Exécute une mutation et normalise le résultat { success, message, ... }
  const run = useCallback(
    async (
      mutation,
      variables,
      pick,
      { refetch = false, busy = false } = {},
    ) => {
      if (busy) setIsLoading(true);
      setError(null);
      try {
        const { data } = await mutation(variables ? { variables } : undefined);
        const result = pick(data);
        if (!result?.success) {
          setError(result?.message || "Erreur inconnue");
        } else if (refetch) {
          await refetchStatus();
        }
        return result;
      } catch (err) {
        setError(err.message);
        return { success: false, message: err.message };
      } finally {
        if (busy) setIsLoading(false);
      }
    },
    [refetchStatus],
  );

  // Tester la clé (sans sauvegarder)
  const testConnection = useCallback(
    (apiKey) =>
      run(testConnectionMutation, { apiKey }, (d) => d.testAbbyConnection, {
        busy: true,
      }),
    [run, testConnectionMutation],
  );

  // Connecter Abby
  const connect = useCallback(
    (apiKey) =>
      run(connectMutation, { apiKey }, (d) => d.connectAbby, {
        refetch: true,
        busy: true,
      }),
    [run, connectMutation],
  );

  // Déconnecter Abby
  const disconnect = useCallback(
    () =>
      run(disconnectMutation, null, (d) => d.disconnectAbby, {
        refetch: true,
        busy: true,
      }),
    [run, disconnectMutation],
  );

  // Préférences auto-sync
  const updateAutoSync = useCallback(
    (autoSync) =>
      run(updateAutoSyncMutation, { autoSync }, (d) => d.updateAbbyAutoSync, {
        refetch: true,
      }),
    [run, updateAutoSyncMutation],
  );

  // Type de produit Abby des recettes
  const updateIncomeProductType = useCallback(
    (productType) =>
      run(
        updateIncomeProductTypeMutation,
        { productType: Number(productType) },
        (d) => d.updateAbbyIncomeProductType,
        { refetch: true },
      ),
    [run, updateIncomeProductTypeMutation],
  );

  const syncInvoice = useCallback(
    (invoiceId) =>
      run(syncInvoiceMutation, { invoiceId }, (d) => d.syncInvoiceToAbby),
    [run, syncInvoiceMutation],
  );

  const syncQuote = useCallback(
    (quoteId) => run(syncQuoteMutation, { quoteId }, (d) => d.syncQuoteToAbby),
    [run, syncQuoteMutation],
  );

  const syncAll = useCallback(
    () =>
      run(syncAllMutation, null, (d) => d.syncAllToAbby, {
        refetch: true,
        busy: true,
      }),
    [run, syncAllMutation],
  );

  // Import Abby → Newbi
  const importFromAbby = useCallback(
    () =>
      run(importFromAbbyMutation, null, (d) => d.importFromAbby, {
        refetch: true,
        busy: true,
      }),
    [run, importFromAbbyMutation],
  );

  const account = abbyData?.myAbbyAccount;
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
    updateIncomeProductType,
    syncInvoice,
    syncQuote,
    syncAll,
    importFromAbby,
    refetchStatus,

    // Utilitaires
    clearError: () => setError(null),
  };
};
