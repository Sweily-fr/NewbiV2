import { useMutation, useQuery, gql } from '@apollo/client';
import { CREATE_PRODUCT, UPDATE_PRODUCT, DELETE_PRODUCT } from '../graphql/mutations/products';
import { GET_PRODUCTS, GET_PRODUCT } from '../graphql/queries/products';
import { toast } from '@/src/components/ui/sonner';

export const useProducts = (page = 1, limit = 10, search = '', category = '') => {
  const { data, loading, error, refetch } = useQuery(GET_PRODUCTS, {
    variables: { page, limit, search, category },
    fetchPolicy: 'cache-and-network',
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
    update(cache, { data: { createProduct: newProduct } }) {
      // Mise à jour optimiste du cache Apollo
      const existingProducts = cache.readQuery({
        query: GET_PRODUCTS,
        variables: { page: 1, limit: 10, search: '', category: '' }
      });

      if (existingProducts) {
        cache.writeQuery({
          query: GET_PRODUCTS,
          variables: { page: 1, limit: 10, search: '', category: '' },
          data: {
            products: {
              ...existingProducts.products,
              products: [newProduct, ...existingProducts.products.products],
              totalCount: existingProducts.products.totalCount + 1
            }
          }
        });
      }
    },
    refetchQueries: [{ query: GET_PRODUCTS }],
    awaitRefetchQueries: true,
    onCompleted: () => {
      toast.success('Produit créé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création du produit');
      console.error('Create product error:', error);
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
    update(cache, { data: { updateProduct: updatedProduct } }) {
      // Mise à jour du cache Apollo
      cache.modify({
        fields: {
          products(existingProductsRef, { readField }) {
            const existingProducts = readField('products', existingProductsRef);
            if (!existingProducts) return existingProductsRef;
            
            const updatedProducts = existingProducts.map(productRef => {
              if (readField('id', productRef) === updatedProduct.id) {
                return cache.writeFragment({
                  data: updatedProduct,
                  fragment: gql`
                    fragment UpdatedProduct on Product {
                      id
                      name
                      reference
                      unitPrice
                      vatRate
                      unit
                      category
                      description
                    }
                  `
                });
              }
              return productRef;
            });
            
            return { ...existingProductsRef, products: updatedProducts };
          }
        }
      });
    },
    refetchQueries: [{ query: GET_PRODUCTS }],
    awaitRefetchQueries: true,
    onCompleted: () => {
      toast.success('Produit modifié avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la modification du produit');
      console.error('Update product error:', error);
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
    onCompleted: () => {
      toast.success('Produit supprimé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression du produit');
      console.error('Delete product error:', error);
    },
  });

  return {
    deleteProduct: async (id) => {
      const result = await deleteProduct({ 
        variables: { id },
        refetchQueries: [{ query: GET_PRODUCTS }],
        awaitRefetchQueries: true,
      });
      return result;
    },
    loading,
    error,
  };
};
