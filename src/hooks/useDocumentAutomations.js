import { useMutation, useQuery, gql } from '@apollo/client';

// Queries
const GET_DOCUMENT_AUTOMATIONS = gql`
  query GetDocumentAutomations($workspaceId: ID!) {
    documentAutomations(workspaceId: $workspaceId) {
      id
      name
      description
      workspaceId
      triggerType
      actionConfig {
        targetFolderId
        targetFolder {
          id
          name
          parentId
        }
        createSubfolder
        subfolderPattern
        documentNaming
        tags
        documentStatus
      }
      isActive
      stats {
        totalExecutions
        lastExecutedAt
        lastDocumentId
        failedExecutions
      }
      createdAt
      updatedAt
    }
  }
`;

const GET_DOCUMENT_AUTOMATION = gql`
  query GetDocumentAutomation($workspaceId: ID!, $id: ID!) {
    documentAutomation(workspaceId: $workspaceId, id: $id) {
      id
      name
      description
      workspaceId
      triggerType
      actionConfig {
        targetFolderId
        targetFolder {
          id
          name
          parentId
        }
        createSubfolder
        subfolderPattern
        documentNaming
        tags
        documentStatus
      }
      isActive
      stats {
        totalExecutions
        lastExecutedAt
        lastDocumentId
        failedExecutions
      }
      createdAt
      updatedAt
    }
  }
`;

const GET_DOCUMENT_AUTOMATION_LOGS = gql`
  query GetDocumentAutomationLogs($workspaceId: ID!, $automationId: ID, $limit: Int) {
    documentAutomationLogs(workspaceId: $workspaceId, automationId: $automationId, limit: $limit) {
      id
      automationId
      sourceDocumentType
      sourceDocumentId
      sourceDocumentNumber
      sharedDocumentId
      targetFolderId
      targetFolderName
      status
      error
      fileName
      fileSize
      createdAt
    }
  }
`;

// Mutations
const CREATE_DOCUMENT_AUTOMATION = gql`
  mutation CreateDocumentAutomation($workspaceId: ID!, $input: CreateDocumentAutomationInput!) {
    createDocumentAutomation(workspaceId: $workspaceId, input: $input) {
      id
      name
      description
      triggerType
      actionConfig {
        targetFolderId
        targetFolder {
          id
          name
        }
        createSubfolder
        subfolderPattern
        documentNaming
        tags
        documentStatus
      }
      isActive
      stats {
        totalExecutions
        lastExecutedAt
        failedExecutions
      }
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_DOCUMENT_AUTOMATION = gql`
  mutation UpdateDocumentAutomation($workspaceId: ID!, $id: ID!, $input: UpdateDocumentAutomationInput!) {
    updateDocumentAutomation(workspaceId: $workspaceId, id: $id, input: $input) {
      id
      name
      description
      triggerType
      actionConfig {
        targetFolderId
        targetFolder {
          id
          name
        }
        createSubfolder
        subfolderPattern
        documentNaming
        tags
        documentStatus
      }
      isActive
      stats {
        totalExecutions
        lastExecutedAt
        failedExecutions
      }
      createdAt
      updatedAt
    }
  }
`;

const DELETE_DOCUMENT_AUTOMATION = gql`
  mutation DeleteDocumentAutomation($workspaceId: ID!, $id: ID!) {
    deleteDocumentAutomation(workspaceId: $workspaceId, id: $id)
  }
`;

const TOGGLE_DOCUMENT_AUTOMATION = gql`
  mutation ToggleDocumentAutomation($workspaceId: ID!, $id: ID!) {
    toggleDocumentAutomation(workspaceId: $workspaceId, id: $id) {
      id
      isActive
      stats {
        totalExecutions
        lastExecutedAt
        failedExecutions
      }
    }
  }
`;

const TEST_DOCUMENT_AUTOMATION = gql`
  mutation TestDocumentAutomation($workspaceId: ID!, $id: ID!) {
    testDocumentAutomation(workspaceId: $workspaceId, id: $id)
  }
