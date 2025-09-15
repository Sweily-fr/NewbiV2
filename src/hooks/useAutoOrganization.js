import { useCallback } from "react";
import { organization, useSession } from "@/src/lib/auth-client";

export const useAutoOrganization = () => {
  const { data: session } = useSession();

  const createAutoOrganization = useCallback(
    async (userFromSignup = null) => {
      try {
        // Utiliser l'utilisateur passé en paramètre ou celui de la session
        const user = userFromSignup || session?.user;

        if (!user || !user.id) {
          console.error("Utilisateur non disponible:", {
            session,
            userFromSignup,
          });
          return { success: false, error: "Utilisateur non disponible" };
        }

        // Générer le nom et le slug de l'organisation
        const organizationName =
          user.name || `Workspace ${user.email.split("@")[0]}'s`;
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
