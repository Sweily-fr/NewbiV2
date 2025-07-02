import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const httpLink = new HttpLink({
  uri: "http://localhost:4000/graphql",
  credentials: "include",
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
  },
});

// const authLink = setContext((_, { headers }) => {
//   // Récupérer le token depuis le localStorage
//   const token = localStorage.getItem('token');

//   // Vérifier si le token est expiré
//   if (token && isTokenExpired(token)) {
//     // Si le token est expiré, le supprimer
//     localStorage.removeItem('token');
//     // La déconnexion complète sera gérée par le contexte d'authentification
//     return { headers };
//   }

//   // Retourner les headers avec le token d'authentification
//   return {
//     headers: {
//       ...headers,
//       authorization: token ? `Bearer ${token}` : "",
//     }
//   }
// });

// // Intercepteur d'erreurs pour gérer les erreurs d'authentification
// const errorLink = onError(({ graphQLErrors, networkError }) => {
//   if (graphQLErrors) {
//     graphQLErrors.forEach(({ message, extensions }) => {
//       // Si l'erreur est liée à l'authentification (token expiré, invalide, etc.)
//       if (extensions?.code === 'UNAUTHENTICATED') {
//         // Supprimer le token
//         localStorage.removeItem('token');

//         // Afficher une notification d'erreur
//         Notification.error('Session expirée. Veuillez vous reconnecter.', {
//           duration: 5000,
//           onClose: () => {
//             // Rediriger vers la page de connexion après la notification
//             window.location.href = '/auth';
//           }
//         });
//       } else {
//         // Afficher les autres erreurs GraphQL
//         Notification.error(`${message}`);
//       }
//     });
//   }

//   if (networkError) {
//     // Marquer l'erreur comme traitée pour éviter les doublons
//     // @ts-expect-error - Ajouter une propriété personnalisée à l'objet d'erreur
//     networkError.handled = true;

//     // Détection plus précise du type d'erreur réseau
//     if (networkError.message === 'Failed to fetch') {
//       Notification.error('Le serveur est actuellement indisponible. Veuillez réessayer ultérieurement ou contacter le support technique.', {
//         duration: 5000,
//       });
//     } else if (networkError.message.includes('NetworkError')) {
//       Notification.warning('Problème de connexion réseau. Veuillez vérifier votre connexion internet.', {
//         duration: 5000,
//       });
//     } else if (networkError.message.includes('timeout')) {
//       Notification.warning('La connexion au serveur a pris trop de temps. Veuillez réessayer.', {
//         duration: 5000,
//       });
//     } else {
//       Notification.warning(`Problème de connexion au serveur: ${networkError.message}`, {
//         duration: 5000,
//       });
//     }
//   }
// });
