import { useCallback } from "react";
import { organization, useSession } from "@/src/lib/auth-client";

export const useAutoOrganization = () => {
  const { data: session } = useSession();

  const createAutoOrganization = useCallback(
    async (userFromSignup = null) => {
      try {
        console.log("Création automatique d'organisation après inscription");
        console.log("Session actuelle:", session);
        console.log("Utilisateur depuis signup:", userFromSignup);

        // Utiliser l'utilisateur passé en paramètre ou celui de la session
        const user = userFromSignup || session?.user;

        if (!user || !user.id) {
          console.error("Utilisateur non disponible:", {
            session,
            userFromSignup,
          });
          return { success: false, error: "Utilisateur non disponible" };
        }

        console.log(
          `Création d'organisation pour l'utilisateur: ${user.email} (ID: ${user.id})`
        );

        // Générer le nom et le slug de l'organisation
        const organizationName =
          user.name || `Workspace ${user.email.split("@")[0]}'s`;
        const organizationSlug = `org-${user.id.slice(-8)}`;

        console.log("Nom de l'organisation:", organizationName);
        console.log("Slug de l'organisation:", organizationSlug);

        console.log("Tentative de création d'organisation via Better Auth...");

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

        console.log("Résultat de organization.create:", result);

        if (result.error) {
          console.error("Erreur lors de la création de l'organisation:", {
            error: result.error,
            errorType: typeof result.error,
            errorKeys: Object.keys(result.error || {}),
            fullResult: result,
          });
          return { success: false, error: result.error };
        }

        if (!result.data) {
          console.error("Aucune donnée retournée:", result);
          return { success: false, error: "Aucune donnée retournée" };
        }

        console.log(
          "Organisation créée avec succès (avec membre):",
          result.data
        );
        return { success: true, data: result.data };
      } catch (error) {
        console.error(
          "Exception lors de la création automatique d'organisation:",
          {
            message: error.message,
            stack: error.stack,
            error: error,
          }
        );
        return { success: false, error: error.message };
      }
    },
    [session]
  );

  return { createAutoOrganization };
};
