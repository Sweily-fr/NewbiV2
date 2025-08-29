import { gql } from "@apollo/client";
import {
  useQuery,
  useMutation,
  useLazyQuery,
  useApolloClient,
} from "@apollo/client";
import { useMemo, useCallback } from "react";
import { toast } from "@/src/components/ui/sonner";
import { useWorkspace } from "../hooks/useWorkspace";

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
    address {
      street
      city
      postalCode
      country
    }
    hasDifferentShippingAddress
    shippingAddress {
      street
      city
      postalCode
      country
    }
  }
`;

export const CLIENT_SUMMARY_FRAGMENT = gql`
  fragment ClientSummaryFragment on Client {
    id
    name
    email
    type
    firstName
    lastName
    address {
      city
      postalCode
    }
  }
`;

// ==================== QUERIES ====================

export const GET_CLIENTS = gql`
  query GetClients(
    $workspaceId: String!
    $page: Int
    $limit: Int
    $search: String
  ) {
    clients(
      workspaceId: $workspaceId
      page: $page
      limit: $limit
      search: $search
    ) {
      items {
        ...ClientFragment
      }
      totalItems
      currentPage
      totalPages
    }
  }
  ${CLIENT_FRAGMENT}
`;

export const GET_CLIENT = gql`
  query GetClient($workspaceId: String!, $id: ID!) {
    client(workspaceId: $workspaceId, id: $id) {
      ...ClientFragment
    }
  }
  ${CLIENT_FRAGMENT}
`;

// ==================== MUTATIONS ====================

export const CREATE_CLIENT = gql`
  mutation CreateClient($workspaceId: String!, $input: ClientInput!) {
    createClient(workspaceId: $workspaceId, input: $input) {
      ...ClientFragment
    }
  }
  ${CLIENT_FRAGMENT}
`;

export const UPDATE_CLIENT = gql`
  mutation UpdateClient(
    $workspaceId: String!
    $id: ID!
    $input: UpdateClientInput!
  ) {
    updateClient(workspaceId: $workspaceId, id: $id, input: $input) {
      ...ClientFragment
    }
  }
  ${CLIENT_FRAGMENT}
`;

export const DELETE_CLIENT = gql`
  mutation DeleteClient($workspaceId: String!, $id: ID!) {
    deleteClient(workspaceId: $workspaceId, id: $id)
  }
`;

// ==================== SEARCH QUERIES ====================

export const SEARCH_COMPANIES_BY_NAME = gql`
  query SearchCompaniesByName($name: String!) {
    searchCompaniesByName(name: $name) {
      siret
      name
      address {
        street
        city
        postalCode
        country
      }
      vatNumber
    }
  }
`;

export const SEARCH_COMPANY_BY_SIRET = gql`
  query SearchCompanyBySiret($siret: String!) {
    searchCompanyBySiret(siret: $siret) {
      siret
      name
      address {
        street
        city
        postalCode
        country
      }
      vatNumber
    }
  }
