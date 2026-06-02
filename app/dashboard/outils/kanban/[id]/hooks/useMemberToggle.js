import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_DELAY = 350;

/**
 * Coalesce les changements rapides de membres assignés en UNE seule mutation
 * par tâche (debounce). Sans cela, retirer/ajouter plusieurs membres très vite
 * envoie une rafale de mutations `updateTask` concurrentes : leurs échos de
 * subscription arrivent dans le désordre et le formulaire « remet » un membre
 * qu'on venait de retirer.
 *
 * Le debounce est géré par tâche (Map taskId → timer), donc un même hook peut
 * suivre plusieurs tâches. Les mutations en attente au démontage (ex: fermeture
 * du modal avant la fin du debounce) sont flushées immédiatement pour ne rien
 * perdre.
 *
 * @returns flush(taskId, members) — planifie l'envoi de `members` pour `taskId`.
 */
export function useDebouncedMemberFlush({
  updateTask,
  workspaceId,
  localMutationRef,
  delay = DEFAULT_DELAY,
  onError,
  onSuccess,
}) {
  // On lit les args via un ref pour garder `flush`/`sendNow` stables et éviter
  // qu'un changement de prop ne flush prématurément les timers en attente.
  const argsRef = useRef({
    updateTask,
    workspaceId,
    localMutationRef,
    delay,
    onError,
    onSuccess,
  });
  argsRef.current = {
    updateTask,
    workspaceId,
    localMutationRef,
    delay,
    onError,
    onSuccess,
  };

  // taskId -> { timer, members }
  const pendingRef = useRef(new Map());
  // taskId -> Promise : queue de mutations en cours, pour sérialiser par tâche.
  const inflightRef = useRef(new Map());

  // Envoie la mutation et renvoie une promesse résolue à la FIN (succès/échec),
  // pour pouvoir enchaîner la suivante (sérialisation).
  const sendNow = useCallback((taskId, members) => {
    const { updateTask, workspaceId, localMutationRef, onError, onSuccess } =
      argsRef.current;
    if (!updateTask || !taskId) return Promise.resolve();
    // Marquer comme mutation locale juste avant l'envoi : l'écho de subscription
    // qui en découle ne doit pas re-synchroniser le formulaire.
    if (localMutationRef) localMutationRef.current = true;
    // Apollo (avec un onError au niveau du useMutation) RÉSOUT la promesse même
    // en cas d'erreur : on inspecte donc `res.errors`/`res.data` ET on attrape
    // le rejet pour, en cas d'échec, revenir à la vérité serveur (sinon l'état
    // optimiste reste divergé et les toggles suivants suppriment le mauvais
    // membre).
    return Promise.resolve(
      updateTask({
        variables: {
          input: { id: taskId, assignedMembers: members },
          workspaceId,
        },
      }),
    )
      .then((res) => {
        if (res && (res.errors?.length || res.data == null)) {
          onError?.(taskId);
        } else {
          onSuccess?.(taskId, members);
        }
      })
      .catch(() => onError?.(taskId));
  }, []);

  // Enchaîne l'envoi après la mutation précédente de la MÊME tâche. Le backend
  // diffe le tableau reçu contre l'état serveur courant ($addToSet/$pull) : si
  // deux tableaux absolus arrivaient dans le désordre, un membre retiré pourrait
  // être ré-ajouté. La sérialisation garantit l'ordre.
  const enqueue = useCallback(
    (taskId, members) => {
      const prev = inflightRef.current.get(taskId) || Promise.resolve();
      const next = prev.then(() => sendNow(taskId, members));
      inflightRef.current.set(taskId, next);
      next.finally(() => {
        if (inflightRef.current.get(taskId) === next) {
          inflightRef.current.delete(taskId);
        }
      });
      return next;
    },
    [sendNow],
  );

  const flush = useCallback(
    (taskId, members) => {
      const pending = pendingRef.current;
      const existing = pending.get(taskId);
      if (existing?.timer) clearTimeout(existing.timer);
      const timer = setTimeout(() => {
        pending.delete(taskId);
        enqueue(taskId, members);
      }, argsRef.current.delay);
      pending.set(taskId, { timer, members });
    },
    [enqueue],
  );

  useEffect(() => {
    const pending = pendingRef.current;
    return () => {
      // Au démontage (ex: fermeture du modal avant la fin du debounce), envoyer
      // immédiatement les changements en attente pour ne rien perdre.
      pending.forEach((entry, taskId) => {
        if (entry.timer) clearTimeout(entry.timer);
        enqueue(taskId, entry.members);
      });
      pending.clear();
    };
  }, [enqueue]);

  return flush;
}

/**
 * État optimiste + debounce pour les composants qui affichent les membres
 * directement depuis le cache (vue liste). Le toggle calcule TOUJOURS à partir
 * de la base optimiste locale (et non de `task.assignedMembers` qui retarde le
 * temps que l'écho serveur revienne), ce qui évite de recalculer un tableau
 * faux lors de clics rapides successifs.
 *
 * @returns { members, toggle }
 *   - members : la liste à afficher (optimiste si en attente, sinon serveur)
 *   - toggle(memberId) : inverse l'assignation et planifie la mutation
 */
export function useTaskMembers({
  task,
  updateTask,
  workspaceId,
  localMutationRef,
  delay = DEFAULT_DELAY,
}) {
  const [optimistic, setOptimistic] = useState(null);

  const flush = useDebouncedMemberFlush({
    updateTask,
    workspaceId,
    localMutationRef,
    delay,
    // En cas d'échec serveur (ex: erreur d'auth), on annule l'override optimiste
    // pour revenir à la vérité du cache (la mutation n'a pas été persistée).
    // Le toast d'erreur est déjà émis par le onError du useMutation(UPDATE_TASK).
    onError: () => {
      setOptimistic(null);
    },
  });

  const serverMembers = useMemo(
    () => task?.assignedMembers || [],
    [task?.assignedMembers],
  );

  // Relâcher l'override optimiste dès que le serveur a rattrapé l'état.
  useEffect(() => {
    if (optimistic == null) return;
    const a = [...optimistic].sort();
    const b = [...serverMembers].sort();
    if (a.length === b.length && a.every((v, i) => v === b[i])) {
      setOptimistic(null);
    }
  }, [serverMembers, optimistic]);

  const members = optimistic ?? serverMembers;

  const toggle = useCallback(
    (memberId) => {
      const base = optimistic ?? serverMembers;
      const next = base.includes(memberId)
        ? base.filter((id) => id !== memberId)
        : [...base, memberId];
      setOptimistic(next);
      if (task?.id) flush(task.id, next);
    },
    [optimistic, serverMembers, flush, task?.id],
  );

  return { members, toggle };
}
