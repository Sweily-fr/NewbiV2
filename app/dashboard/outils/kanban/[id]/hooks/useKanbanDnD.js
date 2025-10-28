import { useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

export const useKanbanDnD = (moveTask, getTasksByColumn, boardId, workspaceId, localColumns, reorderColumns, setLocalColumns, markReorderAction) => {
  const [activeTask, setActiveTask] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);
  
  // Créer une structure locale des tâches par colonne pour la réorganisation en temps réel
  const [localTasksByColumn, setLocalTasksByColumn] = useState({});

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
    
    // Cas 1: Réorganisation des colonnes
    if (activeData?.type === 'column' && overData?.type === 'column') {
      if (active.id !== over.id) {
        const oldIndex = localColumns.findIndex((col) => col.id === active.id);
        const newIndex = localColumns.findIndex((col) => col.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          // Réorganiser localement en temps réel
          const newColumns = arrayMove(localColumns, oldIndex, newIndex);
          setLocalColumns(newColumns);
        }
      }
    }
    
    // Cas 2: Réorganisation des tâches (même logique que les colonnes)
    if (activeData?.type === 'task' && overData?.type === 'task') {
      const activeTask = activeData.task;
      const overTask = overData.task;
      
      // Seulement si c'est dans la même colonne
      if (activeTask.columnId === overTask.columnId) {
        const columnId = activeTask.columnId;
        const currentTasks = localTasksByColumn[columnId] || getTasksByColumn(columnId);
        
        const activeIndex = currentTasks.findIndex((t) => t.id === activeTask.id);
        const overIndex = currentTasks.findIndex((t) => t.id === overTask.id);
        
        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
          // Réorganiser localement en temps réel avec arrayMove
          const newTasks = arrayMove(currentTasks, activeIndex, overIndex);
          setLocalTasksByColumn({
            ...localTasksByColumn,
            [columnId]: newTasks,
          });
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
    setLocalTasksByColumn({}); // Réinitialiser les tâches locales

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Cas 1: Drag d'une colonne - sauvegarder en base de données
    if (activeData?.type === 'column') {
      // Les colonnes sont déjà réorganisées localement via handleDragOver
      // On sauvegarde juste l'ordre final en base de données
      const columnIds = localColumns.map((col) => col.id);

      // Marquer l'action locale pour ignorer la subscription REORDERED
      markReorderAction();

      try {
        await reorderColumns({
          variables: {
            columns: columnIds,
            workspaceId: workspaceId,
          },
        });
        // Colonnes sauvegardées
      } catch (error) {
        console.error('Erreur réorganisation colonnes:', error);
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
      // Déposé sur une colonne (ou zone de drop vide/fermée)
      // Extraire le vrai columnId (peut être "empty-xxx" ou "collapsed-xxx")
      newColumnId = overData.columnId || over.id;
      const targetColumnTasks = getTasksByColumn(newColumnId);
      newPosition = targetColumnTasks.length;
    } else if (overData?.type === 'task') {
      // Déposé sur une autre tâche
      const targetTask = overData.task;
      newColumnId = targetTask.columnId;
      
      // Utiliser les tâches réorganisées localement si disponibles
      const targetColumnTasks = localTasksByColumn[targetTask.columnId] || getTasksByColumn(targetTask.columnId);
      const targetIndex = targetColumnTasks.findIndex(
        (t) => t.id === targetTask.id
      );

      // Utiliser l'index de la tâche cible comme position finale
      // Les tâches ont déjà été réorganisées en temps réel via handleDragOver
      newPosition = targetIndex;
    }

    // Recalculer les positions locales immédiatement (comme le backend le fera)
    // Cela met à jour l'affichage sans attendre la subscription
    if (newColumnId === activeTask.columnId) {
      // Même colonne : recalculer les positions
      const allTasks = localTasksByColumn[newColumnId] || getTasksByColumn(newColumnId);
      const tasksWithoutMoved = allTasks.filter(t => t.id !== activeTask.id);
      
      // Créer le nouvel ordre
      const reorderedTasks = [
        ...tasksWithoutMoved.slice(0, newPosition),
        activeTask,
        ...tasksWithoutMoved.slice(newPosition)
      ];
      
      // Recalculer les positions (0, 1, 2, 3...)
      const tasksWithNewPositions = reorderedTasks.map((task, index) => ({
        ...task,
        position: index
      }));
      
      // Mettre à jour localement
      setLocalTasksByColumn({
        ...localTasksByColumn,
        [newColumnId]: tasksWithNewPositions,
      });
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
              updatedAt: new Date().toISOString(),
            },
          },
        });
      } catch (error) {
        console.error('Error moving task:', error);
      }
    }
  };

  // Fonction pour obtenir les tâches d'une colonne (locales ou de la base de données)
  const getLocalTasksByColumn = (columnId) => {
    return localTasksByColumn[columnId] || getTasksByColumn(columnId);
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
