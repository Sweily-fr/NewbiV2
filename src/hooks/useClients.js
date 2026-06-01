import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_CLIENT,
  UPDATE_CLIENT,
  DELETE_CLIENT,
  BLOCK_CLIENT,
  UNBLOCK_CLIENT,
  ASSIGN_CLIENT_MEMBERS,
} from "../graphql/mutations/clients";
import { GET_CLIENTS, GET_CLIENT } from "../graphql/queries/clients";
import { GET_CLIENT_LISTS } from "../graphql/queries/clientLists";
import { toast } from "@/src/components/ui/sonner";
import { useWorkspace } from "./useWorkspace";
import { useErrorHandler } from "./useErrorHandler";

const MAX_AUTO_RETRIES = 2;

/**
 * Relance automatiquement (de façon bornée) une requête qui tombe sur une
 * erreur transitoire : course sur le JWT/header d'organisation, ou cache Apollo
 * vidé sans refetch après un changement d'org. Évite à l'utilisateur de devoir
 * cliquer "Réessayer" : tant qu'on est sous la limite, on expose `isRetrying`
 * (le composant affiche un spinner plutôt que l'état d'erreur). L'erreur n'est
 * finalement remontée que si l'auto-retry a épuisé ses tentatives.
 */
function useAutoRetryOnError({ error, refetch, enabled = true }) {
  const [attempts, setAttempts] = useState(0);

  // Réinitialiser le compteur dès qu'on n'est plus en erreur (refetch réussi)
  useEffect(() => {
    if (!error) setAttempts(0);
  }, [error]);

  useEffect(() => {
    if (!enabled || !error || attempts >= MAX_AUTO_RETRIES) return;
    const timer = setTimeout(
      () => {
        setAttempts((n) => n + 1);
        refetch?.().catch(() => {});
      },
      500 * (attempts + 1),
    );
    return () => clearTimeout(timer);
  }, [error, attempts, enabled, refetch]);

  return { isRetrying: !!error && attempts < MAX_AUTO_RETRIES };
}

export const useClients = (page = 1, limit = 10, search = "") => {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();

  const {
    data,
    loading: queryLoading,
    error,
    refetch,
  } = useQuery(GET_CLIENTS, {
    variables: { workspaceId, page, limit, search },
    skip: !workspaceId,
  });

  const { isRetrying } = useAutoRetryOnError({
    error,
    refetch,
    enabled: !!workspaceId,
  });

  return {
    clients: data?.clients?.items || [],
    totalItems: data?.clients?.totalItems || 0,
    currentPage: data?.clients?.currentPage || 1,
    totalPages: data?.clients?.totalPages || 1,
    loading:
      (workspaceLoading && !workspaceId) ||
      (queryLoading && !data?.clients) ||
      isRetrying,
    // Ne remonter l'erreur (bouton "Réessayer") qu'une fois l'auto-retry épuisé
    error: isRetrying ? null : error,
    refetch,
  };
};

export const useClient = (id) => {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();

  const {
    data,
    loading: queryLoading,
    error,
    refetch,
  } = useQuery(GET_CLIENT, {
    variables: { workspaceId, id },
    skip: !id || !workspaceId,
  });

  const { isRetrying } = useAutoRetryOnError({
    error,
    refetch,
    enabled: !!workspaceId && !!id,
  });

  return {
    client: data?.client,
    loading:
      (workspaceLoading && !workspaceId) ||
      (queryLoading && !data?.client) ||
      isRetrying,
    error: isRetrying ? null : error,
    refetch,
  };
};

