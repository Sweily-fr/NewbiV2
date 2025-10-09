import { useMutation } from '@apollo/client';
import { CREATE_CLIENT, UPDATE_CLIENT, DELETE_CLIENT } from '../graphql/mutations/clients';
import { GET_CLIENTS, GET_CLIENT } from '../graphql/queries/clients';
import { toast } from '@/src/components/ui/sonner';
import { useWorkspace } from './useWorkspace';
import { useErrorHandler } from './useErrorHandler';
import { 
  useOptimizedListQuery, 
  useOptimizedFormQuery 
} from './useOptimizedQuery';
import { optimizedMutate, invalidateCache } from '@/src/lib/cache-utils';
import { useApolloClient } from '@apollo/client';

/**
 * Hook optimisé pour récupérer la liste des clients avec cache intelligent
 * Utilise cache-first avec mise à jour en arrière-plan pour les performances
 */
export const useClientsOptimized = (page = 1, limit = 10, search = '') => {
  const { workspaceId } = useWorkspace();
  
  const { data, loading, error, refetch, _cacheInfo } = useOptimizedListQuery(
    GET_CLIENTS, 
    {
      variables: { workspaceId, page, limit, search },
      skip: !workspaceId,
      // Politique optimisée automatiquement appliquée pour les listes
    }
  );

  return {
    clients: data?.clients?.items || [],
    totalItems: data?.clients?.totalItems || 0,
    currentPage: data?.clients?.currentPage || 1,
    totalPages: data?.clients?.totalPages || 1,
    loading,
    error,
    refetch,
    // Informations de debug sur le cache
    fromCache: _cacheInfo?.fromCache,
    cachePolicy: _cacheInfo?.policy,
  };
};

/**
 * Hook optimisé pour récupérer un client spécifique avec cache agressif
 * Parfait pour les formulaires où les données changent rarement
 */
export const useClientOptimized = (id) => {
  const { workspaceId } = useWorkspace();
  
  const { data, loading, error, _cacheInfo } = useOptimizedFormQuery(
    GET_CLIENT, 
    {
      variables: { workspaceId, id },
      skip: !id || !workspaceId,
      // Cache agressif pour les formulaires
    }
  );

  return {
    client: data?.client,
    loading,
    error,
    fromCache: _cacheInfo?.fromCache,
  };
};

/**
 * Hook optimisé pour créer un client avec gestion intelligente du cache
 */
