import { useState, useEffect } from 'react';

/**
 * Hook pour gérer le mode d'affichage du Kanban (Board/List)
 * Sauvegarde la préférence dans localStorage
 * @param {string} boardId - ID du tableau pour sauvegarder la préférence par board
 * @returns {Object} - { viewMode, setViewMode, isBoard, isList }
 */
export function useViewMode(boardId) {
  const [viewMode, setViewModeState] = useState('board');

  // Charger la préférence depuis localStorage au montage
  useEffect(() => {
    if (typeof window !== 'undefined' && boardId) {
      const savedMode = localStorage.getItem(`kanban-view-mode-${boardId}`);
      if (savedMode && ['board', 'list'].includes(savedMode)) {
        setViewModeState(savedMode);
      }
    }
  }, [boardId]);

  // Fonction pour changer le mode et sauvegarder dans localStorage
  const setViewMode = (mode) => {
    if (['board', 'list'].includes(mode)) {
      setViewModeState(mode);
      if (typeof window !== 'undefined' && boardId) {
        localStorage.setItem(`kanban-view-mode-${boardId}`, mode);
      }
    }
  };

  return {
    viewMode,
    setViewMode,
    isBoard: viewMode === 'board',
    isList: viewMode === 'list',
  };
}
