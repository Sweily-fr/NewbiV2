import { useQuery } from '@apollo/client';
import { useSession } from '@/src/lib/auth-client';

/**
 * Hook wrapper pour useQuery qui gère mieux les erreurs d'authentification
 * Attend que la session soit chargée avant d'exécuter la query
 * 
 * @param {DocumentNode} query - La query GraphQL
 * @param {Object} options - Options de useQuery
 * @returns {Object} - Résultat de useQuery
 */
export const useSafeQuery = (query, options = {}) => {
  const { data: session, isPending } = useSession();
  
  // Déterminer si on doit skip la query
  const shouldSkip = options.skip || isPending || !session?.user;
  
  // Ajouter le contexte pour indiquer que c'est une query initiale
  const contextOptions = {
    ...options,
    skip: shouldSkip,
    context: {
      ...options.context,
      isInitialLoad: isPending,
    },
  };
  
  return useQuery(query, contextOptions);
};

/**
 * Hook wrapper pour les queries qui nécessitent une authentification
 * Retourne un état de chargement tant que la session n'est pas prête
 * 
 * @param {DocumentNode} query - La query GraphQL
 * @param {Object} options - Options de useQuery
 * @returns {Object} - Résultat de useQuery avec gestion de session
 */
export const useAuthenticatedQuery = (query, options = {}) => {
  const { data: session, isPending } = useSession();
  
  // Toujours appeler useQuery (règle des hooks React)
  const queryResult = useQuery(query, {
    ...options,
    skip: options.skip || isPending || !session?.user,
    context: {
      ...options.context,
      isInitialLoad: isPending,
    },
  });
  
  // Si la session est en cours de chargement, retourner un état de chargement
  if (isPending) {
    return {
      ...queryResult,
      loading: true,
      data: undefined,
      error: undefined,
    };
  }
  
  // Si pas de session, retourner une erreur
  if (!session?.user) {
    return {
      ...queryResult,
      loading: false,
      data: undefined,
      error: new Error('Non authentifié'),
    };
  }
  
  // Retourner le résultat de la query
  return queryResult;
};
