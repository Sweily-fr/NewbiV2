import { useCallback, useRef } from "react";
import { useApolloClient } from "@apollo/client";
import { GET_TASK_DETAILS } from "@/src/graphql/kanbanQueries";

/**
 * Précharge les détails d'une tâche (commentaires, activité, time tracking)
 * dans le cache Apollo. Utilisé au survol ET au mousedown des TaskCard pour
 * que l'ouverture du modal se fasse depuis le cache (zéro attente réseau).
 *
 * Stratégie :
 * - `mouseenter` : prefetch immédiat (Apollo dédupe les in-flight pour la
 *   même tâche, donc pas de risque de spam)
 * - `mousedown` : prefetch immédiat aussi (50-200ms d'avance sur le click —
 *   les commentaires sont prêts au moment où le modal s'ouvre)
 * - Un Set évite les requêtes déjà tirées pour la même tâche
 */
export function usePrefetchTaskDetails(workspaceId) {
  const client = useApolloClient();
  const inflightRef = useRef(new Set());

  const prefetch = useCallback(
    (taskId) => {
      if (!taskId) return;
      if (inflightRef.current.has(taskId)) return;
      inflightRef.current.add(taskId);
      client
        .query({
          query: GET_TASK_DETAILS,
          variables: { id: taskId, workspaceId },
          fetchPolicy: "cache-first",
        })
        .catch(() => {
          // Silencieux : un échec de prefetch ne doit pas casser l'UI.
        })
        .finally(() => {
          inflightRef.current.delete(taskId);
        });
    },
    [client, workspaceId],
  );

  // Conservé pour l'API existante mais devenu no-op (on ne défère plus)
  const cancelPrefetch = useCallback(() => {}, []);

  return { prefetch, cancelPrefetch };
}
