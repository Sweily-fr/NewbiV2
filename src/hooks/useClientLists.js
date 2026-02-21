import { useMutation, useQuery } from '@apollo/client';
import {
  GET_CLIENT_LISTS,
  GET_CLIENT_LIST,
  GET_CLIENTS_IN_LIST,
  GET_CLIENT_LISTS_BY_CLIENT
} from '@/src/graphql/queries/clientLists';
import {
  CREATE_CLIENT_LIST,
  UPDATE_CLIENT_LIST,
  DELETE_CLIENT_LIST,
  ADD_CLIENT_TO_LIST,
  REMOVE_CLIENT_FROM_LIST,
  ADD_CLIENTS_TO_LIST,
  REMOVE_CLIENTS_FROM_LIST,
  ADD_CLIENT_TO_LISTS,
  REMOVE_CLIENT_FROM_LISTS
} from '@/src/graphql/mutations/clientLists';

export const useClientLists = (workspaceId) => {
  const { data, loading, error, refetch } = useQuery(GET_CLIENT_LISTS, {
    variables: { workspaceId },
    skip: !workspaceId
  });

  return {
    lists: data?.clientLists || [],
    loading,
    error,
    refetch
  };
};

export const useClientList = (workspaceId, listId) => {
  const { data, loading, error, refetch } = useQuery(GET_CLIENT_LIST, {
    variables: { workspaceId, id: listId },
    skip: !workspaceId || !listId
  });

  return {
    list: data?.clientList,
    loading,
    error,
    refetch
  };
};

export const useClientsInList = (workspaceId, listId, page = 1, limit = 10, search = '') => {
  const { data, loading, error, refetch } = useQuery(GET_CLIENTS_IN_LIST, {
    variables: { workspaceId, listId, page, limit, search },
    skip: !workspaceId || !listId,
    refetchPolicy: 'network-only'
  });

  return {
    clients: data?.clientsInList?.items || [],
    totalItems: data?.clientsInList?.totalItems || 0,
    currentPage: data?.clientsInList?.currentPage || 1,
    totalPages: data?.clientsInList?.totalPages || 1,
    loading,
    error,
    refetch
  };
};

export const useCreateClientList = () => {
  const [createList, { loading, error }] = useMutation(CREATE_CLIENT_LIST);

  return {
    createList: async (workspaceId, input) => {
      try {
        const { data } = await createList({
          variables: { workspaceId, input },
          refetchQueries: [{ query: GET_CLIENT_LISTS, variables: { workspaceId } }],
        });
        return data.createClientList;
      } catch (err) {
        console.error('Erreur lors de la création de la liste:', err);
        throw err;
      }
    },
    loading,
    error
  };
};

export const useUpdateClientList = () => {
  const [updateList, { loading, error }] = useMutation(UPDATE_CLIENT_LIST);

  return {
    updateList: async (workspaceId, id, input) => {
      try {
        const { data } = await updateList({
          variables: { workspaceId, id, input },
          refetchQueries: [{ query: GET_CLIENT_LISTS, variables: { workspaceId } }],
        });
        return data.updateClientList;
      } catch (err) {
        console.error('Erreur lors de la mise à jour de la liste:', err);
        throw err;
      }
    },
    loading,
    error
  };
};

export const useDeleteClientList = () => {
  const [deleteList, { loading, error }] = useMutation(DELETE_CLIENT_LIST);

  return {
    deleteList: async (workspaceId, id) => {
      try {
        const { data } = await deleteList({
          variables: { workspaceId, id },
          refetchQueries: [{ query: GET_CLIENT_LISTS, variables: { workspaceId } }],
        });
        return data.deleteClientList;
      } catch (err) {
        console.error('Erreur lors de la suppression de la liste:', err);
        throw err;
      }
    },
    loading,
    error
  };
};

export const useAddClientToList = () => {
  const [addClient, { loading, error }] = useMutation(ADD_CLIENT_TO_LIST);

  return {
    addClient: async (workspaceId, listId, clientId) => {
      try {
        const { data } = await addClient({
          variables: { workspaceId, listId, clientId },
          refetchQueries: [
            { query: GET_CLIENT_LISTS, variables: { workspaceId } },
            { query: GET_CLIENT_LISTS_BY_CLIENT, variables: { workspaceId, clientId } },
          ],
        });
        return data.addClientToList;
      } catch (err) {
        console.error('Erreur lors de l\'ajout du client à la liste:', err);
        throw err;
      }
    },
    loading,
    error
  };
};

