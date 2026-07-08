import { useQuery, useSubscription, useApolloClient } from "@apollo/client";
import { useSession } from "@/src/lib/auth-client";
import {
  GET_BOARD,
  TASK_UPDATED_SUBSCRIPTION,
  COLUMN_UPDATED_SUBSCRIPTION,
} from "@/src/graphql/kanbanQueries";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { toast } from "@/src/utils/debouncedToast";
import { forceWsReconnect } from "@/src/lib/apolloClient";
import { useRef, useCallback, useState, useEffect } from "react";

// Logs de debug gated par localStorage('kanban-debug' === '1'). Désactivés
// par défaut pour ne pas alourdir le 'message handler' en prod.
const __klog =
  typeof window === "undefined"
    ? () => {}
    : (...args) => {
        try {
          if (window.localStorage?.getItem("kanban-debug") === "1") {
            console.log(...args);
          }
        } catch {}
      };

export const useKanbanBoard = (id, isRedirecting = false) => {
  const { workspaceId } = useWorkspace();
  const { data: session, isPending: sessionLoading } = useSession();
  const apolloClient = useApolloClient();
  const lastReorderTimeRef = useRef(0);

  // Vérifier directement si la session est prête (sans état intermédiaire)
  const isSessionReady = !sessionLoading && !!session?.user;

  // ── Redémarrage des subscriptions après erreur ─────────────────────────
  // Une erreur reçue par useSubscription TERMINE l'observable Apollo : même
  // si le WebSocket est réparé ensuite (forceWsReconnect), le transport
  // rejoue l'opération et les trames ARRIVENT au navigateur… mais tombent
  // dans un observable mort et sont jetées — plus aucun événement traité
  // jusqu'au refresh de la page. On force donc un vrai ré-abonnement en
  // basculant `skip` (démonte puis remonte les subscriptions), avec backoff
  // exponentiel pour ne pas marteler le serveur si l'erreur persiste.
  const [wsRestartPause, setWsRestartPause] = useState(false);
  const wsRestartAttemptsRef = useRef(0);
  const wsRestartTimerRef = useRef(null);
  const restartSubscriptions = useCallback(() => {
    forceWsReconnect();
    if (wsRestartTimerRef.current) return;
    const delay = Math.min(30000, 1500 * 2 ** wsRestartAttemptsRef.current);
    console.warn(
      `[WebSocket] Ré-abonnement des subscriptions kanban dans ${delay}ms`,
    );
    wsRestartAttemptsRef.current += 1;
    setWsRestartPause(true);
    wsRestartTimerRef.current = setTimeout(() => {
      wsRestartTimerRef.current = null;
      setWsRestartPause(false);
    }, delay);
  }, []);
  useEffect(
    () => () => {
      if (wsRestartTimerRef.current) clearTimeout(wsRestartTimerRef.current);
    },
    [],
  );

  const { data, loading, error, refetch } = useQuery(GET_BOARD, {
    variables: {
      id,
      workspaceId,
    },
    errorPolicy: "all",
    skip: !workspaceId || isRedirecting,
    // 1er mount : cache + refresh réseau en background.
    // Re-mount / navigation : cache only (les subscriptions gardent le cache
    // frais en temps réel, pas besoin de re-fetch tout le board).
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: false,
    context: {
      skipErrorToast: isRedirecting,
    },
  });

  // ─────────────────────────────────────────────────────────────────────
  // Batching des events de subscription
  //
  // Problème avant batching : chaque event WebSocket déclenchait un
  // cache.writeQuery individuel, qui re-render tous les abonnés Apollo
  // → 5 events en 100ms = 5 re-renders complets du board = 500ms+ de
  // main thread bloqué (cf 'message handler took 704ms' observé en prod).
  //
  // Solution : on bufferise les events et on flushe en UN SEUL writeQuery
  // par frame (requestAnimationFrame). Multi-event en rafale → 1 render.
  // ─────────────────────────────────────────────────────────────────────
  const pendingTaskEventsRef = useRef([]);
  const pendingColumnEventsRef = useRef([]);
  const pendingColumnReorderRef = useRef(null);
  const flushScheduledRef = useRef(false);

  const flushPendingEvents = useCallback(() => {
    flushScheduledRef.current = false;
    const taskEvents = pendingTaskEventsRef.current;
    const columnEvents = pendingColumnEventsRef.current;
    const columnReorder = pendingColumnReorderRef.current;
    pendingTaskEventsRef.current = [];
    pendingColumnEventsRef.current = [];
    pendingColumnReorderRef.current = null;

    if (
      taskEvents.length === 0 &&
      columnEvents.length === 0 &&
      !columnReorder
    ) {
      return;
    }

    try {
      const cacheData = apolloClient.cache.readQuery({
        query: GET_BOARD,
        variables: { id, workspaceId },
      });
      if (!cacheData?.board) return;

      let tasks = cacheData.board.tasks || [];
      let columns = cacheData.board.columns || [];
      let mutated = false;

      // ── Apply task events in order ──
      for (const ev of taskEvents) {
        const { type, task, taskId } = ev;

        if (type === "CREATED" && task) {
          if (!tasks.some((t) => t.id === task.id)) {
            // Décale la position des tâches existantes dans la même colonne
            tasks = tasks.map((t) => {
              if (
                t.columnId === task.columnId &&
                t.position !== undefined &&
                t.position >= (task.position ?? 0)
              ) {
                return { ...t, position: t.position + 1 };
              }
              return t;
            });
            tasks = [task, ...tasks];
            mutated = true;
          }
        } else if (type === "DELETED" && taskId) {
          const before = tasks.length;
          tasks = tasks.filter((t) => t.id !== taskId);
          if (tasks.length !== before) mutated = true;
        } else if (type === "MOVED" && task) {
          let didChange = false;
          tasks = tasks.map((t) => {
            if (t.id !== task.id) return t;
            const cachedTime = t.updatedAt
              ? new Date(t.updatedAt).getTime()
              : 0;
            const incomingTime = task.updatedAt
              ? new Date(task.updatedAt).getTime()
              : 0;
            if (incomingTime < cachedTime) return t;
            didChange = true;
            return { ...t, ...task };
          });
          if (didChange) {
            tasks = [...tasks].sort((a, b) => {
              if (a.columnId !== b.columnId) return 0;
              return (a.position || 0) - (b.position || 0);
            });
            mutated = true;
          }
        } else if (
          (type === "UPDATED" ||
            type === "COMMENT_ADDED" ||
            type === "COMMENT_UPDATED" ||
            type === "TIMER_STARTED" ||
            type === "TIMER_STOPPED" ||
            type === "MANUAL_TIME_ADDED") &&
          task
        ) {
          let didChange = false;
          tasks = tasks.map((t) => {
            if (t.id !== task.id) return t;
            const cachedTime = t.updatedAt
              ? new Date(t.updatedAt).getTime()
              : 0;
            const incomingTime = task.updatedAt
              ? new Date(task.updatedAt).getTime()
              : 0;
            if (incomingTime < cachedTime) return t;
            didChange = true;
            return task;
          });
          if (didChange) mutated = true;
        }
      }

      // ── Apply column events in order ──
      for (const ev of columnEvents) {
        const { type, column, columnId } = ev;
        if (type === "CREATED" && column) {
          if (!columns.some((c) => c.id === column.id)) {
            columns = [...columns, column].sort(
              (a, b) => (a.order ?? 0) - (b.order ?? 0),
            );
            mutated = true;
          }
        } else if (type === "UPDATED" && column) {
          columns = columns.map((c) =>
            c.id === column.id ? { ...c, ...column } : c,
          );
          mutated = true;
        } else if (type === "DELETED" && columnId) {
          columns = columns.filter((c) => c.id !== columnId);
          mutated = true;
        }
      }

      // ── REORDERED en dernier (override l'ordre actuel) ──
      if (columnReorder) {
        const reordered = columnReorder
          .map((cid) => columns.find((col) => col.id === cid))
          .filter(Boolean);
        if (reordered.length === columns.length) {
          columns = reordered;
          mutated = true;
        }
      }

      if (!mutated) return;

      apolloClient.cache.writeQuery({
        query: GET_BOARD,
        variables: { id, workspaceId },
        data: {
          board: {
            ...cacheData.board,
            tasks,
            columns,
          },
        },
      });
    } catch (error) {
      console.error("[Kanban] Erreur flush batch subscription:", error);
    }
  }, [apolloClient, id, workspaceId]);

  const scheduleFlush = useCallback(() => {
    if (flushScheduledRef.current) return;
    flushScheduledRef.current = true;
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(flushPendingEvents);
    } else {
      setTimeout(flushPendingEvents, 16);
    }
  }, [flushPendingEvents]);

  // Subscription pour les mises à jour temps réel des tâches
  useSubscription(TASK_UPDATED_SUBSCRIPTION, {
    variables: { boardId: id, workspaceId },
    skip: !workspaceId || !id || !isSessionReady || isRedirecting || wsRestartPause,
    onData: ({ data: subscriptionData }) => {
      const event = subscriptionData?.data?.taskUpdated;
      if (!event) return;
      // Événement reçu = subscription saine → réarmer le backoff
      wsRestartAttemptsRef.current = 0;
      const { type, task, taskId, visitor } = event;
      __klog("📡 [Subscription] Données reçues:", type);

      // VISITOR_PROFILE_UPDATED : refetch immédiat (rare, cas spécial)
      if (type === "VISITOR_PROFILE_UPDATED" && visitor) {
        refetch().catch((err) => {
          console.error("[Kanban] Erreur refetch profil visiteur:", err);
        });
        return;
      }

      // Toasts immédiats (debouncés en interne)
      if (type === "CREATED" && task) {
        toast.success(`Nouvelle tâche: ${task.title}`, {
          description: "Mise à jour automatique",
        });
      } else if (type === "DELETED" && taskId) {
        toast.info("Tâche supprimée", {
          description: "Mise à jour automatique",
        });
      }

      // Bufferise l'event pour application batch
      pendingTaskEventsRef.current.push(event);
      scheduleFlush();
    },
    onError: (error) => {
      if (!error.message?.includes("connecté")) {
        console.error("❌ [Kanban] Erreur subscription tâches:", error);
      }
      // Toute erreur TERMINE l'observable : reconnexion du transport ET
      // ré-abonnement Apollo, sinon la subscription reste sourde à vie.
      restartSubscriptions();
    },
  });

  // Subscription pour les mises à jour temps réel des colonnes
  useSubscription(COLUMN_UPDATED_SUBSCRIPTION, {
    variables: { boardId: id, workspaceId },
    skip: !workspaceId || !id || !isSessionReady || isRedirecting || wsRestartPause,
    onData: ({ data: subscriptionData }) => {
      const event = subscriptionData?.data?.columnUpdated;
      if (!event) return;
      const { type, column, columnId, columns } = event;
      __klog("🔄 [Kanban] Mise à jour colonne:", type);

      // Toasts immédiats
      if (type === "CREATED" && column) {
        toast.success(`Nouvelle colonne: ${column.title}`, {
          description: "Mise à jour automatique",
        });
      } else if (type === "UPDATED" && column) {
        toast.info(`Colonne modifiée: ${column.title}`, {
          description: "Mise à jour automatique",
        });
      } else if (type === "DELETED" && columnId) {
        toast.info("Colonne supprimée", {
          description: "Mise à jour automatique",
        });
      } else if (type === "REORDERED") {
        toast.info("Colonnes réorganisées", {
          description: "Mise à jour automatique",
        });
      }

      if (type === "REORDERED" && columns) {
        // Override l'ordre uniquement avec le dernier REORDERED reçu
        pendingColumnReorderRef.current = columns;
      } else {
        pendingColumnEventsRef.current.push(event);
      }
      scheduleFlush();
    },
    onError: (error) => {
      if (!error.message?.includes("connecté")) {
        console.error("❌ [Kanban] Erreur subscription colonnes:", error);
      }
      restartSubscriptions();
    },
  });

  const board = data?.board;
  const columns = board?.columns || [];

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
