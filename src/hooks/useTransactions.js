import { useMutation } from "@apollo/client";
import { UPDATE_TRANSACTION } from "../graphql/mutations/banking";
import { GET_TRANSACTIONS } from "../graphql/queries/banking";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

// Limite raisonnable pour le refetch après mutation (pas besoin de tout recharger)
// Doit correspondre à la variable limit utilisée dans useDashboardData (limit: 0 = pas de limite)
const REFETCH_LIMIT = 0;

/**
 * Hook pour mettre à jour une transaction
 */
export const useUpdateTransaction = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [updateTransactionMutation, { loading }] = useMutation(
    UPDATE_TRANSACTION,
    {
      refetchQueries: [
        {
          query: GET_TRANSACTIONS,
          variables: { workspaceId, limit: REFETCH_LIMIT },
        },
      ],
    },
  );

  const updateTransaction = async (id, input) => {
    try {
      const result = await updateTransactionMutation({
        variables: { id, input },
      });

      if (result.data?.updateTransaction) {
        toast.success("Transaction modifiée avec succès");
        return { success: true, transaction: result.data.updateTransaction };
      } else {
        throw new Error("Erreur lors de la modification de la transaction");
      }
    } catch (error) {
      console.error("❌ [UPDATE TRANSACTION] Erreur:", error);
      toast.error(
        error.message || "Erreur lors de la modification de la transaction",
      );
      return { success: false, error };
    }
  };

  return {
    updateTransaction,
    loading,
  };
};
