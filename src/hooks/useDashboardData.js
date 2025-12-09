import { useState, useEffect, useMemo, useCallback } from "react";
import { useExpenses } from "@/src/hooks/useExpenses";
import { useInvoices } from "@/src/graphql/invoiceQueries";
import { useWorkspace } from "@/src/hooks/useWorkspace";

// Hook pour récupérer les comptes bancaires et leur solde
const useBankAccounts = (workspaceId) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/banking/accounts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": workspaceId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      } else {
        setAccounts([]);
      }
    } catch (err) {
      console.warn("⚠️ Erreur récupération comptes bancaires:", err.message);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Calculer le solde total
  const totalBalance = accounts.reduce(
    (sum, account) => sum + (account.balance || 0),
    0
  );

  return { accounts, totalBalance, loading, refetch: fetchAccounts };
};

// Hook pour récupérer les transactions bancaires
const useBankTransactions = (workspaceId) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/banking/transactions?limit=500", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": workspaceId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.warn(
        "⚠️ Erreur récupération transactions bancaires:",
        err.message
      );
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Debug: log les transactions récupérées
  console.log("🏦 [useBankTransactions] Transactions récupérées:", {
    count: transactions.length,
    sample: transactions.slice(0, 3).map((t) => ({
      date: t.date,
      amount: t.amount,
      processedAt: t.processedAt,
      createdAt: t.createdAt,
    })),
  });

  return { transactions, loading, refetch: fetchTransactions };
};

// Durée de vie du cache : 2 minutes pour les données financières (plus fréquent)
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Fonction pour vérifier si le cache est valide (en dehors du composant pour éviter les re-renders)
const isCacheValid = (cacheData) => {
  if (!cacheData || !cacheData.timestamp) return false;
  const now = Date.now();
  return now - cacheData.timestamp < CACHE_DURATION;
};

/**
 * Hook de cache intelligent pour les données du dashboard
 * Utilise le même système de cache que les autres pages
 */
