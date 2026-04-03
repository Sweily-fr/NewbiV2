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
      "⚠️ Impossible de vérifier le statut du compte, connexion autorisée",
    );
  }
});

// Hook après — combine OAuth callback + nettoyage members après suppression user
export const afterHook = createAuthMiddleware(async (ctx) => {
  // ========================================
  // 1. Nettoyage des members après suppression d'un user (admin/remove-user)
  // ========================================
  if (ctx.path === "/admin/remove-user") {
    const userId = ctx.body?.userId;
    if (userId) {
      try {
        const { getMongoDb } = await import("./mongodb");
        const { ObjectId } = await import("mongodb");
        const db = await getMongoDb();

        // Supprimer tous les members liés à ce userId
        // On cherche avec les deux formats (string et ObjectId) par sécurité
        const userObjectId = new ObjectId(userId);
        const deletedMembers = await db.collection("member").deleteMany({
          $or: [{ userId: userObjectId }, { userId: userId }],
        });

        if (deletedMembers.deletedCount > 0) {
          console.log(
            `🧹 [USER DELETE] ${deletedMembers.deletedCount} member(s) orphelin(s) supprimé(s) pour userId: ${userId}`,
          );
        }
      } catch (error) {
        console.error(
          "❌ [USER DELETE] Erreur nettoyage members orphelins:",
          error,
        );
      }
    }
    return;
  }

  // ========================================
  // 2. OAuth callback — vérification des organisations
  // ========================================
  if (!ctx.path?.includes("/callback/")) {
    return;
  }

  const newSession = ctx.context.newSession;

  if (newSession && newSession.user && newSession.session) {
    const user = newSession.user;
    const userId = newSession.session.userId;

    console.log(
      `✅ [OAuth] Connexion OAuth réussie pour ${user.email} (${userId})`,
    );

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

      if (existingMemberships && existingMemberships.length > 0) {
        console.log(
          `✅ [OAuth] Utilisateur ${userId} a ${existingMemberships.length} organisation(s)`,
        );
      } else {
        console.log(
          `⚠️ [OAuth] Aucune organisation trouvée pour ${userId} - devrait être créée par user.create.after`,
        );
      }
    } catch (checkError) {
      console.error(
        "❌ [OAuth] Erreur vérification organisations:",
        checkError,
      );
    }
  }
});