`;

export const useDocumentAutomations = (workspaceId) => {
  const { data, loading, error, refetch } = useQuery(GET_DOCUMENT_AUTOMATIONS, {
    variables: { workspaceId },
    skip: !workspaceId,
  });

  return {
    automations: data?.documentAutomations || [],
    loading,
    error,
    refetch,
  };
};

export const useDocumentAutomation = (workspaceId, id) => {
  const { data, loading, error, refetch } = useQuery(GET_DOCUMENT_AUTOMATION, {
    variables: { workspaceId, id },
    skip: !workspaceId || !id,
  });

  return {
    automation: data?.documentAutomation,
    loading,
    error,
    refetch,
  };
};

export const useDocumentAutomationLogs = (workspaceId, automationId, limit) => {
  const { data, loading, error, refetch } = useQuery(GET_DOCUMENT_AUTOMATION_LOGS, {
    variables: { workspaceId, automationId, limit },
    skip: !workspaceId,
  });

  return {
    logs: data?.documentAutomationLogs || [],
    loading,
    error,
    refetch,
  };
};

export const useCreateDocumentAutomation = () => {
  const [createAutomation, { loading, error }] = useMutation(CREATE_DOCUMENT_AUTOMATION);

  return {
    createAutomation: async (workspaceId, input) => {
      try {
        const { data } = await createAutomation({
          variables: { workspaceId, input },
          refetchQueries: [{ query: GET_DOCUMENT_AUTOMATIONS, variables: { workspaceId } }],
        });
        return data.createDocumentAutomation;
      } catch (err) {
        console.error('Erreur lors de la création de l\'automatisation:', err);
        throw err;
      }
    },
    loading,
    error,
  };
};

export const useUpdateDocumentAutomation = () => {
  const [updateAutomation, { loading, error }] = useMutation(UPDATE_DOCUMENT_AUTOMATION);

  return {
    updateAutomation: async (workspaceId, id, input) => {
      try {
        const { data } = await updateAutomation({
          variables: { workspaceId, id, input },
          refetchQueries: [{ query: GET_DOCUMENT_AUTOMATIONS, variables: { workspaceId } }],
        });
        return data.updateDocumentAutomation;
      } catch (err) {
        console.error('Erreur lors de la mise à jour de l\'automatisation:', err);
        throw err;
      }
    },
    loading,
    error,
  };
};

export const useDeleteDocumentAutomation = () => {
  const [deleteAutomation, { loading, error }] = useMutation(DELETE_DOCUMENT_AUTOMATION);

  return {
    deleteAutomation: async (workspaceId, id) => {
      try {
        const { data } = await deleteAutomation({
          variables: { workspaceId, id },
          refetchQueries: [{ query: GET_DOCUMENT_AUTOMATIONS, variables: { workspaceId } }],
        });
        return data.deleteDocumentAutomation;
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'automatisation:', err);
        throw err;
      }
    },
    loading,
    error,
  };
};

export const useToggleDocumentAutomation = () => {
  const [toggleAutomation, { loading, error }] = useMutation(TOGGLE_DOCUMENT_AUTOMATION);

  return {
    toggleAutomation: async (workspaceId, id) => {
      try {
        const { data } = await toggleAutomation({
          variables: { workspaceId, id },
          refetchQueries: [{ query: GET_DOCUMENT_AUTOMATIONS, variables: { workspaceId } }],
        });
        return data.toggleDocumentAutomation;
      } catch (err) {
        console.error('Erreur lors du basculement de l\'automatisation:', err);
        throw err;
      }
    },
    loading,
    error,
  };
};

export const useTestDocumentAutomation = () => {
  const [testAutomation, { loading, error }] = useMutation(TEST_DOCUMENT_AUTOMATION);

  return {
    testAutomation: async (workspaceId, id) => {
      try {
        const { data } = await testAutomation({
          variables: { workspaceId, id },
        });
        return data.testDocumentAutomation;
      } catch (err) {
        console.error('Erreur lors du test de l\'automatisation:', err);
        throw err;
      }
    },
    loading,
    error,
  };
};
