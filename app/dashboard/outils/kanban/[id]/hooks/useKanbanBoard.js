import { useQuery, useSubscription } from '@apollo/client';
import { GET_BOARD, TASK_UPDATED_SUBSCRIPTION, COLUMN_UPDATED_SUBSCRIPTION } from '@/src/graphql/kanbanQueries';
import { useWorkspace } from '@/src/hooks/useWorkspace';
import { toast } from '@/src/utils/debouncedToast';

export const useKanbanBoard = (id) => {
  const { workspaceId } = useWorkspace();
  
  const { data, loading, error, refetch } = useQuery(GET_BOARD, {
    variables: { 
      id,
      workspaceId 
    },
    errorPolicy: "all",
    skip: !workspaceId,
  });

  // Subscription pour les mises à jour temps réel des tâches
  useSubscription(TASK_UPDATED_SUBSCRIPTION, {
    variables: { boardId: id, workspaceId },
    skip: !workspaceId || !id,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.taskUpdated) {
        const { type, task, taskId } = subscriptionData.data.taskUpdated;
        
        console.log("🔄 [Kanban] Mise à jour temps réel tâche:", type, task || taskId);
        
        // Mettre à jour le cache Apollo automatiquement
        refetch();
        
        // Notifications utilisateur (debouncing automatique)
        if (type === 'CREATED' && task) {
          toast.success(`Nouvelle tâche: ${task.title}`, {
            description: "Mise à jour automatique"
          });
        } else if (type === 'UPDATED' && task) {
          toast.info(`Tâche modifiée: ${task.title}`, {
            description: "Mise à jour automatique"
          });
        } else if (type === 'DELETED' && taskId) {
          toast.info("Tâche supprimée", {
            description: "Mise à jour automatique"
          });
        } else if (type === 'MOVED' && task) {
          toast.info(`Tâche déplacée: ${task.title}`, {
            description: "Mise à jour automatique"
          });
        }
      }
    },
    onError: (error) => {
      console.error("❌ [Kanban] Erreur subscription tâches:", error);
    }
  });

  // Subscription pour les mises à jour temps réel des colonnes
  useSubscription(COLUMN_UPDATED_SUBSCRIPTION, {
    variables: { boardId: id, workspaceId },
    skip: !workspaceId || !id,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.columnUpdated) {
        const { type, column, columnId } = subscriptionData.data.columnUpdated;
        
        console.log("🔄 [Kanban] Mise à jour temps réel colonne:", type, column || columnId);
        
        // Mettre à jour le cache Apollo automatiquement
        refetch();
        
        // Notifications utilisateur (debouncing automatique)
        if (type === 'CREATED' && column) {
          toast.success(`Nouvelle colonne: ${column.title}`, {
            description: "Mise à jour automatique"
          });
        } else if (type === 'UPDATED' && column) {
          toast.info(`Colonne modifiée: ${column.title}`, {
            description: "Mise à jour automatique"
          });
        } else if (type === 'DELETED' && columnId) {
          toast.info("Colonne supprimée", {
            description: "Mise à jour automatique"
          });
        } else if (type === 'REORDERED') {
          toast.info("Colonnes réorganisées", {
            description: "Mise à jour automatique"
          });
        }
      }
    },
    onError: (error) => {
      console.error("❌ [Kanban] Erreur subscription colonnes:", error);
    }
  });

  const board = data?.board;
  const columns = board?.columns || [];

  // Get tasks by column
  const getTasksByColumn = (columnId) => {
    if (!board?.tasks) return [];
    return board.tasks
      .filter((task) => task.columnId === columnId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  };

  return {
    board,
    columns,
    loading,
    error,
    refetch,
    getTasksByColumn,
    workspaceId,
  };
};
