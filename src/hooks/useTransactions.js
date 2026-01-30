import { useMutation } from "@apollo/client";
import {
  CREATE_TRANSACTION,
  UPDATE_TRANSACTION,
  DELETE_TRANSACTION,
} from "../graphql/mutations/banking";
import { GET_TRANSACTIONS } from "../graphql/queries/banking";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

/**
 * Hook pour créer une transaction manuelle
 */
export const useCreateTransaction = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [createTransactionMutation, { loading }] = useMutation(
    CREATE_TRANSACTION,
    {
      refetchQueries: [
        {
          query: GET_TRANSACTIONS,
          variables: { workspaceId, limit: 5000 },
        },
      ],
      awaitRefetchQueries: true,
    }
  );

  const createTransaction = async (input) => {
    try {
      const result = await createTransactionMutation({
        variables: { input },
      });

      if (result.data?.createTransaction) {
        toast.success("Transaction créée avec succès");
        return { success: true, transaction: result.data.createTransaction };
      } else {
        throw new Error("Erreur lors de la création de la transaction");
      }
    } catch (error) {
      let errorMessage = "Erreur lors de la création de la transaction";
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error.networkError) {
        errorMessage = "Erreur de connexion au serveur";
      }

      toast.error(errorMessage);
      return { success: false, error };
    }
  };

  return {
    createTransaction,
    loading,
  };
};

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
          variables: { workspaceId, limit: 5000 },
        },
      ],
      awaitRefetchQueries: true,
    }
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
        error.message || "Erreur lors de la modification de la transaction"
      );
      return { success: false, error };
    }
  };

  return {
    updateTransaction,
    loading,
  };
};

/**
 * Hook pour supprimer une transaction manuelle
 */
export const useDeleteTransaction = () => {
  const { workspaceId } = useRequiredWorkspace();

  const [deleteTransactionMutation, { loading }] = useMutation(
    DELETE_TRANSACTION,
    {
      refetchQueries: [
        {
          query: GET_TRANSACTIONS,
          variables: { workspaceId, limit: 5000 },
        },
      ],
      awaitRefetchQueries: true,
    }
  );

  const deleteTransaction = async (id) => {
    try {
      const result = await deleteTransactionMutation({
        variables: { id },
      });

      if (result.data?.deleteTransaction) {
        toast.success("Transaction supprimée avec succès");
        return { success: true };
      } else {
        throw new Error("Erreur lors de la suppression de la transaction");
      }
    } catch (error) {
      console.error("❌ [DELETE TRANSACTION] Erreur:", error);
      toast.error(
        error.message || "Erreur lors de la suppression de la transaction"
      );
      return { success: false, error };
    }
  };

  return {
    deleteTransaction,
    loading,
  };
};
