"use client";

import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { authClient } from "@/src/lib/auth-client";
import { useState, useEffect } from "react";
import { getPlanLimits as getCentralizedPlanLimits } from "@/src/lib/plan-limits";

/**
 * Hook pour vérifier les limites d'utilisation selon le plan d'abonnement
 * - Freelance : 1 utilisateur, 1 workspace
 * - PME : 10 utilisateurs, 1 workspace
 * - Entreprise : 25 utilisateurs, 1 workspace
 */
export function useSubscriptionLimits() {
  const { subscription, isActive } = useSubscription();
  const [limits, setLimits] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLimitsAndUsage() {
      try {
        setLoading(true);

        // Si pas d'abonnement actif, retourner des limites à 0
        if (!isActive() || !subscription) {
          setLimits({ users: 0, workspaces: 0, projects: 0, invoices: 0 });
          setUsage({ users: 0, workspaces: 0 });
          setLoading(false);
          return;
        }

        // Récupérer les limites du plan actuel
        const planLimits = getPlanLimits(subscription?.plan);
        setLimits(planLimits);

        // Récupérer l'utilisation actuelle
        const { data: orgs } = await authClient.organization.list();

        if (orgs && orgs.length > 0) {
          // Trouver l'organisation active
          const activeOrg = orgs.find(
            (org) => org.id === subscription?.referenceId
          );

          if (activeOrg) {
            // Récupérer les membres de l'organisation
            const { data: fullOrg } =
              await authClient.organization.getFullOrganization({
                organizationId: activeOrg.id,
              });

            // Compter les utilisateurs (exclure accountant qui est gratuit)
            const userCount =
              fullOrg?.members?.filter((m) => m.role !== "accountant").length ||
              0;

            setUsage({
              users: userCount,
              workspaces: orgs.length,
            });
          }
        } else {
          setUsage({ users: 0, workspaces: 0 });
        }
      } catch (error) {
        console.error("❌ Erreur récupération limites:", error);
        setLimits({ users: 0, workspaces: 0, projects: 0, invoices: 0 });
        setUsage({ users: 0, workspaces: 0 });
      } finally {
        setLoading(false);
      }
    }

    fetchLimitsAndUsage();
  }, [subscription, isActive]);

  // Calculer les capacités restantes
  const canAddUser = usage && limits ? usage.users < limits.users : false;
  const canAddWorkspace =
    usage && limits ? usage.workspaces < limits.workspaces : false;
  const remainingUsers =
    limits && usage ? Math.max(0, limits.users - usage.users) : 0;
  const remainingWorkspaces =
    limits && usage ? Math.max(0, limits.workspaces - usage.workspaces) : 0;

  return {
    limits,
    usage,
    loading,
    canAddUser,
    canAddWorkspace,
    remainingUsers,
    remainingWorkspaces,
    planName: subscription?.plan || "none",
  };
}

/**
 * Récupère les limites d'un plan (utilise la config centralisée)
 * @param {string} planName
 * @returns {Object}
 */
function getPlanLimits(planName) {
  const centralLimits = getCentralizedPlanLimits(planName);

  // Adapter le format pour la compatibilité avec le code existant
  // Note: users ici = totalUsers (owner + invités) pour l'affichage
  return {
    users: centralLimits.totalUsers,
    workspaces: centralLimits.workspaces,
    projects: centralLimits.projects,
    storage: centralLimits.storage,
    invoices: centralLimits.invoices,
  };
}