export const useCreateClientOptimized = () => {
  const { workspaceId } = useWorkspace();
  const { handleMutationError } = useErrorHandler();
  const apolloClient = useApolloClient();
  
  const createClient = async (input) => {
    try {
      const result = await optimizedMutate(apolloClient, CREATE_CLIENT, {
        variables: { workspaceId, input },
        
        // Réponse optimiste pour UX instantanée
        optimisticResponse: {
          createClient: {
            __typename: 'Client',
            id: `temp-${Date.now()}`, // ID temporaire
            ...input,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        },
        
        // Invalider les caches liés après succès
        invalidateQueries: ['getClients'],
        
        // Mise à jour manuelle du cache pour performance
        update: (cache, { data: { createClient: newClient } }) => {
          try {
            // Lire toutes les variantes possibles de GET_CLIENTS en cache
            const cacheKeys = [
              { workspaceId, page: 1, limit: 10, search: '' },
              { workspaceId, page: 1, limit: 20, search: '' },
              { workspaceId, page: 1, limit: 50, search: '' },
            ];
            
            cacheKeys.forEach(variables => {
              try {
                const existingClients = cache.readQuery({
                  query: GET_CLIENTS,
                  variables
                });

                if (existingClients) {
                  cache.writeQuery({
                    query: GET_CLIENTS,
                    variables,
                    data: {
                      clients: {
                        ...existingClients.clients,
                        items: [newClient, ...existingClients.clients.items],
                        totalItems: existingClients.clients.totalItems + 1
                      }
                    }
                  });
                }
              } catch {
                // Ignore si cette variante n'est pas en cache
              }
            });
          } catch (error) {
            console.warn('⚠️ Erreur mise à jour cache CREATE_CLIENT:', error);
          }
        },
      });

      toast.success('Client créé avec succès', {
        description: `${input.name} a été ajouté à vos clients`
      });
      
      return result;
    } catch (error) {
      handleMutationError(error, 'create', 'client');
      throw error;
    }
  };

  return {
    createClient,
    loading: false, // Géré par optimizedMutate
  };
};

/**
 * Hook optimisé pour modifier un client
 */
export const useUpdateClientOptimized = () => {
  const { workspaceId } = useWorkspace();
  const { handleMutationError } = useErrorHandler();
  const apolloClient = useApolloClient();
  
  const [updateClientMutation, { loading, error }] = useMutation(UPDATE_CLIENT);

  const updateClient = async (id, input) => {
    try {
      const result = await optimizedMutate(apolloClient, UPDATE_CLIENT, {
        variables: { workspaceId, id, input },
        
        // Réponse optimiste
        optimisticResponse: {
          updateClient: {
            __typename: 'Client',
            id,
            ...input,
            updatedAt: new Date().toISOString(),
          }
        },
        
        // Mise à jour intelligente du cache
        update: (cache, { data: { updateClient: updatedClient } }) => {
          try {
            // Mettre à jour le client individuel
            cache.writeQuery({
              query: GET_CLIENT,
              variables: { workspaceId, id: updatedClient.id },
              data: { client: updatedClient }
            });

            // Mettre à jour dans toutes les listes en cache
            const cacheKeys = [
              { workspaceId, page: 1, limit: 10, search: '' },
              { workspaceId, page: 1, limit: 20, search: '' },
              { workspaceId, page: 1, limit: 50, search: '' },
            ];
            
            cacheKeys.forEach(variables => {
              try {
                const existingClients = cache.readQuery({
                  query: GET_CLIENTS,
                  variables
                });

                if (existingClients) {
                  const updatedItems = existingClients.clients.items.map(client =>
                    client.id === updatedClient.id ? updatedClient : client
                  );

                  cache.writeQuery({
                    query: GET_CLIENTS,
                    variables,
                    data: {
                      clients: {
                        ...existingClients.clients,
                        items: updatedItems
                      }
                    }
                  });
                }
              } catch {
                // Ignore si cette variante n'est pas en cache
              }
            });
          } catch (error) {
            console.warn('⚠️ Erreur mise à jour cache UPDATE_CLIENT:', error);
          }
        },
      });

      toast.success('Client modifié avec succès', {
        description: `Les informations de ${input.name || 'ce client'} ont été mises à jour`
      });
      
      return result;
    } catch (error) {
      handleMutationError(error, 'update', 'client');
      throw error;
    }
  };

  return {
    updateClient,
    loading,
    error,
  };
};

/**
 * Hook optimisé pour supprimer un client
 */
export const useDeleteClientOptimized = () => {
  const { workspaceId } = useWorkspace();
  const { handleMutationError } = useErrorHandler();
  const apolloClient = useApolloClient();
  
  const [deleteClientMutation, { loading, error }] = useMutation(DELETE_CLIENT);

  const deleteClient = async (id, clientName = 'ce client') => {
    try {
      const result = await optimizedMutate(apolloClient, DELETE_CLIENT, {
        variables: { workspaceId, id },
        
        // Mise à jour immédiate du cache
        update: (cache) => {
          try {
            // Supprimer le client du cache individuel
            cache.evict({
              id: cache.identify({ __typename: 'Client', id })
            });

            // Supprimer de toutes les listes en cache
            const cacheKeys = [
              { workspaceId, page: 1, limit: 10, search: '' },
              { workspaceId, page: 1, limit: 20, search: '' },
              { workspaceId, page: 1, limit: 50, search: '' },
            ];
            
            cacheKeys.forEach(variables => {
              try {
                const existingClients = cache.readQuery({
                  query: GET_CLIENTS,
                  variables
                });

                if (existingClients) {
                  const filteredItems = existingClients.clients.items.filter(
                    client => client.id !== id
                  );

                  cache.writeQuery({
                    query: GET_CLIENTS,
                    variables,
                    data: {
                      clients: {
                        ...existingClients.clients,
                        items: filteredItems,
                        totalItems: existingClients.clients.totalItems - 1
                      }
                    }
                  });
                }
              } catch {
                // Ignore si cette variante n'est pas en cache
              }
            });

            // Nettoyer les références orphelines
            cache.gc();
          } catch (error) {
            console.warn('⚠️ Erreur mise à jour cache DELETE_CLIENT:', error);
          }
        },
      });

      toast.success('Client supprimé avec succès', {
        description: `${clientName} a été retiré de vos clients`
      });
      
      return result;
    } catch (error) {
      handleMutationError(error, 'delete', 'client');
      throw error;
    }
  };

  return {
    deleteClient,
    loading,
    error,
  };
};

/**
 * Hook pour précharger les clients critiques
 */
export const usePreloadClients = () => {
  const { workspaceId } = useWorkspace();
  const apolloClient = useApolloClient();

  const preloadClients = async () => {
    if (!workspaceId) return;

    try {
      // Précharger la première page des clients
      await apolloClient.query({
        query: GET_CLIENTS,
        variables: { workspaceId, page: 1, limit: 20, search: '' },
        fetchPolicy: 'network-only',
        errorPolicy: 'ignore',
      });
      
      console.log('🚀 Clients préchargés avec succès');
    } catch (error) {
      console.warn('⚠️ Erreur préchargement clients:', error);
    }
  };

  return { preloadClients };
};

/**
 * Hook pour gérer le cache des clients
 */
export const useClientCache = () => {
  const apolloClient = useApolloClient();

  const clearClientCache = () => {
    invalidateCache(apolloClient, ['getClients', 'getClient']);
    toast.info('Cache des clients vidé');
  };

  const refreshClients = async () => {
    try {
      await apolloClient.refetchQueries({
        include: [GET_CLIENTS, GET_CLIENT],
      });
      toast.success('Données clients actualisées');
    } catch (error) {
      toast.error('Erreur lors de l\'actualisation');
    }
  };

  return {
    clearClientCache,
    refreshClients,
  };
};
