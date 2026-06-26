import { useQuery, useMutation, useApolloClient } from "@apollo/client";
import { useCallback } from "react";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import {
  GET_RECONCILIATION_SUGGESTIONS,
  GET_TRANSACTIONS_FOR_INVOICE,
  LINK_TRANSACTION_TO_INVOICE,
  UNLINK_TRANSACTION_FROM_INVOICE,
  IGNORE_TRANSACTION,
  GET_TRANSACTIONS_FOR_IMPORTED_INVOICE,
  LINK_TRANSACTION_TO_IMPORTED_INVOICE,
  UNLINK_TRANSACTION_FROM_IMPORTED_INVOICE,
} from "@/src/graphql/queries/reconciliation";
import { GET_INVOICES } from "@/src/graphql/invoiceQueries";
import { reproposeReconciliation } from "@/src/lib/reconciliationIgnored";

/**
 * Hook pour récupérer les suggestions de rapprochement
 * Remplace useReconciliation.fetchSuggestions (REST)
 */
export const useReconciliationSuggestions = () => {
  const { workspaceId, loading: workspaceLoading } = useRequiredWorkspace();

  const { data, loading, error, refetch } = useQuery(
    GET_RECONCILIATION_SUGGESTIONS,
    {
      variables: { workspaceId },
      skip: !workspaceId || workspaceLoading,
      pollInterval: 60000, // Rafraîchir toutes les 60 secondes (au lieu de 30)
      errorPolicy: "all",
    },
  );

  const result = data?.reconciliationSuggestions;

  return {
    suggestions: result?.suggestions || [],
    unmatchedCount: result?.unmatchedCount || 0,
    pendingInvoicesCount: result?.pendingInvoicesCount || 0,
    loading: loading || workspaceLoading,
    error,
    refetch,
  };
};

/**
 * Hook pour récupérer les transactions pour une facture spécifique
 * Remplace useReconciliation.fetchTransactionsForInvoice (REST)
 */
