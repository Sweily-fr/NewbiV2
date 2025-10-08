import { useCallback } from "react";
import { organization, useSession } from "@/src/lib/auth-client";

export const useAutoOrganization = () => {
  const { data: session } = useSession();

  const createAutoOrganization = useCallback(
    async (userFromSignup = null) => {
      try {
        let user = userFromSignup || session?.user;

        // Si pas d'utilisateur disponible, essayer de récupérer la session actuelle
        if (!user || !user.id) {
          try {
            const { data: currentSession } = await organization.getSession();
            user = currentSession?.user;
          } catch (sessionError) {
            console.error(
              "❌ Erreur lors de la récupération de la session:",
              sessionError
            );
          }
        }

        if (!user || !user.id) {
          console.error("Utilisateur non disponible:", {
            session,
            userFromSignup,
            retrievedUser: user,
          });
          return { success: false, error: "Utilisateur non disponible" };
        }

        // Générer le nom et le slug de l'organisation
        const organizationName =
          user.name || `Espace ${user.email.split("@")[0]}'s`;
        const organizationSlug = `org-${user.id.slice(-8)}`;

        // Calculer les dates de trial (14 jours)
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

        console.log(
          `🔄 Création organisation pour ${user.email} avec trial...`
        );

        // Créer l'organisation via le client Better Auth avec champs trial
        const result = await organization.create({
          name: organizationName,
          slug: organizationSlug,
          trialStartDate: now.toISOString(),
          trialEndDate: trialEnd.toISOString(),
          isTrialActive: true,
          hasUsedTrial: true,
          metadata: {
            autoCreated: true,
            createdAt: new Date().toISOString(),
          },
          keepCurrentActiveOrganization: false,
        });

        console.log(`✅ Organisation créée avec trial:`, result);

        if (result.error) {
          return { success: false, error: result.error };
        }

        if (!result.data) {
          return { success: false, error: "Aucune donnée retournée" };
        }

        return { success: true, data: result.data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    [session]
  );

  return { createAutoOrganization };
};
