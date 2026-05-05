import { createAuthMiddleware } from "better-auth/api";
import { sendReactivationEmail } from "./auth-utils";

// Hook avant connexion pour vérifier les comptes désactivés
// NOUVEAU-5 fix: APIError throw is OUTSIDE try/catch to prevent
// bundler minification from breaking error.constructor.name check.
export const beforeSignInHook = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== "/sign-in/email") {
    return;
  }

  const email = ctx.body?.email;
  if (!email) {
    return;
  }

  // DB lookup in try/catch — fail-open if DB is temporarily unavailable
  let user = null;
  let dbCheckFailed = false;

  try {
    const { getMongoDb } = await import("./mongodb");
    const db = await getMongoDb();
    user = await db.collection("user").findOne({ email });
  } catch (dbError) {
    dbCheckFailed = true;
    console.error(
      "⚠️ [beforeSignIn] DB check failed, allowing login:",
      dbError?.message,
    );
  }

  if (dbCheckFailed) {
    return; // Fail-open: allow login if DB check failed
  }

  // Block deactivated users — throw OUTSIDE try/catch (cannot be swallowed)
  if (user && user.isActive === false) {
    console.warn(`[beforeSignIn] BLOCKING ${email} — isActive: false`);

    await sendReactivationEmail(user).catch((err) =>
      console.error("Failed to send reactivation email:", err?.message),
    );

    const { APIError } = await import("better-auth/api");
    throw new APIError("BAD_REQUEST", {
      message:
        "Votre compte a été désactivé. Un email de réactivation vous a été envoyé.",
    });
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
