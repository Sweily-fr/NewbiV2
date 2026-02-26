import { ApolloClient, InMemoryCache, from, split } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
import { toast } from "@/src/components/ui/sonner";
import { authClient } from "@/src/lib/auth-client";
import { getErrorMessage, isCriticalError } from "@/src/utils/errorMessages";
import {
  recordApiActivity,
  shouldRefreshSession as checkShouldRefreshSession,
  refreshSession,
} from "@/src/lib/activityTracker";

// Fonction pour vérifier si un token JWT est expiré (avec marge de sécurité de 60 secondes)
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    // Ajouter une marge de 60 secondes pour éviter les race conditions
    // où le token expire pendant le traitement de la requête
    // (augmenté pour s'adapter à l'expiration de session d'1 heure)
    const EXPIRATION_BUFFER_SECONDS = 60;
    return payload.exp < (currentTime + EXPIRATION_BUFFER_SECONDS);
  } catch {
    // Si on ne peut pas décoder le token, on considère qu'il est expiré
    return true;
  }
};

// ==================== SYSTÈME DE RAFRAÎCHISSEMENT DE SESSION ====================
// Utilise le service centralisé ActivityTracker pour :
// - Tracker l'activité API (chaque requête GraphQL)
// - Rafraîchir la session Better Auth automatiquement (via updateAge)
// - Synchroniser avec useInactivityTimer et useSessionValidator

// ==================== GARDE ANTI-BOUCLE POUR LES ERREURS AUTH ====================
// Empêche les toasts multiples et redirections simultanées
let isAuthErrorHandling = false;
let authErrorTimeout = null;
let isRedirecting = false;

const resetAuthErrorGuard = () => {
  authErrorTimeout = setTimeout(() => {
    isAuthErrorHandling = false;
    authErrorTimeout = null;
  }, 5000); // Reset après 5 secondes
};

const canHandleAuthError = () => {
  if (isAuthErrorHandling) {
    return false;
  }
  isAuthErrorHandling = true;
  resetAuthErrorGuard();
  return true;
};

/**
 * Force la redirection vers la page d'expiration de session
 * Utilise window.location.href pour une redirection immédiate et fiable
 */
const forceSessionExpiredRedirect = (reason = "inactivity") => {
  // ✅ FIX: Garde dev retirée — le mécanisme de retry (handleCriticalAuthError)
  // protège déjà contre les faux positifs (hot-reload, erreurs transitoires).
  // forceSessionExpiredRedirect n'est appelé qu'après un échec confirmé de refreshSession().

  // Éviter les redirections multiples
  if (isRedirecting) {
    return;
  }
  isRedirecting = true;

  // Nettoyer le token et l'org ID
  localStorage.removeItem("bearer_token");
  resetOrganizationIdForApollo();

  // Réinitialiser la garde après 3 secondes au cas où la redirection échoue
  setTimeout(() => {
    isRedirecting = false;
  }, 3000);

  // Redirection immédiate et synchrone
  console.log(`🔒 [Apollo] Redirection forcée vers /auth/session-expired (${reason})`);
  window.location.href = `/auth/session-expired?reason=${reason}`;
};

// ==================== SYNCHRONISATION ORG ID AVEC useWorkspace ====================
// Module-level variable pour éviter d'envoyer un x-organization-id périmé
// depuis localStorage avant que useWorkspace ne confirme l'org du user courant.
// Le RBAC fallback côté API gère le cas où aucun org ID n'est envoyé.
let _workspaceReady = false;
let _confirmedOrgId = null;

/**
 * Appelée par useWorkspace quand l'organisation active est confirmée.
 * Met à jour la variable module-level ET localStorage.
 */
export function setOrganizationIdForApollo(orgId) {
  _workspaceReady = true;
  _confirmedOrgId = orgId || null;
}

/**
 * Réinitialise l'état (utile au logout ou changement de session).
 */
