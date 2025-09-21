import { ApolloClient, InMemoryCache, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
import { toast } from "@/src/components/ui/sonner";
import { authClient } from "@/src/lib/auth-client";

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
    console.log("🔍 [Apollo] Récupération du token JWT...");

    await authClient.getSession({
      fetchOptions: {
        onSuccess: (ctx) => {
          const jwt = ctx.response.headers.get("set-auth-jwt");
          console.log("🔍 [Apollo] Token JWT reçu:", jwt ? "✅ OUI" : "❌ NON");
          if (jwt && !isTokenExpired(jwt)) {
            jwtToken = jwt;
            console.log("✅ [Apollo] Token JWT valide et non expiré");
          } else if (jwt) {
            console.log("⚠️ [Apollo] Token JWT expiré");
          }
        },
      },
    });

    if (jwtToken) {
      console.log("✅ [Apollo] Envoi du token JWT dans les headers");
      return {
        headers: {
          ...headers,
          authorization: `Bearer ${jwtToken}`,
        },
      };
    } else {
      console.log("❌ [Apollo] Aucun token JWT à envoyer");
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
    // Détection du type d'erreur réseau sans exposer les détails
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
      toast.warning("Problème de connexion au serveur.", {
        duration: 5000,
      });
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
