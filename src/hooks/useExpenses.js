import { useQuery, useMutation } from "@apollo/client";
import { GET_EXPENSES, GET_EXPENSE_STATS } from "../graphql/queries/expense";
import {
  CREATE_EXPENSE,
  UPDATE_EXPENSE,
  DELETE_EXPENSE,
  DELETE_MULTIPLE_EXPENSES,
} from "../graphql/mutations/expense";
import { toast } from "@/src/components/ui/sonner";

/**
 * Hook pour récupérer les dépenses avec filtres et pagination
 */
export const useExpenses = (filters = {}) => {
  const { data, loading, error, refetch } = useQuery(GET_EXPENSES, {
    variables: {
      page: 1,
      limit: 20,
      ...filters,
    },
    fetchPolicy: "cache-and-network",
  });

  return {
    expenses: data?.expenses?.expenses || [],
    totalCount: data?.expenses?.totalCount || 0,
    hasNextPage: data?.expenses?.hasNextPage || false,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook pour récupérer les statistiques des dépenses
 */
export const useExpenseStats = (dateRange = {}) => {
  const { data, loading, error } = useQuery(GET_EXPENSE_STATS, {
    variables: dateRange,
    fetchPolicy: "cache-and-network",
  });

  return {
    stats: data?.expenseStats,
    loading,
    error,
  };
};

/**
 * Hook pour supprimer une dépense
 */
export const useDeleteExpense = () => {
  const [deleteExpenseMutation, { loading }] = useMutation(DELETE_EXPENSE, {
    refetchQueries: [
      {
        query: GET_EXPENSES,
        variables: {
          status: "PAID",
          page: 1,
          limit: 100, // Correspondre à la limite utilisée dans le tableau
        },
      },
    ],
    awaitRefetchQueries: true,
  });

  const deleteExpense = async (id) => {
    try {
      const result = await deleteExpenseMutation({
        variables: { id },
      });

      if (result.data?.deleteExpense?.success) {
        toast.success(
          result.data.deleteExpense.message || "Dépense supprimée avec succès"
        );
        return { success: true };
      } else {
        throw new Error(
          result.data?.deleteExpense?.message || "Erreur lors de la suppression"
        );
      }
    } catch (error) {
      console.error("Erreur suppression dépense:", error);
      toast.error(
        error.message || "Erreur lors de la suppression de la dépense"
      );
      return { success: false, error };
    }
  };

  return {
    deleteExpense,
    loading,
  };
};

/**
 * Hook pour créer une dépense
 */
export const useCreateExpense = () => {
  const [createExpenseMutation, { loading }] = useMutation(CREATE_EXPENSE, {
    refetchQueries: [
      {
        query: GET_EXPENSES,
        variables: {
          status: "PAID",
          page: 1,
          limit: 1000,
        },
      },
    ],
    awaitRefetchQueries: true,
  });

  const createExpense = async (input) => {
    try {
      const result = await createExpenseMutation({
        variables: { input },
      });

      if (result.data?.createExpense) {
        toast.success("Dépense créée avec succès");
        return { success: true, expense: result.data.createExpense };
      } else {
        throw new Error("Erreur lors de la création de la dépense");
      }
    } catch (error) {
      console.error("Erreur création dépense:", error);
      console.error("Détails de l'erreur:", error.graphQLErrors);
      console.error("Erreur réseau:", error.networkError);

      // Extraire le message d'erreur le plus pertinent
      let errorMessage = "Erreur lors de la création de la dépense";
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
    createExpense,
    loading,
  };
};

/**
 * Hook pour supprimer plusieurs dépenses
 */
export const useDeleteMultipleExpenses = () => {
  const [deleteMultipleExpensesMutation, { loading }] = useMutation(
    DELETE_MULTIPLE_EXPENSES,
    {
      // Utiliser refetchQueries sans variables spécifiques pour rafraîchir toutes les requêtes GET_EXPENSES
      refetchQueries: [GET_EXPENSES],
      awaitRefetchQueries: true,
    }
  );

  const deleteMultipleExpenses = async (ids) => {
    try {
      const result = await deleteMultipleExpensesMutation({
        variables: { ids },
      });

      const response = result.data?.deleteMultipleExpenses;
      if (response) {
        const { success, deletedCount, failedCount, message, errors } =
          response;

        if (success) {
          toast.success(
            message || `${deletedCount} dépense(s) supprimée(s) avec succès`
          );
        } else {
          // Afficher un message d'avertissement si certaines suppressions ont échoué
          if (deletedCount > 0 && failedCount > 0) {
            toast.warning(
              `${deletedCount} dépense(s) supprimée(s), ${failedCount} échec(s)`
            );
          } else if (failedCount > 0) {
            toast.error(`Aucune dépense supprimée. ${failedCount} échec(s)`);
          }
        }

        return {
          success,
          deletedCount,
          failedCount,
          errors: errors || [],
        };
      } else {
        throw new Error("Réponse invalide du serveur");
      }
    } catch (error) {
      console.error("Erreur suppression multiple dépenses:", error);
      toast.error(
        error.message || "Erreur lors de la suppression des dépenses"
      );
      return { success: false, error };
    }
  };

  return {
    deleteMultipleExpenses,
    loading,
  };
};

/**
 * Hook pour mettre à jour une dépense
 */
export const useUpdateExpense = () => {
  const [updateExpenseMutation, { loading }] = useMutation(UPDATE_EXPENSE, {
    refetchQueries: [
      {
        query: GET_EXPENSES,
        variables: {
          status: "PAID",
          page: 1,
          limit: 100,
        },
      },
    ],
    awaitRefetchQueries: true,
  });

  const updateExpense = async (id, input) => {
    try {
      console.log("🔄 Tentative de modification dépense:", { id, input });
      
      const result = await updateExpenseMutation({
        variables: { id, input },
      });

      console.log("📊 Résultat mutation updateExpense:", result);

      if (result.data?.updateExpense) {
        toast.success("Dépense modifiée avec succès");
        return { success: true, expense: result.data.updateExpense };
      } else {
        console.error("❌ Pas de données dans result.data.updateExpense:", result.data);
        throw new Error("Erreur lors de la modification");
      }
    } catch (error) {
      console.error("Erreur modification dépense:", error);
      console.error("Détails de l'erreur:", error.graphQLErrors);
      console.error("Erreur réseau:", error.networkError);
      toast.error(
        error.message || "Erreur lors de la modification de la dépense"
      );
      return { success: false, error };
    }
  };

  return {
    updateExpense,
    loading,
  };
};
