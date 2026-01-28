import { useMutation, useQuery } from '@apollo/client';
import {
  GET_CRM_EMAIL_AUTOMATIONS,
  GET_CRM_EMAIL_AUTOMATION,
  GET_CRM_EMAIL_AUTOMATION_LOGS,
} from '@/src/graphql/queries/crmEmailAutomations';
import {
  CREATE_CRM_EMAIL_AUTOMATION,
  UPDATE_CRM_EMAIL_AUTOMATION,
  DELETE_CRM_EMAIL_AUTOMATION,
  TOGGLE_CRM_EMAIL_AUTOMATION,
  TEST_CRM_EMAIL_AUTOMATION,
} from '@/src/graphql/mutations/crmEmailAutomations';
import { toast } from '@/src/components/ui/sonner';

// Hook pour récupérer toutes les automatisations email CRM
export const useCrmEmailAutomations = (workspaceId) => {
  const { data, loading, error, refetch } = useQuery(GET_CRM_EMAIL_AUTOMATIONS, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    automations: data?.crmEmailAutomations || [],
    loading,
    error,
    refetch,
  };
};

// Hook pour récupérer une automatisation spécifique
export const useCrmEmailAutomation = (workspaceId, id) => {
  const { data, loading, error, refetch } = useQuery(GET_CRM_EMAIL_AUTOMATION, {
    variables: { workspaceId, id },
    skip: !workspaceId || !id,
  });

  return {
    automation: data?.crmEmailAutomation,
    loading,
    error,
    refetch,
  };
};

// Hook pour récupérer les logs d'une automatisation
export const useCrmEmailAutomationLogs = (workspaceId, automationId, limit = 50) => {
  const { data, loading, error, refetch } = useQuery(GET_CRM_EMAIL_AUTOMATION_LOGS, {
    variables: { workspaceId, automationId, limit },
    skip: !workspaceId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    logs: data?.crmEmailAutomationLogs || [],
    loading,
    error,
    refetch,
  };
};

// Hook pour créer une automatisation
export const useCreateCrmEmailAutomation = () => {
  const [createMutation, { loading, error }] = useMutation(CREATE_CRM_EMAIL_AUTOMATION, {
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la création de l\'automatisation');
    },
  });

  const createAutomation = async (workspaceId, input) => {
    try {
      const { data } = await createMutation({
        variables: { workspaceId, input },
        refetchQueries: [{ query: GET_CRM_EMAIL_AUTOMATIONS, variables: { workspaceId } }],
      });
      return data.createCrmEmailAutomation;
    } catch (err) {
      console.error('Erreur lors de la création de l\'automatisation email:', err);
      throw err;
    }
  };

  return { createAutomation, loading, error };
};

// Hook pour modifier une automatisation
export const useUpdateCrmEmailAutomation = () => {
  const [updateMutation, { loading, error }] = useMutation(UPDATE_CRM_EMAIL_AUTOMATION, {
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la modification de l\'automatisation');
    },
  });

  const updateAutomation = async (workspaceId, id, input) => {
    try {
      const { data } = await updateMutation({
        variables: { workspaceId, id, input },
        refetchQueries: [{ query: GET_CRM_EMAIL_AUTOMATIONS, variables: { workspaceId } }],
      });
      return data.updateCrmEmailAutomation;
    } catch (err) {
      console.error('Erreur lors de la modification de l\'automatisation email:', err);
      throw err;
    }
  };

  return { updateAutomation, loading, error };
};

// Hook pour supprimer une automatisation
export const useDeleteCrmEmailAutomation = () => {
  const [deleteMutation, { loading, error }] = useMutation(DELETE_CRM_EMAIL_AUTOMATION, {
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la suppression de l\'automatisation');
    },
  });

  const deleteAutomation = async (workspaceId, id) => {
    try {
      const { data } = await deleteMutation({
        variables: { workspaceId, id },
        refetchQueries: [{ query: GET_CRM_EMAIL_AUTOMATIONS, variables: { workspaceId } }],
      });
      return data.deleteCrmEmailAutomation;
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'automatisation email:', err);
      throw err;
    }
  };

  return { deleteAutomation, loading, error };
};

// Hook pour activer/désactiver une automatisation
export const useToggleCrmEmailAutomation = () => {
  const [toggleMutation, { loading, error }] = useMutation(TOGGLE_CRM_EMAIL_AUTOMATION, {
    onError: (error) => {
      toast.error(error.message || 'Erreur lors du basculement de l\'automatisation');
    },
  });

  const toggleAutomation = async (workspaceId, id) => {
    try {
      const { data } = await toggleMutation({
        variables: { workspaceId, id },
        refetchQueries: [{ query: GET_CRM_EMAIL_AUTOMATIONS, variables: { workspaceId } }],
      });
      return data.toggleCrmEmailAutomation;
    } catch (err) {
      console.error('Erreur lors du basculement de l\'automatisation email:', err);
      throw err;
    }
  };

  return { toggleAutomation, loading, error };
};

// Hook pour tester une automatisation
export const useTestCrmEmailAutomation = () => {
  const [testMutation, { loading, error }] = useMutation(TEST_CRM_EMAIL_AUTOMATION, {
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de l\'envoi de l\'email de test');
    },
  });

  const testAutomation = async (workspaceId, id, testEmail) => {
    try {
      const { data } = await testMutation({
        variables: { workspaceId, id, testEmail },
      });
      if (data.testCrmEmailAutomation) {
        toast.success('Email de test envoyé avec succès');
      }
      return data.testCrmEmailAutomation;
    } catch (err) {
      console.error('Erreur lors de l\'envoi de l\'email de test:', err);
      throw err;
    }
  };

  return { testAutomation, loading, error };
};
