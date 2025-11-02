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
    const sourceColumnId = source.droppableId;
    const destColumnId = destination.droppableId;

    // Trouver les colonnes
    const sourceColumn = localColumns.find(col => col.id === sourceColumnId);
    const destColumn = localColumns.find(col => col.id === destColumnId);

    if (!sourceColumn || !destColumn) {
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
      markMoveTaskAction();

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
      } catch (error) {
        console.error('❌ Erreur moveTask:', error);
      }
    } else {
      // Colonnes différentes - déplacement
      const sourceTasks = Array.from(sourceColumn.tasks || []);
      const destTasks = Array.from(destColumn.tasks || []);

      // Retirer la tâche de la source
      const [movedTask] = sourceTasks.splice(source.index, 1);
      
      // Créer une copie de la tâche avec le nouveau columnId ET la nouvelle position
      const updatedTask = { 
        ...movedTask, 
        columnId: destColumnId,
        position: destination.index 
      };
      
      // Insérer dans la destination
      destTasks.splice(destination.index, 0, updatedTask);

      // Recalculer TOUTES les positions pour être sûr
      const sourceTasksWithPositions = sourceTasks.map((task, index) => ({
        ...task,
        position: index
      }));

      const destTasksWithPositions = destTasks.map((task, index) => ({
        ...task,
        position: index,
        columnId: destColumnId // S'assurer que toutes les tâches ont le bon columnId
      }));

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
      markMoveTaskAction();

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
      } catch (error) {
        console.error('❌ Erreur moveTask:', error);
      }
    }
  }, [localColumns, setLocalColumns, moveTask, reorderColumns, workspaceId, markReorderAction, markMoveTaskAction]);

  return {
    handleDragEnd
  };
};
