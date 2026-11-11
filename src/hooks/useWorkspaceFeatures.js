"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_WORKSPACE_FEATURES } from "@/src/graphql/queries/workspaceFeatures";
import { useWorkspace } from "@/src/hooks/useWorkspace";

/**
 * Fonctionnalités en accès anticipé (TVA, prise de rendez-vous, liens
 * clients, réseaux sociaux) : livrées mais réservées à certains espaces par
 * l'API, qui refuse aussi leurs requêtes aux autres.
 *
 * Fermées tant que la réponse n'est pas arrivée (ou en cas d'erreur) : un
 * espace sans accès ne les voit jamais apparaître puis disparaître. Les
 * gardes de page attendent `isReady` avant de conclure.
 */
export function useWorkspaceFeatures() {
  const { workspaceId } = useWorkspace();
  const { data, loading } = useQuery(GET_WORKSPACE_FEATURES, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    context: { skipErrorToast: true },
  });

  const features = data?.workspaceFeatures || null;

  // Sans nom de fonctionnalité (page ordinaire) : toujours ouverte
  const isEnabled = useCallback(
    (feature) => !feature || Boolean(features?.[feature]),
    [features],
  );

  return useMemo(
    () => ({
      features,
      isEnabled,
      isReady: Boolean(features),
      loading: !features && (loading || !workspaceId),
    }),
    [features, isEnabled, loading, workspaceId],
  );
}
