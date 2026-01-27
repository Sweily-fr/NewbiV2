"use client";

import { useEffect, useRef, useCallback } from "react";
import { authClient } from "@/src/lib/auth-client";
import {
  getTimeSinceLastActivity,
  isUserInactive,
  notifySessionExpired,
  onSessionExpired,
  refreshSession,
} from "@/src/lib/activityTracker";

// Garde globale pour éviter les toasts multiples de session expirée
let isSessionErrorShown = false;
let _sessionErrorTimeout = null;

const resetSessionErrorGuard = () => {
  if (_sessionErrorTimeout) {
    clearTimeout(_sessionErrorTimeout);
  }
  _sessionErrorTimeout = setTimeout(() => {
    isSessionErrorShown = false;
    _sessionErrorTimeout = null;
  }, 10000); // Reset après 10 secondes
};

/**
 * Hook pour valider la session utilisateur et détecter les révocations
 *
 * REFACTORISÉ pour utiliser ActivityTracker :
 * - Ne vérifie pas la session si l'utilisateur a été actif récemment
 * - Intégré avec le système centralisé de gestion d'activité
 * - Rafraîchit automatiquement la session si l'utilisateur est actif
 */
export function useSessionValidator() {
  const checkingRef = useRef(false);
  const lastCheckRef = useRef(Date.now());
  const mountedRef = useRef(true);

  // Seuil de temps pour considérer qu'une vérification récente est suffisante
  // Si l'utilisateur a été actif dans les 5 dernières minutes, on skip la vérification
  const ACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  const handleSessionExpired = useCallback(async (reason = "inactivity") => {
    // Utiliser la garde pour éviter les redirections multiples
    if (isSessionErrorShown) {
      return;
    }
    isSessionErrorShown = true;
    resetSessionErrorGuard();

    console.log(`🔒 [SESSION-VALIDATOR] Session expirée: ${reason}`);

    // Nettoyer le token local
    localStorage.removeItem("bearer_token");

    // Notifier ActivityTracker
    notifySessionExpired(reason);

    // Déconnecter proprement (fire and forget)
    authClient.signOut().catch((error) => {
      console.error("Erreur lors de la déconnexion:", error);
    });

    // Redirection immédiate et synchrone (ne pas attendre signOut)
    window.location.href = `/auth/session-expired?reason=${reason}`;
  }, []);

  const checkSession = useCallback(async () => {
    // Éviter les vérifications multiples simultanées
    if (checkingRef.current) {
      return;
    }

    // Throttle : ne pas vérifier plus d'une fois toutes les 30 secondes
    const now = Date.now();
    if (now - lastCheckRef.current < 30000) {
      return;
    }

    // ✅ OPTIMISATION : Si l'utilisateur a été actif récemment, on skip la vérification
    // car les appels API ont déjà rafraîchi la session via ActivityTracker
    const timeSinceActivity = getTimeSinceLastActivity();
    if (timeSinceActivity < ACTIVITY_THRESHOLD) {
      console.log(
        `🟢 [SESSION-VALIDATOR] Utilisateur actif récemment (${Math.round(timeSinceActivity / 1000)}s), skip validation`
      );
      lastCheckRef.current = now;
      return;
    }

    try {
      checkingRef.current = true;
      lastCheckRef.current = now;

      console.log("🔍 [SESSION-VALIDATOR] Vérification de la session...");

      // D'abord, essayer de rafraîchir la session si l'utilisateur n'est pas inactif
      if (!isUserInactive()) {
        console.log("🔄 [SESSION-VALIDATOR] Tentative de rafraîchissement de session...");
        const refreshed = await refreshSession();
        if (refreshed) {
          console.log("✅ [SESSION-VALIDATOR] Session rafraîchie avec succès");
          return;
        }
      }

      // Vérifier la session côté serveur (MongoDB)
      const response = await fetch("/api/auth/validate-session", {
        method: "GET",
        credentials: "include",
      });

      // Vérifier si le composant est toujours monté
      if (!mountedRef.current) {
        return;
      }

      if (!response.ok || response.status === 401) {
        await handleSessionExpired("inactivity");
      } else {
        const data = await response.json();
        if (!data.valid && !isSessionErrorShown) {
          // Déterminer la raison de l'expiration
          const reason = data.error?.includes("révoquée") ? "revoked" : "inactivity";
          await handleSessionExpired(reason);
        } else {
          console.log("✅ [SESSION-VALIDATOR] Session valide");
        }
      }
    } catch (error) {
      console.error(
        "❌ [SESSION-VALIDATOR] Erreur lors de la vérification:",
        error
      );
      // Ne pas rediriger en cas d'erreur réseau temporaire
    } finally {
      checkingRef.current = false;
    }
  }, [handleSessionExpired, ACTIVITY_THRESHOLD]);

  useEffect(() => {
    mountedRef.current = true;

    // S'abonner aux événements d'expiration de session de ActivityTracker
    const unsubscribeExpired = onSessionExpired((reason) => {
      handleSessionExpired(reason);
    });

    // Vérifier au focus de la fenêtre (throttlé par lastCheckRef)
    const handleFocus = () => {
      checkSession();
    };

    // Vérifier au retour de visibilité (throttlé par lastCheckRef)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    };

    // Vérification périodique toutes les 2 minutes
    // (réduit car ActivityTracker gère déjà le rafraîchissement)
    const interval = setInterval(() => {
      checkSession();
    }, 120000); // 2 minutes

    // Vérification initiale après 5 secondes
    const initialCheck = setTimeout(() => {
      checkSession();
    }, 5000);

    // Ajouter les event listeners
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      clearTimeout(initialCheck);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      unsubscribeExpired();
    };
  }, [checkSession, handleSessionExpired]);

  return { checkSession };
}
