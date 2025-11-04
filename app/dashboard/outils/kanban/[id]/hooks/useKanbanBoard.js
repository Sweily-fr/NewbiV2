import { useQuery, useSubscription, useApolloClient } from '@apollo/client';
import { useSession } from '@/src/lib/auth-client';
import { GET_BOARD, TASK_UPDATED_SUBSCRIPTION, COLUMN_UPDATED_SUBSCRIPTION } from '@/src/graphql/kanbanQueries';
import { useWorkspace } from '@/src/hooks/useWorkspace';
import { toast } from '@/src/utils/debouncedToast';
import { useState, useEffect, useRef } from 'react';

export const useKanbanBoard = (id, isRedirecting = false) => {
  const { workspaceId } = useWorkspace();
  const { data: session, isPending: sessionLoading } = useSession();
  const [isReady, setIsReady] = useState(false);
  const apolloClient = useApolloClient();
  const lastReorderTimeRef = useRef(0);
  const lastMoveTaskTimeRef = useRef(0); // Pour ignorer les événements MOVED après un drag
  const pendingRefetchRef = useRef(null); // Pour éviter les refetch multiples
  
  
  // Attendre que la session soit chargée avant d'activer les subscriptions
  useEffect(() => {
    if (!sessionLoading && session?.user) {
      setIsReady(true);
    }
  }, [sessionLoading, session]);
  
  const { data, loading, error, refetch, startPolling, stopPolling } = useQuery(GET_BOARD, {
    variables: { 
      id,
      workspaceId 
    },
    errorPolicy: "all",
    skip: !workspaceId || isRedirecting,
    // IMPORTANT: Utiliser cache-and-network pour avoir les données en cache
    // tout en récupérant les dernières données du serveur
    fetchPolicy: "cache-and-network",
    // IMPORTANT: Ne pas notifier sur les changements de statut réseau du polling
    // Cela évite le clignotement quand le polling récupère les données
    notifyOnNetworkStatusChange: false,
    context: {
      // Ne pas afficher de toast d'erreur si on est en train de rediriger
      skipErrorToast: isRedirecting,
    },
  });
  
  // FALLBACK sans Redis : polling toutes les 5 secondes pour synchroniser entre utilisateurs
  // Démarre automatiquement le polling quand le board est chargé
  useEffect(() => {
    if (data?.board && !isRedirecting) {
      console.log('🔄 [Polling] Démarrage du polling (5s)');
      startPolling(5000);
      return () => {
        console.log('⏹️ [Polling] Arrêt du polling');
        stopPolling();
      };
    }
  }, [data?.board?.id, isRedirecting]);

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
            
            console.log("📝 [Subscription] Création tâche - Cache data:", cacheData?.board?.tasks?.length, "tâches");
            
            if (cacheData?.board) {
              const newTasks = [...(cacheData.board.tasks || []), task];
              console.log("✅ [Subscription] Ajout tâche au cache:", task.title, "- Total:", newTasks.length);
              
              apolloClient.cache.writeQuery({
                query: GET_BOARD,
                variables: { id, workspaceId },
                data: {
                  board: {
                    ...cacheData.board,
                    tasks: newTasks
                  }
                }
              });
            } else {
              console.warn("⚠️ [Subscription] Cache board non trouvé pour id:", id, "workspaceId:", workspaceId);
            }
          } catch (error) {
            console.error("❌ [Subscription] Erreur mise à jour cache:", error);
          }
        }
        
        // Pour les suppressions, mettre à jour le cache Apollo manuellement
        if (type === 'DELETED' && taskId) {
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
                    tasks: (cacheData.board.tasks || []).filter(t => t.id !== taskId)
                  }
                }
              });
            }
          } catch {
            // Erreur silencieuse - continuer
          }
        }
        
        // Pour les déplacements, IGNORER les événements MOVED pendant et après un drag
        // Le backend envoie PLUSIEURS événements MOVED (un pour chaque tâche réorganisée)
        // Cela cause des mises à jour partielles et des incohérences
        if (type === 'MOVED' && task) {
          const timeSinceLastMove = Date.now() - lastMoveTaskTimeRef.current;
          
          // Ignorer les événements MOVED pendant 2 secondes après un drag
          if (lastMoveTaskTimeRef.current > 0 && timeSinceLastMove < 2000) {
            console.log('⛔ [Subscription] Événement MOVED ignoré (drag récent):', task.title, 'temps écoulé:', timeSinceLastMove + 'ms');
            return;
          }
          
          // Si c'est un événement MOVED externe (pas de notre drag)
          // Planifier UN SEUL refetch même si plusieurs événements arrivent
          if (!pendingRefetchRef.current) {
            console.log('🔄 [Subscription] Événement MOVED externe détecté:', task.title, '- planification refetch...');
            pendingRefetchRef.current = setTimeout(() => {
              console.log('🔄 [Subscription] Exécution refetch pour événements MOVED externes');
              refetch();
              pendingRefetchRef.current = null;
            }, 200); // Réduit de 500ms à 200ms pour une réactivité plus rapide
          } else {
            console.log('📦 [Subscription] Événement MOVED en attente de refetch:', task.title);
          }
          return;
        }
        
        // Pour les mises à jour (UPDATED), mettre à jour le cache Apollo
        if (type === 'UPDATED' && task) {
          try {
            const cacheData = apolloClient.cache.readQuery({
              query: GET_BOARD,
              variables: { id, workspaceId }
            });
            
            if (cacheData?.board) {
              const updatedTasks = (cacheData.board.tasks || []).map(t => 
                t.id === task.id ? task : t
              );
              
              apolloClient.cache.writeQuery({
                query: GET_BOARD,
                variables: { id, workspaceId },
                data: {
                  board: {
                    ...cacheData.board,
                    tasks: updatedTasks
                  }
                }
              });
              
              console.log("✅ [Subscription] Tâche mise à jour dans le cache:", task.title);
            }
          } catch (error) {
            console.error("❌ [Subscription] Erreur mise à jour cache (UPDATED):", error);
          }
        }
        
        // Notifications utilisateur (debouncing automatique)
        if (type === 'CREATED' && task) {
          toast.success(`Nouvelle tâche: ${task.title}`, {
            description: "Mise à jour automatique"
          });
        } else if (type === 'DELETED' && taskId) {
          toast.info("Tâche supprimée", {
            description: "Mise à jour automatique"
          });
        } else if (type === 'MOVED' && task) {
          // Pas de toast pour les déplacements - trop de bruit
          // L'utilisateur voit déjà le changement en temps réel
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
        
        // Pour les REORDERED, mettre à jour le cache Apollo avec le nouvel ordre
        if (type === 'REORDERED' && subscriptionData.data.columnUpdated.columns) {
          console.log("🔄 [Kanban] Colonnes réorganisées - Mise à jour du cache");
          
          try {
            const cacheData = apolloClient.cache.readQuery({
              query: GET_BOARD,
              variables: { id, workspaceId }
            });
            
            if (cacheData?.board) {
              const newColumnIds = subscriptionData.data.columnUpdated.columns;
              
              // Réorganiser les colonnes selon le nouvel ordre
              const reorderedColumns = newColumnIds.map(columnId => 
                cacheData.board.columns.find(col => col.id === columnId)
              ).filter(Boolean); // Filtrer les colonnes non trouvées
              
              console.log("✅ [Kanban] Nouvel ordre des colonnes:", reorderedColumns.map(c => c.title));
              
              apolloClient.cache.writeQuery({
                query: GET_BOARD,
                variables: { id, workspaceId },
                data: {
                  board: {
                    ...cacheData.board,
                    columns: reorderedColumns
                  }
                }
              });
            }
          } catch (error) {
            console.error("❌ [Kanban] Erreur mise à jour cache colonnes:", error);
          }
        }
        
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

  const markReorderAction = () => {
    lastReorderTimeRef.current = Date.now();
  };
  
  const markMoveTaskAction = () => {
    lastMoveTaskTimeRef.current = Date.now();
    console.log('🕒 [Kanban] Marquage action moveTask - ignorer MOVED pendant 2s');
    
    // Annuler tout refetch en attente (au cas où des événements seraient arrivés avant)
    if (pendingRefetchRef.current) {
      clearTimeout(pendingRefetchRef.current);
      pendingRefetchRef.current = null;
      console.log('❌ [Kanban] Refetch en attente annulé');
    }
  };

  return {
    board,
    columns,
    loading,
    error,
    refetch,
    getTasksByColumn,
    workspaceId,
    markReorderAction,
    markMoveTaskAction, // Exposer pour useKanbanDnD
    stopPolling, // Exposer pour désactiver le polling pendant le drag
    startPolling, // Exposer pour réactiver le polling après le drag
  };
};
