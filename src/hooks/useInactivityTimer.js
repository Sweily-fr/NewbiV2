import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/src/components/ui/sonner";
import { authClient } from "@/src/lib/auth-client";
import {
  initializeActivityTracker,
  isUserInactive,
  getTimeUntilInactivityTimeout,
  onActivity,
  ACTIVITY_CONFIG,
} from "@/src/lib/activityTracker";

/**
 * Hook pour gérer la déconnexion automatique après inactivité
 *
 * REFACTORISÉ pour utiliser ActivityTracker :
 * - Le tracking des événements DOM est géré par ActivityTracker
 * - Les appels API sont aussi comptés comme activité (via apolloClient)
 * - Timeout aligné sur la configuration centralisée (60 min = 1 heure)
 *
 * @param {number} timeoutMinutes - Ignoré, utilise la config ActivityTracker (60 min)
 * @param {boolean} enabled - Active/désactive le timer d'inactivité (défaut: true)
 */
export function useInactivityTimer(_timeoutMinutes = 60, enabled = true) {
  const router = useRouter();
  const checkIntervalRef = useRef(null);
  const hasLoggedOutRef = useRef(false);

  // Utiliser le timeout de ActivityTracker (55 min) pour cohérence
  const effectiveTimeoutMs = ACTIVITY_CONFIG.INACTIVITY_TIMEOUT;

  // Fonction de déconnexion
  const handleLogout = useCallback(async () => {
    // Éviter les déconnexions multiples
    if (hasLoggedOutRef.current) {
      return;
    }
    hasLoggedOutRef.current = true;

    try {
      console.log("⏰ [Inactivity] Déconnexion pour inactivité...");

      // Afficher la notification de déconnexion
      toast.error("Vous avez été déconnecté pour cause d'inactivité", {
        duration: 5000,
        position: "top-center",
      });

      // Nettoyer le token
      localStorage.removeItem("bearer_token");

      // Déconnexion via Better Auth
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/auth/session-expired?reason=inactivity");
          },
          onError: (ctx) => {
            console.error("Erreur lors de la déconnexion:", ctx.error);
            router.push("/auth/session-expired?reason=inactivity");
          },
        },
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion automatique:", error);
      router.push("/auth/session-expired?reason=inactivity");
    }
  }, [router]);

  // Vérifier l'inactivité périodiquement
  const checkInactivity = useCallback(() => {
    if (!enabled) return;

    if (isUserInactive()) {
      console.log("⏰ [Inactivity] Utilisateur inactif détecté, déconnexion...");
      handleLogout();
    }
  }, [enabled, handleLogout]);

  useEffect(() => {
    if (!enabled) {
      // Nettoyer si désactivé
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    // Initialiser ActivityTracker (idempotent)
    initializeActivityTracker();

    // Réinitialiser le flag de déconnexion
    hasLoggedOutRef.current = false;

    // Vérifier l'inactivité toutes les 60 secondes
    checkIntervalRef.current = setInterval(() => {
      checkInactivity();
    }, 60000);

    // Vérification initiale après 5 secondes
    const initialCheck = setTimeout(() => {
      checkInactivity();
    }, 5000);

    // S'abonner aux événements d'activité pour reset le flag
    const unsubscribe = onActivity(() => {
      hasLoggedOutRef.current = false;
    });

    // Nettoyage
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      clearTimeout(initialCheck);
      unsubscribe();
    };
  }, [enabled, checkInactivity]);

  // Fonction pour obtenir le temps restant avant déconnexion
  const getTimeRemaining = useCallback(() => {
    if (!enabled) return null;

    const remaining = getTimeUntilInactivityTimeout();

    return {
      minutes: Math.floor(remaining / (1000 * 60)),
      seconds: Math.floor((remaining % (1000 * 60)) / 1000),
      totalMs: remaining,
    };
  }, [enabled]);

  // Fonction pour réinitialiser manuellement le timer (via ActivityTracker)
  const resetTimer = useCallback(() => {
    // ActivityTracker gère automatiquement via les événements
    // Cette fonction existe pour la compatibilité
    hasLoggedOutRef.current = false;
  }, []);

  return {
    resetTimer,
    getTimeRemaining,
    isEnabled: enabled,
    timeoutMinutes: effectiveTimeoutMs / (60 * 1000), // Retourner le timeout effectif
  };
}

export default useInactivityTimer;
