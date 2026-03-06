import {
  ApolloClient,
  InMemoryCache,
  from,
  split,
  Observable,
} from "@apollo/client";
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

  clearCachedJWT();
  resetOrganizationIdForApollo();

  // Ne pas reset isRedirecting — la page va se recharger via la redirection.
  // Le reset après timeout causait des boucles de redirection si la page
  // n'avait pas encore navigué et que d'autres erreurs auth arrivaient.
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

// ==================== JWT ON-DEMAND (mémoire uniquement) ====================
// Le cookie session est scopé au domaine frontend (Vercel).
// Pour les requêtes cross-origin vers le backend, on génère un JWT
// à la volée via /api/auth/token (same-origin = cookie envoyé).
// Le JWT vit uniquement en mémoire — jamais en localStorage (pas de risque XSS).
let _cachedJWT = null;
let _jwtExpiresAt = 0;
let _jwtFetchPromise = null;

const getJWTToken = async () => {
  // Si on a un JWT valide en cache (avec 60s de marge), le réutiliser
  if (_cachedJWT && Date.now() < _jwtExpiresAt - 60000) {
    return _cachedJWT;
  }

  // Éviter les appels parallèles (déduplique les fetches simultanés)
  if (_jwtFetchPromise) {
    return _jwtFetchPromise;
  }

  _jwtFetchPromise = (async () => {
    try {
      const response = await fetch("/api/auth/token", {
        credentials: "include",
      });

      if (!response.ok) {
        _cachedJWT = null;
        _jwtExpiresAt = 0;
        return null;
      }

      const data = await response.json();
      if (!data.token) {
        _cachedJWT = null;
        _jwtExpiresAt = 0;
        return null;
      }

      _cachedJWT = data.token;

      // Extraire l'expiration du JWT (payload base64)
      try {
        const payload = JSON.parse(atob(data.token.split(".")[1]));
        _jwtExpiresAt = (payload.exp || 0) * 1000;
      } catch {
        // Fallback : cache 5 minutes
        _jwtExpiresAt = Date.now() + 5 * 60 * 1000;
      }

      return _cachedJWT;
    } catch {
      _cachedJWT = null;
      _jwtExpiresAt = 0;
      return null;
    } finally {
      _jwtFetchPromise = null;
    }
  })();

  return _jwtFetchPromise;
};

function clearCachedJWT() {
  _cachedJWT = null;
  _jwtExpiresAt = 0;
}

