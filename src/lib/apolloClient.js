import {
  ApolloClient,
  InMemoryCache,
  from,
  split,
  Observable,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { RetryLink } from "@apollo/client/link/retry";
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
  _workspaceReady = !!orgId;
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
        console.error(
          `[JWT] /api/auth/token a retourné ${response.status}. Le cookie de session est peut-être invalide.`,
        );
        _cachedJWT = null;
        _jwtExpiresAt = 0;
        return null;
      }

      const data = await response.json();
      if (!data.token) {
        console.error(
          "[JWT] /api/auth/token a répondu 200 mais sans token dans le body.",
        );
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
    } catch (err) {
      console.error(
        "[JWT] Erreur réseau lors de l'appel /api/auth/token:",
        err?.message || err,
      );
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
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  window.__debugAuth = {
    // Simule un JWT expiré → la prochaine requête GraphQL déclenchera le retry
    expireJWT: () => {
      _cachedJWT = "expired.invalid.token";
      _jwtExpiresAt = Date.now() + 5 * 60 * 1000; // Le cache croit qu'il est valide
      console.log(
        "[DEBUG] JWT remplacé par un token invalide. La prochaine requête GraphQL déclenchera le flow de retry.",
      );
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
        expiresAt: _jwtExpiresAt
          ? new Date(_jwtExpiresAt).toISOString()
          : "none",
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
let _wsClient = null;

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _wsClient = wsLink.subscriptionClient;
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
  const userRole = _workspaceReady ? localStorage.getItem("user_role") : null;

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
      // Intercept SUBSCRIPTION_READ_ONLY errors → trigger modal
      const hasSubscriptionBlock = graphQLErrors.some(
        (e) =>
          e.extensions?.code === "SUBSCRIPTION_READ_ONLY" ||
          e.extensions?.exception?.code === "SUBSCRIPTION_READ_ONLY" ||
          e.code === "SUBSCRIPTION_READ_ONLY",
      );
      if (hasSubscriptionBlock) {
        // Trigger the subscription blocked dialog (deduplication handled in the component)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("subscription-blocked"));
        }
        return; // Don't process further — the dialog handles it
      }

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
          // Pendant un retry auth en cours, ne pas afficher de toast
          // car les erreurs vont être retried automatiquement avec le nouveau JWT
          if (isRetryingAuth) return;

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
            const operationName = operation.operationName || "inconnue";

            // Log détaillé dans la console pour le debug
            console.error(
              `[GraphQL Error] Opération: ${operationName}`,
              `\n  Code: ${errorCode || "N/A"}`,
              `\n  Message: ${message}`,
              `\n  Variables:`,
              operation.variables,
            );

            toast.error(userMessage, {
              duration: 6000,
              details: {
                operation: operationName,
                errorCode: errorCode || null,
                rawMessage: message,
              },
            });
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

        console.warn(
          `[Auth Retry] Erreur auth détectée sur "${operation.operationName}". JWT expiré, tentative de renouvellement...`,
          `\n  Erreur:`,
          graphQLErrors.map((e) => e.message).join(", "),
        );

        // Retourner un Observable pour retry l'operation au lieu de propager l'erreur
        return new Observable((observer) => {
          authClient
            .getSession()
            .then(async (session) => {
              if (!session?.data?.user) {
                // Session reellement expiree — rediriger
                console.error(
                  "[Auth Retry] getSession() n'a pas retourné de user — session expirée.",
                  "\n  session.data:",
                  JSON.stringify(session?.data || null),
                );
                forceSessionExpiredRedirect("inactivity");
                observer.error(graphQLErrors[0]);
                // Vider la file d'attente avec erreur
                _pendingRetryQueue.forEach((pending) =>
                  pending.observer.error(graphQLErrors[0]),
                );
                _pendingRetryQueue = [];
                return;
              }

              // Session valide — generer un nouveau JWT et l'injecter dans l'operation.
              // forward() ne repasse PAS par authLink (il va directement a uploadLink),
              // donc on doit manuellement mettre a jour les headers ici.
              const newJWT = await getJWTToken();

              if (!newJWT) {
                console.error(
                  "[Auth Retry] Session valide mais getJWTToken() a retourné null. Le endpoint /api/auth/token a échoué.",
                );
              } else {
                console.log(
                  `[Auth Retry] Nouveau JWT obtenu, retry de "${operation.operationName}"`,
                );
              }

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
                const pendingHeaders =
                  pending.operation.getContext().headers || {};
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
            .catch((err) => {
              // Erreur reseau lors de la verification — ne pas rediriger
              console.error(
                "[Auth Retry] Erreur réseau lors de getSession():",
                err?.message || err,
              );
              observer.error(graphQLErrors[0]);
              // Propager l'erreur aux operations en attente
              _pendingRetryQueue.forEach((pending) =>
                pending.observer.error(graphQLErrors[0]),
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
      // Pendant un retry auth, ne pas afficher de toasts réseau
      if (isRetryingAuth || isRedirecting) return;

      const msg = networkError.message || "";

      // Erreurs de chunk stale (deploiement Vercel) : ne pas afficher de toast,
      // le listener global dans layout.jsx va auto-reload la page.
      const isChunkError =
        msg.includes("Unexpected token") ||
        msg.includes("ChunkLoadError") ||
        msg.includes("Loading chunk") ||
        msg.includes("dynamically imported module") ||
        msg.includes("ERR_CONNECTION_CLOSED");

      if (isChunkError) {
        // Silencieux — le auto-reload va s'en charger
        return;
      }

      // "Failed to fetch" = erreur réseau transitoire (timeout, connexion perdue)
      // Ne pas afficher de toast — ça n'a pas d'incidence fonctionnelle et c'est pas pro
      if (msg === "Failed to fetch") {
        console.warn(
          `[Network] ${operation.operationName || "?"}: Failed to fetch (transitoire)`,
        );
        return;
      }

      const userMessage = getErrorMessage(networkError, "network");
      const networkOperationName = operation.operationName || "inconnue";

      console.error(
        `[Network Error] Opération: ${networkOperationName}`,
        `\n  Message: ${msg}`,
        `\n  Status: ${networkError.statusCode || "N/A"}`,
      );

      toast.error(userMessage, {
        duration: 4000,
      });
    }
  },
);

// ==================== RETRY LINK ====================
// Retry automatique sur erreurs réseau transitoires (ex: "Failed to fetch",
// connexion brièvement perdue entre Vercel et le backend VPS).
// N'agit que sur les erreurs réseau — les erreurs GraphQL (validation, auth,
// permissions, etc.) ne sont jamais retried car ce n'est pas transitoire.
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 3000,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error) => {
      if (!error) return false;
      // Pas de retry sur les erreurs 4xx (client) — ce n'est pas transitoire
      if (
        typeof error.statusCode === "number" &&
        error.statusCode >= 400 &&
        error.statusCode < 500
      ) {
        return false;
      }
      return true;
    },
  },
});

// ==================== CACHE ====================
const cache = new InMemoryCache({
  typePolicies: {
    Board: {
      fields: {
        tasks: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          merge(existing = [], incoming) {
            return incoming;
          },
        },
        columns: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          merge(existing = [], incoming) {
            return incoming;
          },
        },
      },
    },
    Column: {
      fields: {
        tasks: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        from([authLink, errorLink, retryLink, uploadLink]),
      )
    : from([authLink, errorLink, retryLink, uploadLink]);

// Instance unique — partagée par tout le frontend
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-first",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "cache-first",
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
