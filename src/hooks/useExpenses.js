import { useQuery, useMutation } from '@apollo/client';
import { GET_EXPENSES, GET_EXPENSE_STATS } from '../graphql/queries/expense';
import { DELETE_EXPENSE, DELETE_MULTIPLE_EXPENSES } from '../graphql/mutations/expense';
import { toast } from '@/src/components/ui/sonner';

/**
 * Hook pour récupérer les dépenses avec filtres et pagination
 */
export const useExpenses = (filters = {}) => {
  const { data, loading, error, refetch } = useQuery(GET_EXPENSES, {
    variables: {
      page: 1,
      limit: 20,
      ...filters
    },
    fetchPolicy: 'cache-and-network'
  });

  return {
    expenses: data?.expenses?.expenses || [],
    totalCount: data?.expenses?.totalCount || 0,
    hasNextPage: data?.expenses?.hasNextPage || false,
    loading,
    error,
    refetch
  };
};

/**
 * Hook pour récupérer les statistiques des dépenses
 */
export const useExpenseStats = (dateRange = {}) => {
  const { data, loading, error } = useQuery(GET_EXPENSE_STATS, {
    variables: dateRange,
    fetchPolicy: 'cache-and-network'
  });

  return {
    stats: data?.expenseStats,
    loading,
    error
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
          status: 'PAID',
          page: 1,
          limit: 20
        }
      }
    ],
    awaitRefetchQueries: true
  });

  const deleteExpense = async (id) => {
    try {
      const result = await deleteExpenseMutation({
        variables: { id }
      });

      if (result.data?.deleteExpense?.success) {
        toast.success(result.data.deleteExpense.message || 'Dépense supprimée avec succès');
        return { success: true };
      } else {
        throw new Error(result.data?.deleteExpense?.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression dépense:', error);
      toast.error(error.message || 'Erreur lors de la suppression de la dépense');
      return { success: false, error };
    }
  };

  return {
    deleteExpense,
    loading
  };
};

/**
 * Hook pour supprimer plusieurs dépenses
 */
export const useDeleteMultipleExpenses = () => {
  const [deleteMultipleExpensesMutation, { loading }] = useMutation(DELETE_MULTIPLE_EXPENSES, {
    refetchQueries: [
      {
        query: GET_EXPENSES,
        variables: {
          status: 'PAID',
          page: 1,
          limit: 20
        }
      }
    ],
    awaitRefetchQueries: true
  });

  const deleteMultipleExpenses = async (ids) => {
    try {
      const result = await deleteMultipleExpensesMutation({
        variables: { ids }
      });

      const response = result.data?.deleteMultipleExpenses;
      if (response) {
        const { success, deletedCount, failedCount, message, errors } = response;
        
        if (success) {
          toast.success(message || `${deletedCount} dépense(s) supprimée(s) avec succès`);
        } else {
          // Afficher un message d'avertissement si certaines suppressions ont échoué
          if (deletedCount > 0 && failedCount > 0) {
            toast.warning(`${deletedCount} dépense(s) supprimée(s), ${failedCount} échec(s)`);
          } else if (failedCount > 0) {
            toast.error(`Aucune dépense supprimée. ${failedCount} échec(s)`);
          }
        }
        
        return { 
          success, 
          deletedCount, 
          failedCount, 
          errors: errors || [] 
        };
      } else {
        throw new Error('Réponse invalide du serveur');
      }
    } catch (error) {
      console.error('Erreur suppression multiple dépenses:', error);
      toast.error(error.message || 'Erreur lors de la suppression des dépenses');
      return { success: false, error };
    }
  };

  return {
    deleteMultipleExpenses,
    loading
  };
};
