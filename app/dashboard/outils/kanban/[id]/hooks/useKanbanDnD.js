import { useState, useRef } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

export const useKanbanDnD = (moveTask, getTasksByColumn, boardId, workspaceId, localColumns, reorderColumns, setLocalColumns, markReorderAction, markMoveTaskAction) => {
  const [activeTask, setActiveTask] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);
  const [originalTaskState, setOriginalTaskState] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragEndTimeRef = useRef(0);
  const isDraggingRef = useRef(false); // Flag pour bloquer les mises à jour pendant le drag
  const pendingMutationRef = useRef(false); // Flag pour éviter les mutations multiples

  const handleDragStart = (event) => {
    const { active } = event;
    const activeData = active.data.current;
    
    setIsDragging(true);
    isDraggingRef.current = true; // Marquer le début du drag
    
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

    // Réorganisation des tâches - MODIFIER DIRECTEMENT localColumns
    if (activeData?.type === 'task') {
      const activeTask = activeData.task;
      
      // Trouver où la tâche est ACTUELLEMENT dans localColumns
      let currentColumnId = null;
      let currentColumn = null;
      
      for (const column of localColumns) {
        if (column.tasks?.find(t => t.id === activeTask.id)) {
          currentColumnId = column.id;
          currentColumn = column;
          break;
        }
      }
      
      if (!currentColumnId) return;
      
      if (overData?.type === 'task') {
        // Drop sur une tâche
        const overTask = overData.task;
        const targetColumnId = overTask.columnId;
        const targetColumn = localColumns.find(col => col.id === targetColumnId);
        
        if (!targetColumn) return;

        if (currentColumnId === targetColumnId) {
          // Même colonne - réorganiser avec arrayMove
          const tasks = [...currentColumn.tasks];
          const activeIndex = tasks.findIndex((t) => t.id === activeTask.id);
          const overIndex = tasks.findIndex((t) => t.id === overTask.id);
          
          if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
            const newTasks = arrayMove(tasks, activeIndex, overIndex);
            
            // Mettre à jour localColumns directement
            setLocalColumns(localColumns.map(col => 
              col.id === currentColumnId ? { ...col, tasks: newTasks } : col
            ));
          }
        } else {
          // Colonnes différentes - retirer de source et ajouter à target
          const sourceTasks = currentColumn.tasks.filter(t => t.id !== activeTask.id);
          const targetTasks = [...targetColumn.tasks];
          const overIndex = targetTasks.findIndex(t => t.id === overTask.id);
          
          // Insérer à la position de la tâche survolée
          targetTasks.splice(overIndex, 0, { ...activeTask, columnId: targetColumnId });
          
          // Mettre à jour localColumns directement
          setLocalColumns(localColumns.map(col => {
            if (col.id === currentColumnId) return { ...col, tasks: sourceTasks };
            if (col.id === targetColumnId) return { ...col, tasks: targetTasks };
            return col;
          }));
        }
      } else if (overData?.type === 'column' || !overData) {
        // Drop sur colonne (vide ou zone de drop)
        let targetColumnId = over.id;
        if (overData?.column) {
          targetColumnId = overData.column.id;
        }
        targetColumnId = String(targetColumnId).replace(/^(empty-|collapsed-)/, '');
        
        if (currentColumnId !== targetColumnId) {
          const targetColumn = localColumns.find(col => col.id === targetColumnId);
          if (!targetColumn) return;
          
          const sourceTasks = currentColumn.tasks.filter(t => t.id !== activeTask.id);
          const targetTasks = [...(targetColumn.tasks || []), { ...activeTask, columnId: targetColumnId }];
          
          // Mettre à jour localColumns directement
          setLocalColumns(localColumns.map(col => {
            if (col.id === currentColumnId) return { ...col, tasks: sourceTasks };
            if (col.id === targetColumnId) return { ...col, tasks: targetTasks };
            return col;
          }));
        }
      }
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    const activeData = active.data.current;
    
    // Marquer le temps de fin du drag AVANT de mettre isDragging à false
    // Cela permet au useEffect de page.jsx de bloquer les mises à jour
    dragEndTimeRef.current = Date.now();
    
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
      // Utiliser localColumnsRef pour avoir l'ordre à jour après handleDragOver
      const columnIds = localColumnsRef.current.map((col) => col.id);
      markReorderAction();
      
      try {
        await reorderColumns({
          variables: { columns: columnIds, workspaceId },
        });
      } catch (error) {
        console.error('Erreur réorganisation colonnes:', error);
      }
      
      // Marquer la fin du drag de colonne
      isDraggingRef.current = false;
      return;
    }

    // Drag de tâche - utiliser la preview pour calculer la position finale
    if (activeData?.type === 'task' && originalTaskState) {
      const taskId = activeData.task.id;
      const originalColumnId = originalTaskState.columnId;
      const originalPosition = originalTaskState.position;

      let newColumnId = originalColumnId;
      let newPosition = originalPosition;

      // Chercher la position finale dans localColumns
      for (const column of localColumns) {
        const taskIndex = column.tasks?.findIndex(t => t.id === taskId);
        if (taskIndex !== undefined && taskIndex !== -1) {
          newColumnId = column.id;
          // La position est simplement l'index dans la colonne
          newPosition = taskIndex;
          break;
        }
      }

      // Envoyer la mutation si changement
      const hasColumnChanged = newColumnId !== originalColumnId;
      const hasPositionChanged = newPosition !== originalPosition;

      if (hasColumnChanged || hasPositionChanged) {
        // Éviter les mutations multiples
        if (pendingMutationRef.current) {
          console.log('⚠️ [DnD] Mutation déjà en cours, ignorée');
          return;
        }
        
        try {
          pendingMutationRef.current = true;
          
          console.log('📤 [DnD] Envoi mutation moveTask:', {
            taskId,
            from: { columnId: originalColumnId, position: originalPosition },
            to: { columnId: newColumnId, position: newPosition }
          });
          
          // CRITIQUE: Marquer l'action AVANT la mutation pour bloquer les événements MOVED dès le début
          markMoveTaskAction();
          
          await moveTask({
            variables: {
              id: taskId,
              columnId: newColumnId,
              position: newPosition,
              workspaceId,
            },
          });
          
          console.log('✅ [DnD] Mutation moveTask réussie');
        } catch (error) {
          console.error('❌ [DnD] Erreur déplacement tâche:', error);
          // En cas d'erreur, le serveur va renvoyer les bonnes données via subscription
        } finally {
          // Réinitialiser le flag après un court délai
          setTimeout(() => {
            pendingMutationRef.current = false;
          }, 100);
        }
      }
    }

    // Nettoyer l'état d'origine et les flags
    setOriginalTaskState(null);
    
    // Réinitialiser les flags immédiatement
    // Pas besoin de setTimeout car on travaille directement sur localColumns
    setTimeout(() => {
      dragEndTimeRef.current = 0;
      isDraggingRef.current = false;
      console.log('✅ [DnD] Drag terminé, flags réinitialisés');
    }, 100);
  };

  const getLocalTasksByColumn = (columnId) => {
    // Toujours retourner depuis localColumns
    const column = localColumns.find(col => col.id === columnId);
    return column?.tasks || [];
  };

  return {
    activeTask,
    activeColumn,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    isDragging,
    getLocalTasksByColumn,
    dragEndTimeRef,
    isDraggingRef, // Exposer le ref pour que page.jsx puisse l'utiliser
  };
};