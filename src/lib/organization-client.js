import { useState, useEffect } from "react";
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
    // Vérifier la session utilisateur
    const { data: session } = await authClient.getSession();
    console.log("👤 Utilisateur actuel:", session?.user?.email);
    console.log("🔄 Mise à jour de l'organisation:", organizationId);
    console.log("🔄 Données à envoyer:", data);

    const result = await authClient.organization.update({
      organizationId,
      data,
    });

    console.log("✅ Résultat de la mise à jour:", result);
    console.log("✅ Données dans result.data:", result.data);

    if (options.onSuccess) {
      await options.onSuccess(result);
    }

    return result;
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de l'organisation:", error);
    console.error("❌ Détails de l'erreur:", error.message, error.stack);

    if (options.onError) {
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
  
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Synchroniser avec le hook Better Auth
  useEffect(() => {
    if (!betterAuthLoading) {
      setOrganization(betterAuthOrg);
      setLoading(false);
    }
  }, [betterAuthOrg, betterAuthLoading]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      setError(null);
      await betterAuthRefetch();
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
