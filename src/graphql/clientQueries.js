import { gql } from '@apollo/client';

// ==================== FRAGMENTS ====================

export const CLIENT_FRAGMENT = gql`
  fragment ClientFragment on Client {
    id
    name
    email
    type
    firstName
    lastName
    siret
    vatNumber
    hasDifferentShippingAddress
    address {
      street
      city
      postalCode
      country
    }
    shippingAddress {
      street
      city
      postalCode
      country
    }
  }
`;

export const CLIENT_LIST_FRAGMENT = gql`
  fragment ClientListFragment on Client {
    id
    name
    email
    type
    address {
      city
      postalCode
    }
  }
`;

// ==================== QUERIES ====================

export const GET_CLIENTS = gql`
  query GetClients($page: Int, $limit: Int, $search: String) {
    clients(page: $page, limit: $limit, search: $search) {
      items {
        ...ClientListFragment
      }
      totalItems
      currentPage
      totalPages
    }
  }
  ${CLIENT_LIST_FRAGMENT}
`;

export const GET_CLIENT = gql`
  query GetClient($id: ID!) {
    client(id: $id) {
      ...ClientFragment
    }
  }
  ${CLIENT_FRAGMENT}
`;

// ==================== MUTATIONS ====================

export const CREATE_CLIENT = gql`
  mutation CreateClient($input: CreateClientInput!) {
    createClient(input: $input) {
      ...ClientFragment
    }
  }
  ${CLIENT_FRAGMENT}
`;

export const UPDATE_CLIENT = gql`
  mutation UpdateClient($id: ID!, $input: UpdateClientInput!) {
    updateClient(id: $id, input: $input) {
      ...ClientFragment
    }
  }
  ${CLIENT_FRAGMENT}
`;

export const DELETE_CLIENT = gql`
  mutation DeleteClient($id: ID!) {
    deleteClient(id: $id)
  }
`;

// ==================== HOOKS PERSONNALISÉS ====================

import { useQuery, useMutation, useLazyQuery, useApolloClient } from '@apollo/client';
import { useMemo, useCallback } from 'react';
import { toast } from 'sonner';

// Hook pour récupérer la liste des clients
export const useClients = (options = {}) => {
  const { page = 1, limit = 10, search = '' } = options;
  
  const { data, loading, error, refetch, fetchMore } = useQuery(GET_CLIENTS, {
    variables: { page, limit, search },
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true
  });

  const clients = useMemo(() => data?.clients?.items || [], [data]);
  const totalItems = data?.clients?.totalItems || 0;
  const totalPages = data?.clients?.totalPages || 0;
  const currentPage = data?.clients?.currentPage || 1;

  const loadMore = useCallback(async () => {
    if (currentPage < totalPages) {
      try {
        await fetchMore({
          variables: { page: currentPage + 1 },
          updateQuery: (prev, { fetchMoreResult }) => {
            if (!fetchMoreResult) return prev;
            
            return {
              clients: {
                ...fetchMoreResult.clients,
                items: [...prev.clients.items, ...fetchMoreResult.clients.items]
              }
            };
          }
        });
      } catch (error) {
        console.error('Erreur lors du chargement des clients supplémentaires:', error);
        toast.error('Erreur lors du chargement des clients supplémentaires');
      }
    }
  }, [currentPage, totalPages, fetchMore]);

  return {
    clients,
    loading,
    error,
    totalItems,
    totalPages,
    currentPage,
    hasNextPage: currentPage < totalPages,
    refetch,
    loadMore
  };
};

// Hook pour récupérer un client spécifique
export const useClient = (id) => {
  const { data, loading, error } = useQuery(GET_CLIENT, {
    variables: { id },
    skip: !id,
    errorPolicy: 'all'
  });

  return {
    client: data?.client,
    loading,
    error
  };
};

// Hook pour créer un client
export const useCreateClient = () => {
  const client = useApolloClient();
  
  const [createClientMutation, { loading }] = useMutation(CREATE_CLIENT, {
    onCompleted: (data) => {
      toast.success(`Client ${data.createClient.name} créé avec succès`);
      // Invalider le cache des clients
      client.refetchQueries({
        include: [GET_CLIENTS]
      });
    },
    onError: (error) => {
      console.error('Erreur lors de la création du client:', error);
      toast.error(error.message || 'Erreur lors de la création du client');
    }
  });
  
  const createClient = useCallback(async (input) => {
    try {
      const result = await createClientMutation({ variables: { input } });
      return result.data.createClient;
    } catch (error) {
      throw error;
    }
  }, [createClientMutation]);
  
  return { createClient, loading };
};

