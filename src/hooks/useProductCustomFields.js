import { useQuery, useMutation } from '@apollo/client';
import { GET_PRODUCT_CUSTOM_FIELDS } from '../graphql/queries/productCustomFields';
import {
  CREATE_PRODUCT_CUSTOM_FIELD,
  UPDATE_PRODUCT_CUSTOM_FIELD,
  DELETE_PRODUCT_CUSTOM_FIELD,
  REORDER_PRODUCT_CUSTOM_FIELDS,
} from '../graphql/mutations/productCustomFields';
import { toast } from '@/src/components/ui/sonner';

// Ré-exporter FIELD_TYPES depuis les champs clients (types partagés)
export { FIELD_TYPES } from './useClientCustomFields';

// Hook pour récupérer les champs personnalisés produits
export function useProductCustomFields(workspaceId) {
  const { data, loading, error, refetch } = useQuery(GET_PRODUCT_CUSTOM_FIELDS, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    fields: data?.productCustomFields || [],
    loading,
    error,
    refetch,
  };
}

// Hook pour créer un champ personnalisé produit
export function useCreateProductCustomField() {
  const [createMutation, { loading }] = useMutation(CREATE_PRODUCT_CUSTOM_FIELD, {
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la création du champ');
    },
  });

  const createField = async (workspaceId, input) => {
    const result = await createMutation({
      variables: { workspaceId, input },
      refetchQueries: [{ query: GET_PRODUCT_CUSTOM_FIELDS, variables: { workspaceId } }],
    });
    return result.data?.createProductCustomField;
  };

  return { createField, loading };
}

// Hook pour modifier un champ personnalisé produit
export function useUpdateProductCustomField() {
  const [updateMutation, { loading }] = useMutation(UPDATE_PRODUCT_CUSTOM_FIELD, {
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la modification du champ');
    },
  });

  const updateField = async (workspaceId, id, input) => {
    const result = await updateMutation({
      variables: { workspaceId, id, input },
      refetchQueries: [{ query: GET_PRODUCT_CUSTOM_FIELDS, variables: { workspaceId } }],
    });
    return result.data?.updateProductCustomField;
  };

  return { updateField, loading };
}

// Hook pour supprimer un champ personnalisé produit
export function useDeleteProductCustomField() {
  const [deleteMutation, { loading }] = useMutation(DELETE_PRODUCT_CUSTOM_FIELD, {
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la suppression du champ');
    },
  });

  const deleteField = async (workspaceId, id) => {
    const result = await deleteMutation({
      variables: { workspaceId, id },
      refetchQueries: [{ query: GET_PRODUCT_CUSTOM_FIELDS, variables: { workspaceId } }],
    });
    return result.data?.deleteProductCustomField;
  };

  return { deleteField, loading };
}

// Hook pour réordonner les champs personnalisés produits
export function useReorderProductCustomFields() {
  const [reorderMutation, { loading }] = useMutation(REORDER_PRODUCT_CUSTOM_FIELDS, {
    onError: (error) => {
      toast.error(error.message || 'Erreur lors du réordonnancement');
    },
  });

  const reorderFields = async (workspaceId, fieldIds) => {
    const result = await reorderMutation({
      variables: { workspaceId, fieldIds },
      refetchQueries: [{ query: GET_PRODUCT_CUSTOM_FIELDS, variables: { workspaceId } }],
    });
    return result.data?.reorderProductCustomFields;
  };

  return { reorderFields, loading };
}