export const useCreateClient = () => {
  const { workspaceId } = useWorkspace();

  const [createClientMutation, { loading, error }] = useMutation(
    CREATE_CLIENT,
    {
      update: (cache, { data }) => {
        const newClient = data?.createClient;
        if (!newClient) return;
        try {
          // Lire la query existante
          const existingClients = cache.readQuery({
            query: GET_CLIENTS,
            variables: { workspaceId, page: 1, limit: 10, search: "" },
          });

          if (existingClients) {
            // Ajouter le nouveau client au début de la liste
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
        } catch {
          // Si la query n'existe pas dans le cache, on l'ignore
        }
      },
      refetchQueries: [{ query: GET_CLIENT_LISTS, variables: { workspaceId } }],
      awaitRefetchQueries: false,
      onCompleted: () => {
        toast.success("Client créé avec succès");
      },
      // Pas d'onError ici: la gestion d'erreur est faite par le composant appelant
      // pour pouvoir afficher l'erreur soit en toast soit inline sur un champ.
    },
  );

  return {
    createClient: async (input) => {
      try {
        const result = await createClientMutation({
          variables: { workspaceId, input },
        });
        // Avec errorPolicy:"all" la mutation ne throw pas: il faut inspecter result.errors
        if (result?.errors && result.errors.length > 0) {
          const graphQLError = result.errors[0];
          const enhancedError = new Error(graphQLError.message);
          enhancedError.extensions = graphQLError.extensions;
          enhancedError.code = graphQLError.extensions?.code;
          throw enhancedError;
        }
        return result?.data?.createClient;
      } catch (error) {
        // Extraire l'erreur GraphQL pour la propager avec les bonnes infos
        const graphQLError = error.graphQLErrors?.[0];
        if (graphQLError) {
          const enhancedError = new Error(graphQLError.message);
          enhancedError.extensions = graphQLError.extensions;
          enhancedError.code = graphQLError.extensions?.code;
          throw enhancedError;
        }
        throw error;
      }
    },
    loading,
    error,
  };
};

export const useUpdateClient = () => {
  const { workspaceId } = useWorkspace();

  const [updateClientMutation, { loading, error }] = useMutation(
    UPDATE_CLIENT,
    {
      update: (cache, { data }) => {
        const updatedClient = data?.updateClient;
        if (!updatedClient) return;
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
              client.id === updatedClient.id ? updatedClient : client,
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
        } catch {
          // Si la query n'existe pas dans le cache, on l'ignore
        }
      },
      onCompleted: () => {
        toast.success("Client modifié avec succès");
      },
      // Pas d'onError ici: la gestion d'erreur est faite par le composant appelant.
    },
  );

  return {
    updateClient: async (id, input) => {
      try {
        const result = await updateClientMutation({
          variables: { workspaceId, id, input },
        });
        // Avec errorPolicy:"all" la mutation ne throw pas: il faut inspecter result.errors
        if (result?.errors && result.errors.length > 0) {
          const graphQLError = result.errors[0];
          const enhancedError = new Error(graphQLError.message);
          enhancedError.extensions = graphQLError.extensions;
          enhancedError.code = graphQLError.extensions?.code;
          throw enhancedError;
        }
        return result?.data?.updateClient;
      } catch (error) {
        // Extraire l'erreur GraphQL pour la propager avec les bonnes infos
        const graphQLError = error.graphQLErrors?.[0];
        if (graphQLError) {
          const enhancedError = new Error(graphQLError.message);
          enhancedError.extensions = graphQLError.extensions;
          enhancedError.code = graphQLError.extensions?.code;
          throw enhancedError;
        }
        throw error;
      }
    },
    loading,
    error,
  };
};

export const useDeleteClient = () => {
  const { workspaceId } = useWorkspace();
  const { handleMutationError } = useErrorHandler();

  const [deleteClient, { loading, error }] = useMutation(DELETE_CLIENT, {
    context: { skipErrorToast: true },
    update: (cache, { data, errors }, { variables: { id } }) => {
      // Ne pas mettre à jour le cache si la mutation a échoué
      if (!data?.deleteClient || errors?.length > 0) return;
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
            (client) => client.id !== id,
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
      } catch {
        // Si la query n'existe pas dans le cache, on l'ignore
      }

      // Nettoyer le cache
      cache.gc();
    },
    onCompleted: () => {
      toast.success("Client supprimé avec succès");
    },
    onError: (error) => {
      handleMutationError(error, "delete", "client");
    },
  });

  return {
    deleteClient: (id) => deleteClient({ variables: { workspaceId, id } }),
    loading,
    error,
  };
};

export const useBlockClient = () => {
  const { workspaceId } = useWorkspace();
  const { handleMutationError } = useErrorHandler();

  const [blockClient, { loading, error }] = useMutation(BLOCK_CLIENT, {
    refetchQueries: [
      {
        query: GET_CLIENTS,
        variables: { workspaceId, page: 1, limit: 10, search: "" },
      },
    ],
    awaitRefetchQueries: false,
    onCompleted: () => {
      toast.success("Contact bloqué");
    },
    onError: (error) => {
      handleMutationError(error, "block", "client");
    },
  });

  return {
    blockClient: (id, reason) =>
      blockClient({ variables: { workspaceId, id, reason } }),
    loading,
    error,
  };
};

export const useUnblockClient = () => {
  const { workspaceId } = useWorkspace();
  const { handleMutationError } = useErrorHandler();

  const [unblockClient, { loading, error }] = useMutation(UNBLOCK_CLIENT, {
    refetchQueries: [
      {
        query: GET_CLIENTS,
        variables: { workspaceId, page: 1, limit: 10, search: "" },
      },
    ],
    awaitRefetchQueries: false,
    onCompleted: () => {
      toast.success("Contact débloqué");
    },
    onError: (error) => {
      handleMutationError(error, "unblock", "client");
    },
  });

  return {
    unblockClient: (id) => unblockClient({ variables: { workspaceId, id } }),
    loading,
    error,
  };
};

export const useAssignClientMembers = ({ silent = false } = {}) => {
  const { workspaceId } = useWorkspace();
  const { handleMutationError } = useErrorHandler();

  const [assignClientMembers, { loading, error }] = useMutation(
    ASSIGN_CLIENT_MEMBERS,
    {
      refetchQueries: [
        {
          query: GET_CLIENTS,
          variables: { workspaceId, page: 1, limit: 10, search: "" },
        },
      ],
      awaitRefetchQueries: false,
      onCompleted: () => {
        if (!silent) toast.success("Membres assignés");
      },
      onError: (error) => {
        handleMutationError(error, "assign", "client");
      },
    },
  );

  return {
    assignClientMembers: (id, memberIds) =>
      assignClientMembers({ variables: { workspaceId, id, memberIds } }),
    loading,
    error,
  };
};
