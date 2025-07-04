import { useState } from 'react';
import { useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export const useKanbanDnD = (moveTask, getTasksByColumn, boardId) => {
  const [activeTask, setActiveTask] = useState(null);

  // Configuration des capteurs pour le drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Gestion du début du drag
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveTask(active.data.current?.task || null);
  };

  // Gestion de la fin du drag
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = active.data.current?.task;
    if (!activeTask) return;

    let newColumnId = activeTask.columnId;
    let newPosition = activeTask.position || 0;

    // Déterminer où on a déposé la tâche
    if (over.data?.current?.type === 'column') {
      // Déposé sur une colonne
      newColumnId = over.id;
      const targetColumnTasks = getTasksByColumn(over.id);
      newPosition = targetColumnTasks.length;
    } else if (over.data?.current?.type === 'task') {
      // Déposé sur une autre tâche
      const targetTask = over.data.current.task;
      newColumnId = targetTask.columnId;
      const targetColumnTasks = getTasksByColumn(targetTask.columnId);
      const targetIndex = targetColumnTasks.findIndex(
        (t) => t.id === targetTask.id
      );

      // Ajuster la position si nécessaire
      newPosition = targetIndex;
    }

    // Si la position ou la colonne a changé, effectuer la mutation
    if (
      newColumnId !== activeTask.columnId ||
      newPosition !== (activeTask.position || 0)
    ) {
      try {
        await moveTask({
          variables: {
            id: activeTask.id,
            columnId: newColumnId,
            position: newPosition,
          },
          optimisticResponse: {
            moveTask: {
              __typename: 'Task',
              id: activeTask.id,
              columnId: newColumnId,
              position: newPosition,
            },
          },
        });
      } catch (error) {
        console.error('Error moving task:', error);
      }
    }
  };

  return {
    activeTask,
    sensors,
    handleDragStart,
    handleDragEnd,
  };
};
