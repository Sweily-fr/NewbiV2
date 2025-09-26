import { useState, useEffect } from "react";
import { authClient } from "./auth-client";

/**
 * Récupère l'organisation active de l'utilisateur
 */
export async function getActiveOrganization() {
  try {
    const { data: organizations } = await authClient.organization.list();

    // Pour l'instant, on prend la première organisation (ou celle marquée comme active)
    const activeOrg = organizations?.[0];

    if (!activeOrg) {
      throw new Error("Aucune organisation trouvée");
    }

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

    const result = await authClient.organization.update({
      organizationId,
      data,
    });

    if (options.onSuccess) {
      options.onSuccess(result);
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
 */
export function useActiveOrganization() {
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      setError(null);
      const org = await getActiveOrganization();
      setOrganization(org);
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

      // Si on supprime le logo (data.logo === null), forcer le nettoyage complet
      if (data.logo === null || data.logo === undefined) {
        const cleanedOrg = { ...organization, ...data, logo: null };
        setOrganization(cleanedOrg);

        // Forcer un refetch après un délai pour s'assurer de la synchronisation
        setTimeout(() => {
          fetchOrganization();
        }, 100);
      } else {
        // Mettre à jour l'état local avec les données envoyées (pas result.data qui contient les anciennes valeurs)
        const updatedOrg = { ...organization, ...data };
        setOrganization(updatedOrg);
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, []);

  return {
    organization,
    loading,
    error,
    refetch: fetchOrganization,
    updateOrganization: updateOrgData,
  };
}