// DEBUG: Exposer des helpers pour tester l'expiration de session en local
// ⚠️ À SUPPRIMER avant mise en production
if (typeof window !== "undefined") {
  window.__debugAuth = {
    // Simule un JWT expiré → la prochaine requête GraphQL déclenchera le retry
    expireJWT: () => {
      _cachedJWT = "expired.invalid.token";
      _jwtExpiresAt = Date.now() + 5 * 60 * 1000; // Le cache croit qu'il est valide
      console.log("[DEBUG] JWT remplacé par un token invalide. La prochaine requête GraphQL déclenchera le flow de retry.");
    },
    // Vide le cache JWT → la prochaine requête ira chercher un nouveau JWT
    clearJWT: () => {
      clearCachedJWT();
      console.log("[DEBUG] JWT cache vidé.");
    },
    // Affiche l'état actuel du cache JWT
    status: () => {
      console.log({
        hasJWT: !!_cachedJWT,
        expiresAt: _jwtExpiresAt ? new Date(_jwtExpiresAt).toISOString() : "none",
        isExpired: _jwtExpiresAt ? Date.now() > _jwtExpiresAt : true,
        isRedirecting,
        isRetryingAuth,
      });
    },
  };
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
// WebSocket ne peut pas envoyer de cookies — on utilise le même JWT on-demand
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

            const jwtToken = await getJWTToken();
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
// JWT on-demand pour l'auth cross-origin (frontend Vercel → backend API).
// Le JWT est récupéré via /api/auth/token (same-origin, cookie envoyé)
// et transmis au backend en Authorization: Bearer.
// Le JWT vit uniquement en mémoire — pas de localStorage.
const authLink = setContext(async (_, { headers }) => {
  const requestHeaders = { ...headers };

  // JWT on-demand pour authentifier les requêtes cross-origin
  const jwtToken = await getJWTToken();
  if (jwtToken) {
    requestHeaders["authorization"] = `Bearer ${jwtToken}`;
  }

  const organizationId = _workspaceReady ? _confirmedOrgId : null;
  const userRole = _workspaceReady
    ? localStorage.getItem("user_role")
    : null;

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
// File d'attente pour les operations qui arrivent pendant un retry auth en cours.
// Au lieu d'afficher un toast d'erreur, on les met en attente et on les retry
// une fois que la session a ete verifiee.
let _pendingRetryQueue = [];

const errorLink = onError(
  ({ graphQLErrors, networkError, operation, forward }) => {
    if (graphQLErrors) {
      let hasCriticalError = false;
      const processedMessages = new Set();

      // Classifier les erreurs : critiques vs non-critiques
      graphQLErrors.forEach((error) => {
        const { message, extensions } = error;
        const errorCode =
          extensions?.code !== "INTERNAL_SERVER_ERROR"
            ? extensions?.code
            : extensions?.exception?.code || error.code;
        const errorWithCode = { message, code: errorCode };

        if (isCriticalError(errorWithCode)) {
          hasCriticalError = true;
        } else {
          if (processedMessages.has(message)) return;
          processedMessages.add(message);

          const skipErrorToast = operation.getContext().skipErrorToast;
          const isBoardNotFound =
            message?.includes("Board not found") ||
            message?.includes("board not found");

          // Les mutations gerent leurs propres toasts via onError — ne pas doubler
          const definition = getMainDefinition(operation.query);
          const isMutation =
            definition.kind === "OperationDefinition" &&
            definition.operation === "mutation";

          if (!skipErrorToast && !isBoardNotFound && !isMutation) {
            const userMessage = getErrorMessage(errorWithCode, "generic");
            toast.error(userMessage, { duration: 4000 });
          }
        }
      });

      // Erreur auth critique pendant un retry en cours :
      // mettre l'operation en file d'attente au lieu d'afficher un toast
      if (hasCriticalError && isRetryingAuth && !isRedirecting) {
        return new Observable((observer) => {
          _pendingRetryQueue.push({ operation, forward, observer });
        });
      }

      // Erreur auth critique : retry transparent avec un nouveau JWT
      if (hasCriticalError && !isRetryingAuth && !isRedirecting) {
        const isInitialLoad = operation.getContext().isInitialLoad;
        if (isInitialLoad) return;

        isRetryingAuth = true;
        clearCachedJWT();

        // Retourner un Observable pour retry l'operation au lieu de propager l'erreur
        return new Observable((observer) => {
          authClient
            .getSession()
            .then(async (session) => {
              if (!session?.data?.user) {
                // Session reellement expiree — rediriger
                forceSessionExpiredRedirect("inactivity");
                observer.error(graphQLErrors[0]);
                // Vider la file d'attente avec erreur
                _pendingRetryQueue.forEach((pending) =>
                  pending.observer.error(graphQLErrors[0])
                );
                _pendingRetryQueue = [];
                return;
              }

              // Session valide — generer un nouveau JWT et l'injecter dans l'operation.
              // forward() ne repasse PAS par authLink (il va directement a uploadLink),
              // donc on doit manuellement mettre a jour les headers ici.
              const newJWT = await getJWTToken();
              const oldHeaders = operation.getContext().headers || {};
              operation.setContext({
                headers: {
                  ...oldHeaders,
                  authorization: newJWT ? `Bearer ${newJWT}` : "",
                },
              });

              forward(operation).subscribe({
                next: observer.next.bind(observer),
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer),
              });

              // Retry toutes les operations en file d'attente avec le nouveau JWT
              const queue = [..._pendingRetryQueue];
              _pendingRetryQueue = [];
              queue.forEach((pending) => {
                const pendingHeaders = pending.operation.getContext().headers || {};
                pending.operation.setContext({
                  headers: {
                    ...pendingHeaders,
                    authorization: newJWT ? `Bearer ${newJWT}` : "",
                  },
                });
                pending.forward(pending.operation).subscribe({
                  next: pending.observer.next.bind(pending.observer),
                  error: pending.observer.error.bind(pending.observer),
                  complete: pending.observer.complete.bind(pending.observer),
                });
              });
            })
            .catch(() => {
              // Erreur reseau lors de la verification — ne pas rediriger
              observer.error(graphQLErrors[0]);
              // Propager l'erreur aux operations en attente
              _pendingRetryQueue.forEach((pending) =>
                pending.observer.error(graphQLErrors[0])
              );
              _pendingRetryQueue = [];
            })
            .finally(() => {
              isRetryingAuth = false;
            });
        });
      }
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
  }
);

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

// Instance unique — partagée par tout le frontend
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
  devtools: {
    enabled: process.env.NODE_ENV === "development",
  },
});

// Backward compat — retourne la même instance unique
export const getApolloClient = async () => apolloClient;
