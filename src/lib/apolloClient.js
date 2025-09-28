import { ApolloClient, InMemoryCache, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
import { persistCache, LocalStorageWrapper } from "apollo3-cache-persist";
import { toast } from "@/src/components/ui/sonner";
import { authClient } from "@/src/lib/auth-client";
import { getErrorMessage, isCriticalError } from "@/src/utils/errorMessages";

// Fonction pour vérifier si un token JWT est expiré
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    // Si on ne peut pas décoder le token, on considère qu'il est expiré
    return true;
  }
};

// Configuration Upload Link avec support des uploads de fichiers
const uploadLink = createUploadLink({
  uri: process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL + "graphql"
    : "http://localhost:4000/graphql",
  credentials: "include", // Important pour better-auth (cookies)
  headers: {
    "Apollo-Require-Preflight": "true",
  },
});

const authLink = setContext(async (_, { headers }) => {
  try {
    // Récupérer le JWT via authClient.getSession avec le header set-auth-jwt
    let jwtToken = null;

    await authClient.getSession({
      fetchOptions: {
        onSuccess: (ctx) => {
          const jwt = ctx.response.headers.get("set-auth-jwt");
          if (jwt && !isTokenExpired(jwt)) {
            jwtToken = jwt;
          }
        },
      },
    });

    if (jwtToken) {
      return {
        headers: {
          ...headers,
          authorization: `Bearer ${jwtToken}`,
        },
      };
    }
  } catch (error) {
    // Erreur silencieuse - ne pas exposer les détails d'authentification
    console.error("❌ [Apollo] Erreur récupération JWT:", error.message);
  }

  return {
    headers: {
      ...headers,
    },
  };
});

// Intercepteur d'erreurs pour gérer les erreurs d'authentification
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach((error) => {
      const { message, extensions } = error;
      const errorWithCode = { message, code: extensions?.code };

      // Utiliser notre système centralisé pour obtenir le message utilisateur
      const userMessage = getErrorMessage(errorWithCode, "generic");

      // Si l'erreur est critique (authentification), gérer la redirection
      if (isCriticalError(errorWithCode)) {
        toast.error(userMessage, {
          duration: 5000,
          description: "Vous allez être redirigé vers la page de connexion",
        });

        // Rediriger vers la page de connexion après un délai
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 2000);
      } else {
        // Afficher les autres erreurs GraphQL avec message utilisateur
        toast.error(userMessage, {
          duration: 4000,
        });
      }
    });
  }

  if (networkError) {
    // Utiliser notre système centralisé pour les erreurs réseau
    const userMessage = getErrorMessage(networkError, "network");

    if (networkError.message === "Failed to fetch") {
      toast.error(userMessage, {
        duration: 5000,
        description: "Vérifiez votre connexion internet et réessayez",
      });
    } else if (networkError.message.includes("NetworkError")) {
      toast.warning(userMessage, {
        duration: 5000,
      });
    } else {
      toast.warning(userMessage, {
        duration: 4000,
      });
    }
  }
});

// Configuration avancée du cache avec persistance
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Stratégies de cache optimisées pour différents types de données
        getInvoices: {
          keyArgs: ["workspaceId", "status", "sortBy", "sortOrder"],
          merge(_, incoming) {
            return incoming;
          },
        },
        getQuotes: {
          keyArgs: ["workspaceId", "status", "sortBy", "sortOrder"],
          merge(_, incoming) {
            return incoming;
          },
        },
        getClients: {
          keyArgs: ["workspaceId"],
          merge(_, incoming) {
            return incoming;
          },
        },
        getProducts: {
          keyArgs: ["workspaceId"],
          merge(_, incoming) {
            return incoming;
          },
        },
        getExpenses: {
          keyArgs: ["workspaceId", "status", "sortBy", "sortOrder"],
          merge(_, incoming) {
            return incoming;
          },
        },
        getMyEmailSignatures: {
          keyArgs: ["workspaceId"],
          merge(_, incoming) {
            return incoming;
          },
        },
        // Cache plus long pour les données statiques
        getActiveOrganization: {
          keyArgs: false,
          merge(_, incoming) {
            return incoming;
          },
        },
      },
    },
    // Optimisations pour les types d'entités
    Invoice: {
      keyFields: ["id"],
      fields: {
        items: {
          merge(_, incoming) {
            return incoming;
          },
        },
      },
    },
    Quote: {
      keyFields: ["id"],
      fields: {
        items: {
          merge(_, incoming) {
            return incoming;
          },
        },
      },
    },
    Client: {
      keyFields: ["id"],
    },
    Product: {
      keyFields: ["id"],
    },
    Expense: {
      keyFields: ["id"],
    },
    EmailSignature: {
      keyFields: ["id"],
    },
    Organization: {
      keyFields: ["id"],
    },
  },
  // Optimisation de la normalisation
  possibleTypes: {},
  // Configuration pour éviter les warnings
  addTypename: true,
});

// Variable pour stocker l'instance Apollo Client
let apolloClientInstance = null;

// Fonction pour initialiser le cache persistant
const initializePersistentCache = async () => {
  try {
    await persistCache({
      cache,
      storage: new LocalStorageWrapper(window.localStorage),
      key: "newbi-apollo-cache",
      // Durée de vie du cache : 7 jours
      maxSize: 1048576 * 5, // 5MB
      serialize: true,
      // Invalider le cache après 7 jours
      trigger: "write",
    });
    console.log("✅ Cache Apollo persistant initialisé");
  } catch (error) {
    console.warn("⚠️ Impossible d'initialiser le cache persistant:", error);
    // Continuer sans cache persistant
  }
};

// Fonction pour créer le client Apollo
const createApolloClient = () => {
  return new ApolloClient({
    link: from([authLink, errorLink, uploadLink]),
    cache,
    defaultOptions: {
      watchQuery: {
        // Stratégie optimisée : utiliser le cache d'abord, puis réseau en arrière-plan
        fetchPolicy: "cache-first",
        errorPolicy: "all",
        // Réduire les notifications pour améliorer les performances
        notifyOnNetworkStatusChange: false,
      },
      query: {
        // Pour les requêtes ponctuelles, privilégier le cache
        fetchPolicy: "cache-first",
        errorPolicy: "all",
      },
      mutate: {
        errorPolicy: "all",
        // Optimiser les refetch après mutations
        awaitRefetchQueries: false,
        // Mise à jour optimiste du cache
        optimisticResponse: false,
      },
    },
    // Améliorer les performances avec le mode de développement
    connectToDevTools: process.env.NODE_ENV === "development",
  });
};

// Fonction pour obtenir l'instance Apollo Client
export const getApolloClient = async () => {
  if (!apolloClientInstance) {
    // Initialiser le cache persistant seulement côté client
    if (typeof window !== "undefined") {
      await initializePersistentCache();
    }
    apolloClientInstance = createApolloClient();
  }
  return apolloClientInstance;
};

// Export de l'instance pour compatibilité
export const apolloClient = createApolloClient();