// Hook pour rechercher des entreprises par nom via GraphQL
export const useSearchCompaniesByName = () => {
  const [searchCompanies, { loading, error }] = useLazyQuery(SEARCH_COMPANIES_BY_NAME, {
    errorPolicy: 'all',
    onError: (error) => {
      console.error('Erreur lors de la recherche d\'entreprises:', error);
      toast.error('Erreur lors de la recherche d\'entreprises');
    }
  });
  
  const search = useCallback(async (name) => {
    if (!name || name.length < 3) {
      throw new Error('Le nom de recherche doit contenir au moins 3 caractères');
    }
    
    try {
      const result = await searchCompanies({ variables: { name } });
      return result.data?.searchCompaniesByName || [];
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      throw new Error('Impossible de rechercher les entreprises. Veuillez réessayer.');
    }
  }, [searchCompanies]);
  
  return { search, loading, error };
};

// Hook pour récupérer les détails d'une entreprise par SIRET via GraphQL
export const useSearchCompanyBySiret = () => {
  const [searchCompany, { loading, error }] = useLazyQuery(SEARCH_COMPANY_BY_SIRET, {
    errorPolicy: 'all',
    onError: (error) => {
      console.error('Erreur lors de la recherche par SIRET:', error);
      toast.error('Erreur lors de la recherche de l\'entreprise');
    }
  });
  
  const search = useCallback(async (siret) => {
    if (!siret || !/^\d{14}$/.test(siret)) {
      throw new Error('Le SIRET doit contenir exactement 14 chiffres');
    }
    
    try {
      const result = await searchCompany({ variables: { siret } });
      return result.data?.searchCompanyBySiret || null;
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      throw new Error('Impossible de récupérer les détails de l\'entreprise. Veuillez réessayer.');
    }
  }, [searchCompany]);
  
  return { search, loading, error };
};

// Hook pour mettre à jour un client
export const useUpdateClient = () => {
  const client = useApolloClient();
  
  const [updateClientMutation, { loading }] = useMutation(UPDATE_CLIENT, {
    onCompleted: (data) => {
      toast.success('Client mis à jour avec succès');
      // Mettre à jour le cache
      client.writeQuery({
        query: GET_CLIENT,
        variables: { id: data.updateClient.id },
        data: { client: data.updateClient }
      });
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour du client:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour du client');
    }
  });

  const updateClient = async (id, input) => {
    try {
      const result = await updateClientMutation({
        variables: { id, input }
      });
      return result.data.updateClient;
    } catch (error) {
      throw error;
    }
  };

  return { updateClient, loading };
};

// Hook pour supprimer un client
export const useDeleteClient = () => {
  const client = useApolloClient();
  
  const [deleteClientMutation, { loading }] = useMutation(DELETE_CLIENT, {
    onCompleted: () => {
      toast.success('Client supprimé avec succès');
      // Invalider le cache des clients
      client.refetchQueries({
        include: [GET_CLIENTS]
      });
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression du client:', error);
      toast.error(error.message || 'Erreur lors de la suppression du client');
    }
  });

  const deleteClient = async (id) => {
    try {
      await deleteClientMutation({
        variables: { id }
      });
      return true;
    } catch (error) {
      throw error;
    }
  };

  return { deleteClient, loading };
};

// ==================== CONSTANTES ====================

export const CLIENT_TYPE = {
  INDIVIDUAL: 'INDIVIDUAL',
  COMPANY: 'COMPANY'
};

export const CLIENT_TYPE_LABELS = {
  [CLIENT_TYPE.INDIVIDUAL]: 'Particulier',
  [CLIENT_TYPE.COMPANY]: 'Entreprise'
};

// ==================== INTÉGRATION API DATA.GOUV VIA GRAPHQL ====================

// Query pour rechercher des entreprises par nom
export const SEARCH_COMPANIES_BY_NAME = gql`
  query SearchCompaniesByName($name: String!) {
    searchCompaniesByName(name: $name) {
      name
      siret
      siren
      address {
        street
        city
        postalCode
        country
      }
    }
  }
`;

// Query pour récupérer les détails d'une entreprise par SIRET
export const SEARCH_COMPANY_BY_SIRET = gql`
  query SearchCompanyBySiret($siret: String!) {
    searchCompanyBySiret(siret: $siret) {
      name
      siret
      vatNumber
      address {
        street
        city
        postalCode
        country
      }
    }
  }
`;
