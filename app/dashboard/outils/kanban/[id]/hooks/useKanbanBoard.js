import { useQuery, useSubscription, useApolloClient } from '@apollo/client';
import { useSession } from '@/src/lib/auth-client';
import { GET_BOARD, TASK_UPDATED_SUBSCRIPTION, COLUMN_UPDATED_SUBSCRIPTION } from '@/src/graphql/kanbanQueries';
import { useWorkspace } from '@/src/hooks/useWorkspace';
import { toast } from '@/src/utils/debouncedToast';
import { useState, useEffect } from 'react';

export const useKanbanBoard = (id, isRedirecting = false) => {
  const { workspaceId } = useWorkspace();
  const { data: session, isPending: sessionLoading } = useSession();
  const [isReady, setIsReady] = useState(false);
  const apolloClient = useApolloClient();
  
  
  // Attendre que la session soit chargée avant d'activer les subscriptions
  useEffect(() => {
    if (!sessionLoading && session?.user) {
      setIsReady(true);
    }
  }, [sessionLoading, session]);
  
  const { data, loading, error, refetch } = useQuery(GET_BOARD, {
    variables: { 
      id,
      workspaceId 
    },
    errorPolicy: "all",
    skip: !workspaceId || isRedirecting,
    context: {
      // Ne pas afficher de toast d'erreur si on est en train de rediriger
      skipErrorToast: isRedirecting,
    },
  });

  // Subscription pour les mises à jour temps réel des tâches
  useSubscription(TASK_UPDATED_SUBSCRIPTION, {
    variables: { boardId: id, workspaceId },
    skip: !workspaceId || !id || !isReady || sessionLoading || isRedirecting,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.taskUpdated) {
        const { type, task, taskId } = subscriptionData.data.taskUpdated;
        
        
        // Pour les créations, mettre à jour le cache Apollo manuellement
        if (type === 'CREATED' && task) {
          try {
            const cacheData = apolloClient.cache.readQuery({
              query: GET_BOARD,
              variables: { id, workspaceId }
            });
            
            if (cacheData?.board) {
              apolloClient.cache.writeQuery({
                query: GET_BOARD,
                variables: { id, workspaceId },
                data: {
                  board: {
                    ...cacheData.board,
                    tasks: [...(cacheData.board.tasks || []), task]
                  }
                }
              });
            }
          } catch {
            // Erreur silencieuse - continuer
          }
        }
        
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
      // Ne pas afficher d'erreur si c'est un problème d'authentification (changement d'organisation)
      if (error.message?.includes('connecté')) {
        // Silencieux - c'est normal pendant un changement d'organisation
        return;
      }
      console.error("❌ [Kanban] Erreur subscription tâches:", error);
    }
  });

  // Subscription pour les mises à jour temps réel des colonnes
  useSubscription(COLUMN_UPDATED_SUBSCRIPTION, {
    variables: { boardId: id, workspaceId },
    skip: !workspaceId || !id || !isReady || sessionLoading || isRedirecting,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.columnUpdated) {
        const { type, column, columnId } = subscriptionData.data.columnUpdated;
        
        console.log("🔄 [Kanban] Mise à jour temps réel colonne:", type, column || columnId);
        
        // Ne pas faire de refetch complet - juste mettre à jour le cache Apollo
        // Cela évite de recharger toutes les colonnes et de remettre "à l'instant" partout
        // La subscription elle-même met à jour le cache avec les données reçues
        
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
      // Ne pas afficher d'erreur si c'est un problème d'authentification (changement d'organisation)
      if (error.message?.includes('connecté')) {
        // Silencieux - c'est normal pendant un changement d'organisation
        return;
      }
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
