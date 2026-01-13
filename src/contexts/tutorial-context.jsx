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
          error
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

  // Arrêter le tutoriel (skip)
  const stopTutorial = useCallback(() => {
    setIsRunning(false);
    setStepIndex(0);
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

  // Réinitialiser le tutoriel (pour le relancer)
  const resetTutorial = useCallback(async () => {
    setHasCompletedTutorial(false);

    // Persister en base de données
    try {
      await fetch("/api/tutorial/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Démarrer le tutoriel après réinitialisation
      setTimeout(() => {
        setStepIndex(0);
        setIsRunning(true);
      }, 500);
    } catch (error) {
      console.error("Erreur lors de la réinitialisation du tutoriel:", error);
    }
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
