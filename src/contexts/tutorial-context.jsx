"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useSession } from "@/src/lib/auth-client";

const TutorialContext = createContext(undefined);

export function TutorialProvider({ children }) {
  const { data: session } = useSession();
  const [isRunning, setIsRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(true); // Par défaut true pour éviter le flash
  const [isLoading, setIsLoading] = useState(true);

  // Charger l'état du tutoriel depuis la base de données
  useEffect(() => {
    const loadTutorialState = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/tutorial/status");
        if (response.ok) {
          const data = await response.json();
          setHasCompletedTutorial(data.hasCompletedTutorial ?? false);

          // Si l'utilisateur n'a pas complété le tutoriel, le lancer automatiquement
          if (!data.hasCompletedTutorial) {
            // Petit délai pour laisser le temps au DOM de se charger
            setTimeout(() => {
              setIsRunning(true);
            }, 1000);
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement de l'état du tutoriel:",
          error,
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadTutorialState();
  }, [session?.user?.id]);

  // Démarrer le tutoriel
  const startTutorial = useCallback(() => {
    setStepIndex(0);
    setIsRunning(true);
  }, []);

  // Arrêter le tutoriel (skip) - Persiste aussi en base de données pour éviter que le tutoriel se réaffiche
  const stopTutorial = useCallback(async () => {
    setIsRunning(false);
    setStepIndex(0);
    setHasCompletedTutorial(true);

    // Persister en base de données pour éviter que le tutoriel se réaffiche après rechargement
    try {
      await fetch("/api/tutorial/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du tutoriel (skip):", error);
    }
  }, []);

  // Marquer le tutoriel comme complété
  const completeTutorial = useCallback(async () => {
    setIsRunning(false);
    setStepIndex(0);
    setHasCompletedTutorial(true);

    // Persister en base de données
    try {
      await fetch("/api/tutorial/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du tutoriel:", error);
    }
  }, []);

  // Relancer le tutoriel (uniquement côté client, sans toucher à la BDD)
  // Petit délai pour laisser le temps au modal de se fermer avant que Joyride
  // calcule la position des éléments cibles.
  const resetTutorial = useCallback(() => {
    setStepIndex(0);
    setTimeout(() => {
      setIsRunning(true);
    }, 300);
  }, []);

  const value = {
    isRunning,
    stepIndex,
    setStepIndex,
    hasCompletedTutorial,
    isLoading,
    startTutorial,
    stopTutorial,
    completeTutorial,
    resetTutorial,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
}
