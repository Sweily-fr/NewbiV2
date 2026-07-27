import { useMutation } from "@apollo/client";
import { UPDATE_TRANSACTION } from "../graphql/mutations/banking";
import { toast } from "@/src/components/ui/sonner";

/**
 * Hook pour mettre à jour une transaction
 */
export const useUpdateTransaction = () => {
  const [updateTransactionMutation, { loading }] = useMutation(
    UPDATE_TRANSACTION,
    {
      // Noms d'opérations en string : Apollo refetch les queries actives avec
      // leurs variables courantes (liste paginée et historique complet).
      refetchQueries: ["GetTransactions", "GetTransactionsPage"],
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
