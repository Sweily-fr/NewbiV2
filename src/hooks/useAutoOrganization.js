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
          console.log("🔄 Tentative de récupération de la session actuelle...");

          try {
            const { data: currentSession } = await organization.getSession();
            user = currentSession?.user;
            console.log("👤 Utilisateur récupéré depuis la session:", user);
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

        // Créer l'organisation via le client Better Auth
        const result = await organization.create({
          name: organizationName,
          slug: organizationSlug,
          metadata: {
            autoCreated: true,
            createdAt: new Date().toISOString(),
          },
          keepCurrentActiveOrganization: false,
        });

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
