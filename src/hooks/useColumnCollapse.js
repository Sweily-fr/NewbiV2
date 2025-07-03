import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personnalisé pour gérer l'état de collapse des colonnes Kanban
 * Sauvegarde l'état dans localStorage avec une clé unique par tableau
 */
export function useColumnCollapse(boardId) {
  const [collapsedColumns, setCollapsedColumns] = useState(new Set());
  const storageKey = `kanban-collapsed-columns-${boardId}`;

  // Charger l'état depuis localStorage au montage
  useEffect(() => {
    if (!boardId) return;
    
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsedData = JSON.parse(saved);
        setCollapsedColumns(new Set(parsedData));
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des colonnes collapsées:', error);
      // En cas d'erreur, on repart avec un état vide
      setCollapsedColumns(new Set());
    }
  }, [boardId, storageKey]);

  // Sauvegarder l'état dans localStorage à chaque changement
  const saveToStorage = useCallback((newCollapsedSet) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...newCollapsedSet]));
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde des colonnes collapsées:', error);
    }
  }, [storageKey]);

  // Toggle le collapse d'une colonne
  const toggleColumnCollapse = useCallback((columnId) => {
    setCollapsedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      saveToStorage(newSet);
      return newSet;
    });
  }, [saveToStorage]);

  // Vérifier si une colonne est collapsée
  const isColumnCollapsed = useCallback((columnId) => {
    return collapsedColumns.has(columnId);
  }, [collapsedColumns]);

  // Collapser toutes les colonnes
  const collapseAll = useCallback((columnIds) => {
    const newSet = new Set(columnIds);
    setCollapsedColumns(newSet);
    saveToStorage(newSet);
  }, [saveToStorage]);

  // Déplier toutes les colonnes
  const expandAll = useCallback(() => {
    const newSet = new Set();
    setCollapsedColumns(newSet);
    saveToStorage(newSet);
  }, [saveToStorage]);

  return {
    isColumnCollapsed,
    toggleColumnCollapse,
    collapseAll,
    expandAll,
    collapsedColumnsCount: collapsedColumns.size
  };
}
