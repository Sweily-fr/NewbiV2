import { useState, useEffect } from "react";

// Vues disponibles (onglets de la page du tableau)
const VIEW_MODES = ["board", "list", "gantt", "calendar"];

/**
 * Fonction pour lire le viewMode depuis localStorage
 * (partagée avec KanbanPageSkeleton, qui affiche le skeleton de cette vue)
 */
export function getViewModeFromStorage(boardId) {
  if (typeof window === "undefined" || !boardId) {
    return null;
  }

  // Sur mobile, forcer la vue "List"
  if (window.innerWidth < 768) {
    return "list";
  }

  const savedMode = localStorage.getItem(`kanban-view-mode-${boardId}`);
  if (savedMode && VIEW_MODES.includes(savedMode)) {
    return savedMode;
  }

  return "board";
}

/**
 * Hook pour gérer le mode d'affichage du Kanban (Board/List/Gantt/Calendrier)
 * Sauvegarde la préférence dans localStorage
 * Force la vue "List" sur mobile (< 768px)
 * @param {string} boardId - ID du tableau pour sauvegarder la préférence par board
 * @returns {Object} - { viewMode, setViewMode, isBoard, isList, isGantt, isCalendar, isReady }
 */
export function useViewMode(boardId) {
  // null = pas encore initialisé (SSR ou avant hydratation)
  const [viewMode, setViewModeState] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Initialiser côté client après hydratation
  useEffect(() => {
    const mode = getViewModeFromStorage(boardId);
    setViewModeState(mode);
    setIsReady(true);
  }, [boardId]);

  // Détecter les changements de taille d'écran
  useEffect(() => {
    if (!isReady) return;

    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      if (mobile) {
        setViewModeState("list");
      }
    };

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [isReady]);

  // Fonction pour changer le mode et sauvegarder dans localStorage
  const setViewMode = (mode) => {
    if (VIEW_MODES.includes(mode)) {
      setViewModeState(mode);
      if (typeof window !== "undefined" && boardId) {
        localStorage.setItem(`kanban-view-mode-${boardId}`, mode);
      }
    }
  };

  return {
    viewMode: viewMode, // null avant hydratation, vraie valeur après
    setViewMode,
    isBoard: viewMode === "board",
    isList: viewMode === "list",
    isGantt: viewMode === "gantt",
    isCalendar: viewMode === "calendar",
    isReady,
  };
}
