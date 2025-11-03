import React from "react";
import { authClient } from "@/src/lib/auth-client";

/**
 * Hook pour obtenir les informations du workspace actuel
 * Utilise directement les hooks Better Auth pour les organisations
 * Better Auth gère automatiquement la persistance de l'organisation active dans la session
 * @returns {Object} - { workspaceId, organization, organizations, loading }
 */
export const useWorkspace = () => {
  // Utiliser directement les hooks Better Auth
  const { data: organizations, isPending: orgsLoading } =
    authClient.useListOrganizations();
  const { data: activeOrganization, isPending: activeLoading } =
    authClient.useActiveOrganization();

  const loading = orgsLoading || activeLoading;

  return {
    workspaceId: activeOrganization?.id || null,
    organization: activeOrganization,
    activeOrganization: activeOrganization,
    organizations: organizations || [],
    loading,
  };
};

/**
 * Hook pour s'assurer qu'un workspace est sélectionné
 * @returns {Object} - { workspaceId, organization, loading, error }
 */
export const useRequiredWorkspace = () => {
  const { workspaceId, organization, loading } = useWorkspace();

  const error = !loading && !workspaceId ? "Aucun workspace sélectionné" : null;

  return {
    workspaceId,
    organization,
    loading,
    error,
  };
};
