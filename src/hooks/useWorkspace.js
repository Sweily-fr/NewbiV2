import { useEffect, useState, useRef, useMemo } from "react";
import { authClient } from "@/src/lib/auth-client";
import { useSession } from "@/src/lib/auth-client";
import { setOrganizationIdForApollo } from "@/src/lib/apolloClient";

/**
 * Hook pour obtenir les informations du workspace actuel
 * OPTIMISÉ: Utilise un seul appel Better Auth et évite les boucles infinies
 * Better Auth gère automatiquement la persistance de l'organisation active dans la session
 * Stocke automatiquement organizationId et userRole dans localStorage pour Apollo Client
 * @returns {Object} - { workspaceId, organization, organizations, loading }
 */
export const useWorkspace = () => {
  // Utiliser useSession une seule fois - c'est la source de vérité
  const { data: session, isPending: sessionLoading } = useSession();

  // Utiliser les hooks Better Auth avec cache interne
  const { data: organizations, isPending: orgsLoading } =
    authClient.useListOrganizations();
  const { data: activeOrganization, isPending: activeLoading } =
    authClient.useActiveOrganization();

  // État pour l'organisation complète avec les membres
  const [fullOrganization, setFullOrganization] = useState(null);
  const [loadingFull, setLoadingFull] = useState(false);

  // Ref pour éviter les appels multiples à getFullOrganization
  const lastFetchedOrgId = useRef(null);
  const isFetching = useRef(false);

  const loading = sessionLoading || orgsLoading || activeLoading || loadingFull;

  // Charger l'organisation complète si elle n'a pas de membres
  // OPTIMISÉ: Utiliser une ref pour éviter les appels multiples
  useEffect(() => {
    const orgId = activeOrganization?.id;

    // Ne pas refetch si c'est la même organisation ou si on est déjà en train de fetch
    if (!orgId || lastFetchedOrgId.current === orgId || isFetching.current) {
      return;
    }

    // Si l'organisation a déjà les membres, pas besoin de fetch
    if (activeOrganization?.members) {
      setFullOrganization(activeOrganization);
      lastFetchedOrgId.current = orgId;
      return;
    }

    isFetching.current = true;
    setLoadingFull(true);

    authClient.organization
      .getFullOrganization({
        organizationId: orgId,
      })
      .then(({ data }) => {
        setFullOrganization(data);
        lastFetchedOrgId.current = orgId;
      })
      .catch((error) => {
        console.error("Error loading full organization:", error);
        // Marquer comme fetché même en cas d'erreur pour éviter une boucle de retry
        lastFetchedOrgId.current = orgId;
      })
      .finally(() => {
        setLoadingFull(false);
        isFetching.current = false;
      });
  }, [activeOrganization?.id, activeOrganization?.members]);

  // Utiliser l'organisation complète si disponible, sinon l'organisation active
  // Stabilisé avec des deps primitives pour éviter les cascades de re-render
  const orgWithMembers = useMemo(
    () => fullOrganization || activeOrganization,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fullOrganization?.id, fullOrganization?.members?.length, activeOrganization?.id, activeOrganization?.members?.length]
  );

  // Stocker l'organizationId pour Apollo Client via module-level + localStorage
  const orgId = activeOrganization?.id;
  useEffect(() => {
    if (orgId) {
      const currentStored = localStorage.getItem("active_organization_id");
      if (currentStored !== orgId) {
        localStorage.setItem("active_organization_id", orgId);
      }
    } else {
      localStorage.removeItem("active_organization_id");
    }
    // ✅ Synchroniser la variable module-level dans apolloClient
    // pour que authLink utilise l'org confirmée au lieu de lire un localStorage potentiellement périmé
    setOrganizationIdForApollo(orgId || null);
  }, [orgId]);

  // Stocker le userRole dans localStorage pour Apollo Client
  const userId = session?.user?.id;
  const members = orgWithMembers?.members;

  useEffect(() => {
    if (members && userId) {
      const member = members.find((m) => m.userId === userId);
      const userRole = member?.role?.toLowerCase() || null;

      if (userRole) {
        const currentRole = localStorage.getItem("user_role");
        if (currentRole !== userRole) {
          localStorage.setItem("user_role", userRole);
        }
      } else {
        localStorage.removeItem("user_role");
      }
    }
  }, [members, userId]);

  // Stabiliser la liste d'organisations (évite que la ref array change à chaque render)
  const stableOrganizations = useMemo(
    () => organizations || [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [organizations?.length, organizations?.[0]?.id]
  );

  // Mémoriser le résultat avec des deps primitives pour éviter les re-renders inutiles
  return useMemo(
    () => ({
      workspaceId: activeOrganization?.id || null,
      organization: orgWithMembers,
      activeOrganization: orgWithMembers,
      organizations: stableOrganizations,
      loading,
    }),
    [activeOrganization?.id, orgWithMembers, stableOrganizations, loading]
  );
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
