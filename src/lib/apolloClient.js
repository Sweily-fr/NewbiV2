import { ApolloClient, InMemoryCache, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
import { toast } from "@/src/components/ui/sonner";

// Fonction pour vérifier si un token JWT est expiré
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    // Si on ne peut pas décoder le token, on considère qu'il est expiré
    return true;
  }
};

// Configuration Upload Link avec support des uploads de fichiers
const uploadLink = createUploadLink({
  uri: "http://localhost:4000/graphql",
  credentials: "include", // Important pour better-auth (cookies)
  headers: {
    "Apollo-Require-Preflight": "true",
  },
});

const authLink = setContext(async (_, { headers }) => {
  console.log('🔍 [Apollo Client] Configuration des headers d\'authentification');
  
  try {
    // Récupérer le JWT via getSession avec le header set-auth-jwt
    const { getSession } = await import("@/src/lib/auth-client");
    
    let jwtToken = null;
    
    await getSession({
      fetchOptions: {
        onSuccess: (ctx) => {
          const jwt = ctx.response.headers.get("set-auth-jwt");
          if (jwt) {
            jwtToken = jwt;
            console.log('✅ [Apollo Client] JWT récupéré depuis header set-auth-jwt');
          }
        }
      }
    });
    
    if (jwtToken) {
      console.log('✅ [Apollo Client] Token JWT valide, ajout header Authorization');
      const authHeaders = {
        headers: {
          ...headers,
          authorization: `Bearer ${jwtToken}`,
        }
      };
      console.log('🔍 [Apollo Client] Headers finaux:', authHeaders);
      return authHeaders;
    }
  } catch (error) {
    console.error('❌ [Apollo Client] Erreur récupération JWT:', error);
  }

  console.log('🔍 [Apollo Client] Pas de token JWT, headers sans authentification');
  const noAuthHeaders = {
    headers: {
      ...headers,
    }
  };
  console.log('🔍 [Apollo Client] Headers sans auth:', noAuthHeaders);
  return noAuthHeaders;
});

// Intercepteur d'erreurs pour gérer les erreurs d'authentification
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) => {
      // Si l'erreur est liée à l'authentification
      if (extensions?.code === "UNAUTHENTICATED") {
        toast.error("Session expirée. Veuillez vous reconnecter.", {
          duration: 5000,
        });

        // Rediriger vers la page de connexion après un délai
        setTimeout(() => {
          window.location.href = "/auth";
        }, 2000);
      } else {
        // Afficher les autres erreurs GraphQL
        toast.error(message);
      }
    });
  }

  if (networkError) {
    console.error("Network error:", networkError);

    // Détection du type d'erreur réseau
    if (networkError.message === "Failed to fetch") {
      toast.error(
        "Le serveur est actuellement indisponible. Veuillez réessayer ultérieurement.",
        {
          duration: 5000,
        }
      );
    } else if (networkError.message.includes("NetworkError")) {
      toast.warning(
        "Problème de connexion réseau. Veuillez vérifier votre connexion internet.",
        {
          duration: 5000,
        }
      );
    } else {
      toast.warning(
        `Problème de connexion au serveur: ${networkError.message}`,
        {
          duration: 5000,
        }
      );
    }
  }
});

export const apolloClient = new ApolloClient({
  link: from([authLink, errorLink, uploadLink]),
  cache: new InMemoryCache({
    // Configuration pour améliorer la synchronisation du cache
    typePolicies: {
      Query: {
        fields: {
          getMyEmailSignatures: {
            // Toujours refetch depuis le serveur pour garantir la fraîcheur
            fetchPolicy: "cache-and-network",
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
      // Forcer la notification des changements
      notifyOnNetworkStatusChange: true,
    },
    query: {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
    },
    mutate: {
      // Configuration pour les mutations
      errorPolicy: "all",
      // Forcer la mise à jour du cache après mutation
      awaitRefetchQueries: true,
    },
  },
});
