import { useMutation, useQuery } from '@apollo/client';
import { CREATE_CLIENT, UPDATE_CLIENT, DELETE_CLIENT } from '../graphql/mutations/clients';
import { GET_CLIENTS, GET_CLIENT } from '../graphql/queries/clients';
import { toast } from '@/src/components/ui/sonner';
import { useWorkspace } from './useWorkspace';
import { useErrorHandler } from './useErrorHandler';

export const useClients = (page = 1, limit = 10, search = '') => {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  
  const { data, loading: queryLoading, error, refetch } = useQuery(GET_CLIENTS, {
    variables: { workspaceId, page, limit, search },
    skip: !workspaceId,
    fetchPolicy: 'network-only',
  });

  return {
    clients: data?.clients?.items || [],
    totalItems: data?.clients?.totalItems || 0,
    currentPage: data?.clients?.currentPage || 1,
    totalPages: data?.clients?.totalPages || 1,
    loading: (workspaceLoading && !workspaceId) || (queryLoading && !data?.clients),
    error,
    refetch,
  };
};

export const useClient = (id) => {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  
  const { data, loading: queryLoading, error } = useQuery(GET_CLIENT, {
    variables: { workspaceId, id },
    skip: !id || !workspaceId,
  });

  return {
    client: data?.client,
    loading: (workspaceLoading && !workspaceId) || (queryLoading && !data?.client),
    error,
  };
};

export const useCreateClient = () => {
  const { workspaceId } = useWorkspace();
  const { handleMutationError } = useErrorHandler();
  
  const [createClient, { loading, error }] = useMutation(CREATE_CLIENT, {
    update: (cache, { data: { createClient: newClient } }) => {
      try {
        // Lire la query existante
        const existingClients = cache.readQuery({
          query: GET_CLIENTS,
          variables: { workspaceId, page: 1, limit: 10, search: '' }
        });

        if (existingClients) {
          // Ajouter le nouveau client au début de la liste
          cache.writeQuery({
            query: GET_CLIENTS,
            variables: { workspaceId, page: 1, limit: 10, search: '' },
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
        // Si la query n'existe pas dans le cache, on l'ignore
      }
    },
    onCompleted: () => {
      toast.success('Client créé avec succès');
    },
    onError: (error) => {
      handleMutationError(error, 'create', 'client');
    },
  });

  return {
    createClient: async (input) => {
      const result = await createClient({ variables: { workspaceId, input } });
      return result?.data?.createClient;
    },
    loading,
    error,
  };
};

export const useUpdateClient = () => {
  const { workspaceId } = useWorkspace();
  const { handleMutationError } = useErrorHandler();
  
  const [updateClient, { loading, error }] = useMutation(UPDATE_CLIENT, {
    update: (cache, { data: { updateClient: updatedClient } }) => {
      // Mettre à jour le client dans le cache GET_CLIENT
      cache.writeQuery({
        query: GET_CLIENT,
        variables: { workspaceId, id: updatedClient.id },
        data: { client: updatedClient }
      });

      // Mettre à jour le client dans la liste GET_CLIENTS
      try {
        const existingClients = cache.readQuery({
          query: GET_CLIENTS,
          variables: { workspaceId, page: 1, limit: 10, search: '' }
        });

        if (existingClients) {
          const updatedItems = existingClients.clients.items.map(client =>
            client.id === updatedClient.id ? updatedClient : client
          );

          cache.writeQuery({
            query: GET_CLIENTS,
            variables: { workspaceId, page: 1, limit: 10, search: '' },
            data: {
              clients: {
                ...existingClients.clients,
                items: updatedItems
              }
            }
          });
        }
      } catch {
        // Si la query n'existe pas dans le cache, on l'ignore
      }
    },
    onCompleted: () => {
      toast.success('Client modifié avec succès');
    },
    onError: (error) => {
      handleMutationError(error, 'update', 'client');
    },
  });

  return {
    updateClient: async (id, input) => {
      const result = await updateClient({ variables: { workspaceId, id, input } });
      return result?.data?.updateClient;
    },
    loading,
    error,
  };
};

export const useDeleteClient = () => {
  const { workspaceId } = useWorkspace();
  const { handleMutationError } = useErrorHandler();
  
  const [deleteClient, { loading, error }] = useMutation(DELETE_CLIENT, {
    update: (cache, {}, { variables: { id } }) => {
      // Supprimer le client du cache GET_CLIENT
      cache.evict({
        id: cache.identify({ __typename: 'Client', id })
      });

      // Supprimer le client de la liste GET_CLIENTS
      try {
        const existingClients = cache.readQuery({
          query: GET_CLIENTS,
          variables: { workspaceId, page: 1, limit: 10, search: '' }
        });

        if (existingClients) {
          const filteredItems = existingClients.clients.items.filter(client => client.id !== id);

          cache.writeQuery({
            query: GET_CLIENTS,
            variables: { workspaceId, page: 1, limit: 10, search: '' },
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
        // Si la query n'existe pas dans le cache, on l'ignore
      }

      // Nettoyer le cache
      cache.gc();
    },
    onCompleted: () => {
      toast.success('Client supprimé avec succès');
    },
    onError: (error) => {
      handleMutationError(error, 'delete', 'client');
    },
  });

  return {
    deleteClient: (id) => deleteClient({ variables: { workspaceId, id } }),
    loading,
    error,
  };
};
