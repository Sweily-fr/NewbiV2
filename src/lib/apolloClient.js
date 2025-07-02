import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { toast } from "sonner";

// Fonction pour récupérer un cookie par son nom
function getCookie(name) {
  if (typeof window === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

const httpLink = new HttpLink({
  uri: "http://localhost:4000/graphql",
  credentials: "include", // Important pour better-auth (cookies)
});

const authLink = setContext((_, { headers }) => {
  // Récupérer le token depuis les cookies Better Auth
  const token = getCookie("better-auth.session_token");
  
  // Debug: afficher le token récupéré
  console.log("🍪 Cookie token récupéré:", token ? "✅ Token trouvé" : "❌ Pas de token");
  console.log("🔑 Token value:", token);
  
  // Debug: afficher tous les cookies disponibles
  if (typeof window !== "undefined") {
    console.log("🍪 Tous les cookies:", document.cookie);
  }

  // Retourner les headers avec le token d'authentification
  const finalHeaders = {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
  
  console.log("📤 Headers envoyés:", finalHeaders.headers);
  
  return finalHeaders;
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

export const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
    },
  },
});
