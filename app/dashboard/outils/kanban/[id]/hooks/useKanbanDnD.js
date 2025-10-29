import { useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

// Hook pour gérer le drag and drop des tâches et colonnes dans le Kanban
export const useKanbanDnD = (moveTask, getTasksByColumn, boardId, workspaceId, localColumns, reorderColumns, setLocalColumns, markReorderAction) => {
  const [activeTask, setActiveTask] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);

  // Sauvegarder la colonne d'origine de la tâche (car activeTask peut être muté pendant le drag)
  const [originalColumnId, setOriginalColumnId] = useState(null);

  // Sauvegarder la position originale de la tâche
  const [originalTaskPosition, setOriginalTaskPosition] = useState(null);

  // Créer une structure locale des tâches par colonne pour la réorganisation en temps réel
  const [localTasksByColumn, setLocalTasksByColumn] = useState({});

  // Gestion du début du drag
  const handleDragStart = (event) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === 'task') {
      setActiveTask(activeData.task);
      // IMPORTANT: Sauvegarder la colonne d'origine avant toute mutation
      setOriginalColumnId(activeData.task.columnId);
      // Sauvegarder la position originale
      setOriginalTaskPosition(activeData.task.position || 0);
      setActiveColumn(null);
    } else if (activeData?.type === 'column') {
      setActiveColumn(activeData.column);
      setActiveTask(null);
      setOriginalColumnId(null);
      setOriginalTaskPosition(null);
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

      if (activeTask.columnId === overTask.columnId) {
        // Même colonne : réorganiser avec arrayMove
        const columnId = activeTask.columnId;
        const currentTasks = localTasksByColumn[columnId] || getTasksByColumn(columnId);

        const activeIndex = currentTasks.findIndex((t) => t.id === activeTask.id);
        const overIndex = currentTasks.findIndex((t) => t.id === overTask.id);

        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
          // Réorganiser localement en temps réel avec arrayMove
          const newTasks = arrayMove(currentTasks, activeIndex, overIndex);
          
          // Mettre à jour les positions pour refléter l'ordre visuel
          const tasksWithUpdatedPositions = newTasks.map((task, index) => ({
            ...task,
            position: index
          }));
          
          setLocalTasksByColumn({
            ...localTasksByColumn,
            [columnId]: tasksWithUpdatedPositions,
          });
        }
      } else {
        // Colonnes différentes : déplacer la tâche pour la preview visuelle
        // Utiliser requestAnimationFrame pour éviter les conflits avec dnd-kit
        requestAnimationFrame(() => {
          const sourceColumnId = activeTask.columnId;
          const targetColumnId = overTask.columnId;

          const sourceTasks = localTasksByColumn[sourceColumnId] || getTasksByColumn(sourceColumnId);
          const targetTasks = localTasksByColumn[targetColumnId] || getTasksByColumn(targetColumnId);

          const activeIndex = sourceTasks.findIndex((t) => t.id === activeTask.id);
          const overIndex = targetTasks.findIndex((t) => t.id === overTask.id);

          if (activeIndex !== -1 && overIndex !== -1) {
            // Retirer de la source
            const newSourceTasks = sourceTasks.filter((t) => t.id !== activeTask.id);
            // Insérer dans la cible avec la nouvelle columnId
            const movedTask = { ...activeTask, columnId: targetColumnId };
            const newTargetTasks = [...targetTasks];
            newTargetTasks.splice(overIndex, 0, movedTask);

            // Mettre à jour les positions dans les deux colonnes
            const sourceTasksWithUpdatedPositions = newSourceTasks.map((task, index) => ({
              ...task,
              position: index
            }));
            
            const targetTasksWithUpdatedPositions = newTargetTasks.map((task, index) => ({
              ...task,
              position: index
            }));

            // Mettre à jour pour la preview
            setLocalTasksByColumn({
              ...localTasksByColumn,
              [sourceColumnId]: sourceTasksWithUpdatedPositions,
              [targetColumnId]: targetTasksWithUpdatedPositions,
            });
          }
        });
      }
    }

    // Cas 3: Tâche déposée directement sur une colonne (zone vide ou en-dehors des tâches)
    if (activeData?.type === 'task' && overData?.type === 'column') {
      const activeTask = activeData.task;
      const targetColumnId = overData.columnId || over.id;

      // Ne rien faire si c'est la même colonne (la tâche reste à sa position)
      if (activeTask.columnId !== targetColumnId) {
        requestAnimationFrame(() => {
          const sourceColumnId = activeTask.columnId;

          const sourceTasks = localTasksByColumn[sourceColumnId] || getTasksByColumn(sourceColumnId);
          const targetTasks = localTasksByColumn[targetColumnId] || getTasksByColumn(targetColumnId);

          // Retirer de la source
          const newSourceTasks = sourceTasks.filter((t) => t.id !== activeTask.id);

          // Ajouter à la fin de la cible
          const movedTask = { ...activeTask, columnId: targetColumnId };
          const newTargetTasks = [...targetTasks, movedTask];

          // Mettre à jour les positions dans les deux colonnes
          const sourceTasksWithUpdatedPositions = newSourceTasks.map((task, index) => ({
            ...task,
            position: index
          }));
          
          const targetTasksWithUpdatedPositions = newTargetTasks.map((task, index) => ({
            ...task,
            position: index
          }));

          // Mettre à jour pour la preview
          setLocalTasksByColumn({
            ...localTasksByColumn,
            [sourceColumnId]: sourceTasksWithUpdatedPositions,
            [targetColumnId]: targetTasksWithUpdatedPositions,
          });
        });
      }
    }
  };

  // Gestion de la fin du drag
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over) {
      // Drag annulé, réinitialiser
      setLocalTasksByColumn({});
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current;

    // Sauvegarder les valeurs originales avant de réinitialiser
    const savedOriginalColumnId = originalColumnId;
    const savedOriginalTaskPosition = originalTaskPosition;

    // Réinitialiser les états visuels du drag
    setActiveTask(null);
    setActiveColumn(null);
    setOriginalColumnId(null);
    setOriginalTaskPosition(null);

    // Cas 1: Drag d'une colonne
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
      } catch (error) {
        console.error('Erreur lors du réordonnancement des colonnes:', error);
      }

      // Réinitialiser les états
      setLocalTasksByColumn({});
      return;
    }

    // Cas 2: Drag d'une tâche
    if (!activeData?.task) {
      // Pas une tâche, réinitialiser
      setLocalTasksByColumn({});
      return;
    }

    const activeTask = activeData.task;
    let newColumnId;
    let newPosition = 0;

    // Déterminer la nouvelle colonne et position
    if (overData?.type === 'column') {
      // Déposé sur une colonne (pas sur une tâche spécifique)
      const rawColumnId = overData.column.id;
      // Nettoyer les préfixes "empty-" ou "collapsed-" si présents
      newColumnId = rawColumnId.replace(/^(empty-|collapsed-)/, '');

      // Utiliser les tâches localement réorganisées si disponibles, sinon les originales
      const targetColumnTasks = localTasksByColumn[newColumnId] || getTasksByColumn(newColumnId);

      // Pour un drop sur une colonne, placer la tâche à la fin
      newPosition = targetColumnTasks.length;
    } else if (overData?.type === 'task') {
      // Déposé sur une autre tâche
      const targetTask = overData.task;
      newColumnId = targetTask.columnId;

      // Trouver la position finale de la tâche active dans la prévisualisation
      const finalTasks = localTasksByColumn[newColumnId];
      const activeTaskIndex = finalTasks ? finalTasks.findIndex(t => t.id === activeTask.id) : -1;
      newPosition = activeTaskIndex !== -1 ? activeTaskIndex : 0;
      
      console.log('🎯 Calcul position tâche:', {
        targetTaskId: targetTask.id,
        targetTaskPosition: targetTask.position,
        finalTasksOrder: finalTasks ? finalTasks.map(t => `${t.id.slice(-4)}:${finalTasks.indexOf(t)}`).join(', ') : 'none',
        activeTaskIndex,
        newPosition,
        activeTaskId: activeTask.id,
        activeTaskOriginalPosition: savedOriginalTaskPosition
      });
    } else {
      // Type inconnu, réinitialiser
      setLocalTasksByColumn({});
      return;
    }

    // TOUJOURS effectuer la mutation si la colonne a changé, même si la position est identique
    // Pour les déplacements dans la même colonne, toujours effectuer la mutation car l'ordre a changé
    const hasColumnChanged = newColumnId !== savedOriginalColumnId;
    const hasPositionChanged = newColumnId === savedOriginalColumnId ? true : newPosition !== savedOriginalTaskPosition;

    console.log('🔍 Vérification mutation:', {
      activeTaskId: activeTask.id,
      originalColumnId: savedOriginalColumnId,
      activeTaskColumnId: activeTask.columnId,
      activeTaskPosition: activeTask.position,
      newColumnId,
      newPosition,
      hasColumnChanged,
      hasPositionChanged
    });

    if (hasColumnChanged || hasPositionChanged) {
      console.log('🚀 Mutation appelée:', {
        activeTaskId: activeTask.id,
        newColumnId,
        newPosition,
        hasColumnChanged,
        hasPositionChanged,
        originalPosition: savedOriginalTaskPosition
      });
      
      try {
        await moveTask({
          variables: {
            id: activeTask.id,
            columnId: newColumnId,
            position: newPosition,
            workspaceId: workspaceId,
          },
          // Supprimer optimistic response pour éviter les conflits
          // optimisticResponse: {
          //   moveTask: {
          //     __typename: 'Task',
          //     id: activeTask.id,
          //     columnId: newColumnId,
          //     position: newPosition,
          //     updatedAt: new Date().toISOString(),
          //   },
          // },
        });
        
        console.log('✅ Mutation réussie');
        
        // Garder les données locales mises à jour - elles sont correctes !
        // La subscription GraphQL mettra à jour le cache en arrière-plan
      } catch (error) {
        console.error('❌ Erreur mutation:', error);
        // En cas d'erreur, réinitialiser immédiatement
        setLocalTasksByColumn({});
      }
    } else {
      console.log('❌ Mutation NON appelée:', {
        activeTaskId: activeTask.id,
        newColumnId,
        newPosition,
        hasColumnChanged,
        hasPositionChanged,
        originalPosition: savedOriginalTaskPosition
      });
      
      // Pas de changement, réinitialiser immédiatement
      setLocalTasksByColumn({});
    }
  };

  // Fonction pour obtenir les tâches d'une colonne (locales ou de la base de données)
  const getLocalTasksByColumn = (columnId) => {
    // Si on a des données locales pour N'IMPORTE QUELLE colonne, on est en mode "drag actif"
    // Dans ce cas, retourner les données locales uniquement (même si vide) pour éviter les doublons
    if (Object.keys(localTasksByColumn).length > 0) {
      // Retourner les tâches locales si elles existent, sinon les tâches de la BDD
      return localTasksByColumn[columnId] !== undefined
        ? localTasksByColumn[columnId]
        : getTasksByColumn(columnId);
    }
    // Sinon, retourner les données normales de la BDD
    return getTasksByColumn(columnId);
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