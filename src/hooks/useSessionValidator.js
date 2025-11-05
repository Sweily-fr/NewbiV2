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
      console.log("⏭️ [SESSION-VALIDATOR] Vérification déjà en cours, skip");
      return;
    }

    // Throttle : ne pas vérifier plus d'une fois toutes les 5 secondes
    const now = Date.now();
    if (now - lastCheckRef.current < 5000) {
      console.log("⏭️ [SESSION-VALIDATOR] Vérification trop récente, skip");
      return;
    }

    try {
      checkingRef.current = true;
      lastCheckRef.current = now;

      console.log("🔍 [SESSION-VALIDATOR] Vérification de la session côté serveur...");

      // Vérifier la session côté serveur (MongoDB)
      const response = await fetch("/api/auth/validate-session", {
        method: "GET",
        credentials: "include",
      });

      console.log("📊 [SESSION-VALIDATOR] Réponse API:", response.status);

      if (!response.ok || response.status === 401) {
        console.log("❌ [SESSION-VALIDATOR] Session invalide ou révoquée");
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
        if (data.valid) {
          console.log("✅ [SESSION-VALIDATOR] Session valide");
        } else {
          console.log("❌ [SESSION-VALIDATOR] Session non valide selon le serveur");
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
      console.error("❌ [SESSION-VALIDATOR] Erreur lors de la vérification:", error);
      // Ne pas rediriger en cas d'erreur réseau temporaire
    } finally {
      checkingRef.current = false;
    }
  };

  useEffect(() => {
    console.log("🎯 [SESSION-VALIDATOR] Hook initialisé");

    // Vérifier au focus de la fenêtre
    const handleFocus = () => {
      console.log("👁️ [SESSION-VALIDATOR] Fenêtre focus - vérification session");
      checkSession();
    };

    // Vérifier au retour de visibilité
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("👁️ [SESSION-VALIDATOR] Page visible - vérification session");
        checkSession();
      }
    };

    // Vérification périodique toutes les 10 secondes (pour détecter rapidement les révocations)
    const interval = setInterval(() => {
      console.log("⏰ [SESSION-VALIDATOR] Vérification périodique");
      checkSession();
    }, 10000); // 10 secondes

    // Vérification initiale après 1 seconde
    const initialCheck = setTimeout(() => {
      console.log("🚀 [SESSION-VALIDATOR] Vérification initiale");
      checkSession();
    }, 1000);

    // Ajouter les event listeners
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      console.log("🧹 [SESSION-VALIDATOR] Nettoyage");
      clearInterval(interval);
      clearTimeout(initialCheck);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return { checkSession };
}
