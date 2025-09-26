import { createAuthMiddleware } from "better-auth/api";
import { sendReactivationEmail } from "./auth-utils";

// Hook avant connexion pour vérifier les comptes désactivés
export const beforeSignInHook = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== "/sign-in/email") {
    return;
  }

  const email = ctx.body?.email;
  if (!email) {
    return;
  }

  // Vérifier si l'utilisateur existe et s'il est actif
  const { mongoDb } = await import("./mongodb");
  const usersCollection = mongoDb.collection("user");

  const user = await usersCollection.findOne({ email: email });

  if (user && user.isActive === false) {
    // Envoyer l'email de réactivation
    await sendReactivationEmail(user);

    // Bloquer la connexion
    const { APIError } = await import("better-auth/api");
    throw new APIError("BAD_REQUEST", {
      message:
        "Votre compte a été désactivé. Un email de réactivation vous a été envoyé.",
    });
  }
});

// Hook après connexion OAuth pour créer automatiquement une organisation
export const afterOAuthHook = createAuthMiddleware(async (ctx) => {
  // Filtrer uniquement les callbacks OAuth
  if (!ctx.path?.includes("/callback/")) {
    return;
  }

  // Utiliser newSession comme nous l'avons vu dans les logs
  const newSession = ctx.context.newSession;

  if (newSession && newSession.user && newSession.session) {
    const user = newSession.user;
    const userId = newSession.session.userId;

    // Créer une organisation automatiquement comme pour l'inscription normale
    try {
      // Générer le nom et le slug comme dans useAutoOrganization
      const organizationName =
        user.name || `Workspace ${user.email.split("@")[0]}'s`;
      const organizationSlug = `org-${user.id.slice(-8)}`;

      // Utiliser l'API interne Better Auth pour créer l'organisation
      const organizationData = {
        name: organizationName,
        slug: organizationSlug,
        metadata: {
          autoCreated: true,
          createdAt: new Date().toISOString(),
          createdVia: "oauth",
        },
      };

      const organization = await ctx.context.internalAdapter.createOrganization(
        {
          ...organizationData,
          creatorId: userId,
        }
      );
    } catch (error) {
      // Fallback: essayer avec l'adapter normal
      try {
        const organizationData = {
          name: user.name
            ? `Organisation de ${user.name}`
            : `Organisation de ${user.email}`,
          slug: `org-${user.id.slice(-8)}`,
        };

        const organization = await ctx.context.adapter.create({
          model: "organization",
          data: organizationData,
        });

        const member = await ctx.context.adapter.create({
          model: "member",
          data: {
            userId: userId,
            organizationId: organization.id,
            role: "owner",
          },
        });
      } catch (fallbackError) {
        console.error("Erreur même avec le fallback:", fallbackError);
      }
    }
  }
});
