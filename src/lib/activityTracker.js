/**
 * ActivityTracker - Service centralisé de gestion d'activité utilisateur
 *
 * Ce service est le point central pour :
 * 1. Tracker toute l'activité utilisateur (DOM + API)
 * 2. Gérer le rafraîchissement automatique de la session Better Auth
 * 3. Fournir un état cohérent pour useInactivityTimer et useSessionValidator
 *
 * Résout le problème où les sessions expiraient même quand l'utilisateur était actif
 * car les appels API n'étaient pas comptés comme activité.
 */

import { authClient } from "./auth-client";

// ==================== CONFIGURATION ====================
const CONFIG = {
  // Intervalle de rafraîchissement de session (25 min, avant updateAge de 30 min)
  SESSION_REFRESH_INTERVAL: 25 * 60 * 1000,

  // Timeout d'inactivité (60 min = 1 heure)
  // Note: expiresIn dans auth.js est à 70 min pour garder une marge de sécurité
  INACTIVITY_TIMEOUT: 60 * 60 * 1000,

  // Debounce pour les événements DOM fréquents (1 seconde)
  DOM_EVENT_DEBOUNCE: 1000,

  // Intervalle de vérification du timer (1 minute)
  CHECK_INTERVAL: 60 * 1000,
};

// ==================== ÉTAT GLOBAL ====================
let lastActivityTimestamp = Date.now();
let lastSessionRefreshTimestamp = 0;
let isRefreshingSession = false;
let checkIntervalId = null;
let isInitialized = false;

// Callbacks pour notifier les composants
const activityCallbacks = new Set();
const sessionExpiredCallbacks = new Set();

// ==================== FONCTIONS PUBLIQUES ====================

/**
 * Enregistre une activité utilisateur (DOM ou API)
 * Appelé par : événements DOM, requêtes GraphQL, navigation, etc.
 */
export function recordActivity(source = "unknown") {
  const now = Date.now();
  const timeSinceLastActivity = now - lastActivityTimestamp;

  // Debounce pour les activités très fréquentes
  if (timeSinceLastActivity < CONFIG.DOM_EVENT_DEBOUNCE && source === "dom") {
    return;
  }

  lastActivityTimestamp = now;

  // Log en développement
  if (process.env.NODE_ENV === "development") {
    console.log(`🟢 [ActivityTracker] Activité enregistrée: ${source}`);
  }

  // Notifier les listeners
  activityCallbacks.forEach((callback) => {
    try {
      callback(now);
    } catch (error) {
      console.error("[ActivityTracker] Erreur callback activité:", error);
    }
  });

  // Vérifier si on doit rafraîchir la session
  checkAndRefreshSession();
}

/**
 * Enregistre une activité API (appelé par Apollo Client)
 */
export function recordApiActivity() {
  recordActivity("api");
}

/**
 * Enregistre une activité DOM (appelé par useInactivityTimer)
 */
export function recordDomActivity() {
  recordActivity("dom");
}

/**
 * Retourne le temps écoulé depuis la dernière activité (en ms)
 */
export function getTimeSinceLastActivity() {
  return Date.now() - lastActivityTimestamp;
}

/**
 * Vérifie si l'utilisateur est considéré comme inactif
 */
export function isUserInactive() {
  return getTimeSinceLastActivity() >= CONFIG.INACTIVITY_TIMEOUT;
}

/**
 * Retourne le temps restant avant timeout d'inactivité (en ms)
 */
export function getTimeUntilInactivityTimeout() {
  const remaining = CONFIG.INACTIVITY_TIMEOUT - getTimeSinceLastActivity();
  return Math.max(0, remaining);
}

/**
 * Vérifie si on doit rafraîchir la session Better Auth
 */
export function shouldRefreshSession() {
  const timeSinceRefresh = Date.now() - lastSessionRefreshTimestamp;
  return timeSinceRefresh >= CONFIG.SESSION_REFRESH_INTERVAL;
}

/**
 * Rafraîchit la session Better Auth manuellement
 * Retourne true si le rafraîchissement a réussi
 */
