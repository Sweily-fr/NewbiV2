import { ApolloClient, InMemoryCache, from, split } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
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

// Variable globale pour stocker le client WebSocket
let wsClient = null;

// Configuration WebSocket Link pour les subscriptions
const wsLink = typeof window !== "undefined" ? new WebSocketLink({
  uri: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/graphql",
  options: {
    reconnect: true,
    lazy: true, // Connexion lazy pour permettre la reconnexion avec nouveau token
    connectionParams: async () => {
      // Récupérer le JWT pour l'authentification WebSocket
      let jwtToken = null;
      let retries = 0;
      const maxRetries = 3;
      
      // Retry logic pour attendre que la session soit disponible
      while (retries < maxRetries) {
        try {
          const session = await authClient.getSession({
            fetchOptions: {
              onSuccess: (ctx) => {
                const jwt = ctx.response.headers.get("set-auth-jwt");
                if (jwt && !isTokenExpired(jwt)) {
                  jwtToken = jwt;
                }
              },
            },
          });
          
          // Si on a une session, on peut continuer
          if (session?.session) {
            if (jwtToken) {
              console.log("✅ [WebSocket] JWT récupéré pour connexion");
            } else {
              console.log("ℹ️ [WebSocket] Session disponible sans JWT, utilisation des cookies");
            }
            break;
          }
          
          // Si pas de session, attendre un peu avant de réessayer
          if (retries < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
            retries++;
          } else {
            break;
          }
        } catch {
          console.warn("⚠️ [WebSocket] Erreur récupération session, retry:", retries + 1);
          if (retries < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
            retries++;
          } else {
            break;
          }
        }
      }
      
      return {
        authorization: jwtToken ? `Bearer ${jwtToken}` : "",
      };
    },
    // Reconnexion automatique avec nouveau token quand le token expire
    onError: (error) => {
      console.error("❌ [WebSocket] Erreur:", error);
    },
  },
}) : null;

// Stocker le client WebSocket pour pouvoir le fermer/rouvrir
if (wsLink && typeof window !== "undefined") {
  wsClient = wsLink.subscriptionClient;
  
  // Fonction pour reconnecter le WebSocket avec un nouveau token
  const reconnectWebSocket = () => {
    if (wsClient) {
      console.log("🔄 [WebSocket] Reconnexion avec nouveau token");
      wsClient.close(false, false);
      // Le lazy: true va reconnecter automatiquement
    }
  };
  
  // Écouter les changements de session pour reconnecter le WebSocket
  if (typeof window !== "undefined") {
    // Reconnecter immédiatement si une session existe
    authClient.getSession().then((session) => {
      if (session?.session) {
        reconnectWebSocket();
      }
    });
    
    // Vérifier périodiquement si le token a expiré (toutes les 5 minutes)
    setInterval(async () => {
      try {
        const session = await authClient.getSession();
        if (session?.session) {
          reconnectWebSocket();
        }
      } catch (error) {
        console.warn("⚠️ [WebSocket] Erreur vérification session:", error);
      }
    }, 5 * 60 * 1000); // Toutes les 5 minutes
    
    // Écouter les événements de changement de session (connexion/déconnexion)
    window.addEventListener('storage', (e) => {
      if (e.key === 'better-auth.session_token') {
        console.log("🔄 [WebSocket] Session changée, reconnexion...");
        reconnectWebSocket();
      }
    });
  }
}

const authLink = setContext(async (_, { headers }) => {
  try {
    // Récupérer le JWT via authClient.getSession avec le header set-auth-jwt
    let jwtToken = null;

    const session = await authClient.getSession({
      fetchOptions: {
        onSuccess: (ctx) => {
          const jwt = ctx.response.headers.get("set-auth-jwt");
          if (jwt && !isTokenExpired(jwt)) {
            jwtToken = jwt;
          }
        },
        onError: (ctx) => {
          // Log l'erreur mais ne bloque pas
          console.warn("⚠️ [Apollo] Session non disponible:", ctx.error?.message);
        },
      },
    });

    // Si on a une session mais pas de JWT, essayer de le récupérer depuis la session
    if (session?.session && !jwtToken) {
      // Certaines requêtes peuvent fonctionner avec les cookies seulement
      console.log("ℹ️ [Apollo] Session disponible sans JWT, utilisation des cookies");
    }

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
    console.warn("⚠️ [Apollo] Erreur récupération JWT:", error.message);
  }

  return {
    headers: {
      ...headers,
    },
  };
});

// Intercepteur d'erreurs pour gérer les erreurs d'authentification
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach((error) => {
      const { message, extensions } = error;
      const errorWithCode = { message, code: extensions?.code };

      // Utiliser notre système centralisé pour obtenir le message utilisateur
      const userMessage = getErrorMessage(errorWithCode, "generic");

      // Si l'erreur est critique (authentification), gérer la redirection
      if (isCriticalError(errorWithCode)) {
        // Ne pas afficher de toast si c'est une erreur au chargement initial
        const isInitialLoad = operation.getContext().isInitialLoad;
        
        if (!isInitialLoad) {
          toast.error(userMessage, {
            duration: 5000,
            description: "Vous allez être redirigé vers la page de connexion",
          });

          // Rediriger vers la page de connexion après un délai
          setTimeout(() => {
            window.location.href = "/auth/login";
          }, 2000);
        } else {
          // Log silencieux pour le chargement initial
          console.warn("⚠️ [Apollo] Erreur auth au chargement initial:", message);
        }
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

// Configuration du cache sans persistance
const cache = new InMemoryCache({
  // Configuration minimale pour éviter les warnings
  addTypename: true,
});

// Variable pour stocker l'instance Apollo Client
let apolloClientInstance = null;

// Fonction pour créer le client Apollo
const createApolloClient = () => {
  // Créer le link split pour diriger les subscriptions vers WebSocket
  const splitLink = typeof window !== "undefined" && wsLink
    ? split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
          );
        },
        wsLink, // WebSocket pour les subscriptions
        from([authLink, errorLink, uploadLink]) // HTTP pour queries et mutations
      )
    : from([authLink, errorLink, uploadLink]); // Fallback pour SSR

  return new ApolloClient({
    link: splitLink,
    cache,
    defaultOptions: {
      watchQuery: {
        // Désactivation du cache : toujours aller chercher les données fraîches
        fetchPolicy: "network-only",
        errorPolicy: "all",
        notifyOnNetworkStatusChange: true,
      },
      query: {
        // Désactivation du cache : toujours requête réseau
        fetchPolicy: "network-only",
        errorPolicy: "all",
      },
      mutate: {
        errorPolicy: "all",
        awaitRefetchQueries: true,
      },
    },
    // Améliorer les performances avec le mode de développement
    connectToDevTools: process.env.NODE_ENV === "development",
  });
};

// Fonction pour obtenir l'instance Apollo Client
export const getApolloClient = async () => {
  if (!apolloClientInstance) {
    apolloClientInstance = createApolloClient();
  }
  return apolloClientInstance;
};

// Export de l'instance pour compatibilité
export const apolloClient = createApolloClient();
