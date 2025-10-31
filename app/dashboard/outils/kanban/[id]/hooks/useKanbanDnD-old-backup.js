import { useState, useRef } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

export const useKanbanDnD = (moveTask, getTasksByColumn, boardId, workspaceId, localColumns, reorderColumns, setLocalColumns, markReorderAction) => {
  const [activeTask, setActiveTask] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);
  const [localTasksByColumn, setLocalTasksByColumn] = useState({});
  const [originalTaskState, setOriginalTaskState] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragEndTimeRef = useRef(0);

  const handleDragStart = (event) => {
    const { active } = event;
    const activeData = active.data.current;
    
    setIsDragging(true);
    
    if (activeData?.type === 'task') {
      setActiveTask(activeData.task);
      // CRITIQUE: Capturer l'état d'origine IMMÉDIATEMENT et de manière IMMUTABLE
      // Utiliser des valeurs primitives (string, number) qui ne peuvent pas être modifiées par référence
      const frozenState = {
        taskId: String(activeData.task.id),
        columnId: String(activeData.task.columnId),
        position: Number(activeData.task.position || 0)
      };
      // Geler l'objet pour empêcher toute modification
      Object.freeze(frozenState);
      setOriginalTaskState(frozenState);
      
    } else if (activeData?.type === 'column') {
      setActiveColumn(activeData.column);
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeData = active.data.current;
    const overData = over.data.current;
    
    // Réorganisation des colonnes
    if (activeData?.type === 'column' && overData?.type === 'column' && active.id !== over.id) {
      const oldIndex = localColumns.findIndex((col) => col.id === active.id);
      const newIndex = localColumns.findIndex((col) => col.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setLocalColumns(arrayMove(localColumns, oldIndex, newIndex));
      }
      return;
    }

    // Preview simple pour les tâches
    if (activeData?.type === 'task') {
      // Initialiser la preview si pas encore fait
      if (Object.keys(localTasksByColumn).length === 0) {
        const preview = {};
        localColumns.forEach(column => {
          preview[column.id] = [...(column.tasks || [])];
        });
        setLocalTasksByColumn(preview);
        return;
      }

      const activeTask = activeData.task;
      
      // IMPORTANT: Trouver où la tâche est ACTUELLEMENT dans la preview (pas sa colonne d'origine)
      let currentColumnId = activeTask.columnId;
      for (const [columnId, tasks] of Object.entries(localTasksByColumn)) {
        if (tasks.find(t => t.id === activeTask.id)) {
          currentColumnId = columnId;
          break;
        }
      }
      
      
      if (overData?.type === 'task') {
        // Drop sur une tâche
        const overTask = overData.task;
        const targetColumnId = overTask.columnId;


        if (currentColumnId === targetColumnId) {
          // Même colonne - réorganiser avec arrayMove
          const tasks = [...localTasksByColumn[currentColumnId]];
          const activeIndex = tasks.findIndex((t) => t.id === activeTask.id);
          const overIndex = tasks.findIndex((t) => t.id === overTask.id);
          
          
          if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
            const newTasks = arrayMove(tasks, activeIndex, overIndex);
            
            
            setLocalTasksByColumn({
              ...localTasksByColumn,
              [currentColumnId]: newTasks
            });
          }
        } else {
          // Colonnes différentes - retirer de source et ajouter à target
          const sourceTasks = localTasksByColumn[currentColumnId].filter(t => t.id !== activeTask.id);
          const targetTasks = [...localTasksByColumn[targetColumnId]];
          const overIndex = targetTasks.findIndex(t => t.id === overTask.id);
          
          // Insérer à la position de la tâche survolée
          targetTasks.splice(overIndex, 0, { ...activeTask, columnId: targetColumnId });
          
          
          setLocalTasksByColumn({
            ...localTasksByColumn,
            [currentColumnId]: sourceTasks,
            [targetColumnId]: targetTasks
          });
        }
      } else if (overData?.type === 'column') {
        // Drop sur colonne vide
        const targetColumnId = (overData.columnId || over.id).replace(/^(empty-|collapsed-)/, '');
        
        
        if (currentColumnId !== targetColumnId) {
          const sourceTasks = localTasksByColumn[currentColumnId].filter(t => t.id !== activeTask.id);
          const targetTasks = [...(localTasksByColumn[targetColumnId] || []), { ...activeTask, columnId: targetColumnId }];
          
          
          setLocalTasksByColumn({
            ...localTasksByColumn,
            [currentColumnId]: sourceTasks,
            [targetColumnId]: targetTasks
          });
        }
      }
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    const activeData = active.data.current;
    
    setActiveTask(null);
    setActiveColumn(null);
    setIsDragging(false);

    if (!over) {
      setLocalTasksByColumn({});
      setOriginalTaskState(null);
      return;
    }

    // Drag de colonne
    if (activeData?.type === 'column') {
      const columnIds = localColumns.map((col) => col.id);
      markReorderAction();
      try {
        await reorderColumns({
          variables: { columns: columnIds, workspaceId },
        });
      } catch (error) {
        console.error('Erreur réorganisation colonnes:', error);
      }
      return;
    }

    // Drag de tâche - utiliser la preview pour calculer la position finale
    if (activeData?.type === 'task' && originalTaskState) {
      const taskId = activeData.task.id;
      const originalColumnId = originalTaskState.columnId;
      const originalPosition = originalTaskState.position;

      let newColumnId = originalColumnId;
      let newPosition = originalPosition;

      // Chercher la position finale dans la preview
      for (const [columnId, tasks] of Object.entries(localTasksByColumn)) {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          newColumnId = columnId;
          newPosition = taskIndex;
          break;
        }
      }

      // Envoyer la mutation si changement
      const hasColumnChanged = newColumnId !== originalColumnId;
      const hasPositionChanged = newPosition !== originalPosition;

      if (hasColumnChanged || hasPositionChanged) {
        
        try {
          await moveTask({
            variables: {
              id: taskId,
              columnId: newColumnId,
              position: newPosition,
              workspaceId,
            },
          });
        } catch (error) {
          console.error('❌ Erreur déplacement tâche:', error);
        }
      }
    }

    // Nettoyer la preview et l'état d'origine
    setOriginalTaskState(null);
    // Marquer le temps de fin du drag pour bloquer les mises à jour pendant 500ms
    dragEndTimeRef.current = Date.now();
    setTimeout(() => {
      setLocalTasksByColumn({});
      dragEndTimeRef.current = 0;
      // Forcer la synchronisation avec les données du serveur
      if (markReorderAction) {
        markReorderAction();
      }
    }, 500);
  };

  const getLocalTasksByColumn = (columnId) => {
    if (Object.keys(localTasksByColumn).length > 0) {
      return localTasksByColumn[columnId] || [];
    }
    return getTasksByColumn(columnId);
  };

  return {
    activeTask,
    activeColumn,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    isDragging,
    getLocalTasksByColumn,
    localTasksByColumn,
    dragEndTimeRef,
  };
};