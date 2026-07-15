import { useQuery, useMutation } from "@apollo/client";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { GET_PURCHASE_INVOICE_RECONCILIATION_SUGGESTIONS } from "@/src/graphql/queries/purchaseInvoiceReconciliation";
import { RECONCILE_PURCHASE_INVOICE } from "@/src/graphql/mutations/purchaseInvoices";

/**
 * Suggestions de rapprochement facture d'achat ↔ transaction (débit).
 * Miroir de useReconciliationSuggestions (factures client), polling 60s.
 */
export const usePurchaseInvoiceReconciliationSuggestions = () => {
  const { workspaceId, loading: workspaceLoading } = useRequiredWorkspace();

  const { data, loading, error, refetch } = useQuery(
    GET_PURCHASE_INVOICE_RECONCILIATION_SUGGESTIONS,
    {
      variables: { workspaceId },
      skip: !workspaceId || workspaceLoading,
      pollInterval: 60000,
      errorPolicy: "all",
    },
  );

  const result = data?.purchaseInvoiceReconciliationSuggestions;

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
 * Lier une transaction à une facture d'achat depuis le toast.
 * Backend : reconcilePurchaseInvoice copie aussi le justificatif de la facture
 * sur la transaction (receiptFiles). Signature (transactionId, invoiceId) pour
 * rester alignée avec linkTransaction (flux facture client).
 */
export const useLinkPurchaseInvoiceToTransaction = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [reconcileMutation, { loading }] = useMutation(
    RECONCILE_PURCHASE_INVOICE,
    {
      refetchQueries: [
        {
          query: GET_PURCHASE_INVOICE_RECONCILIATION_SUGGESTIONS,
          variables: { workspaceId },
        },
      ],
      awaitRefetchQueries: true,
      onError: (error) => {
        toast.error(error.message || "Erreur lors du rapprochement");
      },
    },
  );

  const linkTransaction = async (transactionId, purchaseInvoiceId) => {
    try {
      const result = await reconcileMutation({
        variables: {
          purchaseInvoiceId,
          transactionIds: [transactionId],
        },
      });
      const ok = !!result.data?.reconcilePurchaseInvoice;
      if (ok) toast.success("Rapprochement effectué avec succès");
      return { success: ok, data: result.data?.reconcilePurchaseInvoice };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return { linkTransaction, loading };
};

/**
 * Hook combiné pour le toast de rapprochement facture d'achat.
 */
export const usePurchaseInvoiceReconciliation = () => {
  const {
    suggestions,
    unmatchedCount,
    pendingInvoicesCount,
    loading,
    error,
    refetch,
  } = usePurchaseInvoiceReconciliationSuggestions();

  const { linkTransaction, loading: linkLoading } =
    useLinkPurchaseInvoiceToTransaction();

  return {
    suggestions,
    unmatchedCount,
    pendingInvoicesCount,
    loading,
    error,
    refetch,
    linkTransaction,
    isLinking: linkLoading,
  };
};
