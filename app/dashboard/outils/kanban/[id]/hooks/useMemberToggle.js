import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTaskFieldMutations } from "./useTaskFieldMutations";

/**
 * État optimiste des membres assignés pour les composants qui les affichent
 * directement depuis le cache (vue liste). Chaque clic envoie UN membre
 * (assignTaskMember / unassignTaskMember) : plus de tableau complet qui
 * écrasait les assignations faites en même temps par un collègue, ni de
 * debounce pour coalescer les clics.
 *
 * Le toggle calcule TOUJOURS à partir de la dernière valeur locale (ref mise
 * à jour au clic, avant le re-render) et non de `task.assignedMembers` qui
 * retarde le temps de l'écho serveur : deux clics rapides sur le même membre
 * donnent bien une assignation puis un retrait.
 *
 * @returns { members, toggle }
 *   - members : la liste à afficher (optimiste si en attente, sinon serveur)
 *   - toggle(memberId) : inverse l'assignation et envoie la mutation
 */
export function useTaskMembers({ task, workspaceId }) {
  const fieldMutations = useTaskFieldMutations(workspaceId);
  const [optimistic, setOptimistic] = useState(null);

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
  const latestRef = useRef(members);
  latestRef.current = members;

  const toggle = useCallback(
    (memberId) => {
      const base = latestRef.current || [];
      const assign = !base.includes(memberId);
      const next = assign
        ? [...base, memberId]
        : base.filter((id) => id !== memberId);
      latestRef.current = next;
      setOptimistic(next);
      if (!task?.id) return;
      // En cas d'échec (toast déjà affiché), retour à la vérité du cache
      fieldMutations
        .setMember(task.id, memberId, assign)
        .catch(() => setOptimistic(null));
    },
    [fieldMutations, task?.id],
  );

  return { members, toggle };
}
