import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  MY_QONTO_ACCOUNT,
  QONTO_SANDBOX_AVAILABLE,
  TEST_QONTO_CONNECTION,
  CONNECT_QONTO,
  DISCONNECT_QONTO,
  UPDATE_QONTO_AUTO_SYNC,
  UPDATE_QONTO_BANK_ACCOUNT,
  REFRESH_QONTO_BANK_ACCOUNTS,
  SYNC_INVOICE_TO_QONTO,
  SYNC_PURCHASE_INVOICE_TO_QONTO,
  SYNC_EXPENSE_TO_QONTO,
  SYNC_ALL_TO_QONTO,
  IMPORT_FROM_QONTO,
} from "@/src/graphql/mutations/qonto";

/**
 * Hook d'intégration Qonto — même contrat que usePennylane.
 * La connexion se fait par identifiant (slug de l'organisation) + clé secrète
 * générés dans Qonto → Intégrations et partenariats → Clé API.
 */
export const useQonto = (organizationId) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    data: qontoData,
    loading: statusLoading,
    refetch: refetchStatus,
  } = useQuery(MY_QONTO_ACCOUNT, {
    skip: !organizationId,
    errorPolicy: "all",
  });

  const { data: sandboxData } = useQuery(QONTO_SANDBOX_AVAILABLE, {
    skip: !organizationId,
    errorPolicy: "all",
  });

  const [testConnectionMutation] = useMutation(TEST_QONTO_CONNECTION);
  const [connectMutation] = useMutation(CONNECT_QONTO);
  const [disconnectMutation] = useMutation(DISCONNECT_QONTO);
  const [updateAutoSyncMutation] = useMutation(UPDATE_QONTO_AUTO_SYNC);
  const [updateBankAccountMutation] = useMutation(UPDATE_QONTO_BANK_ACCOUNT);
  const [refreshBankAccountsMutation] = useMutation(
    REFRESH_QONTO_BANK_ACCOUNTS,
  );
  const [syncInvoiceMutation] = useMutation(SYNC_INVOICE_TO_QONTO);
  const [syncPurchaseInvoiceMutation] = useMutation(
    SYNC_PURCHASE_INVOICE_TO_QONTO,
  );
  const [syncExpenseMutation] = useMutation(SYNC_EXPENSE_TO_QONTO);
  const [syncAllMutation] = useMutation(SYNC_ALL_TO_QONTO);
  const [importFromQontoMutation] = useMutation(IMPORT_FROM_QONTO);

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

  // Tester les identifiants (sans sauvegarder)
  const testConnection = useCallback(
    (login, secretKey, { environment } = {}) =>
      run(
        testConnectionMutation,
        { login, secretKey, environment },
        (d) => d.testQontoConnection,
        { busy: true },
      ),
    [run, testConnectionMutation],
  );

  // Connecter Qonto
  const connect = useCallback(
    (login, secretKey, { environment, bankAccountId } = {}) =>
      run(
        connectMutation,
        { login, secretKey, environment, bankAccountId },
        (d) => d.connectQonto,
        { refetch: true, busy: true },
      ),
    [run, connectMutation],
  );

  // Déconnecter Qonto
  const disconnect = useCallback(
    () =>
      run(disconnectMutation, null, (d) => d.disconnectQonto, {
        refetch: true,
        busy: true,
      }),
    [run, disconnectMutation],
  );

  // Préférences auto-sync
  const updateAutoSync = useCallback(
    (autoSync) =>
      run(updateAutoSyncMutation, { autoSync }, (d) => d.updateQontoAutoSync, {
        refetch: true,
      }),
    [run, updateAutoSyncMutation],
  );

  // Compte bancaire (IBAN) utilisé sur les factures
  const updateBankAccount = useCallback(
    (bankAccountId) =>
      run(
        updateBankAccountMutation,
        { bankAccountId },
        (d) => d.updateQontoBankAccount,
        { refetch: true },
      ),
    [run, updateBankAccountMutation],
  );

  // Rafraîchir les comptes bancaires depuis Qonto
  const refreshBankAccounts = useCallback(
    () =>
      run(
        refreshBankAccountsMutation,
        null,
        (d) => d.refreshQontoBankAccounts,
        { refetch: true },
      ),
    [run, refreshBankAccountsMutation],
  );

  const syncInvoice = useCallback(
    (invoiceId) =>
      run(syncInvoiceMutation, { invoiceId }, (d) => d.syncInvoiceToQonto),
    [run, syncInvoiceMutation],
  );

  const syncPurchaseInvoice = useCallback(
    (purchaseInvoiceId) =>
      run(
        syncPurchaseInvoiceMutation,
        { purchaseInvoiceId },
        (d) => d.syncPurchaseInvoiceToQonto,
      ),
    [run, syncPurchaseInvoiceMutation],
  );

  const syncExpense = useCallback(
    (expenseId) =>
      run(syncExpenseMutation, { expenseId }, (d) => d.syncExpenseToQonto),
    [run, syncExpenseMutation],
  );

  const syncAll = useCallback(
    () =>
      run(syncAllMutation, null, (d) => d.syncAllToQonto, {
        refetch: true,
        busy: true,
      }),
    [run, syncAllMutation],
  );

  // Import Qonto → Newbi
  const importFromQonto = useCallback(
    () =>
      run(importFromQontoMutation, null, (d) => d.importFromQonto, {
        refetch: true,
        busy: true,
      }),
    [run, importFromQontoMutation],
  );

  const account = qontoData?.myQontoAccount;
  const sandboxAvailable = !!sandboxData?.qontoSandboxAvailable;
  const isConnected = !!account?.isConnected;
  const syncStatus = account?.syncStatus || "IDLE";
  const lastSyncAt = account?.lastSyncAt;
  const selectedBankAccount =
    account?.bankAccounts?.find(
      (b) => b.qontoId === account?.selectedBankAccountId,
    ) || null;

  return {
    // États
    isConnected,
    syncStatus,
    lastSyncAt,
    isLoading: isLoading || statusLoading,
    error,

    // Données du compte
    account,
    selectedBankAccount,
    sandboxAvailable,

    // Actions
    testConnection,
    connect,
    disconnect,
    updateAutoSync,
    updateBankAccount,
    refreshBankAccounts,
    syncInvoice,
    syncPurchaseInvoice,
    syncExpense,
    syncAll,
    importFromQonto,
    refetchStatus,

    // Utilitaires
    clearError: () => setError(null),
  };
};
