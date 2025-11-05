import { useCallback } from 'react';

/**
 * Hook simplifié pour gérer le drag and drop avec @hello-pangea/dnd
 */
export const useKanbanDnDSimple = (
  moveTask,
  boardId,
  workspaceId,
  localColumns,
  setLocalColumns,
  reorderColumns,
  markReorderAction,
  markMoveTaskAction,
  selectedMemberId = null // Filtre par membre
) => {
  
  const handleDragEnd = useCallback(async (result) => {
    const { destination, source, draggableId, type } = result;

    // Pas de destination = annulé
    if (!destination) {
      return;
    }

    // Pas de changement
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // === DRAG DE COLONNE ===
    if (type === 'column') {
      const newColumns = Array.from(localColumns);
      const [removed] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, removed);

      setLocalColumns(newColumns);
      markReorderAction();

      // Sauvegarder l'ordre
      try {
        await reorderColumns({
          variables: {
            columns: newColumns.map(col => col.id),
            workspaceId
          }
        });
      } catch (error) {
        console.error('❌ Erreur reorder columns:', error);
      }
      return;
    }

    // === DRAG DE TÂCHE ===
    // Nettoyer les IDs (enlever les préfixes collapsed-, empty-, etc.)
    let sourceColumnId = source.droppableId;
    let destColumnId = destination.droppableId;
    
    // Enlever les préfixes si présents
    if (sourceColumnId.startsWith('collapsed-')) {
      sourceColumnId = sourceColumnId.replace('collapsed-', '');
    }
    if (sourceColumnId.startsWith('empty-')) {
      sourceColumnId = sourceColumnId.replace('empty-', '');
    }
    if (destColumnId.startsWith('collapsed-')) {
      destColumnId = destColumnId.replace('collapsed-', '');
    }
    if (destColumnId.startsWith('empty-')) {
      destColumnId = destColumnId.replace('empty-', '');
    }

    // Trouver les colonnes
    const sourceColumn = localColumns.find(col => col.id === sourceColumnId);
    const destColumn = localColumns.find(col => col.id === destColumnId);

    if (!sourceColumn || !destColumn) {
      console.log('❌ Colonnes non trouvées:', { sourceColumnId, destColumnId });
      return;
    }

    // Même colonne - réorganisation
    if (sourceColumnId === destColumnId) {
      const newTasks = Array.from(sourceColumn.tasks || []);
      const [movedTask] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, movedTask);

      // Mettre à jour les positions
      const tasksWithNewPositions = newTasks.map((task, index) => ({
        ...task,
        position: index
      }));

      const newColumns = localColumns.map(col =>
        col.id === sourceColumnId
          ? { ...col, tasks: tasksWithNewPositions }
          : col
      );

      setLocalColumns(newColumns);

      // Sauvegarder
      try {
        await moveTask({
          variables: {
            id: draggableId,
            columnId: destColumnId,
            position: destination.index,
            workspaceId
          }
        });
        // Marquer APRÈS la mutation pour empêcher les updates pendant toute la durée
        markMoveTaskAction();
      } catch (error) {
        console.error('❌ Erreur moveTask:', error);
      }
    } else {
      // Colonnes différentes - déplacement
      const sourceTasks = Array.from(sourceColumn.tasks || []);
      const destTasks = Array.from(destColumn.tasks || []);

      console.log('🔄 [DnD] Déplacement entre colonnes:', {
        source: { columnId: sourceColumnId, index: source.index, tasksCount: sourceTasks.length },
        dest: { columnId: destColumnId, index: destination.index, tasksCount: destTasks.length },
        hasFilter: !!selectedMemberId
      });

      // Si un filtre est actif, on doit recalculer les index réels
      let realSourceIndex = source.index;
      let realDestIndex = destination.index;
      
      if (selectedMemberId) {
        // Filtrer les tâches pour trouver les index réels
        const filteredSourceTasks = sourceTasks.filter(task => 
          task.assignedMembers && task.assignedMembers.includes(selectedMemberId)
        );
        const filteredDestTasks = destTasks.filter(task => 
          task.assignedMembers && task.assignedMembers.includes(selectedMemberId)
        );
        
        // Trouver la tâche déplacée dans les tâches filtrées
        const movedTaskInFiltered = filteredSourceTasks[source.index];
        
        // Trouver l'index réel dans toutes les tâches
        realSourceIndex = sourceTasks.findIndex(t => t.id === movedTaskInFiltered?.id);
        
        // Pour la destination, trouver la tâche à l'index de destination dans les filtrées
        if (destination.index < filteredDestTasks.length) {
          const targetTaskInFiltered = filteredDestTasks[destination.index];
          realDestIndex = destTasks.findIndex(t => t.id === targetTaskInFiltered?.id);
        } else {
          // Si on drop à la fin des tâches filtrées, trouver la position après la dernière tâche filtrée
          const lastFilteredTask = filteredDestTasks[filteredDestTasks.length - 1];
          if (lastFilteredTask) {
            realDestIndex = destTasks.findIndex(t => t.id === lastFilteredTask.id) + 1;
          } else {
            realDestIndex = destTasks.length;
          }
        }
        
        console.log('🔍 [DnD] Recalcul index avec filtre:', {
          visualSourceIndex: source.index,
          realSourceIndex,
          visualDestIndex: destination.index,
          realDestIndex,
          movedTaskId: movedTaskInFiltered?.id
        });
      }

      // Retirer la tâche de la source (utiliser l'index réel)
      const [movedTask] = sourceTasks.splice(realSourceIndex, 1);
      
      // IMPORTANT: Le backend exclut la tâche déplacée quand il récupère les tâches
      // Donc si la tâche vient de la même colonne, on doit ajuster l'index
      // Utiliser realDestIndex au lieu de destination.index
      let finalPosition = realDestIndex;
      if (sourceColumnId === destColumnId && realDestIndex > realSourceIndex) {
        // Si on déplace dans la même colonne vers le bas, l'index diminue de 1
        // car la tâche a été retirée de la source
        finalPosition = realDestIndex - 1;
      }
      
      console.log('📍 [DnD] Calcul position:', {
        sourceColumnId,
        destColumnId,
        sameColumn: sourceColumnId === destColumnId,
        visualDestIndex: destination.index,
        realDestIndex,
        visualSourceIndex: source.index,
        realSourceIndex,
        finalPosition
      });
      
      // Insérer dans la destination à l'index réel
      destTasks.splice(realDestIndex, 0, movedTask);

      console.log('📍 [DnD] Après insertion:', {
        destTasksCount: destTasks.length,
        movedTaskIndex: destTasks.findIndex(t => t.id === draggableId),
        finalPosition: finalPosition
      });

      // Recalculer TOUTES les positions pour être sûr
      const sourceTasksWithPositions = sourceTasks.map((task, index) => ({
        ...task,
        position: index
      }));

      const destTasksWithPositions = destTasks.map((task, index) => ({
        ...task,
        position: index,
        columnId: task.id === draggableId ? destColumnId : task.columnId
      }));

      console.log('✅ [DnD] Position finale:', {
        taskId: draggableId,
        finalPosition,
        taskTitle: movedTask.title
      });

      const newColumns = localColumns.map(col => {
        if (col.id === sourceColumnId) {
          return { ...col, tasks: sourceTasksWithPositions };
        }
        if (col.id === destColumnId) {
          return { ...col, tasks: destTasksWithPositions };
        }
        return col;
      });

      setLocalColumns(newColumns);

      // Sauvegarder avec la position finale calculée (pas destination.index)
      try {
        await moveTask({
          variables: {
            id: draggableId,
            columnId: destColumnId,
            position: finalPosition,
            workspaceId
          }
        });
        console.log('✅ Tâche déplacée:', draggableId, 'vers colonne:', destColumnId, 'position:', finalPosition);
        // Marquer APRÈS la mutation pour empêcher les updates pendant toute la durée
        markMoveTaskAction();
      } catch (error) {
        console.error('❌ Erreur moveTask:', error);
      }
    }
  }, [localColumns, setLocalColumns, moveTask, reorderColumns, workspaceId, markReorderAction, markMoveTaskAction, selectedMemberId]);

  return {
    handleDragEnd
  };
};
