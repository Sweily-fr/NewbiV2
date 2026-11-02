"use client";

import { useEffect } from "react";
import { useQuery } from "@apollo/client";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { GET_WORKSPACE_STORAGE } from "@/src/graphql/queries/storage";

/**
 * Stockage de l'espace actif (utilisé, quota, détail, proposition).
 * Tant que le premier calcul n'est pas terminé (`ready: false`), la requête
 * est relancée toutes les 10 secondes.
 */
export function useWorkspaceStorage({ skip = false } = {}) {
  const { workspaceId } = useWorkspace();
  const query = useQuery(GET_WORKSPACE_STORAGE, {
    variables: { workspaceId },
    skip: skip || !workspaceId,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    errorPolicy: "all",
    context: { skipErrorToast: true },
  });
  const storage = query.data?.workspaceStorage || null;
  const pending = Boolean(storage && !storage.ready);
  const { startPolling, stopPolling } = query;

  useEffect(() => {
    if (!pending) return undefined;
    startPolling(10000);
    return () => stopPolling();
  }, [pending, startPolling, stopPolling]);

  return {
    storage,
    loading: query.loading && !storage,
    error: query.error || null,
    refetch: query.refetch,
    workspaceId,
  };
}
