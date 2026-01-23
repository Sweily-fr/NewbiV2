import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_PRODUCT,
  UPDATE_PRODUCT,
  DELETE_PRODUCT,
} from "../graphql/mutations/products";
import { GET_PRODUCTS, GET_PRODUCT } from "../graphql/queries/products";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

export const useProducts = (
  page = 1,
  limit = 50,
  search = "",
  category = ""
) => {
  const {
    workspaceId,
    loading: workspaceLoading,
    error: workspaceError,
  } = useRequiredWorkspace();

  const {
    data,
    loading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery(GET_PRODUCTS, {
    variables: { workspaceId, page, limit, search, category },
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: false,
    errorPolicy: "all",
    skip: !workspaceId,
  });

  return {
    products: data?.products?.products || [],
    totalItems: data?.products?.totalCount || 0,
    currentPage: page,
    totalPages: Math.ceil((data?.products?.totalCount || 0) / limit),
    hasNextPage: data?.products?.hasNextPage || false,
    loading: workspaceLoading || (queryLoading && !data?.products),
    error: workspaceError || queryError,
    refetch,
  };
};

export const useProduct = (id) => {
  const { data, loading, error } = useQuery(GET_PRODUCT, {
    variables: { id },
    skip: !id,
  });

  return {
    product: data?.product,
    loading: loading && !data?.product,
    error,
  };
};

export const useCreateProduct = (options = {}) => {
  const { workspaceId } = useRequiredWorkspace();
  const { showToast = true } = options;

  const [createProduct, { loading, error }] = useMutation(CREATE_PRODUCT, {
    refetchQueries: ["GetProducts"],
    onCompleted: () => {
      if (showToast) {
        toast.success("Produit créé avec succès");
      }
    },
    onError: (error) => {
      if (showToast) {
        // Afficher un message d'erreur plus détaillé si disponible
        const errorMessage =
          error.message || "Erreur lors de la création du produit";
        toast.error(errorMessage);
      }
    },
  });

  return {
    createProduct: async (input) => {
      if (!workspaceId) {
        throw new Error("Aucun workspace sélectionné");
      }

      try {
        const result = await createProduct({
          variables: {
            input: {
              ...input,
              workspaceId,
            },
          },
        });
        return result;
      } catch {
        // L'erreur est déjà gérée par onError, on retourne null
        return null;
      }
    },
    loading,
    error,
  };
};

export const useUpdateProduct = () => {
  const [updateProduct, { loading, error }] = useMutation(UPDATE_PRODUCT, {
    refetchQueries: ["GetProducts"],
    onCompleted: () => {
      toast.success("Produit modifié avec succès");
    },
    onError: (error) => {
      // Afficher un message d'erreur plus détaillé si disponible
      const errorMessage =
        error.message || "Erreur lors de la modification du produit";
      toast.error(errorMessage);
    },
  });

  return {
    updateProduct: async (id, input) => {
      try {
        const result = await updateProduct({ variables: { id, input } });
        return result;
      } catch {
        // L'erreur est déjà gérée par onError, on retourne null
        return null;
      }
    },
    loading,
    error,
  };
};

export const useDeleteProduct = (options = {}) => {
  const { showToast = true } = options;

  const [deleteProduct, { loading, error }] = useMutation(DELETE_PRODUCT, {
    refetchQueries: ["GetProducts"],
    onCompleted: () => {
      if (showToast) {
        toast.success("Produit supprimé avec succès");
      }
    },
    onError: () => {
      if (showToast) {
        toast.error("Erreur lors de la suppression du produit");
      }
    },
  });

  return {
    deleteProduct: async (id) => {
      const result = await deleteProduct({
        variables: { id },
      });
      return result;
    },
    loading,
    error,
  };
};
