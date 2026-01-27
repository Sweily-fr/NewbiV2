import { useQuery, useMutation } from '@apollo/client';
import { GET_CLIENT_CUSTOM_FIELDS } from '../graphql/queries/clientCustomFields';
import {
  CREATE_CLIENT_CUSTOM_FIELD,
  UPDATE_CLIENT_CUSTOM_FIELD,
  DELETE_CLIENT_CUSTOM_FIELD,
  REORDER_CLIENT_CUSTOM_FIELDS,
} from '../graphql/mutations/clientCustomFields';
import { toast } from '@/src/components/ui/sonner';

// Types de champs disponibles avec leurs labels
export const FIELD_TYPES = [
  { value: 'TEXT', label: 'Texte court', icon: 'Type' },
  { value: 'TEXTAREA', label: 'Texte long', icon: 'AlignLeft' },
  { value: 'NUMBER', label: 'Nombre', icon: 'Hash' },
  { value: 'DATE', label: 'Date', icon: 'Calendar' },
  { value: 'SELECT', label: 'Choix unique', icon: 'ChevronDown' },
  { value: 'MULTISELECT', label: 'Choix multiple', icon: 'CheckSquare' },
  { value: 'CHECKBOX', label: 'Case à cocher', icon: 'CheckCircle' },
  { value: 'URL', label: 'Lien URL', icon: 'Link' },
  { value: 'EMAIL', label: 'Email', icon: 'Mail' },
  { value: 'PHONE', label: 'Téléphone', icon: 'Phone' },
];

// Hook pour récupérer les champs personnalisés
export function useClientCustomFields(workspaceId) {
  const { data, loading, error, refetch } = useQuery(GET_CLIENT_CUSTOM_FIELDS, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    fields: data?.clientCustomFields || [],
    loading,
    error,
    refetch,
  };
}

// Hook pour créer un champ personnalisé
export function useCreateClientCustomField() {
  const [createMutation, { loading }] = useMutation(CREATE_CLIENT_CUSTOM_FIELD, {
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la création du champ');
    },
  });

  const createField = async (workspaceId, input) => {
    const result = await createMutation({
      variables: { workspaceId, input },
      refetchQueries: [{ query: GET_CLIENT_CUSTOM_FIELDS, variables: { workspaceId } }],
    });
    return result.data?.createClientCustomField;
  };

  return { createField, loading };
}

// Hook pour modifier un champ personnalisé
export function useUpdateClientCustomField() {
  const [updateMutation, { loading }] = useMutation(UPDATE_CLIENT_CUSTOM_FIELD, {
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la modification du champ');
    },
  });

  const updateField = async (workspaceId, id, input) => {
    const result = await updateMutation({
      variables: { workspaceId, id, input },
      refetchQueries: [{ query: GET_CLIENT_CUSTOM_FIELDS, variables: { workspaceId } }],
    });
    return result.data?.updateClientCustomField;
  };

  return { updateField, loading };
}

// Hook pour supprimer un champ personnalisé
export function useDeleteClientCustomField() {
  const [deleteMutation, { loading }] = useMutation(DELETE_CLIENT_CUSTOM_FIELD, {
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la suppression du champ');
    },
  });

  const deleteField = async (workspaceId, id) => {
    const result = await deleteMutation({
      variables: { workspaceId, id },
      refetchQueries: [{ query: GET_CLIENT_CUSTOM_FIELDS, variables: { workspaceId } }],
    });
    return result.data?.deleteClientCustomField;
  };

  return { deleteField, loading };
}

// Hook pour réordonner les champs personnalisés
export function useReorderClientCustomFields() {
  const [reorderMutation, { loading }] = useMutation(REORDER_CLIENT_CUSTOM_FIELDS, {
    onError: (error) => {
      toast.error(error.message || 'Erreur lors du réordonnancement');
    },
  });

  const reorderFields = async (workspaceId, fieldIds) => {
    const result = await reorderMutation({
      variables: { workspaceId, fieldIds },
      refetchQueries: [{ query: GET_CLIENT_CUSTOM_FIELDS, variables: { workspaceId } }],
    });
    return result.data?.reorderClientCustomFields;
  };

  return { reorderFields, loading };
}
