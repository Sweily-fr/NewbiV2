import { useState, useRef, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

export const useKanbanDnD = (
  moveTask, 
  getTasksByColumn, 
  boardId, 
  workspaceId, 
  localColumns, 
  reorderColumns, 
  setLocalColumns, 
  markReorderAction, 
  markMoveTaskAction
) => {
  const [activeTask, setActiveTask] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);
  const [originalTaskState, setOriginalTaskState] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const dragEndTimeRef = useRef(0);
  const isDraggingRef = useRef(false);
  const pendingMutationRef = useRef(false);
  const localColumnsRef = useRef(localColumns); // REF MANQUANT !
  const optimisticUpdateRef = useRef(null); // Pour stocker les updates optimistes

  // Mettre à jour le ref quand localColumns change
  localColumnsRef.current = localColumns;

  const handleDragStart = useCallback((event) => {
    const { active } = event;
    const activeData = active.data.current;
    
    setIsDragging(true);
    isDraggingRef.current = true;
    
    if (activeData?.type === 'task') {
      setActiveTask(activeData.task);
      
      // Capturer l'état d'origine de manière immutable
      const frozenState = Object.freeze({
        taskId: String(activeData.task.id),
        columnId: String(activeData.task.columnId),
        position: Number(activeData.task.position || 0)
      });
      
      setOriginalTaskState(frozenState);
    } else if (activeData?.type === 'column') {
      setActiveColumn(activeData.column);
    }
  }, []);

  const handleDragOver = useCallback((event) => {
    const { active, over } = event;
    if (!over || !isDraggingRef.current) return;
    
    const activeData = active.data.current;
    const overData = over.data.current;
    
    // Réorganisation des colonnes
    if (activeData?.type === 'column' && overData?.type === 'column' && active.id !== over.id) {
      const oldIndex = localColumnsRef.current.findIndex((col) => col.id === active.id);
      const newIndex = localColumnsRef.current.findIndex((col) => col.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newColumns = arrayMove(localColumnsRef.current, oldIndex, newIndex);
        setLocalColumns(newColumns);
      }
      return;
    }

    // Réorganisation des tâches - OPTIMISATION CRITIQUE
    if (activeData?.type === 'task') {
      const activeTask = activeData.task;
      
      // Éviter les updates multiples avec throttling
      const now = Date.now();
      if (optimisticUpdateRef.current && now - optimisticUpdateRef.current < 16) {
        return; // Throttle à ~60fps
      }
      optimisticUpdateRef.current = now;
      
      // Trouver la colonne actuelle de la tâche
      let currentColumnId = null;
      let currentColumn = null;
      
      for (const column of localColumnsRef.current) {
        if (column.tasks?.find(t => t.id === activeTask.id)) {
          currentColumnId = column.id;
          currentColumn = column;
          break;
        }
      }
      
      if (!currentColumnId || !currentColumn) return;
      
      if (overData?.type === 'task') {
        const overTask = overData.task;
        const targetColumnId = overTask.columnId;
        const targetColumn = localColumnsRef.current.find(col => col.id === targetColumnId);
        
        if (!targetColumn) return;

        if (currentColumnId === targetColumnId) {
          // Même colonne - réorganiser
          const tasks = [...currentColumn.tasks];
          const activeIndex = tasks.findIndex((t) => t.id === activeTask.id);
          const overIndex = tasks.findIndex((t) => t.id === overTask.id);
          
          if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
            const newTasks = arrayMove(tasks, activeIndex, overIndex);
            
            setLocalColumns(prev => prev.map(col => 
              col.id === currentColumnId ? { ...col, tasks: newTasks } : col
            ));
          }
        } else {
          // Colonnes différentes
          const sourceTasks = currentColumn.tasks.filter(t => t.id !== activeTask.id);
          const targetTasks = [...targetColumn.tasks];
          const overIndex = targetTasks.findIndex(t => t.id === overTask.id);
          
          targetTasks.splice(overIndex >= 0 ? overIndex : targetTasks.length, 0, {
            ...activeTask,
            columnId: targetColumnId
          });
          
          setLocalColumns(prev => prev.map(col => {
            if (col.id === currentColumnId) return { ...col, tasks: sourceTasks };
            if (col.id === targetColumnId) return { ...col, tasks: targetTasks };
            return col;
          }));
        }
      } else if (overData?.type === 'column' || !overData) {
        // Drop sur colonne vide
        let targetColumnId = String(over.id).replace(/^(empty-|collapsed-)/, '');
        if (overData?.column) {
          targetColumnId = overData.column.id;
        }
        
        if (currentColumnId !== targetColumnId) {
          const targetColumn = localColumnsRef.current.find(col => col.id === targetColumnId);
          if (!targetColumn) return;
          
          const sourceTasks = currentColumn.tasks.filter(t => t.id !== activeTask.id);
          const targetTasks = [...(targetColumn.tasks || []), {
            ...activeTask,
            columnId: targetColumnId
          }];
          
          setLocalColumns(prev => prev.map(col => {
            if (col.id === currentColumnId) return { ...col, tasks: sourceTasks };
            if (col.id === targetColumnId) return { ...col, tasks: targetTasks };
            return col;
          }));
        }
      }
    }
  }, [setLocalColumns]);

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    const activeData = active.data.current;
    
    // Nettoyer les états IMMÉDIATEMENT
    dragEndTimeRef.current = Date.now();
    optimisticUpdateRef.current = null;
    
    setActiveTask(null);
    setActiveColumn(null);
    setIsDragging(false);

    if (!over) {
      setOriginalTaskState(null);
      isDraggingRef.current = false;
      return;
    }

    // Drag de colonne
    if (activeData?.type === 'column') {
      const columnIds = localColumnsRef.current.map((col) => col.id);
      markReorderAction();
      
      try {
        await reorderColumns({
          variables: { columns: columnIds, workspaceId },
        });
      } catch (error) {
        console.error('❌ Erreur réorganisation colonnes:', error);
      }
      
      isDraggingRef.current = false;
      setTimeout(() => {
        dragEndTimeRef.current = 0;
      }, 100);
      return;
    }

    // Drag de tâche
    if (activeData?.type === 'task' && originalTaskState) {
      const taskId = activeData.task.id;
      const originalColumnId = originalTaskState.columnId;
      const originalPosition = originalTaskState.position;

      let newColumnId = originalColumnId;
      let newPosition = originalPosition;

      // Trouver la position finale dans localColumns
      for (const column of localColumnsRef.current) {
        const taskIndex = column.tasks?.findIndex(t => t.id === taskId);
        if (taskIndex !== undefined && taskIndex !== -1) {
          newColumnId = column.id;
          newPosition = taskIndex;
          break;
        }
      }

      const hasChanged = newColumnId !== originalColumnId || newPosition !== originalPosition;

      if (hasChanged) {
        if (pendingMutationRef.current) {
          console.warn('⚠️ Mutation déjà en cours, ignorée');
          setOriginalTaskState(null);
          isDraggingRef.current = false;
          return;
        }
        
        try {
          pendingMutationRef.current = true;
          
          console.log('📤 Envoi mutation moveTask:', {
            taskId,
            from: { columnId: originalColumnId, position: originalPosition },
            to: { columnId: newColumnId, position: newPosition }
          });
          
          // Marquer l'action AVANT la mutation
          markMoveTaskAction();
          
          await moveTask({
            variables: {
              id: taskId,
              columnId: newColumnId,
              position: newPosition,
              workspaceId,
            },
          });
          
          console.log('✅ Mutation moveTask réussie');
        } catch (error) {
          console.error('❌ Erreur déplacement tâche:', error);
        } finally {
          setTimeout(() => {
            pendingMutationRef.current = false;
          }, 100);
        }
      }
    }

    setOriginalTaskState(null);
    
    setTimeout(() => {
      dragEndTimeRef.current = 0;
      isDraggingRef.current = false;
    }, 100);
  }, [
    moveTask, 
    workspaceId, 
    reorderColumns, 
    markReorderAction, 
    markMoveTaskAction, 
    originalTaskState
  ]);

  const getLocalTasksByColumn = useCallback((columnId) => {
    const column = localColumnsRef.current.find(col => col.id === columnId);
    return column?.tasks || [];
  }, []);

  return {
    activeTask,
    activeColumn,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    isDragging,
    getLocalTasksByColumn,
    dragEndTimeRef,
    isDraggingRef,
  };
};