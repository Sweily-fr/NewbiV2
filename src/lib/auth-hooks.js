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

  try {
    // Vérifier si l'utilisateur existe et s'il est actif
    const { getMongoDb } = await import("./mongodb");
    const db = await getMongoDb(); // Attendre la connexion MongoDB
    const usersCollection = db.collection("user");

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
  } catch (error) {
    console.error("❌ Erreur dans beforeSignInHook:", error);
    // Si c'est déjà une APIError, la relancer
    if (error.constructor.name === "APIError") {
      throw error;
    }
    // Sinon, logger mais ne pas bloquer la connexion
    console.error(
      "⚠️ Impossible de vérifier le statut du compte, connexion autorisée"
    );
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

    // ⚠️ IMPORTANT: Vérifier si l'utilisateur a déjà une organisation
    try {
      const existingMemberships = await ctx.context.adapter.findMany({
        model: "member",
        where: [
          {
            field: "userId",
            value: userId,
          },
        ],
      });

      // Si l'utilisateur a déjà au moins une organisation, ne rien faire
      if (existingMemberships && existingMemberships.length > 0) {
        console.log(
          `✅ [OAuth] Utilisateur ${userId} a déjà ${existingMemberships.length} organisation(s)`
        );
        return;
      }

      console.log(
        `🆕 [OAuth] Création d'une organisation pour l'utilisateur ${userId}`
      );
    } catch (checkError) {
      console.error(
        "❌ [OAuth] Erreur vérification organisations:",
        checkError
      );
      // En cas d'erreur de vérification, on continue pour ne pas bloquer l'utilisateur
    }

    // Créer une organisation automatiquement comme pour l'inscription normale
    try {
      // Générer le nom et le slug comme dans useAutoOrganization
      const organizationName =
        user.name || `Workspace ${user.email.split("@")[0]}'s`;
      const organizationSlug = `org-${user.id.slice(-8)}`;

      // Calculer les dates de trial (14 jours)
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      console.log(`🔄 [OAuth] Création organisation pour ${user.email}...`);

      // Créer l'organisation via l'API interne Better Auth
      const organizationData = {
        name: organizationName,
        slug: organizationSlug,
        metadata: {
          autoCreated: true,
          createdAt: new Date().toISOString(),
          createdVia: "oauth",
        },
        // ⚠️ IMPORTANT: Ajouter les champs trial directement
        trialStartDate: now,
        trialEndDate: trialEnd,
        isTrialActive: true,
        hasUsedTrial: true,
      };

      const organization = await ctx.context.internalAdapter.createOrganization(
        {
          ...organizationData,
          creatorId: userId,
        }
      );

      console.log(
        `✅ [OAuth] Organisation créée avec trial pour ${user.email}:`,
        organization
      );
    } catch (error) {
      console.error("❌ [OAuth] Erreur avec internalAdapter:", error);

      // Fallback: essayer avec l'adapter normal
      try {
        // Calculer les dates de trial (14 jours)
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

        const organizationData = {
          name: user.name
            ? `Organisation de ${user.name}`
            : `Organisation de ${user.email}`,
          slug: `org-${user.id.slice(-8)}`,
          createdAt: now,
          metadata: JSON.stringify({
            autoCreated: true,
            createdAt: now.toISOString(),
            createdVia: "oauth",
          }),
          // ✅ Ajouter les champs trial
          trialStartDate: now.toISOString(),
          trialEndDate: trialEnd.toISOString(),
          isTrialActive: true,
          hasUsedTrial: true,
        };

        console.log(
          "🔄 [OAuth Fallback] Création organisation avec adapter normal..."
        );

        const organization = await ctx.context.adapter.create({
          model: "organization",
          data: organizationData,
        });

        // Import ObjectId pour la conversion
        const { ObjectId } = await import("mongodb");

        const member = await ctx.context.adapter.create({
          model: "member",
          data: {
            userId: new ObjectId(userId),
            organizationId: new ObjectId(organization.id),
            role: "owner",
            createdAt: now,
          },
        });

        console.log(
          "✅ [OAuth Fallback] Organisation créée avec trial:",
          organization.id
        );
      } catch (fallbackError) {
        console.error(
          "❌ [OAuth Fallback] Erreur même avec le fallback:",
          fallbackError
        );
      }
    }
  }
});
