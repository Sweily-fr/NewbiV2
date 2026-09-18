import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import { useSession } from "@/src/lib/auth-client";
import { onWsReconnected } from "@/src/lib/apolloClient";
import {
  GET_TASK_PRESENCE,
  SET_TASK_PRESENCE,
  TASK_PRESENCE_SUBSCRIPTION,
} from "@/src/graphql/kanbanQueries";

// Doit rester bien inférieur à STALE_MS côté API (120 s) : au-delà, la
// présence est purgée comme un onglet fermé sans prévenir. Chrome ralentit
// les minuteurs d'un onglet caché à 1/min, d'où la marge.
const HEARTBEAT_MS = 30 * 1000;
// Relecture périodique de l'état : purge les onglets expirés côté serveur
// (diffusée à tous) et resynchronise après une coupure silencieuse.
const REFRESH_MS = 30 * 1000;

// Identifiant de cet onglet : un utilisateur peut avoir le même tableau
// ouvert plusieurs fois, chaque onglet annonce sa propre présence.
const newClientId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
// Après une erreur de subscription, délai avant de se réabonner.
const RESUBSCRIBE_DELAY_MS = 5 * 1000;

const EMPTY = Object.freeze([]);
const noopSubscribe = () => () => {};

/**
 * Store minimal « qui est sur quelle tâche », lu par chaque TaskCard via
 * useSyncExternalStore avec un sélecteur par tâche. Les tableaux par tâche
 * gardent leur référence tant que leur contenu ne change pas : seules les
 * cartes réellement concernées par une arrivée/départ re-rendent, pas les
 * 300 cartes du tableau (cf. contraintes perf de KanbanColumnSimple).
 */
function createPresenceStore() {
  let byTask = new Map();
  const listeners = new Set();

  const sameViewers = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (
        a[i].userId !== b[i].userId ||
        a[i].name !== b[i].name ||
        a[i].image !== b[i].image
      ) {
        return false;
      }
    }
    return true;
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    get(taskId) {
      return byTask.get(taskId) || EMPTY;
    },
    // Remplace l'état complet (le serveur diffuse toujours un instantané).
    setViewers(viewers, excludedUserId) {
      const grouped = new Map();
      for (const v of viewers || []) {
        if (!v?.taskId || !v?.userId) continue;
        if (excludedUserId && String(v.userId) === String(excludedUserId)) {
          continue;
        }
        const list = grouped.get(v.taskId) || [];
        list.push(v);
        grouped.set(v.taskId, list);
      }
      const next = new Map();
      let changed = grouped.size !== byTask.size;
      for (const [taskId, list] of grouped) {
        list.sort((a, b) => (a.since || "").localeCompare(b.since || ""));
        const prev = byTask.get(taskId);
        if (prev && sameViewers(prev, list)) {
          next.set(taskId, prev);
        } else {
          next.set(taskId, list);
          changed = true;
        }
      }
      byTask = next;
      if (changed) listeners.forEach((l) => l());
    },
  };
}

export const TaskPresenceContext = createContext(null);

/**
 * Hook monté une fois par tableau : charge l'état initial, suit les mises à
 * jour temps réel et annonce la tâche actuellement ouverte par l'utilisateur
 * (battement de cœur tant qu'elle reste ouverte, retrait à la fermeture).
 *
 * @param {object} p
 * @param {string} p.boardId
 * @param {string} p.workspaceId
 * @param {string|null} p.currentTaskId - tâche ouverte dans la modale, null sinon
 * @param {boolean} p.enabled
 * @returns store à fournir via TaskPresenceContext
 */
