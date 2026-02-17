import { useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@apollo/client";
import { useInvoices } from "@/src/graphql/invoiceQueries";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import {
  GET_BANKING_ACCOUNTS,
  GET_TRANSACTIONS,
} from "@/src/graphql/queries/banking";

// Durée de validité du cache (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Clé pour stocker le timestamp du dernier fetch
const CACHE_KEY = "dashboard_last_fetch";

/**
 * Hook pour les données du dashboard utilisant GraphQL
 * Utilise cache-first pour éviter les rechargements inutiles
 * Rafraîchit automatiquement après CACHE_TTL
 */
export function useDashboardData() {
  // Récupérer le workspaceId actuel
  const { workspaceId } = useRequiredWorkspace();
  const lastFetchRef = useRef(null);
  const hasInitialFetch = useRef(false);

  // Vérifier si le cache est encore valide
  const isCacheValid = useCallback(() => {
    if (typeof window === "undefined") return false;
    const lastFetch = localStorage.getItem(`${CACHE_KEY}_${workspaceId}`);
    if (!lastFetch) return false;
    return Date.now() - parseInt(lastFetch, 10) < CACHE_TTL;
  }, [workspaceId]);

  // Marquer le cache comme mis à jour
  const updateCacheTimestamp = useCallback(() => {
    if (typeof window !== "undefined" && workspaceId) {
      localStorage.setItem(
        `${CACHE_KEY}_${workspaceId}`,
        Date.now().toString()
      );
      lastFetchRef.current = Date.now();
    }
  }, [workspaceId]);

  // Hook GraphQL pour les factures
  const {
    invoices,
    loading: invoicesLoading,
    refetch: refetchInvoices,
  } = useInvoices();

  // Hook GraphQL pour les comptes bancaires - cache-first
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

  // Hook GraphQL pour les transactions
  // Temporairement: network-only pour forcer le rechargement et voir les vraies données
  const {
    data: transactionsData,
    loading: bankLoading,
    refetch: refetchBankTransactions,
  } = useQuery(GET_TRANSACTIONS, {
    variables: { workspaceId, limit: 5000 },
    fetchPolicy: "network-only", // Forcer le rechargement depuis le serveur
    skip: !workspaceId,
  });

  // Rafraîchir les données si le cache est expiré (une seule fois au montage)
  useEffect(() => {
    if (!workspaceId || hasInitialFetch.current) return;

    hasInitialFetch.current = true;

    // Marquer le timestamp au premier chargement
    if (!isCacheValid()) {
      updateCacheTimestamp();
    }
  }, [workspaceId, isCacheValid, updateCacheTimestamp]);

  // Extraire les données
  const bankAccounts = accountsData?.bankingAccounts || [];
  const bankTransactions = transactionsData?.transactions || [];

  // Calculer le solde total
  const bankBalance = useMemo(() => {
    return bankAccounts.reduce(
      (sum, account) => sum + (account.balance?.current || 0),
      0
    );
  }, [bankAccounts]);

  // Traiter et calculer les données
  const processedData = useMemo(() => {
    // Filtrer les factures payées
    const paidInvoices = (invoices || []).filter(
      (invoice) => invoice.status === "COMPLETED"
    );

    // Séparer les transactions en entrées et sorties
    const bankIncome = bankTransactions.filter((t) => t.amount > 0);
    const bankExpensesFiltered = bankTransactions.filter((t) => t.amount < 0);

    // Les dépenses payées sont maintenant les transactions avec montant négatif
    const paidExpenses = bankExpensesFiltered;

    // Totaux basés sur les transactions bancaires
    const totalIncome = bankIncome.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExpenses = Math.abs(
      bankExpensesFiltered.reduce((sum, t) => sum + (t.amount || 0), 0)
    );

    return {
      expenses: bankTransactions,
      invoices: invoices || [],
      paidInvoices,
      paidExpenses,
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
  }, [invoices, bankTransactions, bankAccounts, bankBalance]);

  // Fonction pour forcer le rafraîchissement
  const refreshData = useCallback(async () => {
    await Promise.all([
      refetchInvoices?.(),
      refetchBankAccounts?.(),
      refetchBankTransactions?.(),
    ]);
    updateCacheTimestamp();
  }, [
    refetchInvoices,
    refetchBankAccounts,
    refetchBankTransactions,
    updateCacheTimestamp,
  ]);

  // Fonction pour invalider le cache
  const invalidateCache = useCallback(() => {
    if (typeof window !== "undefined" && workspaceId) {
      localStorage.removeItem(`${CACHE_KEY}_${workspaceId}`);
    }
    refreshData();
  }, [workspaceId, refreshData]);

  const isLoading = invoicesLoading || bankLoading || accountsLoading;

  // Calculer si les données viennent du cache
  const isFromCache = useMemo(() => {
    return isCacheValid() && !isLoading;
  }, [isCacheValid, isLoading]);

  return {
    // Données
    ...processedData,

    // États de chargement
    isLoading,
    isInitialized: !isLoading,
    // États de chargement individuels pour le rendu progressif
    invoicesLoading,
    accountsLoading,
    transactionsLoading: bankLoading,

    // Fonctions de gestion
    refreshData,
    invalidateCache,

    // Métadonnées
    cacheInfo: {
      lastUpdate: lastFetchRef.current
        ? new Date(lastFetchRef.current)
        : new Date(),
      isFromCache,
      cacheKey: `${CACHE_KEY}_${workspaceId}`,
      ttl: CACHE_TTL,
    },

    // Fonction utilitaire pour formater les devises
    formatCurrency: (amount) => {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(amount || 0);
    },
  };
}
