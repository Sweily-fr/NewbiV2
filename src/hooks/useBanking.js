import { useQuery, useMutation } from "@apollo/client";
import { toast } from "@/src/components/ui/sonner";
import {
  GET_BANKING_ACCOUNTS,
  GET_BANKING_ACCOUNT,
  GET_TRANSACTIONS,
  GET_TRANSACTION,
  GET_ACCOUNT_BALANCE,
  GET_TRANSACTION_HISTORY,
  SYNC_ACCOUNT_BALANCE,
  SYNC_TRANSACTION_HISTORY,
} from "@/src/graphql/queries/banking";

/**
 * Hook pour récupérer tous les comptes bancaires
 */
export const useBankingAccounts = () => {
  const { data, loading, error, refetch } = useQuery(GET_BANKING_ACCOUNTS, {
    fetchPolicy: "cache-and-network",
  });

  return {
    accounts: data?.bankingAccounts || [],
    loading,
    error,
    refetch,
  };
};

/**
 * Hook pour récupérer un compte bancaire par ID
 */
export const useBankingAccount = (id) => {
  const { data, loading, error, refetch } = useQuery(GET_BANKING_ACCOUNT, {
    variables: { id },
    skip: !id,
    fetchPolicy: "cache-and-network",
  });

  return {
    account: data?.bankingAccount,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook pour récupérer les transactions bancaires
 */
export const useBankTransactions = (filters = {}, limit = 500, offset = 0) => {
  const { data, loading, error, refetch } = useQuery(GET_TRANSACTIONS, {
    variables: { filters, limit, offset },
    fetchPolicy: "cache-and-network",
  });

  return {
    transactions: data?.transactions || [],
    loading,
    error,
    refetch,
  };
};

/**
 * Hook pour récupérer une transaction par ID
 */
export const useBankTransaction = (id) => {
  const { data, loading, error, refetch } = useQuery(GET_TRANSACTION, {
    variables: { id },
    skip: !id,
    fetchPolicy: "cache-and-network",
  });

  return {
    transaction: data?.transaction,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook pour récupérer le solde d'un compte
 */
export const useAccountBalance = (accountId) => {
  const { data, loading, error, refetch } = useQuery(GET_ACCOUNT_BALANCE, {
    variables: { accountId },
    skip: !accountId,
    fetchPolicy: "cache-and-network",
  });

  return {
    balance: data?.accountBalance,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook pour récupérer l'historique des transactions d'un compte
 */
export const useTransactionHistory = (accountId, filters = {}) => {
  const { data, loading, error, refetch } = useQuery(GET_TRANSACTION_HISTORY, {
    variables: { accountId, filters },
    skip: !accountId,
    fetchPolicy: "cache-and-network",
  });

  return {
    transactions: data?.transactionHistory || [],
    loading,
    error,
    refetch,
  };
};

/**
 * Hook pour synchroniser le solde d'un compte
 */
export const useSyncAccountBalance = () => {
  const [syncBalance, { loading }] = useMutation(SYNC_ACCOUNT_BALANCE, {
    refetchQueries: [GET_BANKING_ACCOUNTS],
    onCompleted: () => {
      toast.success("Solde synchronisé avec succès");
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la synchronisation");
    },
  });

  return {
    syncBalance: (accountId) => syncBalance({ variables: { accountId } }),
    loading,
  };
};

/**
 * Hook pour synchroniser l'historique des transactions
 */
export const useSyncTransactionHistory = () => {
  const [syncHistory, { loading }] = useMutation(SYNC_TRANSACTION_HISTORY, {
    refetchQueries: [GET_TRANSACTIONS],
    onCompleted: () => {
      toast.success("Historique synchronisé avec succès");
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la synchronisation");
    },
  });

  return {
    syncHistory: (accountId) => syncHistory({ variables: { accountId } }),
    loading,
  };
};

/**
 * Hook combiné pour les données du dashboard (comptes + transactions)
 * Remplace useDashboardData pour les données bancaires
 */
export const useBankingData = () => {
  const {
    accounts,
    loading: accountsLoading,
    error: accountsError,
    refetch: refetchAccounts,
  } = useBankingAccounts();

  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useBankTransactions({}, 500);

  // Calculer le solde total
  const totalBalance = accounts.reduce(
    (sum, account) => sum + (account.balance?.current || 0),
    0
  );

  // Séparer les transactions en entrées et sorties
  const bankIncome = transactions.filter((t) => t.amount > 0);
  const bankExpenses = transactions.filter((t) => t.amount < 0);

  // Calculer les totaux
  const totalIncome = bankIncome.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpenses = Math.abs(
    bankExpenses.reduce((sum, t) => sum + (t.amount || 0), 0)
  );

  const refreshData = async () => {
    await Promise.all([refetchAccounts(), refetchTransactions()]);
  };

  return {
    // Comptes
    accounts,
    bankAccounts: accounts,
    bankBalance: totalBalance,

    // Transactions
    transactions,
    bankTransactions: transactions,
    bankIncome,
    bankExpenses,

    // Totaux
    totalIncome,
    totalExpenses,

    // États
    isLoading: accountsLoading || transactionsLoading,
    error: accountsError || transactionsError,

    // Actions
    refreshData,
    refetchAccounts,
    refetchTransactions,

    // Flag pour indiquer si des données bancaires sont disponibles
    hasBankData: transactions.length > 0,
  };
};
