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
} from "@/src/graphql/queries/reconciliation";
import { GET_INVOICES } from "@/src/graphql/invoiceQueries";

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
      fetchPolicy: "cache-and-network",
      skip: !workspaceId || workspaceLoading, // Ne pas exécuter tant que le workspace n'est pas disponible
      pollInterval: 30000, // Rafraîchir toutes les 30 secondes
      errorPolicy: "all", // Ne pas lancer d'erreur, retourner les données partielles
    }
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
      fetchPolicy: "cache-and-network",
    }
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
    refetchQueries: [GET_RECONCILIATION_SUGGESTIONS, GET_INVOICES],
    onCompleted: (data) => {
      if (data.linkTransactionToInvoice.success) {
        toast.success("Rapprochement effectué avec succès");
      } else {
        toast.error(
          data.linkTransactionToInvoice.message ||
            "Erreur lors du rapprochement"
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
      refetchQueries: [GET_RECONCILIATION_SUGGESTIONS, GET_INVOICES],
      onCompleted: (data) => {
        if (data.unlinkTransactionFromInvoice.success) {
          toast.success("Déliaison effectuée avec succès");
        } else {
          toast.error(
            data.unlinkTransactionFromInvoice.message ||
              "Erreur lors de la déliaison"
          );
        }
      },
      onError: (error) => {
        toast.error(error.message || "Erreur lors de la déliaison");
      },
    }
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
  const { workspaceId } = useRequiredWorkspace();
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
          error
        );
        return { transactions: [], invoiceAmount: 0 };
      }
    },
    [client]
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
