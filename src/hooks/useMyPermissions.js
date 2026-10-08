"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_MY_PERMISSIONS } from "@/src/graphql/organizationRoleQueries";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { canAction, canLevel } from "@/src/lib/role-levels";

/**
 * Droits de l'utilisateur dans l'espace actif (grille module → niveau,
 * calculée par l'API : rôle prédéfini, ajusté ou personnalisé).
 *
 * Tant que la grille n'est pas chargée, `can*` renvoie false : les gardes
 * doivent attendre `isReady` avant de conclure à un refus.
 */
export function useMyPermissions() {
  const { workspaceId } = useWorkspace();
  const { data, loading, error, refetch } = useQuery(GET_MY_PERMISSIONS, {
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  const permissions = data?.myPermissions;
  // Grille d'un autre espace encore en cache juste après un changement
  // d'espace : ignorée jusqu'à la réponse du serveur
  const current =
    permissions && (!workspaceId || permissions.organizationId === workspaceId)
      ? permissions
      : null;
  const levels = current?.levels || null;

  const can = useCallback(
    (resource, level = "read") => canLevel(levels, resource, level),
    [levels],
  );
  const canDo = useCallback(
    (resource, action) => canAction(levels, resource, action),
    [levels],
  );

  return useMemo(
    () => ({
      levels,
      role: current?.role || null,
      roleName: current?.roleName || null,
      isOwner: Boolean(current?.isOwner),
      isReady: Boolean(levels),
      loading: loading && !levels,
      error,
      refetch,
      can,
      canDo,
      canRead: (resource) => can(resource, "read"),
      canWrite: (resource) => can(resource, "write"),
      canDelete: (resource) => can(resource, "delete"),
    }),
    [levels, current, loading, error, refetch, can, canDo],
  );
}
