import { useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

export const useKanbanDnD = (moveTask, getTasksByColumn, boardId, workspaceId, localColumns, reorderColumns, setLocalColumns, markReorderAction) => {
  const [activeTask, setActiveTask] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);
  
  // Sauvegarder la colonne d'origine de la tâche
  const [originalColumnId, setOriginalColumnId] = useState(null);
  
  // Structure locale des tâches par colonne pour la réorganisation en temps réel
  const [localTasksByColumn, setLocalTasksByColumn] = useState({});

  // Gestion du début du drag
  const handleDragStart = (event) => {
    const { active } = event;
    const activeData = active.data.current;
    
    if (activeData?.type === 'task') {
      setActiveTask(activeData.task);
      setOriginalColumnId(activeData.task.columnId);
      setActiveColumn(null);
    } else if (activeData?.type === 'column') {
      setActiveColumn(activeData.column);
      setActiveTask(null);
      setOriginalColumnId(null);
    }
  };

  // Gestion du drag en cours (réorganisation visuelle en temps réel)
  const handleDragOver = (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeData = active.data.current;
    const overData = over.data.current;
    
    // Cas 1: Réorganisation des colonnes
    if (activeData?.type === 'column' && overData?.type === 'column') {
      if (active.id !== over.id) {
        const oldIndex = localColumns.findIndex((col) => col.id === active.id);
        const newIndex = localColumns.findIndex((col) => col.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const newColumns = arrayMove(localColumns, oldIndex, newIndex);
          setLocalColumns(newColumns);
        }
      }
      return;
    }
    
    // Cas 2: Drag de tâche sur une autre tâche (même colonne)
    if (activeData?.type === 'task' && overData?.type === 'task') {
      const activeTask = activeData.task;
      const overTask = overData.task;
      
      if (activeTask.columnId === overTask.columnId) {
        // Même colonne : utiliser arrayMove comme pour les colonnes
        const columnId = activeTask.columnId;
        const currentTasks = localTasksByColumn[columnId] || getTasksByColumn(columnId);
        
        const activeIndex = currentTasks.findIndex((t) => t.id === activeTask.id);
        const overIndex = currentTasks.findIndex((t) => t.id === overTask.id);
        
        // Vérifier si la position a vraiment changé
        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
          // Vérifier si on a déjà cette configuration en cache
          const newTasks = arrayMove(currentTasks, activeIndex, overIndex);
          const isSame = newTasks.every((t, i) => t.id === (localTasksByColumn[columnId]?.[i]?.id));
          
          if (!isSame) {
            setLocalTasksByColumn({
              ...localTasksByColumn,
              [columnId]: newTasks,
            });
          }
        }
      } else {
        // Colonnes différentes
        const sourceColumnId = activeTask.columnId;
        const targetColumnId = overTask.columnId;

        const sourceTasks = localTasksByColumn[sourceColumnId] || getTasksByColumn(sourceColumnId);
        const targetTasks = localTasksByColumn[targetColumnId] || getTasksByColumn(targetColumnId);

        const activeIndex = sourceTasks.findIndex((t) => t.id === activeTask.id);
        const overIndex = targetTasks.findIndex((t) => t.id === overTask.id);

        if (activeIndex !== -1 && overIndex !== -1) {
          // Retirer de la source
          const newSourceTasks = sourceTasks.filter((t) => t.id !== activeTask.id);
          
          // Insérer dans la cible à la position de overTask
          const movedTask = { ...activeTask, columnId: targetColumnId };
          const newTargetTasks = [...targetTasks];
          newTargetTasks.splice(overIndex, 0, movedTask);

          // Vérifier si vraiment changé
          const sourceChanged = !newSourceTasks.every((t, i) => t.id === (localTasksByColumn[sourceColumnId]?.[i]?.id));
          const targetChanged = !newTargetTasks.every((t, i) => t.id === (localTasksByColumn[targetColumnId]?.[i]?.id));
          
          if (sourceChanged || targetChanged) {
            setLocalTasksByColumn({
              ...localTasksByColumn,
              [sourceColumnId]: newSourceTasks,
              [targetColumnId]: newTargetTasks,
            });
          }
        }
      }
    }
    
    // Cas 3: Tâche déposée sur une colonne vide
    if (activeData?.type === 'task' && overData?.type === 'column') {
      const activeTask = activeData.task;
      const targetColumnId = overData.columnId || over.id;
      
      if (activeTask.columnId !== targetColumnId) {
        const sourceColumnId = activeTask.columnId;
        
        const sourceTasks = localTasksByColumn[sourceColumnId] || getTasksByColumn(sourceColumnId);
        const targetTasks = localTasksByColumn[targetColumnId] || getTasksByColumn(targetColumnId);
        
        // Retirer de la source
        const newSourceTasks = sourceTasks.filter((t) => t.id !== activeTask.id);
        
        // Ajouter à la fin de la cible
        const movedTask = { ...activeTask, columnId: targetColumnId };
        const newTargetTasks = [...targetTasks, movedTask];
        
        setLocalTasksByColumn({
          ...localTasksByColumn,
          [sourceColumnId]: newSourceTasks,
          [targetColumnId]: newTargetTasks,
        });
      }
    }
  };

  // Gestion de la fin du drag
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    const savedOriginalColumnId = originalColumnId;
    const savedLocalTasksByColumn = { ...localTasksByColumn };
    
    setActiveTask(null);
    setActiveColumn(null);
    setOriginalColumnId(null);

    if (!over) {
      setLocalTasksByColumn({});
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current;

    // Cas 1: Drag d'une colonne
    if (activeData?.type === 'column') {
      const columnIds = localColumns.map((col) => col.id);
      markReorderAction();

      try {
        await reorderColumns({
          variables: {
            columns: columnIds,
            workspaceId: workspaceId,
          },
        });
      } catch (error) {
        console.error('Erreur réorganisation colonnes:', error);
      }
      
      setLocalTasksByColumn({});
      return;
    }

    // Cas 2: Drag d'une tâche
    const activeTask = activeData?.task;
    if (!activeTask) {
      setLocalTasksByColumn({});
      return;
    }

    let newColumnId = activeTask.columnId;
    let newPosition = activeTask.position || 0;

    // Déterminer la position finale à partir de savedLocalTasksByColumn
    if (overData?.type === 'column') {
      // Drag sur colonne vide
      const rawColumnId = overData.columnId || over.id;
      newColumnId = rawColumnId.replace(/^(empty-|collapsed-)/, '');
      
      const targetColumnTasks = savedLocalTasksByColumn[newColumnId] || getTasksByColumn(newColumnId);
      
      // Position = fin de la colonne
      newPosition = targetColumnTasks.length;
      
    } else if (overData?.type === 'task') {
      // Drag sur une autre tâche
      const targetTask = overData.task;
      newColumnId = targetTask.columnId;

      const targetColumnTasks = savedLocalTasksByColumn[newColumnId] || getTasksByColumn(newColumnId);
      
      // Trouver l'index de la tâche "over" (pas la tâche active)
      const overTaskIndex = targetColumnTasks.findIndex((t) => t.id === targetTask.id);
      
      // La position = l'index de la tâche over
      // (elle sera insérée à cette position, poussant les autres vers le bas)
      newPosition = overTaskIndex !== -1 ? overTaskIndex : 0;
    }

    const hasColumnChanged = newColumnId !== savedOriginalColumnId;
    const hasPositionChanged = newPosition !== (activeTask.position || 0);
    
    if (hasColumnChanged || hasPositionChanged) {
      try {
        // Appeler moveTask UNE SEULE fois
        // Le backend gère automatiquement la réorganisation de TOUTES les tâches
        await moveTask({
          variables: {
            id: activeTask.id,
            columnId: newColumnId,
            position: newPosition,
            workspaceId: workspaceId,
          },
        });
        
        // Garder localTasksByColumn pendant 1000ms pour éviter le clignotement
        // Les données du serveur arrivent via la subscription et localColumns se met à jour
        // On ne nettoie que quand on est sûr que les données sont synchronisées
        setTimeout(() => {
          setLocalTasksByColumn({});
        }, 1000);
      } catch (error) {
        console.error('Error moving task:', error);
        setLocalTasksByColumn({});
      }
    } else {
      setLocalTasksByColumn({});
    }
  };

  // Fonction pour obtenir les tâches d'une colonne
  const getLocalTasksByColumn = (columnId) => {
    if (Object.keys(localTasksByColumn).length > 0) {
      return localTasksByColumn[columnId] !== undefined 
        ? localTasksByColumn[columnId] 
        : getTasksByColumn(columnId);
    }
    return getTasksByColumn(columnId);
  };

  return {
    activeTask,
    activeColumn,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    getLocalTasksByColumn,
    localTasksByColumn,
  };
};