export function useTaskPresence({
  boardId,
  workspaceId,
  currentTaskId,
  enabled = true,
}) {
  const { data: session } = useSession();
  const meId = session?.user?.id ? String(session.user.id) : null;
  const store = useMemo(createPresenceStore, [boardId]);
  const [resubscribeKey, setResubscribeKey] = useState(0);
  const [resubscribePause, setResubscribePause] = useState(false);
  const resubscribeTimerRef = useRef(null);

  const active = enabled && !!boardId && !!workspaceId && !!meId;

  const clientIdRef = useRef(null);
  if (!clientIdRef.current) clientIdRef.current = newClientId();
  const clientId = clientIdRef.current;

  // État initial + relecture toutes les REFRESH_MS. Le résultat est appliqué
  // via un effet sur `data` (onCompleted est déprécié en Apollo 3.14).
  const { data: presenceData, refetch } = useQuery(GET_TASK_PRESENCE, {
    variables: { boardId, workspaceId },
    skip: !active,
    fetchPolicy: "network-only",
    nextFetchPolicy: "network-only",
    pollInterval: REFRESH_MS,
    notifyOnNetworkStatusChange: false,
    context: { skipErrorToast: true },
  });
  useEffect(() => {
    if (presenceData?.taskPresence) {
      store.setViewers(presenceData.taskPresence, meId);
    }
  }, [presenceData, store, meId]);

  useSubscription(TASK_PRESENCE_SUBSCRIPTION, {
    variables: { boardId, workspaceId, clientId },
    skip: !active || resubscribePause,
    onData: ({ data }) => {
      const payload = data?.data?.taskPresence;
      if (!payload) return;
      store.setViewers(payload.viewers, meId);
    },
    onError: (error) => {
      if (!error.message?.includes("connecté")) {
        console.error("[Kanban] Erreur subscription présence:", error);
      }
      // Une erreur termine l'observable Apollo : on se réabonne après une
      // pause (même mécanique que useKanbanBoard, en plus simple).
      if (resubscribeTimerRef.current) return;
      setResubscribePause(true);
      resubscribeTimerRef.current = setTimeout(() => {
        resubscribeTimerRef.current = null;
        setResubscribePause(false);
        setResubscribeKey((k) => k + 1);
      }, RESUBSCRIBE_DELAY_MS);
    },
  });
  useEffect(
    () => () => {
      if (resubscribeTimerRef.current)
        clearTimeout(resubscribeTimerRef.current);
    },
    [],
  );

  const [setTaskPresenceMutation] = useMutation(SET_TASK_PRESENCE, {
    context: { skipErrorToast: true },
  });

  // Envois sérialisés : « je quitte t1 » puis « j'ouvre t2 » partent en
  // parallèle en HTTP et pourraient arriver dans le désordre côté serveur.
  const queueRef = useRef(Promise.resolve());
  const lastSentRef = useRef(null);
  const send = useCallback(
    (taskId) => {
      queueRef.current = queueRef.current
        .then(() =>
          setTaskPresenceMutation({
            variables: {
              boardId,
              taskId: taskId || null,
              clientId,
              workspaceId,
            },
          }),
        )
        .then(() => {
          lastSentRef.current = taskId || null;
        })
        .catch(() => {
          // Silencieux : la présence est un confort, jamais bloquante
        });
    },
    [setTaskPresenceMutation, boardId, clientId, workspaceId],
  );

  // Tâche annoncée en ce moment, lue par le handler de reconnexion sans
  // dépendre du cycle de rendu.
  const currentTaskIdRef = useRef(null);
  currentTaskIdRef.current = active ? currentTaskId || null : null;

  useEffect(() => {
    if (!active) return undefined;
    const taskId = currentTaskId || null;
    // Rien à retirer si on n'a jamais rien annoncé (premier montage sans modale)
    if (!taskId && lastSentRef.current === null) return undefined;
    send(taskId);
    if (!taskId) return undefined;
    const interval = setInterval(() => send(taskId), HEARTBEAT_MS);
    return () => clearInterval(interval);
    // resubscribeKey : après un réabonnement, le serveur a pu retirer notre
    // présence à la fermeture de l'ancienne subscription → on se ré-annonce.
  }, [active, currentTaskId, send, resubscribeKey]);

  // Reconnexion du WebSocket (coupure, changement de réseau, redéploiement) :
  // le serveur retire la présence de l'onglet déconnecté après un court délai
  // de grâce. On se ré-annonce tout de suite pour rester dans ce délai, et on
  // relit l'état pour rattraper ce qu'on a manqué pendant la coupure.
  useEffect(() => {
    if (!active) return undefined;
    return onWsReconnected(() => {
      if (currentTaskIdRef.current) send(currentTaskIdRef.current);
      refetch().catch(() => {});
    });
  }, [active, send, refetch]);

  // Quitter le tableau (ou changer de tableau) retire la présence.
  useEffect(
    () => () => {
      if (lastSentRef.current !== null) send(null);
    },
    [send],
  );

  return store;
}

/**
 * Autres utilisateurs ayant cette tâche ouverte (jamais soi-même).
 * Retourne un tableau à référence stable tant que rien ne change.
 */
export function useTaskViewers(taskId) {
  const store = useContext(TaskPresenceContext);
  const subscribe = store ? store.subscribe : noopSubscribe;
  const getSnapshot = useCallback(
    () => (store ? store.get(taskId) : EMPTY),
    [store, taskId],
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}