export function resetOrganizationIdForApollo() {
  _workspaceReady = false;
  _confirmedOrgId = null;
}

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
const wsLink =
  typeof window !== "undefined"
    ? new WebSocketLink({
        uri: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/graphql",
        options: {
          reconnect: true,
          lazy: true, // Connexion lazy pour permettre la reconnexion avec nouveau token
          connectionParams: async () => {
            // Vérifier si on est sur une page publique (pas besoin d'auth)
            const isPublicPage = typeof window !== "undefined" && window.location.pathname.startsWith("/public/");
            
            if (isPublicPage) {
              // Pour les pages publiques, pas besoin d'authentification
              console.log("ℹ️ [WebSocket] Page publique, connexion sans authentification");
              return {};
            }
            
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
                      // Vérifier les deux noms de headers possibles
                      const jwt = ctx.response.headers.get("set-auth-jwt") ||
                                 ctx.response.headers.get("set-auth-token");
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
                    console.log(
                      "ℹ️ [WebSocket] Session disponible sans JWT, utilisation des cookies"
                    );
                  }
                  break;
                }

                // Si pas de session, attendre un peu avant de réessayer
                if (retries < maxRetries - 1) {
                  await new Promise((resolve) => setTimeout(resolve, 500));
                  retries++;
                } else {
                  break;
                }
              } catch {
                console.warn(
                  "⚠️ [WebSocket] Erreur récupération session, retry:",
                  retries + 1
                );
                if (retries < maxRetries - 1) {
                  await new Promise((resolve) => setTimeout(resolve, 500));
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
      })
    : null;

// Stocker le client WebSocket pour pouvoir le fermer/rouvrir
if (wsLink && typeof window !== "undefined") {
  wsClient = wsLink.subscriptionClient;

  // Fonction pour reconnecter le WebSocket avec un nouveau token (avec debouncing amélioré)
  let reconnectTimeout = null;
  let isReconnecting = false;

  const reconnectWebSocket = () => {
    // Double vérification pour éviter les reconnexions multiples
    if (!wsClient || isReconnecting || reconnectTimeout !== null) {
      return;
    }

    console.log("🔄 [WebSocket] Reconnexion programmée...");
    isReconnecting = true;

    // Debouncing : attendre 500ms avant de reconnecter
    reconnectTimeout = setTimeout(() => {
      console.log("🔄 [WebSocket] Reconnexion avec nouveau token");
      try {
        wsClient.close(false, false);
      } catch (e) {
        console.warn("⚠️ [WebSocket] Erreur lors de la fermeture:", e.message);
      }
      reconnectTimeout = null;
      isReconnecting = false;
      // Le lazy: true va reconnecter automatiquement
    }, 500);
  };

  // Écouter UNIQUEMENT les changements de session (connexion/déconnexion)
  // Note: Cet event listener n'est pas nettoyé car wsLink est un singleton global
  // et vit pendant toute la durée de l'application
  if (typeof window !== "undefined") {
    const handleStorageChange = (e) => {
      if (e.key === "better-auth.session_token" || e.key === "bearer_token") {
        console.log("🔄 [WebSocket] Session/token changé, reconnexion...");
        reconnectWebSocket();
      }
    };

    // Supprimer tout listener existant avant d'en ajouter un nouveau
    // (au cas où le module serait rechargé en développement)
    window.removeEventListener("storage", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);
  }
}

const authLink = setContext(async (_, { headers }) => {
  try {
    let jwtToken = null;

    // ✅ ACTIVITÉ API : Enregistrer chaque requête GraphQL comme activité
    // Cela permet à ActivityTracker de savoir que l'utilisateur est actif
    recordApiActivity();

    // 1. Vérifier d'abord le JWT stocké dans localStorage
    const storedToken = localStorage.getItem("bearer_token");
    const tokenExpired = storedToken ? isTokenExpired(storedToken) : true;
    if (storedToken && !tokenExpired) {
      jwtToken = storedToken;
    }
    // NB: On ne supprime PAS le token expiré ici — on le garde en fallback
    // Le serveur a une clockTolerance de 60s, donc un token récemment expiré reste valide

    // 2. Si pas de JWT valide OU si on doit rafraîchir la session, appeler getSession()
    // ✅ FIX CRITIQUE : Utilise ActivityTracker pour décider quand rafraîchir
    // Cela déclenche le mécanisme updateAge de Better Auth (30 min)
    const needsSessionRefresh = checkShouldRefreshSession();

    if (!jwtToken || needsSessionRefresh) {
      if (needsSessionRefresh) {
        // Utiliser la fonction centralisée de rafraîchissement
        await refreshSession();
        // Récupérer le nouveau token
        const newToken = localStorage.getItem("bearer_token");
        if (newToken && !isTokenExpired(newToken)) {
          jwtToken = newToken;
        }
      } else {
        // Pas de JWT, récupérer via getSession()
        const session = await authClient.getSession({
          fetchOptions: {
            onSuccess: (ctx) => {
              const jwt = ctx.response.headers.get("set-auth-jwt") ||
                         ctx.response.headers.get("set-auth-token");
              if (jwt && !isTokenExpired(jwt)) {
                jwtToken = jwt;
                localStorage.setItem("bearer_token", jwt);
              }
            },
            onError: () => {},
          },
        });

        // Si getSession() n'a pas retourné de JWT (cookieCache actif),
        // utiliser l'endpoint dédié /api/auth/token du plugin JWT
        if (!jwtToken) {
          console.log("⚠️ [Apollo] Pas de JWT après getSession, appel /api/auth/token...");
          try {
            const tokenResponse = await fetch("/api/auth/token", {
              credentials: "include",
            });
            if (tokenResponse.ok) {
              const tokenData = await tokenResponse.json();
              if (tokenData.token && !isTokenExpired(tokenData.token)) {
                jwtToken = tokenData.token;
                localStorage.setItem("bearer_token", tokenData.token);
              }
            }
          } catch (err) {
            console.warn("⚠️ [Apollo] Erreur /api/auth/token:", err.message);
          }
        }
      }

      // Fallback: si le refresh n'a pas retourné de nouveau JWT,
      // utiliser l'ancien token (même expiré côté client) car le serveur
      // a une clockTolerance de 60s et le token peut encore être valide
      if (!jwtToken && storedToken) {
        jwtToken = storedToken;
      }
    }

    // 3. Récupérer l'organization ID et le rôle
    // ✅ Utiliser la variable module-level confirmée par useWorkspace si disponible.
    // Si useWorkspace n'a pas encore chargé, ne pas envoyer de header org ID
    // pour éviter les org ID périmés dans localStorage. Le RBAC API a un fallback
    // qui retrouve l'org via la collection member.
    const organizationId = _workspaceReady
      ? _confirmedOrgId
      : null;
    const userRole = _workspaceReady
      ? localStorage.getItem("user_role")
      : null;

    // 4. Construire les headers avec JWT + organization + role
    const requestHeaders = {
      ...headers,
    };

    if (jwtToken) {
      requestHeaders.authorization = `Bearer ${jwtToken}`;
    }

    if (organizationId) {
      requestHeaders["x-organization-id"] = organizationId;
    }

    if (userRole) {
      requestHeaders["x-user-role"] = userRole;
    }

    return {
      headers: requestHeaders,
    };
  } catch (error) {
    console.error("❌ [Apollo] Erreur récupération JWT:", error.message);
  }

  // Fallback: utiliser les cookies httpOnly
  return {
    headers: {
      ...headers,
    },
  };
});

// ✅ FIX: Tentative de rafraîchissement de session avant redirection
// Évite les déconnexions sur des erreurs UNAUTHENTICATED transitoires
// (JWT expiré temporairement, cookie cache, cold start Vercel, etc.)
let isRetryingAuth = false;

const handleCriticalAuthError = async (operation, message) => {
  // Éviter les retries simultanés
  if (isRetryingAuth || isRedirecting) {
    return;
  }

  const isInitialLoad = operation.getContext().isInitialLoad;
  if (isInitialLoad) {
    console.warn("⚠️ [Apollo] Erreur auth au chargement initial:", message);
    return;
  }

  isRetryingAuth = true;

  try {
    // 1. Tenter de rafraîchir la session avant de rediriger
    console.log("🔄 [Apollo] Erreur auth détectée, tentative de refresh session...");
    const refreshed = await refreshSession();

    if (refreshed) {
      console.log("✅ [Apollo] Session rafraîchie avec succès après erreur auth, pas de redirection");
      // La session est valide, l'erreur était transitoire
      // Les requêtes suivantes utiliseront le nouveau token
      return;
    }

    // 2. Le refresh a échoué - la session est vraiment expirée
    if (canHandleAuthError()) {
      console.log("🔒 [Apollo] Session réellement expirée après retry, redirection...");
    }
    forceSessionExpiredRedirect("inactivity");
  } catch (error) {
    console.error("❌ [Apollo] Erreur lors du retry auth:", error);
    // En cas d'erreur réseau lors du retry, ne PAS rediriger
    // L'utilisateur pourra réessayer manuellement
  } finally {
    isRetryingAuth = false;
  }
};

// Intercepteur d'erreurs pour gérer les erreurs d'authentification
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    // Utiliser un Set pour éviter les messages en double
    const processedMessages = new Set();

    graphQLErrors.forEach((error) => {
      const { message, extensions } = error;
      // ✅ FIX: Extraire le code d'erreur avec fallback complet
      // Le backend peut renvoyer le code à 3 endroits différents :
      // 1. extensions.code (format standard après formatError)
      // 2. extensions.exception.code (quand formatError n'attrape pas l'AppError)
      // 3. error.code (ancien format)
      const errorCode = extensions?.code !== "INTERNAL_SERVER_ERROR"
        ? extensions?.code
        : extensions?.exception?.code || error.code;
      const errorWithCode = { message, code: errorCode };

      // Éviter de traiter le même message plusieurs fois
      if (processedMessages.has(message)) {
        return;
      }
      processedMessages.add(message);

      // Utiliser notre système centralisé pour obtenir le message utilisateur
      const userMessage = getErrorMessage(errorWithCode, "generic");

      // Si l'erreur est critique (authentification), tenter un refresh avant de rediriger
      if (isCriticalError(errorWithCode)) {
        // ✅ FIX: Ne plus rediriger immédiatement, d'abord tenter un refresh
        handleCriticalAuthError(operation, message);
      } else {
        // Ne pas afficher de toast si skipErrorToast est activé (redirection en cours)
        const skipErrorToast = operation.getContext().skipErrorToast;

        // Ne pas afficher de toast pour les erreurs "Board not found" (changement d'organisation)
        const isBoardNotFound =
          message?.includes("Board not found") ||
          message?.includes("board not found");

        if (!skipErrorToast && !isBoardNotFound) {
          // Afficher le message original du backend au lieu du message générique
          // Cela permet d'avoir des messages d'erreur précis comme "La date d'émission ne peut pas être antérieure..."
          toast.error(message || userMessage, {
            duration: 4000,
          });
        } else if (isBoardNotFound) {
          // Log silencieux pour les boards introuvables (changement d'organisation)
          console.warn(
            "⚠️ [Apollo] Board introuvable (changement d'organisation):",
            message
          );
        } else {
          // Log silencieux pour les redirections
          console.warn(
            "⚠️ [Apollo] Erreur silencieuse (redirection en cours):",
            message
          );
        }
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
  typePolicies: {
    Board: {
      fields: {
        tasks: {
          // Politique de merge pour éviter les conflits lors des mises à jour en temps réel
          merge(existing = [], incoming, { mergeObjects }) {
            // Toujours prendre les données entrantes (du serveur ou de la subscription)
            // Cela évite les conflits de cache lors des drag-and-drop
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

// Variable pour stocker l'instance Apollo Client
let apolloClientInstance = null;

// Fonction pour créer le client Apollo
const createApolloClient = () => {
  // Créer le link split pour diriger les subscriptions vers WebSocket
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
          wsLink, // WebSocket pour les subscriptions
          from([authLink, errorLink, uploadLink]) // HTTP pour queries et mutations
        )
      : from([authLink, errorLink, uploadLink]); // Fallback pour SSR

  return new ApolloClient({
    link: splitLink,
    cache,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "cache-and-network",
        errorPolicy: "all",
        notifyOnNetworkStatusChange: true,
      },
      query: {
        fetchPolicy: "cache-and-network",
        errorPolicy: "all",
      },
      mutate: {
        errorPolicy: "all",
        awaitRefetchQueries: true,
      },
    },
    // Configuration des DevTools (nouvelle syntaxe)
    devtools: {
      enabled: process.env.NODE_ENV === "development",
    },
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