export async function refreshSession() {
  if (isRefreshingSession) {
    console.log("[ActivityTracker] Rafraîchissement déjà en cours, skip");
    return false;
  }

  isRefreshingSession = true;

  try {
    console.log(
      "🔄 [ActivityTracker] Rafraîchissement de la session Better Auth...",
    );

    const session = await authClient.getSession({
      fetchOptions: {
        onSuccess: (ctx) => {
          // Récupérer le nouveau JWT si disponible
          const jwt =
            ctx.response.headers.get("set-auth-jwt") ||
            ctx.response.headers.get("set-auth-token");

          if (jwt) {
            localStorage.setItem("bearer_token", jwt);
            console.log("✅ [ActivityTracker] Nouveau JWT stocké");
          }

          lastSessionRefreshTimestamp = Date.now();
          console.log("✅ [ActivityTracker] Session rafraîchie avec succès");
        },
        onError: (error) => {
          console.error(
            "❌ [ActivityTracker] Erreur rafraîchissement session:",
            error,
          );
        },
      },
    });

    if (session?.data?.user) {
      lastSessionRefreshTimestamp = Date.now();
      return true;
    }

    return false;
  } catch (error) {
    console.error(
      "❌ [ActivityTracker] Exception rafraîchissement session:",
      error,
    );
    return false;
  } finally {
    isRefreshingSession = false;
  }
}

/**
 * Vérifie et rafraîchit la session si nécessaire
 */
async function checkAndRefreshSession() {
  if (shouldRefreshSession() && !isRefreshingSession) {
    await refreshSession();
  }
}

/**
 * Abonne un callback aux événements d'activité
 * Retourne une fonction pour se désabonner
 */
export function onActivity(callback) {
  activityCallbacks.add(callback);
  return () => activityCallbacks.delete(callback);
}

/**
 * Abonne un callback à l'expiration de session
 * Retourne une fonction pour se désabonner
 */
export function onSessionExpired(callback) {
  sessionExpiredCallbacks.add(callback);
  return () => sessionExpiredCallbacks.delete(callback);
}

/**
 * Notifie que la session a expiré
 */
export function notifySessionExpired(reason = "inactivity") {
  console.log(`⚠️ [ActivityTracker] Session expirée: ${reason}`);
  sessionExpiredCallbacks.forEach((callback) => {
    try {
      callback(reason);
    } catch (error) {
      console.error("[ActivityTracker] Erreur callback expiration:", error);
    }
  });
}

/**
 * Initialise le tracker d'activité
 * Doit être appelé une seule fois au démarrage de l'application
 */
export function initializeActivityTracker() {
  if (isInitialized) {
    console.log("[ActivityTracker] Déjà initialisé, skip");
    return;
  }

  if (typeof window === "undefined") {
    console.log("[ActivityTracker] Pas de window (SSR), skip");
    return;
  }

  console.log("🚀 [ActivityTracker] Initialisation...");

  // Configurer les événements DOM
  const domEvents = [
    "mousedown",
    "mousemove",
    "keypress",
    "keydown",
    "scroll",
    "touchstart",
    "click",
    "focus",
    "input",
    "change",
  ];

  const handleDomEvent = () => {
    recordDomActivity();
  };

  domEvents.forEach((event) => {
    document.addEventListener(event, handleDomEvent, {
      passive: true,
      capture: true,
    });
  });

  // Écouter les changements de visibilité
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      recordActivity("visibility");
      // Rafraîchir la session au retour si nécessaire
      checkAndRefreshSession();
    }
  });

  // Écouter le focus de la fenêtre
  window.addEventListener("focus", () => {
    recordActivity("focus");
    checkAndRefreshSession();
  });

  // Vérification périodique
  checkIntervalId = setInterval(() => {
    // Vérifier si on doit rafraîchir la session
    if (!isUserInactive()) {
      checkAndRefreshSession();
    }
  }, CONFIG.CHECK_INTERVAL);

  isInitialized = true;
  lastActivityTimestamp = Date.now();
  lastSessionRefreshTimestamp = Date.now();

  console.log("✅ [ActivityTracker] Initialisé avec succès");
  console.log(
    `   - Timeout d'inactivité: ${CONFIG.INACTIVITY_TIMEOUT / 60000} minutes`,
  );
  console.log(
    `   - Intervalle de rafraîchissement: ${CONFIG.SESSION_REFRESH_INTERVAL / 60000} minutes`,
  );
}

/**
 * Nettoie le tracker (pour les tests ou le démontage)
 */
export function cleanupActivityTracker() {
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
  }
  activityCallbacks.clear();
  sessionExpiredCallbacks.clear();
  isInitialized = false;
  console.log("🧹 [ActivityTracker] Nettoyé");
}

/**
 * Retourne la configuration actuelle (pour debug)
 */
export function getActivityTrackerConfig() {
  return {
    ...CONFIG,
    lastActivityTimestamp,
    lastSessionRefreshTimestamp,
    isInitialized,
    timeSinceLastActivity: getTimeSinceLastActivity(),
    timeUntilTimeout: getTimeUntilInactivityTimeout(),
  };
}

// Export de la configuration pour les autres modules
export const ACTIVITY_CONFIG = CONFIG;
