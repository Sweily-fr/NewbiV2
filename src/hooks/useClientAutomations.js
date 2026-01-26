import { useMutation, useQuery } from '@apollo/client';
import {
  GET_CLIENT_AUTOMATIONS,
  GET_CLIENT_AUTOMATION,
} from '@/src/graphql/queries/clientAutomations';
import {
  CREATE_CLIENT_AUTOMATION,
  UPDATE_CLIENT_AUTOMATION,
  DELETE_CLIENT_AUTOMATION,
  TOGGLE_CLIENT_AUTOMATION,
} from '@/src/graphql/mutations/clientAutomations';

export const useClientAutomations = (workspaceId) => {
  const { data, loading, error, refetch } = useQuery(GET_CLIENT_AUTOMATIONS, {
    variables: { workspaceId },
    skip: !workspaceId,
  });

  return {
    automations: data?.clientAutomations || [],
    loading,
    error,
    refetch,
  };
};

export const useClientAutomation = (workspaceId, id) => {
  const { data, loading, error, refetch } = useQuery(GET_CLIENT_AUTOMATION, {
    variables: { workspaceId, id },
    skip: !workspaceId || !id,
  });

  return {
    automation: data?.clientAutomation,
    loading,
    error,
    refetch,
  };
};

export const useCreateClientAutomation = () => {
  const [createAutomation, { loading, error }] = useMutation(CREATE_CLIENT_AUTOMATION);

  return {
    createAutomation: async (workspaceId, input) => {
      try {
        const { data } = await createAutomation({
          variables: { workspaceId, input },
          refetchQueries: [{ query: GET_CLIENT_AUTOMATIONS, variables: { workspaceId } }],
        });
        return data.createClientAutomation;
      } catch (err) {
        console.error('Erreur lors de la création de l\'automatisation:', err);
        throw err;
      }
    },
    loading,
    error,
  };
};

export const useUpdateClientAutomation = () => {
  const [updateAutomation, { loading, error }] = useMutation(UPDATE_CLIENT_AUTOMATION);

  return {
    updateAutomation: async (workspaceId, id, input) => {
      try {
        const { data } = await updateAutomation({
          variables: { workspaceId, id, input },
          refetchQueries: [{ query: GET_CLIENT_AUTOMATIONS, variables: { workspaceId } }],
        });
        return data.updateClientAutomation;
      } catch (err) {
        console.error('Erreur lors de la mise à jour de l\'automatisation:', err);
        throw err;
      }
    },
    loading,
    error,
  };
};

export const useDeleteClientAutomation = () => {
  const [deleteAutomation, { loading, error }] = useMutation(DELETE_CLIENT_AUTOMATION);

  return {
    deleteAutomation: async (workspaceId, id) => {
      try {
        const { data } = await deleteAutomation({
          variables: { workspaceId, id },
          refetchQueries: [{ query: GET_CLIENT_AUTOMATIONS, variables: { workspaceId } }],
        });
        return data.deleteClientAutomation;
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'automatisation:', err);
        throw err;
      }
    },
    loading,
    error,
  };
};

export const useToggleClientAutomation = () => {
  const [toggleAutomation, { loading, error }] = useMutation(TOGGLE_CLIENT_AUTOMATION);

  return {
    toggleAutomation: async (workspaceId, id) => {
      try {
        const { data } = await toggleAutomation({
          variables: { workspaceId, id },
          refetchQueries: [{ query: GET_CLIENT_AUTOMATIONS, variables: { workspaceId } }],
        });
        return data.toggleClientAutomation;
      } catch (err) {
        console.error('Erreur lors du basculement de l\'automatisation:', err);
        throw err;
      }
    },
    loading,
    error,
  };
};
