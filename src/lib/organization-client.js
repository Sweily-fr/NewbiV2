import { useState, useEffect, useMemo } from "react";
import { authClient } from "./auth-client";

/**
 * Récupère l'organisation active de l'utilisateur
 */
export async function getActiveOrganization() {
  try {
    // Utiliser l'API Better Auth pour récupérer l'organisation active de la session
    const { data: activeOrg, error } = await authClient.organization.getFullOrganization();

    if (error || !activeOrg) {
      console.warn("⚠️ Aucune organisation active, utilisation de la première organisation");
      // Fallback: Si aucune organisation active, prendre la première
      const { data: organizations } = await authClient.organization.list();
      return organizations?.[0] || null;
    }

    console.log("✅ Organisation active récupérée:", activeOrg.name);
    return activeOrg;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'organisation:", error);
    throw error;
  }
}

/**
 * Met à jour les informations de l'organisation
 */
export async function updateOrganization(organizationId, data, options = {}) {
  try {
    const { data: resultData, error } = await authClient.organization.update({
      organizationId,
      data,
    });

    if (error) {
      console.error("❌ Erreur Better Auth:", error);
      if (options.onError) {
        options.onError(error);
      }
      throw new Error(error.message || "Erreur lors de la mise à jour");
    }

    // Rafraîchir la session active pour que les hooks réactifs (useActiveOrganization)
    // reçoivent les données mises à jour
    try {
      await authClient.organization.setActive({ organizationId });
    } catch (e) {
      // Non critique : juste pour invalider le cache de la session
    }

    if (options.onSuccess) {
      await options.onSuccess(resultData);
    }

    return resultData;
  } catch (error) {
    console.error("❌ Erreur mise à jour organisation:", error);

    if (options.onError && error.message !== "Erreur lors de la mise à jour") {
      options.onError(error);
    }

    throw error;
  }
}

/**
 * Récupère les membres d'une organisation
 */
export async function getOrganizationMembers(organizationId) {
  try {
    const { data: members } = await authClient.organization.getMembers({
      organizationId,
    });

    return members;
  } catch (error) {
    console.error("Erreur lors de la récupération des membres:", error);
    throw error;
  }
}

/**
 * Invite un utilisateur à rejoindre l'organisation
 */
export async function inviteToOrganization(
  organizationId,
  email,
  role = "member"
) {
  try {
    const result = await authClient.organization.inviteUser({
      organizationId,
      email,
      role,
    });

    return result;
  } catch (error) {
    console.error("Erreur lors de l'invitation:", error);
    throw error;
  }
}

/**
 * Hook personnalisé pour gérer l'organisation active
 * Utilise Better Auth en interne pour récupérer l'organisation active
 */
export function useActiveOrganization() {
  // Utiliser directement le hook Better Auth pour l'organisation active
  const { data: betterAuthOrg, isPending: betterAuthLoading, refetch: betterAuthRefetch } = 
    authClient.useActiveOrganization();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);

  // Stabiliser l'objet organization avec useMemo pour éviter les re-renders inutiles
  // On change l'objet si l'ID change OU si forceUpdateCounter change (après un update)
  const organization = useMemo(() => {
    if (!betterAuthOrg) return null;
    return betterAuthOrg;
  }, [betterAuthOrg?.id, forceUpdateCounter]); // ✅ Change si ID ou forceUpdate change

  // Synchroniser le loading
  useEffect(() => {
    if (!betterAuthLoading) {
      setLoading(false);
    }
  }, [betterAuthLoading]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      setError(null);
      await betterAuthRefetch();
      // Forcer la mise à jour du useMemo pour refléter les nouvelles données
      setForceUpdateCounter(prev => prev + 1);
      console.log("✅ Organisation refetch depuis Better Auth");
    } catch (err) {
      setError(err);
      console.error("Erreur lors du chargement de l'organisation:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrgData = async (data, options = {}) => {
    if (!organization?.id) {
      throw new Error("Aucune organisation active");
    }

    try {
      const result = await updateOrganization(organization.id, data, options);

      // Forcer un refetch depuis Better Auth après la mise à jour
      await betterAuthRefetch();
      
      // Incrémenter le compteur pour forcer la mise à jour du useMemo
      setForceUpdateCounter(prev => prev + 1);
      
      console.log("✅ Organisation mise à jour et refetch depuis Better Auth");

      return result;
    } catch (error) {
      throw error;
    }
  };

  return {
    organization,
    loading,
    error,
    refetch: fetchOrganization,
    updateOrganization: updateOrgData,
  };
}
