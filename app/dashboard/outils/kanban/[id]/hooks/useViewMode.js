import { useState, useEffect } from 'react';

/**
 * Hook pour gérer le mode d'affichage du Kanban (Board/List)
 * Sauvegarde la préférence dans localStorage
 * Force la vue "List" sur mobile (< 768px)
 * @param {string} boardId - ID du tableau pour sauvegarder la préférence par board
 * @returns {Object} - { viewMode, setViewMode, isBoard, isList }
 */
export function useViewMode(boardId) {
  const [viewMode, setViewModeState] = useState('board');
  const [isMobile, setIsMobile] = useState(false);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Charger la préférence depuis localStorage au montage
  useEffect(() => {
    if (typeof window !== 'undefined' && boardId) {
      // Sur mobile, forcer la vue "List"
      if (isMobile) {
        setViewModeState('list');
        return;
      }
      
      const savedMode = localStorage.getItem(`kanban-view-mode-${boardId}`);
      if (savedMode && ['board', 'list'].includes(savedMode)) {
        setViewModeState(savedMode);
      }
    }
  }, [boardId, isMobile]);

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
