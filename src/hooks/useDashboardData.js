import { useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@apollo/client";
import { useInvoices } from "@/src/graphql/invoiceQueries";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import {
  GET_BANKING_ACCOUNTS,
  GET_TRANSACTIONS,
} from "@/src/graphql/queries/banking";
import { GET_DASHBOARD_SUMMARY } from "@/src/graphql/queries/dashboardAggregation";

// Durée de validité du cache (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_KEY = "dashboard_last_fetch";

/**
 * Hook pour les données du dashboard.
 *
 * @param {Object} options
 * @param {boolean} options.skipTransactions - Si true, ne charge pas les transactions brutes.
 *   Le dashboard utilise ce mode car les graphiques font leurs propres queries backend.
 *   Les pages analytics et transactions gardent skipTransactions=false (défaut).
 * @param {string} options.accountId - Filtre optionnel par compte bancaire (pour le summary backend).
 */
export function useDashboardData({
  skipTransactions = false,
  accountId = null,
} = {}) {
  const { workspaceId } = useRequiredWorkspace();
  const lastFetchRef = useRef(null);
  const hasInitialFetch = useRef(false);

  const isCacheValid = useCallback(() => {
    if (typeof window === "undefined") return false;
    const lastFetch = localStorage.getItem(`${CACHE_KEY}_${workspaceId}`);
    if (!lastFetch) return false;
    return Date.now() - parseInt(lastFetch, 10) < CACHE_TTL;
  }, [workspaceId]);

  const updateCacheTimestamp = useCallback(() => {
    if (typeof window !== "undefined" && workspaceId) {
      localStorage.setItem(
        `${CACHE_KEY}_${workspaceId}`,
        Date.now().toString(),
      );
      lastFetchRef.current = Date.now();
    }
  }, [workspaceId]);

  // Factures (toujours chargées)
  const {
    invoices,
    loading: invoicesLoading,
    refetch: refetchInvoices,
  } = useInvoices();

  // Comptes bancaires (toujours chargés - pour le sélecteur de compte)
  const {
    data: accountsData,
    loading: accountsLoading,
    refetch: refetchBankAccounts,
  } = useQuery(GET_BANKING_ACCOUNTS, {
    variables: { workspaceId },
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    skip: !workspaceId,
  });

  // Summary backend (stats pré-calculées) — utilisé quand skipTransactions=true
  const {
    data: summaryData,
    loading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery(GET_DASHBOARD_SUMMARY, {
    variables: {
      workspaceId,
      accountId: accountId === "all" ? null : accountId,
    },
    fetchPolicy: "cache-and-network",
    skip: !workspaceId || !skipTransactions,
  });

  // Transactions brutes — skippé sur le dashboard (graphiques font leurs propres queries)
  const {
    data: transactionsData,
    loading: bankLoading,
    refetch: refetchBankTransactions,
  } = useQuery(GET_TRANSACTIONS, {
    variables: { workspaceId, limit: 0 },
    fetchPolicy: "cache-and-network",
    skip: !workspaceId || skipTransactions,
  });

  // Premier chargement
  useEffect(() => {
    if (!workspaceId || hasInitialFetch.current) return;
    hasInitialFetch.current = true;
    if (!isCacheValid()) updateCacheTimestamp();
  }, [workspaceId, isCacheValid, updateCacheTimestamp]);

  const bankAccounts = accountsData?.bankingAccounts || [];
  const bankTransactions = transactionsData?.transactions || [];

  // Si skipTransactions, les stats viennent du backend (qui inclut déjà les espèces)
  const bankBalance = useMemo(() => {
    if (skipTransactions && summaryData?.dashboardSummary) {
      return summaryData.dashboardSummary.bankBalance;
    }
    // Solde global = somme des comptes bancaires + mouvements manuels (espèces),
    // ces derniers n'étant reflétés par aucun solde de compte.
    const accountsBalance = bankAccounts.reduce(
      (sum, account) => sum + (account.balance?.current || 0),
      0,
    );
    const cashBalance = bankTransactions.reduce(
      (sum, t) => (t.provider === "manual" ? sum + (t.amount || 0) : sum),
      0,
    );
    return accountsBalance + cashBalance;
  }, [skipTransactions, summaryData, bankAccounts, bankTransactions]);

  const processedData = useMemo(() => {
    if (skipTransactions) {
      const summary = summaryData?.dashboardSummary;
      return {
        expenses: [],
        invoices: invoices || [],
        paidInvoices: (invoices || []).filter((i) => i.status === "COMPLETED"),
        paidExpenses: [],
        bankTransactions: [],
        bankIncome: [],
        bankExpenses: [],
        bankAccounts,
        bankBalance,
        totalIncome: summary?.totalIncome ?? 0,
        totalExpenses: summary?.totalExpenses ?? 0,
        transactions: [],
        hasBankData: (summary?.transactionCount ?? 0) > 0,
      };
    }

    const paidInvoices = (invoices || []).filter(
      (i) => i.status === "COMPLETED",
    );
    const bankIncome = bankTransactions.filter((t) => t.amount > 0);
    const bankExpensesFiltered = bankTransactions.filter((t) => t.amount < 0);
    const totalIncome = bankIncome.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExpenses = Math.abs(
      bankExpensesFiltered.reduce((sum, t) => sum + (t.amount || 0), 0),
    );

    return {
      expenses: bankTransactions,
      invoices: invoices || [],
      paidInvoices,
      paidExpenses: bankExpensesFiltered,
      bankTransactions,
      bankIncome,
      bankExpenses: bankExpensesFiltered,
      bankAccounts,
      bankBalance,
      totalIncome,
      totalExpenses,
      transactions: bankTransactions,
      hasBankData: bankTransactions.length > 0,
    };
  }, [
    skipTransactions,
    summaryData,
    invoices,
    bankTransactions,
    bankAccounts,
    bankBalance,
  ]);

  const refreshData = useCallback(async () => {
    const promises = [refetchInvoices?.(), refetchBankAccounts?.()];
    if (skipTransactions) {
      promises.push(refetchSummary?.());
    } else {
      promises.push(refetchBankTransactions?.());
    }
    await Promise.all(promises);
    updateCacheTimestamp();
  }, [
    refetchInvoices,
    refetchBankAccounts,
    refetchSummary,
    refetchBankTransactions,
    skipTransactions,
    updateCacheTimestamp,
  ]);

  const invalidateCache = useCallback(() => {
    if (typeof window !== "undefined" && workspaceId) {
      localStorage.removeItem(`${CACHE_KEY}_${workspaceId}`);
    }
    refreshData();
  }, [workspaceId, refreshData]);

  const isLoading =
    invoicesLoading ||
    accountsLoading ||
    (skipTransactions ? summaryLoading : bankLoading);

  const isFromCache = useMemo(() => {
    return isCacheValid() && !isLoading;
  }, [isCacheValid, isLoading]);

  return {
    ...processedData,
    isLoading,
    isInitialized: !isLoading,
    invoicesLoading,
    accountsLoading,
    transactionsLoading: skipTransactions
      ? summaryLoading
      : bankLoading || !transactionsData,
    refreshData,
    invalidateCache,
    cacheInfo: {
      lastUpdate: lastFetchRef.current
        ? new Date(lastFetchRef.current)
        : new Date(),
      isFromCache,
      cacheKey: `${CACHE_KEY}_${workspaceId}`,
      ttl: CACHE_TTL,
    },
    formatCurrency: (amount) => {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(amount || 0);
    },
  };
}