export function useDashboardData() {
  const { workspaceId } = useWorkspace();
  const CACHE_KEY = `dashboard-data-${workspaceId}`;

  // Initialisation synchrone du cache pour affichage instantané
  const [cachedData, setCachedData] = useState(() => {
    if (typeof window === "undefined" || !workspaceId) return null;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        if (isCacheValid(parsedCache)) {
          console.log("📊 Dashboard: Cache initialisé de façon synchrone");
          return parsedCache;
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      console.error(
        "📊 Dashboard: Erreur lors de l'initialisation du cache:",
        error
      );
      localStorage.removeItem(CACHE_KEY);
    }
    return null;
  });

  // États de cache
  const [isLoading, setIsLoading] = useState(!cachedData);
  const [isInitialized, setIsInitialized] = useState(!!cachedData);
  const [lastUpdate, setLastUpdate] = useState(
    cachedData ? new Date(cachedData.timestamp) : null
  );
  const [hasCheckedCache, setHasCheckedCache] = useState(!!cachedData);

  // Hooks pour récupérer les données
  const {
    expenses,
    loading: expensesLoading,
    refetch: refetchExpenses,
  } = useExpenses();

  const {
    invoices,
    loading: invoicesLoading,
    refetch: refetchInvoices,
  } = useInvoices();

  // Hook pour les comptes bancaires (solde)
  const {
    accounts: bankAccounts,
    totalBalance: bankBalance,
    loading: accountsLoading,
    refetch: refetchBankAccounts,
  } = useBankAccounts(workspaceId);

  // Hook pour les transactions bancaires
  const {
    transactions: bankTransactions,
    loading: bankLoading,
    refetch: refetchBankTransactions,
  } = useBankTransactions(workspaceId);

  // Fonction pour charger depuis le cache
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        if (isCacheValid(parsedCache)) {
          console.log("📊 Dashboard: Données chargées depuis le cache");
          return parsedCache;
        } else {
          console.log("📊 Dashboard: Cache expiré, suppression");
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      console.error("📊 Dashboard: Erreur lors du chargement du cache:", error);
      localStorage.removeItem(CACHE_KEY);
    }
    return null;
  }, [CACHE_KEY]);

  // Fonction pour sauvegarder en cache
  const saveToCache = useCallback(
    (data) => {
      try {
        const cacheData = {
          ...data,
          timestamp: Date.now(),
          workspaceId,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        console.log("📊 Dashboard: Données sauvegardées en cache");
      } catch (error) {
        console.error(
          "📊 Dashboard: Erreur lors de la sauvegarde du cache:",
          error
        );
      }
    },
    [CACHE_KEY, workspaceId]
  );

  // Fonction pour traiter et calculer les données
  // MODE BANCAIRE PUR : Seules les transactions bancaires sont utilisées pour les flux financiers
  const processData = useMemo(() => {
    if (!expenses || !invoices) return null;

    // Filtrer les factures payées (pour référence, pas pour les calculs de flux)
    const paidInvoices = invoices.filter(
      (invoice) => invoice.status === "COMPLETED"
    );

    // Filtrer les dépenses payées (pour référence, pas pour les calculs de flux)
    const paidExpenses = expenses.filter(
      (expense) => expense.status === "PAID"
    );

    // MODE BANCAIRE PUR : Séparer les transactions bancaires en entrées et sorties
    const bankIncome = bankTransactions.filter((t) => t.amount > 0);
    const bankExpenses = bankTransactions.filter((t) => t.amount < 0);

    // MODE BANCAIRE PUR : Totaux basés uniquement sur les transactions bancaires
    const totalIncome = bankIncome.reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalExpenses = Math.abs(
      bankExpenses.reduce((sum, t) => sum + (t.amount || 0), 0)
    );

    // Données pour les graphiques - MODE BANCAIRE PUR
    const dashboardData = {
      expenses,
      invoices,
      paidInvoices,
      paidExpenses,
      bankTransactions,
      bankIncome,
      bankExpenses,
      bankAccounts,
      bankBalance,
      totalIncome,
      totalExpenses,
      transactions: bankTransactions,
      // Flag pour indiquer si des données bancaires sont disponibles
      hasBankData: bankTransactions.length > 0,
    };

    return dashboardData;
  }, [expenses, invoices, bankTransactions, bankAccounts, bankBalance]);

  // Chargement initial depuis le cache - SYNCHRONE pour affichage instantané
  useEffect(() => {
    if (typeof window === "undefined" || hasCheckedCache) return;

    const cached = loadFromCache();
    if (cached) {
      console.log("📊 Dashboard: Cache trouvé, affichage instantané");
      setCachedData(cached);
      setLastUpdate(new Date(cached.timestamp));
      setIsInitialized(true);
      setIsLoading(false);
    } else {
      console.log("📊 Dashboard: Pas de cache, chargement depuis API");
      setIsLoading(true);
    }
    setHasCheckedCache(true);
  }, [loadFromCache, hasCheckedCache]);

  // Mise à jour du cache quand les données changent
  useEffect(() => {
    if (
      !expensesLoading &&
      !invoicesLoading &&
      !bankLoading &&
      !accountsLoading &&
      processData &&
      workspaceId
    ) {
      const newData = processData;

      // Vérifier si les données ont changé
      const hasChanged =
        !cachedData ||
        JSON.stringify(newData.expenses) !==
          JSON.stringify(cachedData.expenses) ||
        JSON.stringify(newData.invoices) !==
          JSON.stringify(cachedData.invoices) ||
        JSON.stringify(newData.bankTransactions) !==
          JSON.stringify(cachedData.bankTransactions);

      if (hasChanged) {
        console.log(
          "📊 Dashboard: Nouvelles données détectées, mise à jour du cache"
        );
        setCachedData(newData);
        saveToCache(newData);
        setLastUpdate(new Date());
      }

      setIsInitialized(true);
      setIsLoading(false);
    }
  }, [
    expenses,
    invoices,
    bankTransactions,
    bankAccounts,
    expensesLoading,
    invoicesLoading,
    bankLoading,
    accountsLoading,
    processData,
    workspaceId,
    cachedData,
    saveToCache,
  ]);

  // Fonction pour forcer le rafraîchissement
  const refreshData = async () => {
    console.log("📊 Dashboard: Rafraîchissement forcé des données");
    setIsLoading(true);

    try {
      // Supprimer le cache
      localStorage.removeItem(CACHE_KEY);

      // Refetch des données (factures, dépenses, comptes et transactions bancaires)
      await Promise.all([
        refetchExpenses?.(),
        refetchInvoices?.(),
        refetchBankAccounts?.(),
        refetchBankTransactions?.(),
      ]);

      console.log("📊 Dashboard: Données rafraîchies avec succès");
    } catch (error) {
      console.error("📊 Dashboard: Erreur lors du rafraîchissement:", error);
    }
  };

  // Fonction pour invalider le cache
  const invalidateCache = () => {
    console.log("📊 Dashboard: Invalidation du cache");
    localStorage.removeItem(CACHE_KEY);
    setCachedData(null);
    setLastUpdate(null);
  };

  // Utiliser les données en cache si disponibles, sinon les données fraîches
  const currentData = cachedData || processData;

  return {
    // Données
    ...currentData,

    // États de chargement - Si on a des données en cache, pas de loading
    isLoading: cachedData
      ? false
      : isLoading ||
        expensesLoading ||
        invoicesLoading ||
        bankLoading ||
        accountsLoading,
    isInitialized: cachedData ? true : isInitialized,

    // Fonctions de gestion du cache
    refreshData,
    invalidateCache,

    // Métadonnées du cache
    cacheInfo: {
      lastUpdate,
      isFromCache: !!cachedData,
      cacheKey: CACHE_KEY,
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
