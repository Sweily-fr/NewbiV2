import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/src/components/ui/sonner";
import { authClient } from "@/src/lib/auth-client";

// Événements à surveiller pour détecter l'activité (déclaré à l'extérieur pour éviter les dépendances)
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keypress",
  "scroll",
  "touchstart",
  "click",
  "focus",
  "blur",
];

/**
 * Hook pour gérer la déconnexion automatique après inactivité
 * @param {number} timeoutMinutes - Durée d'inactivité en minutes avant déconnexion (défaut: 15)
 * @param {boolean} enabled - Active/désactive le timer d'inactivité (défaut: true)
 */
export function useInactivityTimer(timeoutMinutes = 15, enabled = true) {
  const router = useRouter();
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Durée en millisecondes
  const timeoutMs = timeoutMinutes * 60 * 1000;

  // Fonction de déconnexion
  const handleLogout = useCallback(async () => {
    try {
      // Afficher la notification de déconnexion
      toast.error("Vous avez été déconnecté pour cause d'inactivité", {
        duration: 5000,
        position: "top-center",
      });

      // Déconnexion via Better Auth
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            // Redirection vers la page de connexion
            router.push("/auth/login");
          },
          onError: (ctx) => {
            console.error("Erreur lors de la déconnexion:", ctx.error);
            // Redirection même en cas d'erreur
            router.push("/auth/login");
          },
        },
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion automatique:", error);
      // Redirection de secours
      router.push("/auth/login");
    }
  }, [router]);

  // Réinitialiser le timer d'inactivité
  const resetTimer = useCallback(() => {
    if (!enabled) return;

    // Mettre à jour la dernière activité
    lastActivityRef.current = Date.now();

    // Effacer le timer existant
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Créer un nouveau timer
    timeoutRef.current = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;

      // Vérifier si vraiment inactif (double vérification)
      if (timeSinceLastActivity >= timeoutMs) {
        handleLogout();
      } else {
        // Si l'activité a été détectée entre temps, relancer le timer
        const remainingTime = timeoutMs - timeSinceLastActivity;
        timeoutRef.current = setTimeout(handleLogout, remainingTime);
      }
    }, timeoutMs);
  }, [enabled, timeoutMs, handleLogout]);

  // Gestionnaire d'événements d'activité
  const handleActivity = useCallback(
    (event) => {
      // Ignorer les mouvements de souris trop fréquents
      if (event.type === "mousemove") {
        const now = Date.now();
        if (now - lastActivityRef.current < 1000) {
          return; // Ignorer si moins d'1 seconde depuis la dernière activité
        }
      }

      resetTimer();
    },
    [resetTimer]
  );

  useEffect(() => {
    if (!enabled) {
      // Nettoyer le timer si désactivé
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Démarrer le timer initial
    resetTimer();

    // Ajouter les écouteurs d'événements
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Surveiller les changements de visibilité de la page
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resetTimer();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Nettoyage
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, handleActivity, resetTimer]);

  // Fonction pour obtenir le temps restant avant déconnexion
  const getTimeRemaining = useCallback(() => {
    if (!enabled || !timeoutRef.current) return null;

    const timeSinceLastActivity = Date.now() - lastActivityRef.current;
    const remaining = Math.max(0, timeoutMs - timeSinceLastActivity);

    return {
      minutes: Math.floor(remaining / (1000 * 60)),
      seconds: Math.floor((remaining % (1000 * 60)) / 1000),
      totalMs: remaining,
    };
  }, [enabled, timeoutMs]);

  // Fonction pour réinitialiser manuellement le timer
  const resetInactivityTimer = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  return {
    resetTimer: resetInactivityTimer,
    getTimeRemaining,
    isEnabled: enabled,
  };
}

export default useInactivityTimer;
