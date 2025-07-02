import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { toast } from "sonner";

const httpLink = new HttpLink({
  uri: "http://localhost:4000/graphql",
  credentials: "include", // Important pour better-auth (cookies)
});

// Intercepteur d'erreurs pour gérer les erreurs d'authentification
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) => {
      // Si l'erreur est liée à l'authentification
      if (extensions?.code === 'UNAUTHENTICATED') {
        toast.error('Session expirée. Veuillez vous reconnecter.', {
          duration: 5000,
        });
        
        // Rediriger vers la page de connexion après un délai
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
      } else {
        // Afficher les autres erreurs GraphQL
        toast.error(message);
      }
    });
  }

  if (networkError) {
    console.error('Network error:', networkError);
    
    // Détection du type d'erreur réseau
    if (networkError.message === 'Failed to fetch') {
      toast.error('Le serveur est actuellement indisponible. Veuillez réessayer ultérieurement.', {
        duration: 5000,
      });
    } else if (networkError.message.includes('NetworkError')) {
      toast.warning('Problème de connexion réseau. Veuillez vérifier votre connexion internet.', {
        duration: 5000,
      });
    } else {
      toast.warning(`Problème de connexion au serveur: ${networkError.message}`, {
        duration: 5000,
      });
    }
  }
});

export const client = new ApolloClient({
  link: from([errorLink, httpLink]),
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