export const useRemoveClientFromList = () => {
  const [removeClient, { loading, error }] = useMutation(REMOVE_CLIENT_FROM_LIST);

  return {
    removeClient: async (workspaceId, listId, clientId) => {
      try {
        const { data } = await removeClient({
          variables: { workspaceId, listId, clientId },
          refetchQueries: [
            { query: GET_CLIENT_LISTS, variables: { workspaceId } },
            { query: GET_CLIENT_LISTS_BY_CLIENT, variables: { workspaceId, clientId } },
          ],
        });
        return data.removeClientFromList;
      } catch (err) {
        console.error('Erreur lors de la suppression du client de la liste:', err);
        throw err;
      }
    },
    loading,
    error
  };
};

export const useAddClientsToList = () => {
  const [addClients, { loading, error }] = useMutation(ADD_CLIENTS_TO_LIST);

  return {
    addClients: async (workspaceId, listId, clientIds) => {
      try {
        const { data } = await addClients({
          variables: { workspaceId, listId, clientIds },
          refetchQueries: [{ query: GET_CLIENT_LISTS, variables: { workspaceId } }],
        });
        return data.addClientsToList;
      } catch (err) {
        console.error('Erreur lors de l\'ajout des clients à la liste:', err);
        throw err;
      }
    },
    loading,
    error
  };
};

export const useRemoveClientsFromList = () => {
  const [removeClients, { loading, error }] = useMutation(REMOVE_CLIENTS_FROM_LIST);

  return {
    removeClients: async (workspaceId, listId, clientIds) => {
      try {
        const { data } = await removeClients({
          variables: { workspaceId, listId, clientIds },
          refetchQueries: [{ query: GET_CLIENT_LISTS, variables: { workspaceId } }],
        });
        return data.removeClientsFromList;
      } catch (err) {
        console.error('Erreur lors de la suppression des clients de la liste:', err);
        throw err;
      }
    },
    loading,
    error
  };
};

export const useAddClientToLists = () => {
  const [addToLists, { loading, error }] = useMutation(ADD_CLIENT_TO_LISTS);

  return {
    addToLists: async (workspaceId, clientId, listIds) => {
      try {
        const { data } = await addToLists({
          variables: { workspaceId, clientId, listIds },
          refetchQueries: [
            { query: GET_CLIENT_LISTS, variables: { workspaceId } },
            { query: GET_CLIENT_LISTS_BY_CLIENT, variables: { workspaceId, clientId } },
          ],
        });
        return data.addClientToLists;
      } catch (err) {
        console.error('Erreur lors de l\'ajout du client aux listes:', err);
        throw err;
      }
    },
    loading,
    error
  };
};

export const useRemoveClientFromLists = () => {
  const [removeFromLists, { loading, error }] = useMutation(REMOVE_CLIENT_FROM_LISTS);

  return {
    removeFromLists: async (workspaceId, clientId, listIds) => {
      try {
        const { data } = await removeFromLists({
          variables: { workspaceId, clientId, listIds },
          refetchQueries: [
            { query: GET_CLIENT_LISTS, variables: { workspaceId } },
            { query: GET_CLIENT_LISTS_BY_CLIENT, variables: { workspaceId, clientId } },
          ],
        });
        return data.removeClientFromLists;
      } catch (err) {
        console.error('Erreur lors de la suppression du client des listes:', err);
        throw err;
      }
    },
    loading,
    error
  };
};

export const useClientListsByClient = (workspaceId, clientId) => {
  const { data, loading, error, refetch } = useQuery(GET_CLIENT_LISTS_BY_CLIENT, {
    variables: { workspaceId, clientId },
    skip: !workspaceId || !clientId,
    refetchPolicy: 'network-only'
  });

  return {
    lists: data?.clientListsByClient || [],
    loading,
    error,
    refetch
  };
};
