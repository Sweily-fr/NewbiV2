import { useCallback, useRef } from "react";
import { useApolloClient } from "@apollo/client";
import { GET_TASK_DETAILS } from "@/src/graphql/kanbanQueries";

/**
 * Précharge les détails d'une tâche (commentaires, activité, time tracking
 * entries) dans le cache Apollo. Utilisé au survol des TaskCard pour que
 * l'ouverture du modal se fasse depuis le cache (zéro attente réseau).
 *
 * - `cache-first` : si la donnée est déjà en cache, aucun hit réseau.
 * - Un Set évite les requêtes concurrentes pour la même tâche (Apollo dédupe
 *   les in-flight, mais on évite aussi le travail JS côté client).
 * - Un petit délai (hover intent) évite de spammer le serveur quand
 *   l'utilisateur balaie rapidement des cartes sans intention d'ouvrir.
 */
export function usePrefetchTaskDetails(workspaceId) {
  const client = useApolloClient();
  const inflightRef = useRef(new Set());
  const timersRef = useRef(new Map());

  const prefetch = useCallback(
    (taskId) => {
      if (!taskId) return;
      if (inflightRef.current.has(taskId)) return;
      if (timersRef.current.has(taskId)) return;

      // Hover intent : on attend 120ms avant de fetch. Si l'utilisateur a
      // quitté la carte avant, cancelPrefetch annulera le timer.
      const timer = setTimeout(() => {
        timersRef.current.delete(taskId);
        inflightRef.current.add(taskId);
        client
          .query({
            query: GET_TASK_DETAILS,
            variables: { id: taskId, workspaceId },
            fetchPolicy: "cache-first",
          })
          .catch(() => {
            // Silencieux : un échec de prefetch ne doit pas casser l'UI.
            // Le fetch "officiel" à l'ouverture du modal gérera l'erreur.
          })
          .finally(() => {
            inflightRef.current.delete(taskId);
          });
      }, 120);

      timersRef.current.set(taskId, timer);
    },
    [client, workspaceId],
  );

  const cancelPrefetch = useCallback((taskId) => {
    if (!taskId) return;
    const timer = timersRef.current.get(taskId);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(taskId);
    }
  }, []);

  return { prefetch, cancelPrefetch };
}
