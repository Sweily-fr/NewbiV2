import { ApolloClient, InMemoryCache, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
import { toast } from "sonner";

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

const authLink = setContext((_, { headers }) => {
  // Récupérer le token depuis le localStorage
  const token = localStorage.getItem("token");

  // Vérifier si le token est expiré
  if (token && isTokenExpired(token)) {
    // Si le token est expiré, le supprimer
    localStorage.removeItem("token");
    // La déconnexion complète sera gérée par le contexte d'authentification
    return { headers };
  }

  // Retourner les headers avec le token d'authentification
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// console.log("token", authLink);

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
    // Activer les notifications de changement de cache
    addTypename: true,
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
