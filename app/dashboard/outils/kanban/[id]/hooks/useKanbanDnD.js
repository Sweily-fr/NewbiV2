import { useState } from 'react';
import { useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';

export const useKanbanDnD = (moveTask, getTasksByColumn, boardId, workspaceId, columns, reorderColumns, setLocalColumns, markAsUpdating) => {
  const [activeTask, setActiveTask] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);

  // Configuration des capteurs pour le drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Distance minimale pour activer le drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Gestion du début du drag
  const handleDragStart = (event) => {
    const { active } = event;
    const activeData = active.data.current;
    
    if (activeData?.type === 'task') {
      setActiveTask(activeData.task);
      setActiveColumn(null);
    } else if (activeData?.type === 'column') {
      setActiveColumn(activeData.column);
      setActiveTask(null);
    }
  };

  // Gestion du drag en cours (réorganisation en temps réel)
  const handleDragOver = (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeData = active.data.current;
    const overData = over.data.current;
    
    // Seulement pour les colonnes
    if (activeData?.type === 'column' && overData?.type === 'column') {
      if (active.id !== over.id) {
        const oldIndex = columns.findIndex((col) => col.id === active.id);
        const newIndex = columns.findIndex((col) => col.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          // Réorganiser localement en temps réel
          const newColumns = arrayMove(columns, oldIndex, newIndex);
          setLocalColumns(newColumns);
        }
      }
    }
  };

  // Gestion de la fin du drag
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    // Réinitialiser les états
    setActiveTask(null);
    setActiveColumn(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Cas 1: Drag d'une colonne - sauvegarder en base de données
    if (activeData?.type === 'column') {
      // Les colonnes sont déjà réorganisées localement via handleDragOver
      // On sauvegarde juste l'ordre final en base de données
      const columnIds = columns.map((col) => col.id);

      console.log('🔄 [DnD] Début réorganisation colonnes:', {
        columnIds,
        workspaceId,
        hasMarkAsUpdating: !!markAsUpdating
      });

      // Marquer qu'on fait une mise à jour pour éviter les boucles avec le realtime
      if (markAsUpdating) {
        markAsUpdating();
        console.log('✅ [DnD] markAsUpdating() appelé');
      }

      try {
        await reorderColumns({
          variables: {
            columns: columnIds,
            workspaceId: workspaceId,
          },
        });
        console.log('✅ [DnD] Colonnes sauvegardées avec succès:', columnIds);
      } catch (error) {
        console.error('❌ [DnD] Erreur réorganisation colonnes:', error);
        // En cas d'erreur, on pourrait restaurer l'ordre précédent
      }
      return;
    }

    // Cas 2: Drag d'une tâche
    const activeTask = activeData?.task;
    if (!activeTask) return;

    let newColumnId = activeTask.columnId;
    let newPosition = activeTask.position || 0;

    // Déterminer où on a déposé la tâche
    if (overData?.type === 'column') {
      // Déposé sur une colonne
      newColumnId = over.id;
      const targetColumnTasks = getTasksByColumn(over.id);
      newPosition = targetColumnTasks.length;
    } else if (overData?.type === 'task') {
      // Déposé sur une autre tâche
      const targetTask = overData.task;
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
            workspaceId: workspaceId,
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
    activeColumn,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
};
