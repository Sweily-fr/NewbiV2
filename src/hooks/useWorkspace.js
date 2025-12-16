import React, { useEffect, useState } from "react";
import { authClient } from "@/src/lib/auth-client";
import { useUser } from "@/src/lib/auth/hooks";

/**
 * Hook pour obtenir les informations du workspace actuel
 * Utilise directement les hooks Better Auth pour les organisations
 * Better Auth gère automatiquement la persistance de l'organisation active dans la session
 * Stocke automatiquement organizationId et userRole dans localStorage pour Apollo Client
 * @returns {Object} - { workspaceId, organization, organizations, loading }
 */
export const useWorkspace = () => {
  // Utiliser directement les hooks Better Auth
  const { data: organizations, isPending: orgsLoading } =
    authClient.useListOrganizations();
  const { data: activeOrganization, isPending: activeLoading } =
    authClient.useActiveOrganization();

  // Récupérer la session pour obtenir l'utilisateur
  const { session } = useUser();

  // État pour l'organisation complète avec les membres
  const [fullOrganization, setFullOrganization] = useState(null);
  const [loadingFull, setLoadingFull] = useState(false);

  const loading = orgsLoading || activeLoading || loadingFull;

  // Charger l'organisation complète si elle n'a pas de membres
  useEffect(() => {
    if (activeOrganization?.id && !activeOrganization.members) {
      setLoadingFull(true);
      authClient.organization
        .getFullOrganization({
          organizationId: activeOrganization.id,
        })
        .then(({ data }) => {
          setFullOrganization(data);
          setLoadingFull(false);
        })
        .catch((error) => {
          console.error("Error loading full organization:", error);
          setLoadingFull(false);
        });
    } else if (activeOrganization?.members) {
      setFullOrganization(activeOrganization);
    }
  }, [activeOrganization?.id]);

  // Utiliser l'organisation complète si disponible, sinon l'organisation active
  const orgWithMembers = fullOrganization || activeOrganization;

  // Stocker l'organizationId dans localStorage pour Apollo Client
  useEffect(() => {
    if (activeOrganization?.id) {
      const currentStoredId = localStorage.getItem("active_organization_id");
      if (currentStoredId !== activeOrganization.id) {
        localStorage.setItem("active_organization_id", activeOrganization.id);
      }
    } else {
      localStorage.removeItem("active_organization_id");
    }
  }, [activeOrganization?.id]);

  // Stocker le userRole dans localStorage pour Apollo Client
  useEffect(() => {
    if (orgWithMembers?.members && session?.user?.id) {
      const member = orgWithMembers.members.find(
        (m) => m.userId === session.user.id
      );
      const userRole = member?.role?.toLowerCase() || null;

      if (userRole) {
        const currentStoredRole = localStorage.getItem("user_role");
        if (currentStoredRole !== userRole) {
          localStorage.setItem("user_role", userRole);
        }
      } else {
        localStorage.removeItem("user_role");
      }
    }
  }, [orgWithMembers?.members, session?.user?.id]);

  return {
    workspaceId: activeOrganization?.id || null,
    organization: orgWithMembers,
    activeOrganization: orgWithMembers,
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