`;

// ==================== HOOKS PERSONNALISÉS ====================

// Hook pour récupérer la liste des clients
export const useClients = (options = {}) => {
  const { workspaceId: contextWorkspaceId } = useWorkspace();
  const {
    workspaceId = contextWorkspaceId,
    page = 1,
    limit = 10,
    search = "",
  } = options;

  const { data, loading, error, refetch, fetchMore } = useQuery(GET_CLIENTS, {
    variables: { workspaceId, page, limit, search },
    skip: !workspaceId,
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  });

  const clients = useMemo(() => data?.clients?.items || [], [data]);
  const totalItems = data?.clients?.totalItems || 0;
  const totalPages = data?.clients?.totalPages || 0;
  const currentPage = data?.clients?.currentPage || 1;

  const loadMore = useCallback(async () => {
    if (currentPage < totalPages) {
      try {
        await fetchMore({
          variables: {
            workspaceId,
            page: currentPage + 1,
            limit,
            search,
          },
          updateQuery: (prev, { fetchMoreResult }) => {
            if (!fetchMoreResult) return prev;
            return {
              clients: {
                ...fetchMoreResult.clients,
                items: [
                  ...prev.clients.items,
                  ...fetchMoreResult.clients.items,
                ],
              },
            };
          },
        });
      } catch (err) {
        console.error("Erreur lors du chargement de plus de clients:", err);
      }
    }
  }, [fetchMore, currentPage, totalPages, workspaceId, limit, search]);

  return {
    clients,
    loading,
    error,
    totalItems,
    totalPages,
    currentPage,
    hasNextPage: currentPage < totalPages,
    refetch,
    loadMore,
  };
};

// Hook pour récupérer un client spécifique
export const useClient = (id, providedWorkspaceId) => {
  const { workspaceId: contextWorkspaceId } = useWorkspace();
  const workspaceId = providedWorkspaceId || contextWorkspaceId;

  const { data, loading, error } = useQuery(GET_CLIENT, {
    variables: { workspaceId, id },
    skip: !id || !workspaceId,
    errorPolicy: "all",
  });

  return {
    client: data?.client,
    loading,
    error,
  };
};

// Hook pour créer un client
export const useCreateClient = (providedWorkspaceId) => {
  const { workspaceId: contextWorkspaceId } = useWorkspace();
  const workspaceId = providedWorkspaceId || contextWorkspaceId;

  const [createClientMutation, { loading, error }] = useMutation(
    CREATE_CLIENT,
    {
      update: (cache, { data: { createClient: newClient } }) => {
        // Mettre à jour le cache en temps réel
        try {
          const existingClients = cache.readQuery({
            query: GET_CLIENTS,
            variables: { workspaceId, page: 1, limit: 10, search: "" },
          });

          if (existingClients) {
            cache.writeQuery({
              query: GET_CLIENTS,
              variables: { workspaceId, page: 1, limit: 10, search: "" },
              data: {
                clients: {
                  ...existingClients.clients,
                  items: [newClient, ...existingClients.clients.items],
                  totalItems: existingClients.clients.totalItems + 1,
                },
              },
            });
          }
        } catch (e) {
          console.log("GET_CLIENTS not in cache, skipping update");
        }
      },
      errorPolicy: "all",
    }
  );

  const createClient = useCallback(
    async (input) => {
      try {
        const { data } = await createClientMutation({
          variables: { workspaceId, input },
        });

        toast.success("Client créé avec succès");
        return data.createClient;
      } catch (err) {
        console.error("Erreur lors de la création du client:", err);
        // Le toast d'erreur est géré par le hook useCreateClient
        throw err;
      }
    },
    [createClientMutation, workspaceId]
  );

  return {
    createClient,
    loading,
    error,
  };
};

// Hook pour rechercher des entreprises par nom via GraphQL
export const useSearchCompaniesByName = () => {
  const [searchCompanies, { loading, error }] = useLazyQuery(
    SEARCH_COMPANIES_BY_NAME,
    {
      errorPolicy: "all",
      onError: (error) => {
        console.error("Erreur lors de la recherche d'entreprises:", error);
        toast.error("Erreur lors de la recherche d'entreprises");
      },
    }
  );

  const search = useCallback(
    async (name) => {
      if (!name || name.length < 2) return [];

      try {
        const result = await searchCompanies({ variables: { name } });
        return result.data?.searchCompaniesByName || [];
      } catch (error) {
        console.error("Erreur lors de la recherche:", error);
        return [];
      }
    },
    [searchCompanies]
  );

  return { search, loading, error };
};

// Hook pour rechercher une entreprise par SIRET
export const useSearchCompanyBySiret = () => {
  const [searchCompany, { loading, error }] = useLazyQuery(
    SEARCH_COMPANY_BY_SIRET,
    {
      errorPolicy: "all",
    }
  );

  const search = useCallback(
    async (siret) => {
      if (!siret) return null;

      try {
        const result = await searchCompany({ variables: { siret } });
        return result.data?.searchCompanyBySiret || null;
      } catch (error) {
        console.error("Erreur lors de la recherche:", error);
        throw new Error(
          "Impossible de récupérer les détails de l'entreprise. Veuillez réessayer."
        );
      }
    },
    [searchCompany]
  );

  return { search, loading, error };
};

// Hook pour mettre à jour un client
export const useUpdateClient = (providedWorkspaceId) => {
  const { workspaceId: contextWorkspaceId } = useWorkspace();
  const workspaceId = providedWorkspaceId || contextWorkspaceId;
  const client = useApolloClient();

  const [updateClientMutation, { loading }] = useMutation(UPDATE_CLIENT, {
    update: (cache, { data: { updateClient: updatedClient } }) => {
      // Mettre à jour le client dans le cache GET_CLIENT
      cache.writeQuery({
        query: GET_CLIENT,
        variables: { workspaceId, id: updatedClient.id },
        data: { client: updatedClient },
      });

      // Mettre à jour le client dans la liste GET_CLIENTS
      try {
        const existingClients = cache.readQuery({
          query: GET_CLIENTS,
          variables: { workspaceId, page: 1, limit: 10, search: "" },
        });

        if (existingClients) {
          const updatedItems = existingClients.clients.items.map((client) =>
            client.id === updatedClient.id ? updatedClient : client
          );

          cache.writeQuery({
            query: GET_CLIENTS,
            variables: { workspaceId, page: 1, limit: 10, search: "" },
            data: {
              clients: {
                ...existingClients.clients,
                items: updatedItems,
              },
            },
          });
        }
      } catch (e) {
        console.log("GET_CLIENTS not in cache, skipping update");
      }
    },
    onCompleted: () => {
      toast.success("Client mis à jour avec succès");
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour du client:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du client");
    },
  });

  const updateClient = async (id, input) => {
    try {
      const result = await updateClientMutation({
        variables: { workspaceId, id, input },
      });
      return result.data.updateClient;
    } catch (error) {
      throw error;
    }
  };

  return { updateClient, loading };
};

// Hook pour supprimer un client
export const useDeleteClient = (providedWorkspaceId) => {
  const { workspaceId: contextWorkspaceId } = useWorkspace();
  const workspaceId = providedWorkspaceId || contextWorkspaceId;
  const client = useApolloClient();

  const [deleteClientMutation, { loading }] = useMutation(DELETE_CLIENT, {
    update: (cache, { data }, { variables: { id } }) => {
      // Supprimer le client du cache GET_CLIENT
      cache.evict({
        id: cache.identify({ __typename: "Client", id }),
      });

      // Supprimer le client de la liste GET_CLIENTS
      try {
        const existingClients = cache.readQuery({
          query: GET_CLIENTS,
          variables: { workspaceId, page: 1, limit: 10, search: "" },
        });

        if (existingClients) {
          const filteredItems = existingClients.clients.items.filter(
            (client) => client.id !== id
          );

          cache.writeQuery({
            query: GET_CLIENTS,
            variables: { workspaceId, page: 1, limit: 10, search: "" },
            data: {
              clients: {
                ...existingClients.clients,
                items: filteredItems,
                totalItems: existingClients.clients.totalItems - 1,
              },
            },
          });
        }
      } catch (e) {
        console.log("GET_CLIENTS not in cache, skipping update");
      }

      // Nettoyer le cache
      cache.gc();
    },
    onCompleted: () => {
      toast.success("Client supprimé avec succès");
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression du client:", error);
      toast.error(error.message || "Erreur lors de la suppression du client");
    },
  });

  const deleteClient = async (id) => {
    try {
      await deleteClientMutation({
        variables: { workspaceId, id },
      });
      return true;
    } catch (error) {
      throw error;
    }
  };

  return { deleteClient, loading };
};

// ==================== CONSTANTES ====================

export const CLIENT_TYPE_LABELS = {
  INDIVIDUAL: "Particulier",
  COMPANY: "Entreprise",
};

export const CLIENT_TYPES = [
  { value: "INDIVIDUAL", label: "Particulier" },
  { value: "COMPANY", label: "Entreprise" },
];
