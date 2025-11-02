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
  const localColumnsRef = useRef(localColumns);
  
  // Throttle pour handleDragOver (max 20 updates/sec au lieu de 60)
  const lastDragOverTime = useRef(0);
  const DRAG_OVER_THROTTLE = 50; // 50ms = 20fps max (plus réactif)
  
  // Batch des updates pour réduire les re-renders
  const pendingUpdate = useRef(null);
  const updateTimeoutRef = useRef(null);

  // Synchroniser la ref avec localColumns
  localColumnsRef.current = localColumns;

  const handleDragStart = useCallback((event) => {
    const { active } = event;
    const activeData = active.data.current;
    
    console.log('🎬 Drag start');
    
    setIsDragging(true);
    isDraggingRef.current = true;
    lastDragOverTime.current = 0; // Reset throttle
    
    if (activeData?.type === 'task') {
      setActiveTask(activeData.task);
      
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

  // Fonction pour appliquer les updates en batch
  const applyPendingUpdate = useCallback(() => {
    if (pendingUpdate.current) {
      setLocalColumns(pendingUpdate.current);
      pendingUpdate.current = null;
    }
  }, [setLocalColumns]);

  const handleDragOver = useCallback((event) => {
    const { active, over } = event;
    if (!over || !isDraggingRef.current) return;
    
    // THROTTLE : Limiter à 10 updates par seconde
    const now = Date.now();
    if (now - lastDragOverTime.current < DRAG_OVER_THROTTLE) {
      return;
    }
    lastDragOverTime.current = now;
    
    const activeData = active.data.current;
    const overData = over.data.current;
    
    // Debug temporaire
    console.log('🔍 DragOver:', {
      activeType: activeData?.type,
      activeId: active.id,
      overType: overData?.type,
      overId: over.id,
      hasOverData: !!overData
    });
    
    // === RÉORGANISATION DES COLONNES ===
    if (activeData?.type === 'column' && overData?.type === 'column' && active.id !== over.id) {
      // Extraire les IDs des colonnes (peuvent avoir le préfixe column-)
      let activeColumnId = activeData.column?.id;
      let overColumnId = overData.column?.id;
      
      if (typeof active.id === 'string' && active.id.startsWith('column-')) {
        activeColumnId = active.id.replace('column-', '');
      }
      if (typeof over.id === 'string' && over.id.startsWith('column-')) {
        overColumnId = over.id.replace('column-', '');
      }
      
      const oldIndex = localColumnsRef.current.findIndex((col) => col.id === activeColumnId);
      const newIndex = localColumnsRef.current.findIndex((col) => col.id === overColumnId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newColumns = arrayMove(localColumnsRef.current, oldIndex, newIndex);
        
        // Appliquer directement (pas besoin de batch pour les colonnes)
        setLocalColumns(newColumns);
        localColumnsRef.current = newColumns;
      }
      return;
    }

    // === RÉORGANISATION DES TÂCHES ===
    if (activeData?.type !== 'task') return;
    
    const activeTask = activeData.task;
    
    // Trouver la colonne actuelle
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
    
    let newColumns = localColumnsRef.current;
    
    // === DROP SUR UNE TÂCHE ===
    if (overData?.type === 'task') {
      const overTask = overData.task;
      const targetColumnId = overTask.columnId;
      const targetColumn = localColumnsRef.current.find(col => col.id === targetColumnId);
      
      if (!targetColumn) return;

      if (currentColumnId === targetColumnId) {
        // MÊME COLONNE - Réorganiser
        const tasks = [...currentColumn.tasks];
        const activeIndex = tasks.findIndex((t) => t.id === activeTask.id);
        const overIndex = tasks.findIndex((t) => t.id === overTask.id);
        
        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
          const newTasks = arrayMove(tasks, activeIndex, overIndex);
          
          newColumns = localColumnsRef.current.map(col => 
            col.id === currentColumnId ? { ...col, tasks: newTasks } : col
          );
        }
      } else {
        // COLONNES DIFFÉRENTES
        const sourceTasks = currentColumn.tasks.filter(t => t.id !== activeTask.id);
        const targetTasks = [...targetColumn.tasks];
        const overIndex = targetTasks.findIndex(t => t.id === overTask.id);
        
        targetTasks.splice(overIndex >= 0 ? overIndex : targetTasks.length, 0, {
          ...activeTask,
          columnId: targetColumnId
        });
        
        newColumns = localColumnsRef.current.map(col => {
          if (col.id === currentColumnId) return { ...col, tasks: sourceTasks };
          if (col.id === targetColumnId) return { ...col, tasks: targetTasks };
          return col;
        });
      }
    } 
    // === DROP SUR COLONNE VIDE ===
    else if (overData?.type === 'column') {
      // Extraire l'ID de la colonne (peut avoir un préfixe empty-, collapsed-, ou column-)
      let targetColumnId = overData.column?.id || overData.columnId;
      
      // Si l'ID a un préfixe, l'extraire
      if (typeof over.id === 'string') {
        if (over.id.startsWith('column-')) {
          targetColumnId = over.id.replace('column-', '');
        } else if (over.id.startsWith('empty-')) {
          targetColumnId = over.id.replace('empty-', '');
        } else if (over.id.startsWith('collapsed-')) {
          targetColumnId = over.id.replace('collapsed-', '');
        }
      }
      
      if (currentColumnId !== targetColumnId) {
        const targetColumn = localColumnsRef.current.find(col => col.id === targetColumnId);
        if (!targetColumn) return;
        
        const sourceTasks = currentColumn.tasks.filter(t => t.id !== activeTask.id);
        const targetTasks = [...(targetColumn.tasks || []), {
          ...activeTask,
          columnId: targetColumnId
        }];
        
        newColumns = localColumnsRef.current.map(col => {
          if (col.id === currentColumnId) return { ...col, tasks: sourceTasks };
          if (col.id === targetColumnId) return { ...col, tasks: targetTasks };
          return col;
        });
      }
    }
    
    // APPLIQUER L'UPDATE (directement pour la fluidité)
    if (newColumns !== localColumnsRef.current) {
      setLocalColumns(newColumns);
      localColumnsRef.current = newColumns;
    }
  }, [setLocalColumns]);

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    const activeData = active.data.current;
    
    console.log('🏁 Drag end');
    
    // Nettoyer immédiatement
    dragEndTimeRef.current = Date.now();
    lastDragOverTime.current = 0;
    
    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    pendingUpdate.current = null;
    
    setActiveTask(null);
    setActiveColumn(null);
    setIsDragging(false);

    if (!over) {
      setOriginalTaskState(null);
      isDraggingRef.current = false;
      return;
    }

    // === DRAG DE COLONNE ===
    if (activeData?.type === 'column') {
      const columnIds = localColumnsRef.current.map((col) => col.id);
      markReorderAction();
      
      try {
        console.log('📤 Mutation reorder columns');
        await reorderColumns({
          variables: { columns: columnIds, workspaceId },
        });
        console.log('✅ Reorder columns OK');
      } catch (error) {
        console.error('❌ Erreur reorder columns:', error);
      }
      
      isDraggingRef.current = false;
      setTimeout(() => {
        dragEndTimeRef.current = 0;
      }, 100);
      return;
    }

    // === DRAG DE TÂCHE ===
    if (activeData?.type === 'task' && originalTaskState) {
      const taskId = activeData.task.id;
      const originalColumnId = originalTaskState.columnId;
      const originalPosition = originalTaskState.position;

      let newColumnId = originalColumnId;
      let newPosition = originalPosition;

      // Trouver la position finale
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
        // ÉVITER LES DOUBLONS : vérifier qu'une mutation n'est pas déjà en cours
        if (pendingMutationRef.current) {
          console.warn('⚠️ Mutation déjà en cours, ignorée');
          setOriginalTaskState(null);
          isDraggingRef.current = false;
          return;
        }
        
        try {
          pendingMutationRef.current = true;
          
          console.log('📤 Mutation moveTask:', {
            taskId,
            from: { columnId: originalColumnId, position: originalPosition },
            to: { columnId: newColumnId, position: newPosition }
          });
          
          // Marquer AVANT la mutation pour éviter les updates Redis pendant le traitement
          markMoveTaskAction();
          
          // ENVOYER LA MUTATION - UNE SEULE FOIS
          await moveTask({
            variables: {
              id: taskId,
              columnId: newColumnId,
              position: newPosition,
              workspaceId,
            },
          });
          
          console.log('✅ Mutation moveTask OK');
        } catch (error) {
          console.error('❌ Erreur moveTask:', error);
          
          // ROLLBACK en cas d'erreur
          // Restaurer l'état original
          const rollbackColumns = localColumnsRef.current.map(col => {
            if (col.id === originalColumnId || col.id === newColumnId) {
              // Reconstruire les tasks avec les positions correctes
              const tasks = col.tasks.map((t, idx) => ({
                ...t,
                position: idx,
                columnId: col.id
              }));
              return { ...col, tasks };
            }
            return col;
          });
          
          setLocalColumns(rollbackColumns);
          localColumnsRef.current = rollbackColumns;
        } finally {
          // Attendre un peu avant de permettre une nouvelle mutation
          setTimeout(() => {
            pendingMutationRef.current = false;
          }, 200);
        }
      }
    }

    setOriginalTaskState(null);
    
    // Attendre avant de réactiver complètement
    setTimeout(() => {
      dragEndTimeRef.current = 0;
      isDraggingRef.current = false;
    }, 200);
  }, [
    moveTask, 
    workspaceId, 
    reorderColumns, 
    markReorderAction, 
    markMoveTaskAction, 
    originalTaskState,
    setLocalColumns
  ]);

  const getLocalTasksByColumn = useCallback((columnId) => {
    const column = localColumnsRef.current.find(col => col.id === columnId);
    return column?.tasks || [];
  }, []);

  return {
    activeTask,
    activeColumn,
    handleDragStart: handleDragStart,
    handleDragOver,
    handleDragEnd,
    isDragging,
    getLocalTasksByColumn,
    dragEndTimeRef,
    isDraggingRef,
  };
};