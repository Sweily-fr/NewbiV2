import { useMutation, useQuery } from '@apollo/client';
import { CREATE_CLIENT, UPDATE_CLIENT, DELETE_CLIENT } from '../graphql/mutations/clients';
import { GET_CLIENTS, GET_CLIENT } from '../graphql/queries/clients';
import { toast } from '@/src/components/ui/sonner';

export const useClients = (page = 1, limit = 10, search = '') => {
  const { data, loading, error, refetch } = useQuery(GET_CLIENTS, {
    variables: { page, limit, search },
    fetchPolicy: 'cache-and-network',
  });

  return {
    clients: data?.clients?.items || [],
    totalItems: data?.clients?.totalItems || 0,
    currentPage: data?.clients?.currentPage || 1,
    totalPages: data?.clients?.totalPages || 1,
    loading,
    error,
    refetch,
  };
};

export const useClient = (id) => {
  const { data, loading, error } = useQuery(GET_CLIENT, {
    variables: { id },
    skip: !id,
  });

  return {
    client: data?.client,
    loading,
    error,
  };
};

export const useCreateClient = () => {
  const [createClient, { loading, error }] = useMutation(CREATE_CLIENT, {
    refetchQueries: [{ query: GET_CLIENTS }],
    onCompleted: () => {
      toast.success('Client créé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création du client');
      console.error('Create client error:', error);
    },
  });

  return {
    createClient: (input) => createClient({ variables: { input } }),
    loading,
    error,
  };
};

export const useUpdateClient = () => {
  const [updateClient, { loading, error }] = useMutation(UPDATE_CLIENT, {
    refetchQueries: [{ query: GET_CLIENTS }],
    onCompleted: () => {
      toast.success('Client modifié avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la modification du client');
      console.error('Update client error:', error);
    },
  });

  return {
    updateClient: (id, input) => updateClient({ variables: { id, input } }),
    loading,
    error,
  };
};

export const useDeleteClient = () => {
  const [deleteClient, { loading, error }] = useMutation(DELETE_CLIENT, {
    refetchQueries: [{ query: GET_CLIENTS }],
    onCompleted: () => {
      toast.success('Client supprimé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression du client');
      console.error('Delete client error:', error);
    },
  });

  return {
    deleteClient: (id) => deleteClient({ variables: { id } }),
    loading,
    error,
  };
};
