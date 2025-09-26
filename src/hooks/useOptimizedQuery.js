import { useQuery } from '@apollo/client';
import { getOptimizedPolicy } from '@/src/lib/cache-utils';

/**
 * Hook personnalisé pour des requêtes GraphQL optimisées avec cache intelligent
 * 
 * @param {DocumentNode} query - La requête GraphQL
 * @param {Object} options - Options de la requête
 * @param {string} dataType - Type de données pour optimisation ('organization', 'lists', 'forms', 'stats', 'settings', 'session')
 * @param {string} context - Contexte d'utilisation ('table', 'form', 'dashboard', 'default')
 * @returns {Object} Résultat de useQuery avec optimisations
 */
export const useOptimizedQuery = (query, options = {}, dataType = 'default', context = 'default') => {
  // Obtenir la politique de cache optimisée
  const optimizedPolicy = getOptimizedPolicy(dataType, context);
  
  // Fusionner avec les options personnalisées
  const queryOptions = {
    ...optimizedPolicy,
    ...options,
    // Les options personnalisées ont la priorité
    errorPolicy: options.errorPolicy || 'all',
  };
  
  const result = useQuery(query, queryOptions);
  
  // Ajouter des métadonnées utiles pour le debug
  return {
    ...result,
    _cacheInfo: {
      dataType,
      context,
      policy: optimizedPolicy,
      fromCache: !result.loading && !result.networkStatus,
    },
  };
};

/**
 * Hook pour les listes avec pagination optimisée
 */
export const useOptimizedListQuery = (query, options = {}) => {
  return useOptimizedQuery(query, {
    ...options,
    notifyOnNetworkStatusChange: true, // Important pour les tables
  }, 'lists', 'table');
};

/**
 * Hook pour les données de formulaire avec cache agressif
 */
export const useOptimizedFormQuery = (query, options = {}) => {
  return useOptimizedQuery(query, options, 'forms', 'form');
};

/**
 * Hook pour les statistiques avec cache + réseau
 */
export const useOptimizedStatsQuery = (query, options = {}) => {
  return useOptimizedQuery(query, options, 'stats', 'dashboard');
};

/**
 * Hook pour les paramètres avec cache long
 */
export const useOptimizedSettingsQuery = (query, options = {}) => {
  return useOptimizedQuery(query, options, 'settings', 'default');
};

/**
 * Hook pour les données d'organisation (très peu fréquentes)
 */
export const useOptimizedOrganizationQuery = (query, options = {}) => {
  return useOptimizedQuery(query, {
    ...options,
    // Cache très agressif pour les données d'organisation
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-only',
  }, 'organization', 'default');
};
