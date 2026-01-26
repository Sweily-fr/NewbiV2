"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";

// Garde globale pour éviter les toasts multiples de session expirée
let isSessionErrorShown = false;
let sessionErrorTimeout = null;

const resetSessionErrorGuard = () => {
  sessionErrorTimeout = setTimeout(() => {
    isSessionErrorShown = false;
    sessionErrorTimeout = null;
  }, 10000); // Reset après 10 secondes
};

/**
 * Hook pour valider la session utilisateur et détecter les révocations
 * Vérifie la session au focus de la fenêtre et périodiquement
 */
export function useSessionValidator() {
  const router = useRouter();
  const checkingRef = useRef(false);
  const lastCheckRef = useRef(Date.now());
  const mountedRef = useRef(true);

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

    try {
      checkingRef.current = true;
      lastCheckRef.current = now;

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
        // Utiliser la garde pour éviter les toasts multiples
        if (!isSessionErrorShown) {
          isSessionErrorShown = true;
          resetSessionErrorGuard();

          // Nettoyer le token local
          localStorage.removeItem("bearer_token");

          // Déconnecter proprement et rediriger vers la page d'expiration
          await authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                if (mountedRef.current) {
                  router.push("/auth/session-expired?reason=inactivity");
                }
              },
              onError: () => {
                // Forcer la redirection même en cas d'erreur
                if (mountedRef.current) {
                  router.push("/auth/session-expired?reason=inactivity");
                }
              },
            },
          });
        }
      } else {
        const data = await response.json();
        if (!data.valid && !isSessionErrorShown) {
          isSessionErrorShown = true;
          resetSessionErrorGuard();

          // Nettoyer le token local
          localStorage.removeItem("bearer_token");

          // Déterminer la raison de l'expiration
          const reason = data.error?.includes("révoquée") ? "revoked" : "inactivity";

          await authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                if (mountedRef.current) {
                  router.push(`/auth/session-expired?reason=${reason}`);
                }
              },
              onError: () => {
                if (mountedRef.current) {
                  router.push(`/auth/session-expired?reason=${reason}`);
                }
              },
            },
          });
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
  }, [router]);

  useEffect(() => {
    mountedRef.current = true;

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

    // Vérification périodique toutes les minutes (adapté à l'expiration de session d'1 heure)
    const interval = setInterval(() => {
      checkSession();
    }, 60000); // 1 minute

    // Vérification initiale après 2 secondes
    const initialCheck = setTimeout(() => {
      checkSession();
    }, 2000);

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
    };
  }, [checkSession]);

  return { checkSession };
}
