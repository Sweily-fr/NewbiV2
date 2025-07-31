import { useQuery } from '@apollo/client';
import { GET_EXPENSES, GET_EXPENSE_STATS } from '../graphql/queries/expense';

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