export const useTransactionsForInvoice = (invoiceId) => {
  const { data, loading, error, refetch } = useQuery(
    GET_TRANSACTIONS_FOR_INVOICE,
    {
      variables: { invoiceId },
      skip: !invoiceId,
    },
  );

  const result = data?.transactionsForInvoice;

  return {
    transactions: result?.transactions || [],
    invoiceAmount: result?.invoiceAmount || 0,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook pour lier une transaction à une facture
 * Remplace useReconciliation.linkTransaction (REST)
 */
export const useLinkTransactionToInvoice = () => {
  const [linkMutation, { loading }] = useMutation(LINK_TRANSACTION_TO_INVOICE, {
    // La mutation renvoie le Transaction complet (linkedInvoice + reconciliationStatus) :
    // Apollo normalise l'entité par id → l'icône "facture liée" de la page Transaction
    // se met à jour sans refetch. On ne refetch que les agrégats non normalisables :
    // GET_RECONCILIATION_SUGGESTIONS (compteur serveur) et GET_INVOICES (statut facture,
    // type ReconciliationInvoice ≠ Invoice donc pas de normalisation auto).
    refetchQueries: [GET_RECONCILIATION_SUGGESTIONS, GET_INVOICES],
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      if (data.linkTransactionToInvoice.success) {
        toast.success("Rapprochement effectué avec succès");
      } else {
        toast.error(
          data.linkTransactionToInvoice.message ||
            "Erreur lors du rapprochement",
        );
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors du rapprochement");
    },
  });

  const linkTransaction = async (transactionId, invoiceId) => {
    try {
      const result = await linkMutation({
        variables: {
          input: { transactionId, invoiceId },
        },
      });
      return {
        success: result.data?.linkTransactionToInvoice?.success || false,
        data: result.data?.linkTransactionToInvoice,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return { linkTransaction, loading };
};

/**
 * Hook pour délier une transaction d'une facture
 * Remplace useReconciliation.unlinkTransaction (REST)
 */
export const useUnlinkTransactionFromInvoice = () => {
  const [unlinkMutation, { loading }] = useMutation(
    UNLINK_TRANSACTION_FROM_INVOICE,
    {
      // Idem au link : la mutation renvoie le Transaction complet (linkedInvoice null,
      // statut unmatched) → normalisation Apollo, l'icône disparaît sans refetch liste.
      refetchQueries: [GET_RECONCILIATION_SUGGESTIONS, GET_INVOICES],
      awaitRefetchQueries: true,
      onCompleted: (data) => {
        if (data.unlinkTransactionFromInvoice.success) {
          toast.success("Déliaison effectuée avec succès");
          // La transaction redevient "à rapprocher" : on la retire de la liste
          // des suggestions ignorées (où le rattachement l'avait placée) pour
          // que le toast la repropose, sans la rattacher.
          reproposeReconciliation(
            data.unlinkTransactionFromInvoice.transaction?.id,
          );
        } else {
          toast.error(
            data.unlinkTransactionFromInvoice.message ||
              "Erreur lors de la déliaison",
          );
        }
      },
      onError: (error) => {
        toast.error(error.message || "Erreur lors de la déliaison");
      },
    },
  );

  const unlinkTransaction = async (transactionId, invoiceId) => {
    try {
      const result = await unlinkMutation({
        variables: {
          input: { transactionId, invoiceId },
        },
      });
      return {
        success: result.data?.unlinkTransactionFromInvoice?.success || false,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return { unlinkTransaction, loading };
};

/**
 * Hook pour ignorer une transaction
 */
export const useIgnoreTransaction = () => {
  const [ignoreMutation, { loading }] = useMutation(IGNORE_TRANSACTION, {
    refetchQueries: [GET_RECONCILIATION_SUGGESTIONS],
    onCompleted: (data) => {
      if (data.ignoreTransaction.success) {
        toast.success("Transaction ignorée");
      } else {
        toast.error(data.ignoreTransaction.message || "Erreur");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erreur");
    },
  });

  const ignoreTransaction = async (transactionId) => {
    try {
      const result = await ignoreMutation({
        variables: {
          input: { transactionId },
        },
      });
      return {
        success: result.data?.ignoreTransaction?.success || false,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return { ignoreTransaction, loading };
};

/**
 * Hook combiné pour toutes les opérations de rapprochement
 * Remplace useReconciliation (REST)
 */
export const useReconciliationGraphQL = () => {
  const client = useApolloClient();

  const {
    suggestions,
    unmatchedCount,
    pendingInvoicesCount,
    loading: suggestionsLoading,
    error: suggestionsError,
    refetch: refetchSuggestions,
  } = useReconciliationSuggestions();

  const { linkTransaction, loading: linkLoading } =
    useLinkTransactionToInvoice();
  const { unlinkTransaction, loading: unlinkLoading } =
    useUnlinkTransactionFromInvoice();
  const { ignoreTransaction, loading: ignoreLoading } = useIgnoreTransaction();

  // Fonction pour récupérer les transactions pour une facture spécifique
  // (utilisée par le drawer de facture)
  // OPTIMISÉ: Utiliser useCallback pour éviter les re-renders inutiles
  const fetchTransactionsForInvoice = useCallback(
    async (invoiceId) => {
      try {
        const { data } = await client.query({
          query: GET_TRANSACTIONS_FOR_INVOICE,
          variables: { invoiceId },
          fetchPolicy: "network-only",
        });

        const result = data?.transactionsForInvoice;
        return {
          transactions: result?.transactions || [],
          invoiceAmount: result?.invoiceAmount || 0,
        };
      } catch (error) {
        console.error(
          "[RECONCILIATION] Erreur fetchTransactionsForInvoice:",
          error,
        );
        return { transactions: [], invoiceAmount: 0 };
      }
    },
    [client],
  );

  return {
    // Données
    suggestions,
    unmatchedCount,
    pendingInvoicesCount,

    // États
    loading: suggestionsLoading,
    error: suggestionsError,
    isLinking: linkLoading,
    isUnlinking: unlinkLoading,
    isIgnoring: ignoreLoading,

    // Actions
    refetch: refetchSuggestions,
    linkTransaction,
    unlinkTransaction,
    ignoreTransaction,
    fetchTransactionsForInvoice,
  };
};

/**
 * Hook pour le compteur de suggestions de rapprochement (sidebar badge)
 * Lit le cache Apollo alimenté par le polling du ReconciliationToastProvider.
 * Ne déclenche aucune requête réseau propre.
 */
export const useReconciliationCount = () => {
  const { workspaceId, loading: workspaceLoading } = useRequiredWorkspace();

  const { data } = useQuery(GET_RECONCILIATION_SUGGESTIONS, {
    variables: { workspaceId },
    skip: !workspaceId || workspaceLoading,
    fetchPolicy: "cache-only",
  });

  const suggestions = data?.reconciliationSuggestions?.suggestions || [];
  const highConfidenceCount = suggestions.filter(
    (s) => s.confidence === "high" && s.matchingInvoices?.length > 0,
  ).length;

  return highConfidenceCount;
};

/**
 * Hook léger pour les opérations de rapprochement dans la sidebar
 * N'appelle PAS useReconciliationSuggestions pour éviter les re-renders
 * causés par le pollInterval
 */
export const useReconciliationForSidebar = () => {
  const client = useApolloClient();

  const { linkTransaction, loading: linkLoading } =
    useLinkTransactionToInvoice();
  const { unlinkTransaction, loading: unlinkLoading } =
    useUnlinkTransactionFromInvoice();

  // Fonction pour récupérer les transactions pour une facture spécifique
  // OPTIMISÉ: Utiliser useCallback pour éviter les re-renders inutiles
  const fetchTransactionsForInvoice = useCallback(
    async (invoiceId) => {
      try {
        const { data } = await client.query({
          query: GET_TRANSACTIONS_FOR_INVOICE,
          variables: { invoiceId },
          fetchPolicy: "network-only",
        });

        const result = data?.transactionsForInvoice;
        return {
          transactions: result?.transactions || [],
          invoiceAmount: result?.invoiceAmount || 0,
        };
      } catch (error) {
        console.error(
          "[RECONCILIATION] Erreur fetchTransactionsForInvoice:",
          error,
        );
        return { transactions: [], invoiceAmount: 0 };
      }
    },
    [client],
  );

  return {
    // États
    isLinking: linkLoading,
    isUnlinking: unlinkLoading,

    // Actions
    linkTransaction,
    unlinkTransaction,
    fetchTransactionsForInvoice,
  };
};

/**
 * Hook de rapprochement pour la popup des factures de CA importées.
 * Miroir de useReconciliationForSidebar côté ImportedInvoice (entrée d'argent).
 */
export const useReconciliationForImportedInvoice = () => {
  const client = useApolloClient();

  const [linkMutation, { loading: linkLoading }] = useMutation(
    LINK_TRANSACTION_TO_IMPORTED_INVOICE,
    {
      // Apollo normalise la Transaction renvoyée (id + statut matched). On
      // refetch la liste/stats des factures importées (statut → Encaissée).
      refetchQueries: [
        "GetImportedInvoices",
        "GetImportedInvoiceStats",
        "GetReconciliationSuggestions",
      ],
      awaitRefetchQueries: true,
    },
  );

  const [unlinkMutation, { loading: unlinkLoading }] = useMutation(
    UNLINK_TRANSACTION_FROM_IMPORTED_INVOICE,
    {
      refetchQueries: [
        "GetImportedInvoices",
        "GetImportedInvoiceStats",
        "GetReconciliationSuggestions",
      ],
      awaitRefetchQueries: true,
    },
  );

  const linkTransaction = async (transactionId, importedInvoiceId) => {
    try {
      const result = await linkMutation({
        variables: { input: { transactionId, importedInvoiceId } },
      });
      const payload = result.data?.linkTransactionToImportedInvoice;
      return {
        success: payload?.success || false,
        error: payload?.success ? null : payload?.message,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const unlinkTransaction = async (transactionId, importedInvoiceId) => {
    try {
      const result = await unlinkMutation({
        variables: { input: { transactionId, importedInvoiceId } },
      });
      const payload = result.data?.unlinkTransactionFromImportedInvoice;
      return {
        success: payload?.success || false,
        error: payload?.success ? null : payload?.message,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const fetchTransactionsForImportedInvoice = useCallback(
    async (importedInvoiceId) => {
      try {
        const { data } = await client.query({
          query: GET_TRANSACTIONS_FOR_IMPORTED_INVOICE,
          variables: { importedInvoiceId },
          fetchPolicy: "network-only",
        });

        const result = data?.transactionsForImportedInvoice;
        return {
          transactions: result?.transactions || [],
          invoiceAmount: result?.invoiceAmount || 0,
        };
      } catch (error) {
        console.error(
          "[RECONCILIATION] Erreur fetchTransactionsForImportedInvoice:",
          error,
        );
        return { transactions: [], invoiceAmount: 0 };
      }
    },
    [client],
  );

  return {
    isLinking: linkLoading,
    isUnlinking: unlinkLoading,
    linkTransaction,
    unlinkTransaction,
    fetchTransactionsForImportedInvoice,
  };
};
