"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef } from "react";
import { useTutorial } from "@/src/contexts/tutorial-context";
import { useSidebar } from "@/src/components/ui/sidebar";
import { tutorialSteps } from "./tutorial-steps";

// Import dynamique de Joyride pour éviter les erreurs SSR
const Joyride = dynamic(
  () => import("react-joyride").then((mod) => mod.Joyride),
  { ssr: false },
);

// Styles personnalisés pour correspondre à la charte graphique Newbi
const joyrideStyles = {
  options: {
    arrowColor: "transparent",
    backgroundColor: "#ffffff",
    overlayColor: "rgba(0, 0, 0, 0.5)",
    primaryColor: "#5a54fa",
    spotlightShadow: "0 0 15px rgba(0, 0, 0, 0.3)",
    textColor: "#1a1a1a",
    width: 360,
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: "0.75rem",
    padding: "1rem 1.25rem",
  },
  tooltipContainer: {
    textAlign: "left",
  },
  tooltipTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    marginBottom: "0.25rem",
    color: "#1a1a1a",
  },
  tooltipContent: {
    fontSize: "0.875rem",
    lineHeight: 1.4,
    color: "#6b7280",
    marginBottom: "0.5rem",
  },
  buttonNext: {
    backgroundColor: "#5a54fa",
    borderRadius: "0.5rem",
    color: "#ffffff",
    fontSize: "0.875rem",
    fontWeight: 500,
    padding: "0.5rem 1rem",
    outline: "none",
    border: "none",
    cursor: "pointer",
  },
  buttonBack: {
    backgroundColor: "transparent",
    borderRadius: "0.5rem",
    color: "#6b7280",
    fontSize: "0.875rem",
    fontWeight: 500,
    marginRight: "0.5rem",
    padding: "0.5rem 1rem",
    outline: "none",
    border: "1px solid #e5e7eb",
    cursor: "pointer",
  },
  buttonSkip: {
    backgroundColor: "transparent",
    color: "#9ca3af",
    fontSize: "0.8125rem",
    padding: "0.5rem",
    outline: "none",
    border: "none",
    cursor: "pointer",
  },
  buttonClose: {
    display: "none",
  },
  spotlight: {
    borderRadius: "0.5rem",
  },
  beacon: {
    display: "none",
  },
};

// Textes personnalisés en français
const locale = {
  back: "Précédent",
  close: "Fermer",
  last: "Terminer",
  next: "Suivant",
  open: "Ouvrir",
  skip: "Ignorer",
};

export function TutorialOverlay() {
  const {
    isRunning,
    stepIndex,
    setStepIndex,
    stopTutorial,
    completeTutorial,
    isLoading,
  } = useTutorial();

  const {
    open: sidebarOpen,
    setOpen: setSidebarOpen,
    isMobile,
    openMobile,
    setOpenMobile,
  } = useSidebar();
  const sidebarWasOpen = useRef(sidebarOpen);
  const mobileWasOpen = useRef(openMobile);

  // Forcer la sidebar ouverte pendant le tutoriel (desktop + mobile)
  useEffect(() => {
    if (isRunning) {
      sidebarWasOpen.current = sidebarOpen;
      mobileWasOpen.current = openMobile;
      setSidebarOpen(true);
      if (isMobile) {
        setOpenMobile(true);
      }
    } else if (sidebarWasOpen.current !== undefined) {
      setSidebarOpen(sidebarWasOpen.current);
      if (isMobile) {
        setOpenMobile(mobileWasOpen.current ?? false);
      }
    }
  }, [isRunning]); // eslint-disable-line react-hooks/exhaustive-deps

  const advanceOrComplete = useCallback(
    (fromIndex) => {
      const nextIndex = fromIndex + 1;
      if (nextIndex >= tutorialSteps.length) {
        completeTutorial();
      } else {
        setStepIndex(nextIndex);
      }
    },
    [setStepIndex, completeTutorial],
  );

  const handleJoyrideCallback = useCallback(
    (data) => {
      const { action, index, status, type } = data;

      // Cible introuvable (élément pas encore monté, écran mobile, etc.)
      // En mode contrôlé, Joyride ne fait rien par défaut → on avance manuellement
      // sinon l'overlay gris reste bloqué sans tooltip.
      if (type === "error:target_not_found" || type === "error") {
        advanceOrComplete(index);
        return;
      }

      if (type === "step:after") {
        if (action === "next") {
          advanceOrComplete(index);
        }
        if (action === "prev") {
          setStepIndex(Math.max(0, index - 1));
        }
      }

      if (status === "finished") {
        completeTutorial();
      }

      if (status === "skipped" || action === "skip") {
        stopTutorial();
      }

      if (action === "close") {
        stopTutorial();
      }
    },
    [advanceOrComplete, setStepIndex, completeTutorial, stopTutorial],
  );

  // Ne pas afficher pendant le chargement
  if (isLoading) {
    return null;
  }

  return (
    <Joyride
      steps={tutorialSteps}
      run={isRunning}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      hideCloseButton
      disableOverlayClose
      disableCloseOnEsc={false}
      scrollToFirstStep
      spotlightClicks={false}
      spotlightPadding={10}
      callback={handleJoyrideCallback}
      styles={joyrideStyles}
      locale={locale}
      floaterProps={{
        disableAnimation: false,
      }}
    />
  );
}
