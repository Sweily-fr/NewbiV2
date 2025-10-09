/**
 * Utilitaires pour optimiser les stratégies de cache Apollo Client
 */

// Stratégies de cache optimisées par type de données
export const CACHE_POLICIES = {
  // Toutes les politiques utilisent maintenant network-only
  STATIC: {
    fetchPolicy: "network-only",
    nextFetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  },
  
  // Toutes les politiques utilisent maintenant network-only
  CRITICAL: {
    fetchPolicy: "network-only",
    nextFetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  },
  
  // Données en temps réel - toujours du réseau
  REALTIME: {
    fetchPolicy: "network-only",
    nextFetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  },
  
  // Toutes les politiques utilisent maintenant network-only
  READONLY: {
    fetchPolicy: "network-only",
    nextFetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  },
};

// Configuration optimisée par type de composant
export const getOptimizedPolicy = (dataType, context = 'default') => {
  const policies = {
    // Données d'organisation (peu fréquentes)
    organization: CACHE_POLICIES.STATIC,
    
    // Listes de données (factures, devis, clients)
    lists: context === 'table' ? CACHE_POLICIES.CRITICAL : CACHE_POLICIES.STATIC,
    
    // Données de formulaire (lecture fréquente)
    forms: CACHE_POLICIES.STATIC,
    
    // Statistiques et dashboards
    stats: CACHE_POLICIES.CRITICAL,
    
    // Paramètres utilisateur
    settings: CACHE_POLICIES.STATIC,
    
    // Données de session
    session: CACHE_POLICIES.CRITICAL,
  };
  
  return policies[dataType] || CACHE_POLICIES.STATIC;
};

// Fonction pour invalider le cache de manière sélective
export const invalidateCache = (apolloClient, patterns = []) => {
  const cache = apolloClient.cache;
  
  patterns.forEach(pattern => {
    try {
      // Invalider les requêtes correspondant au pattern
      cache.evict({ 
        fieldName: pattern,
        broadcast: false 
      });
    } catch (error) {
      console.warn(`⚠️ Impossible d'invalider le cache pour ${pattern}:`, error);
    }
  });
  
  // Nettoyer les références orphelines
  cache.gc();
  
  console.log('🧹 Cache invalidé pour:', patterns);
};

// Fonction pour précharger des données critiques
export const preloadCriticalData = async (apolloClient, queries = []) => {
  const preloadPromises = queries.map(async ({ query, variables, policy }) => {
    try {
      await apolloClient.query({
        query,
        variables,
        fetchPolicy: policy || "network-only",
        errorPolicy: "ignore", // Ignorer les erreurs de préchargement
      });
    } catch (error) {
      console.warn('⚠️ Erreur préchargement:', error);
    }
  });
  
  await Promise.allSettled(preloadPromises);
  console.log('🚀 Données critiques préchargées');
};

// Fonction pour optimiser les mutations avec mise à jour du cache
export const optimizedMutate = async (apolloClient, mutation, options = {}) => {
  const {
    variables,
    optimisticResponse,
    updateQueries = [],
    invalidateQueries = [],
    refetchQueries = [],
    ...otherOptions
  } = options;
  
  try {
    const result = await apolloClient.mutate({
      mutation,
      variables,
      optimisticResponse,
      refetchQueries: refetchQueries.map(query => ({ query, variables })),
      awaitRefetchQueries: false, // Optimisation performance
      errorPolicy: "all",
      ...otherOptions,
    });
    
    // Invalider les caches spécifiés
    if (invalidateQueries.length > 0) {
      invalidateCache(apolloClient, invalidateQueries);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erreur mutation optimisée:', error);
    throw error;
  }
};

// Hook pour surveiller les performances du cache
export const useCacheStats = (apolloClient) => {
  const getCacheSize = () => {
    try {
      const cache = apolloClient.cache;
      const data = cache.extract();
      return {
        entries: Object.keys(data).length,
        size: JSON.stringify(data).length,
        sizeKB: Math.round(JSON.stringify(data).length / 1024),
      };
    } catch (error) {
      return { entries: 0, size: 0, sizeKB: 0 };
    }
  };
  
  const clearCache = () => {
    try {
      apolloClient.cache.reset();
      console.log('🧹 Cache Apollo complètement vidé');
    } catch (error) {
      console.error('❌ Erreur vidage cache:', error);
    }
  };
  
  return {
    getCacheSize,
    clearCache,
  };
};

// Configuration pour les requêtes paginées
export const getPaginationPolicy = (fieldName) => ({
  keyArgs: ["workspaceId", "filters"],
  merge(existing = { items: [], totalCount: 0 }, incoming) {
    return {
      ...incoming,
      items: [...(existing.items || []), ...(incoming.items || [])],
    };
  },
});
