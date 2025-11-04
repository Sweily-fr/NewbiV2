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
  markMoveTaskAction
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
        dest: { columnId: destColumnId, index: destination.index, tasksCount: destTasks.length }
      });

      // Retirer la tâche de la source
      const [movedTask] = sourceTasks.splice(source.index, 1);
      
      // IMPORTANT: Le backend exclut la tâche déplacée quand il récupère les tâches
      // Donc si la tâche vient de la même colonne, on doit ajuster l'index
      // Sinon, on utilise destination.index directement
      let finalPosition = destination.index;
      if (sourceColumnId === destColumnId && destination.index > source.index) {
        // Si on déplace dans la même colonne vers le bas, l'index diminue de 1
        // car la tâche a été retirée de la source
        finalPosition = destination.index - 1;
      }
      
      console.log('📍 [DnD] Calcul position:', {
        sourceColumnId,
        destColumnId,
        sameColumn: sourceColumnId === destColumnId,
        destinationIndex: destination.index,
        sourceIndex: source.index,
        finalPosition
      });
      
      // Insérer dans la destination à l'index exact
      destTasks.splice(destination.index, 0, movedTask);

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
  }, [localColumns, setLocalColumns, moveTask, reorderColumns, workspaceId, markReorderAction, markMoveTaskAction]);

  return {
    handleDragEnd
  };
};
