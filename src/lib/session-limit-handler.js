/**
 * Handler pour gérer la limite de sessions
 * Détecte si l'utilisateur a atteint la limite et redirige vers la page de gestion
 */

import { authClient } from "./auth-client";

/**
 * Vérifie si l'utilisateur a atteint la limite de sessions
 * @returns {Promise<{hasReachedLimit: boolean, sessions: Array}>}
 */
export async function checkSessionLimit() {
  try {
    const { data, error } = await authClient.multiSession.listDeviceSessions();
    
    if (error) {
      console.error("Erreur lors de la vérification des sessions:", error);
      return { hasReachedLimit: false, sessions: [] };
    }

    const sessionsArray = Array.isArray(data) ? data : data?.sessions || [data];
    const maxSessions = 1; // Correspond à la config dans auth-plugins.js

    return {
      hasReachedLimit: sessionsArray.length >= maxSessions,
      sessions: sessionsArray,
    };
  } catch (error) {
    console.error("Erreur lors de la vérification des sessions:", error);
    return { hasReachedLimit: false, sessions: [] };
  }
}

/**
 * Redirige vers la page de gestion des appareils si nécessaire
 * À appeler après une connexion réussie
 */
export async function handleSessionLimitRedirect(router) {
  const { hasReachedLimit } = await checkSessionLimit();
  
  if (hasReachedLimit) {
    router.push("/auth/manage-devices");
    return true;
  }
  
  return false;
}
