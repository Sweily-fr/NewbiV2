import { createAuthMiddleware } from "better-auth/api";
import { sendReactivationEmail } from "./auth-utils";

// Hook avant connexion pour vérifier les comptes désactivés
export const beforeSignInHook = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== "/sign-in/email") {
    return;
  }

  console.log("Hook before signIn email déclenché");

  const email = ctx.body?.email;
  if (!email) {
    console.log("Pas d'email trouvé dans la requête");
    return;
  }

  console.log("Vérification du statut isActive pour:", email);

  // Vérifier si l'utilisateur existe et s'il est actif
  const { mongoDb } = await import("./mongodb");
  const usersCollection = mongoDb.collection("user");

  const user = await usersCollection.findOne({ email: email });

  if (user && user.isActive === false) {
    console.log(
      "Utilisateur désactivé détecté, envoi de l'email de réactivation"
    );

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

  console.log("Hook OAuth déclenché sur:", ctx.path);

  // Utiliser newSession comme nous l'avons vu dans les logs
  const newSession = ctx.context.newSession;

  if (newSession && newSession.user && newSession.session) {
    const user = newSession.user;
    const userId = newSession.session.userId;

    console.log("Nouvelle session OAuth détectée pour userId:", userId);
    console.log("Utilisateur:", user.email);

    // Créer une organisation automatiquement comme pour l'inscription normale
    try {
      console.log("Création automatique d'organisation pour OAuth...");

      // Générer le nom et le slug comme dans useAutoOrganization
      const organizationName =
        user.name || `Workspace ${user.email.split("@")[0]}'s`;
      const organizationSlug = `org-${user.id.slice(-8)}`;

      console.log("Nom de l'organisation:", organizationName);
      console.log("Slug de l'organisation:", organizationSlug);

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

      const organization =
        await ctx.context.internalAdapter.createOrganization({
          ...organizationData,
          creatorId: userId,
        });

      console.log(
        "Organisation créée automatiquement via OAuth:",
        organization
      );
    } catch (error) {
      console.error(
        "Erreur lors de la création automatique d'organisation OAuth:",
        error
      );

      // Fallback: essayer avec l'adapter normal
      try {
        console.log("Tentative avec l'adapter normal...");

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

        console.log("Organisation créée avec fallback:", organization);
        console.log("Membre créé:", member);
      } catch (fallbackError) {
        console.error("Erreur même avec le fallback:", fallbackError);
      }
    }
  } else {
    console.log("Pas de nouvelle session dans le contexte pour:", ctx.path);
  }
});
