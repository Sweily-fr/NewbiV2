import { useMutation, useQuery } from '@apollo/client';
import { CREATE_PRODUCT, UPDATE_PRODUCT, DELETE_PRODUCT } from '../graphql/mutations/products';
import { GET_PRODUCTS, GET_PRODUCT } from '../graphql/queries/products';
import { toast } from '@/src/components/ui/sonner';

export const useProducts = (page = 1, limit = 10, search = '', category = '') => {
  const { data, loading, error, refetch } = useQuery(GET_PRODUCTS, {
    variables: { page, limit, search, category },
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    errorPolicy: 'all',
  });

  return {
    products: data?.products?.products || [],
    totalItems: data?.products?.totalCount || 0,
    currentPage: page,
    totalPages: Math.ceil((data?.products?.totalCount || 0) / limit),
    hasNextPage: data?.products?.hasNextPage || false,
    loading: loading && !data?.products,
    error,
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

export const useCreateProduct = () => {
  const [createProduct, { loading, error }] = useMutation(CREATE_PRODUCT, {
    refetchQueries: ['GetProducts'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      toast.success('Produit créé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création du produit');
    },
  });

  return {
    createProduct: (input) => createProduct({ variables: { input } }),
    loading,
    error,
  };
};

export const useUpdateProduct = () => {
  const [updateProduct, { loading, error }] = useMutation(UPDATE_PRODUCT, {
    refetchQueries: ['GetProducts'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      toast.success('Produit modifié avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la modification du produit');
    },
  });

  return {
    updateProduct: (id, input) => updateProduct({ variables: { id, input } }),
    loading,
    error,
  };
};

export const useDeleteProduct = () => {
  const [deleteProduct, { loading, error }] = useMutation(DELETE_PRODUCT, {
    refetchQueries: ['GetProducts'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      toast.success('Produit supprimé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du produit');
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
