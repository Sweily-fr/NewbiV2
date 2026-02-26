import { ApolloClient, InMemoryCache, from, split } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
import { toast } from "@/src/components/ui/sonner";
import { authClient } from "@/src/lib/auth-client";
import { getErrorMessage, isCriticalError } from "@/src/utils/errorMessages";

// ==================== GARDE ANTI-BOUCLE POUR LES ERREURS AUTH ====================
let isRedirecting = false;

const forceSessionExpiredRedirect = (reason = "inactivity") => {
  if (isRedirecting) return;
  isRedirecting = true;

  resetOrganizationIdForApollo();

  setTimeout(() => {
    isRedirecting = false;
  }, 3000);

  window.location.href = `/auth/session-expired?reason=${reason}`;
};

// ==================== SYNCHRONISATION ORG ID AVEC useWorkspace ====================
let _workspaceReady = false;
let _confirmedOrgId = null;

export function setOrganizationIdForApollo(orgId) {
  _workspaceReady = true;
  _confirmedOrgId = orgId || null;
}

export function resetOrganizationIdForApollo() {
  _workspaceReady = false;
  _confirmedOrgId = null;
}

// ==================== UPLOAD LINK ====================
const uploadLink = createUploadLink({
  uri: process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL + "graphql"
    : "http://localhost:4000/graphql",
  credentials: "include",
  headers: {
    "Apollo-Require-Preflight": "true",
  },
});

// ==================== WEBSOCKET LINK ====================
// WebSocket ne peut pas envoyer de cookies — on génère un JWT à la volée
// (jamais stocké en localStorage, vit uniquement en mémoire pour la connexion)
let wsClient = null;

const wsLink =
  typeof window !== "undefined"
    ? new WebSocketLink({
        uri: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/graphql",
        options: {
          reconnect: true,
          lazy: true,
          connectionParams: async () => {
            const isPublicPage =
              typeof window !== "undefined" &&
              window.location.pathname.startsWith("/public/");

            if (isPublicPage) return {};

            // Générer un JWT à la volée pour le WebSocket (jamais stocké)
            let jwtToken = null;
            try {
              const tokenResponse = await fetch("/api/auth/token", {
                credentials: "include",
              });
              if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                if (tokenData.token) {
                  jwtToken = tokenData.token;
                }
              }
            } catch {
              // Fallback silencieux
            }

            return {
              authorization: jwtToken ? `Bearer ${jwtToken}` : "",
            };
          },
          onError: (error) => {
            console.error("[WebSocket] Erreur:", error);
          },
        },
      })
    : null;

if (wsLink && typeof window !== "undefined") {
  wsClient = wsLink.subscriptionClient;
}

// ==================== AUTH LINK ====================
// Authentification cookie-only : le cookie better-auth.session_token
// est envoyé automatiquement via credentials: "include".
// On ajoute uniquement les headers d'organisation et de rôle.
const authLink = setContext(async (_, { headers }) => {
  const organizationId = _workspaceReady ? _confirmedOrgId : null;
  const userRole = _workspaceReady
    ? localStorage.getItem("user_role")
    : null;

  const requestHeaders = { ...headers };

  if (organizationId) {
    requestHeaders["x-organization-id"] = organizationId;
  }
  if (userRole) {
    requestHeaders["x-user-role"] = userRole;
  }

  return { headers: requestHeaders };
});

// ==================== ERROR LINK ====================
let isRetryingAuth = false;

const handleCriticalAuthError = async (operation, message) => {
  if (isRetryingAuth || isRedirecting) return;

  const isInitialLoad = operation.getContext().isInitialLoad;
  if (isInitialLoad) return;

  isRetryingAuth = true;

  try {
    // Vérifier si la session est encore valide (cookie)
    const session = await authClient.getSession();
    if (session?.data?.user) {
      // Session valide — l'erreur était transitoire
      return;
    }

    // Session réellement expirée
    forceSessionExpiredRedirect("inactivity");
  } catch {
    // Erreur réseau — ne pas rediriger
  } finally {
    isRetryingAuth = false;
  }
};

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    const processedMessages = new Set();

    graphQLErrors.forEach((error) => {
      const { message, extensions } = error;
      const errorCode =
        extensions?.code !== "INTERNAL_SERVER_ERROR"
          ? extensions?.code
          : extensions?.exception?.code || error.code;
      const errorWithCode = { message, code: errorCode };

      if (processedMessages.has(message)) return;
      processedMessages.add(message);

      const userMessage = getErrorMessage(errorWithCode, "generic");

      if (isCriticalError(errorWithCode)) {
        handleCriticalAuthError(operation, message);
      } else {
        const skipErrorToast = operation.getContext().skipErrorToast;
        const isBoardNotFound =
          message?.includes("Board not found") ||
          message?.includes("board not found");

        if (!skipErrorToast && !isBoardNotFound) {
          toast.error(message || userMessage, { duration: 4000 });
        }
      }
    });
  }

  if (networkError) {
    const userMessage = getErrorMessage(networkError, "network");

    if (networkError.message === "Failed to fetch") {
      toast.error(userMessage, {
        duration: 5000,
        description: "Vérifiez votre connexion internet et réessayez",
      });
    } else {
      toast.warning(userMessage, { duration: 4000 });
    }
  }
});

// ==================== CACHE ====================
const cache = new InMemoryCache({
  typePolicies: {
    Board: {
      fields: {
        tasks: {
          merge(existing = [], incoming) {
            return incoming;
          },
        },
        columns: {
          merge(existing = [], incoming) {
            return incoming;
          },
        },
      },
    },
    Column: {
      fields: {
        tasks: {
          merge(existing = [], incoming) {
            return incoming;
          },
        },
      },
    },
  },
});

// ==================== CLIENT ====================
let apolloClientInstance = null;

const createApolloClient = () => {
  const splitLink =
    typeof window !== "undefined" && wsLink
      ? split(
          ({ query }) => {
            const definition = getMainDefinition(query);
            return (
              definition.kind === "OperationDefinition" &&
              definition.operation === "subscription"
            );
          },
          wsLink,
          from([authLink, errorLink, uploadLink])
        )
      : from([authLink, errorLink, uploadLink]);

  return new ApolloClient({
    link: splitLink,
    cache,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "cache-and-network",
        errorPolicy: "all",
        notifyOnNetworkStatusChange: true,
      },
      query: {
        fetchPolicy: "cache-and-network",
        errorPolicy: "all",
      },
      mutate: {
        errorPolicy: "all",
        awaitRefetchQueries: true,
      },
    },
    devtools: {
      enabled: process.env.NODE_ENV === "development",
    },
  });
};

export const getApolloClient = async () => {
  if (!apolloClientInstance) {
    apolloClientInstance = createApolloClient();
  }
  return apolloClientInstance;
};

export const apolloClient = createApolloClient();
