import React from 'react';
import { authClient } from '@/src/lib/auth-client';

/**
 * Hook pour obtenir les informations du workspace actuel
 * Utilise directement les hooks Better Auth pour les organisations
 * @returns {Object} - { workspaceId, organization, organizations, loading }
 */
export const useWorkspace = () => {
  // Utiliser directement les hooks Better Auth
  const { data: organizations, isPending: orgsLoading } = authClient.useListOrganizations();
  const { data: activeOrganization, isPending: activeLoading } = authClient.useActiveOrganization();
  
  const loading = orgsLoading || activeLoading;
  
  // Si pas d'organisation active mais qu'il y a des organisations, définir la première comme active
  React.useEffect(() => {
    if (!loading && !activeOrganization && organizations && organizations.length > 0) {
      console.log('🏢 Définition de l\'organisation active:', organizations[0]);
      authClient.organization.setActive({
        organizationId: organizations[0].id
      });
    }
  }, [loading, activeOrganization, organizations]);
  
  // Debug logs
  React.useEffect(() => {
    console.log('🔍 useWorkspace state:', {
      loading,
      orgsLoading,
      activeLoading,
      organizationsCount: organizations?.length || 0,
      activeOrganization: activeOrganization ? {
        id: activeOrganization.id,
        name: activeOrganization.name
      } : null,
      workspaceId: activeOrganization?.id || null
    });
  }, [loading, orgsLoading, activeLoading, organizations, activeOrganization]);
  
  return {
    workspaceId: activeOrganization?.id || null,
    organization: activeOrganization,
    organizations: organizations || [],
    loading
  };
};

/**
 * Hook pour s'assurer qu'un workspace est sélectionné
 * @returns {Object} - { workspaceId, organization, loading, error }
 */
export const useRequiredWorkspace = () => {
  const { workspaceId, organization, loading } = useWorkspace();

  const error = !loading && !workspaceId ? "Aucun workspace sélectionné" : null;

  // Debug logs
  React.useEffect(() => {
    console.log('🔍 useRequiredWorkspace:', {
      workspaceId,
      hasOrganization: !!organization,
      loading,
      error,
      organizationId: organization?.id
    });
  }, [workspaceId, organization, loading, error]);

  return {
    workspaceId,
    organization,
    loading,
    error,
  };
};
