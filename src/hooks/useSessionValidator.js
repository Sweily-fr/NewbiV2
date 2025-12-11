"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";

/**
 * Hook pour valider la session utilisateur et détecter les révocations
 * Vérifie la session au focus de la fenêtre et périodiquement
 */
export function useSessionValidator() {
  const router = useRouter();
  const checkingRef = useRef(false);
  const lastCheckRef = useRef(Date.now());

  const checkSession = async () => {
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

      if (!response.ok || response.status === 401) {
        toast.error("Votre session a expiré. Veuillez vous reconnecter.");

        // Déconnecter proprement
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push("/auth/login");
            },
            onError: () => {
              // Forcer la redirection même en cas d'erreur
              router.push("/auth/login");
            },
          },
        });
      } else {
        const data = await response.json();
        if (!data.valid) {
          toast.error("Votre session a expiré. Veuillez vous reconnecter.");

          await authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                router.push("/auth/login");
              },
              onError: () => {
                router.push("/auth/login");
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
  };

  useEffect(() => {
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

    // Vérification périodique toutes les 2 minutes (suffisant pour détecter les révocations)
    const interval = setInterval(() => {
      checkSession();
    }, 120000); // 2 minutes

    // Vérification initiale après 2 secondes
    const initialCheck = setTimeout(() => {
      checkSession();
    }, 2000);

    // Ajouter les event listeners
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(interval);
      clearTimeout(initialCheck);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return { checkSession };
}
