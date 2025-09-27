import { useState, useEffect, useMemo, useCallback } from 'react';
import { useExpenses } from '@/src/hooks/useExpenses';
import { useInvoices } from '@/src/graphql/invoiceQueries';
import { useWorkspace } from '@/src/hooks/useWorkspace';

// Durée de vie du cache : 2 minutes pour les données financières (plus fréquent)
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Fonction pour vérifier si le cache est valide (en dehors du composant pour éviter les re-renders)
const isCacheValid = (cacheData) => {
  if (!cacheData || !cacheData.timestamp) return false;
  const now = Date.now();
  return (now - cacheData.timestamp) < CACHE_DURATION;
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
    if (typeof window === 'undefined' || !workspaceId) return null;
    
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        if (isCacheValid(parsedCache)) {
          console.log('📊 Dashboard: Cache initialisé de façon synchrone');
          return parsedCache;
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('📊 Dashboard: Erreur lors de l\'initialisation du cache:', error);
      localStorage.removeItem(CACHE_KEY);
    }
    return null;
  });
  
  // États de cache
  const [isLoading, setIsLoading] = useState(!cachedData);
  const [isInitialized, setIsInitialized] = useState(!!cachedData);
  const [lastUpdate, setLastUpdate] = useState(cachedData ? new Date(cachedData.timestamp) : null);
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
    refetch: refetchInvoices 
  } = useInvoices();

  // Fonction pour charger depuis le cache
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        if (isCacheValid(parsedCache)) {
          console.log('📊 Dashboard: Données chargées depuis le cache');
          return parsedCache;
        } else {
          console.log('📊 Dashboard: Cache expiré, suppression');
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('📊 Dashboard: Erreur lors du chargement du cache:', error);
      localStorage.removeItem(CACHE_KEY);
    }
    return null;
  }, [CACHE_KEY]);

  // Fonction pour sauvegarder en cache
  const saveToCache = useCallback((data) => {
    try {
      const cacheData = {
        ...data,
        timestamp: Date.now(),
        workspaceId,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log('📊 Dashboard: Données sauvegardées en cache');
    } catch (error) {
      console.error('📊 Dashboard: Erreur lors de la sauvegarde du cache:', error);
    }
  }, [CACHE_KEY, workspaceId]);

  // Fonction pour traiter et calculer les données
  const processData = useMemo(() => {
    if (!expenses || !invoices) return null;

    // Filtrer les factures payées
    const paidInvoices = invoices.filter((invoice) => invoice.status === "COMPLETED");
    
    // Filtrer les dépenses payées (exclure les DRAFT)
    const paidExpenses = expenses.filter((expense) => expense.status === "PAID");

    // Calculer les totaux
    const totalIncome = paidInvoices.reduce(
      (sum, invoice) => sum + (invoice.finalTotalTTC || 0),
      0
    );
    
    const totalExpenses = paidExpenses.reduce(
      (sum, expense) => sum + (expense.amount || 0),
      0
    );

    // Données pour les graphiques (vous pouvez importer les fonctions existantes)
    const dashboardData = {
      expenses,
      invoices,
      paidInvoices,
      paidExpenses,
      totalIncome,
      totalExpenses,
      transactions: [], // Pour l'instant vide
    };

    return dashboardData;
  }, [expenses, invoices]);

  // Chargement initial depuis le cache - SYNCHRONE pour affichage instantané
  useEffect(() => {
    if (typeof window === 'undefined' || hasCheckedCache) return;

    const cached = loadFromCache();
    if (cached) {
      console.log('📊 Dashboard: Cache trouvé, affichage instantané');
      setCachedData(cached);
      setLastUpdate(new Date(cached.timestamp));
      setIsInitialized(true);
      setIsLoading(false);
    } else {
      console.log('📊 Dashboard: Pas de cache, chargement depuis API');
      setIsLoading(true);
    }
    setHasCheckedCache(true);
  }, [loadFromCache, hasCheckedCache]);

  // Mise à jour du cache quand les données changent
  useEffect(() => {
    if (!expensesLoading && !invoicesLoading && processData && workspaceId) {
      const newData = processData;
      
      // Vérifier si les données ont changé
      const hasChanged = !cachedData || 
        JSON.stringify(newData.expenses) !== JSON.stringify(cachedData.expenses) ||
        JSON.stringify(newData.invoices) !== JSON.stringify(cachedData.invoices);

      if (hasChanged) {
        console.log('📊 Dashboard: Nouvelles données détectées, mise à jour du cache');
        setCachedData(newData);
        saveToCache(newData);
        setLastUpdate(new Date());
      }

      setIsInitialized(true);
      setIsLoading(false);
    }
  }, [expenses, invoices, expensesLoading, invoicesLoading, processData, workspaceId, cachedData, saveToCache]);

  // Fonction pour forcer le rafraîchissement
  const refreshData = async () => {
    console.log('📊 Dashboard: Rafraîchissement forcé des données');
    setIsLoading(true);
    
    try {
      // Supprimer le cache
      localStorage.removeItem(CACHE_KEY);
      
      // Refetch des données
      await Promise.all([
        refetchExpenses?.(),
        refetchInvoices?.()
      ]);
      
      console.log('📊 Dashboard: Données rafraîchies avec succès');
    } catch (error) {
      console.error('📊 Dashboard: Erreur lors du rafraîchissement:', error);
    }
  };

  // Fonction pour invalider le cache
  const invalidateCache = () => {
    console.log('📊 Dashboard: Invalidation du cache');
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
    isLoading: cachedData ? false : (isLoading || expensesLoading || invoicesLoading),
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
