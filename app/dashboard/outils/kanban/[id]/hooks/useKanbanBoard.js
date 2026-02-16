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
  
  // Polling désactivé - Les subscriptions WebSocket temps réel sont suffisantes
  // Le polling causait des conflits et des re-renders inutiles
  // useEffect(() => {
  //   if (data?.board && !isRedirecting) {
  //     console.log('🔄 [Polling] Démarrage du polling (5s)');
  //     startPolling(5000);
  //     return () => {
  //       console.log('⏹️ [Polling] Arrêt du polling');
  //       stopPolling();
  //     };
  //   }
  // }, [data?.board?.id, isRedirecting, startPolling, stopPolling]);

  // Subscription pour les mises à jour temps réel des tâches
  useSubscription(TASK_UPDATED_SUBSCRIPTION, {
    variables: { boardId: id, workspaceId },
    skip: !workspaceId || !id || !isReady || sessionLoading || isRedirecting,
    onData: ({ data: subscriptionData }) => {
      console.log('📡 [Subscription] Données reçues:', subscriptionData?.data?.taskUpdated?.type, 'visitor:', subscriptionData?.data?.taskUpdated?.visitor);
      if (subscriptionData?.data?.taskUpdated) {
        const { type, task, taskId, visitor } = subscriptionData.data.taskUpdated;
        
        // Traiter immédiatement les mises à jour de profil visiteur
        if (type === 'VISITOR_PROFILE_UPDATED' && visitor) {
          console.log('👤 [Subscription] Mise à jour profil visiteur détectée:', visitor.email, visitor.name);
          // Refetch pour récupérer les données mises à jour depuis le serveur
          // Les commentaires sont déjà mis à jour en base de données par le backend
          refetch().then(() => {
            console.log("✅ [Subscription] Board rechargé avec le nouveau profil visiteur:", visitor.name);
          }).catch(error => {
            console.error("❌ [Subscription] Erreur refetch après mise à jour profil visiteur:", error);
          });
          return; // Sortir après traitement
        }
        
        
        // Pour les créations, mettre à jour le cache Apollo manuellement
        if (type === 'CREATED' && task) {
          try {
            const cacheData = apolloClient.cache.readQuery({
              query: GET_BOARD,
              variables: { id, workspaceId }
            });
            
            console.log("📝 [Subscription] Création tâche - Cache data:", cacheData?.board?.tasks?.length, "tâches");
            
            if (cacheData?.board) {
              // Vérifier que la tâche n'existe pas déjà (ajoutée par la mutation update)
              const taskExists = (cacheData.board.tasks || []).some(
                (t) => t.id === task.id
              );
              if (taskExists) {
                console.log("ℹ️ [Subscription] Tâche déjà dans le cache, skip:", task.title);
              } else {
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
              }
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
        
        // Pour les déplacements, mettre à jour le cache Apollo directement
        if (type === 'MOVED' && task) {
          try {
            const cacheData = apolloClient.cache.readQuery({
              query: GET_BOARD,
              variables: { id, workspaceId }
            });
            
            if (cacheData?.board) {
              // Mettre à jour la tâche dans le cache avec ses nouvelles position et colonne
              const updatedTasks = cacheData.board.tasks.map(t => 
                t.id === task.id ? { ...t, ...task } : t
              ).sort((a, b) => {
                // Trier par colonne puis position
                if (a.columnId !== b.columnId) return 0;
                return (a.position || 0) - (b.position || 0);
              });
              
              console.log("✅ [Subscription] Tâche déplacée - Mise à jour cache:", task.title, "→ position", task.position);
              
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
            }
          } catch (error) {
            console.error("❌ [Subscription] Erreur mise à jour cache MOVED:", error);
          }
        }
        
        // Pour les mises à jour (UPDATED, COMMENT_ADDED, COMMENT_UPDATED, TIMER_STARTED, TIMER_STOPPED), mettre à jour le cache Apollo
        if ((type === 'UPDATED' || type === 'COMMENT_ADDED' || type === 'COMMENT_UPDATED' || type === 'TIMER_STARTED' || type === 'TIMER_STOPPED') && task) {
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
              
              if (type === 'TIMER_STARTED') {
                console.log("✅ [Subscription] Timer démarré dans le cache:", task.title);
              } else if (type === 'TIMER_STOPPED') {
                console.log("✅ [Subscription] Timer arrêté dans le cache:", task.title);
              } else {
                console.log("✅ [Subscription] Tâche mise à jour dans le cache:", task.title);
              }
            }
          } catch (error) {
            console.error("❌ [Subscription] Erreur mise à jour cache (UPDATED/TIMER):", error);
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
        
        // Gestion des événements colonnes
        try {
          const cacheData = apolloClient.cache.readQuery({
            query: GET_BOARD,
            variables: { id, workspaceId }
          });
          
          if (!cacheData?.board) return;
          
          // CREATED - Ajouter la nouvelle colonne
          if (type === 'CREATED' && column) {
            console.log("✅ [Kanban] Colonne créée - Ajout au cache:", column.title);
            
            // Vérifier si la colonne n'existe pas déjà
            const columnExists = cacheData.board.columns.some(c => c.id === column.id);
            if (!columnExists) {
              apolloClient.cache.writeQuery({
                query: GET_BOARD,
                variables: { id, workspaceId },
                data: {
                  board: {
                    ...cacheData.board,
                    columns: [...cacheData.board.columns, column].sort((a, b) => a.order - b.order)
                  }
                }
              });
            }
          }
          
          // UPDATED - Mettre à jour la colonne existante
          else if (type === 'UPDATED' && column) {
            console.log("✅ [Kanban] Colonne mise à jour - Mise à jour cache:", column.title);
            
            apolloClient.cache.writeQuery({
              query: GET_BOARD,
              variables: { id, workspaceId },
              data: {
                board: {
                  ...cacheData.board,
                  columns: cacheData.board.columns.map(c => 
                    c.id === column.id ? { ...c, ...column } : c
                  )
                }
              }
            });
          }
          
          // DELETED - Supprimer la colonne
          else if (type === 'DELETED' && columnId) {
            console.log("✅ [Kanban] Colonne supprimée - Suppression du cache:", columnId);
            
            apolloClient.cache.writeQuery({
              query: GET_BOARD,
              variables: { id, workspaceId },
              data: {
                board: {
                  ...cacheData.board,
                  columns: cacheData.board.columns.filter(c => c.id !== columnId)
                }
              }
            });
          }
          
          // REORDERED - Réorganiser les colonnes
          else if (type === 'REORDERED' && subscriptionData.data.columnUpdated.columns) {
            console.log("🔄 [Kanban] Colonnes réorganisées - Mise à jour du cache");
            
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

  return {
    board,
    columns,
    loading,
    error,
    refetch,
    getTasksByColumn,
    workspaceId,
    markReorderAction,
  };
};
