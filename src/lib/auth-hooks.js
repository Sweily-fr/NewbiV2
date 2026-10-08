import { createAuthMiddleware } from "better-auth/api";
import { sendReactivationEmail } from "./auth-utils";

// Hook "before" global Better Auth. Regroupe :
//  1. le blocage des comptes désactivés à la connexion ;
//  2. le blocage de l'invitation de membre sans abonnement (période d'essai
//     incluse) — enforcement serveur incontournable, en plus du garde UI ;
//  3. le contrôle des rôles des espaces (checkOrganizationRoles).
// NOUVEAU-5 fix: les throw APIError sont OUTSIDE try/catch pour éviter que la
// minification casse le check error.constructor.name.
export const beforeSignInHook = createAuthMiddleware(async (ctx) => {
  // ── 1. Comptes désactivés à la connexion ──
  if (ctx.path === "/sign-in/email") {
    const email = ctx.body?.email;
    if (email) {
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

      // Block deactivated users — throw OUTSIDE try/catch (cannot be swallowed)
      if (!dbCheckFailed && user && user.isActive === false) {
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
    }
  }

  // ── 2. Invitation de membre interdite sans abonnement (essai inclus) ──
  // Pendant l'essai, aucun document `subscription` n'existe (le trial vit sur
  // l'organisation) → on refuse l'invitation. Un plan payant crée un document
  // `subscription` : on laisse alors passer (limites de sièges gérées ailleurs).
  if (ctx.path === "/organization/invite-member") {
    const organizationId =
      ctx.body?.organizationId ||
      ctx.context?.session?.session?.activeOrganizationId;

    if (organizationId) {
      let hasSubscription = false;
      let seatCheckFailed = false;

      try {
        const { getMongoDb } = await import("./mongodb");
        const db = await getMongoDb();
        const subscription = await db
          .collection("subscription")
          .findOne({ referenceId: organizationId });
        hasSubscription = !!subscription;
      } catch (dbError) {
        seatCheckFailed = true;
        console.error(
          "⚠️ [inviteMember] subscription check failed, allowing:",
          dbError?.message,
        );
      }

      // Sans abonnement → invitation refusée. throw OUTSIDE try/catch.
      if (!seatCheckFailed && !hasSubscription) {
        console.warn(
          `[inviteMember] BLOCKING invite for org ${organizationId} — no subscription (trial/none)`,
        );

        const { APIError } = await import("better-auth/api");
        throw new APIError("FORBIDDEN", {
          message:
            "L'invitation de membres nécessite un abonnement payant. Souscrivez à un plan sur newbi.fr pour inviter des collaborateurs.",
        });
      }
    }
  }

  // ── 3. Rôles des espaces : membres, organisation, définition des rôles ──
  await checkOrganizationRoles(ctx);
});

// ── Rôles des espaces (cf. src/lib/organization-roles.js) ──
// Les rôles se définissent par l'API (seul le super admin) : routes de
// Better Auth fermées.
const ROLE_DEFINITION_PATHS = new Set([
  "/organization/create-role",
  "/organization/update-role",
  "/organization/delete-role",
]);

// Inviter, retirer, changer un rôle : droit « Membres » (team = write)
const MEMBER_MANAGEMENT_PATHS = new Set([
  "/organization/invite-member",
  "/organization/update-member-role",
  "/organization/remove-member",
  "/organization/cancel-invitation",
]);

async function forbid(message) {
  const { APIError } = await import("better-auth/api");
  throw new APIError("FORBIDDEN", { message });
}

function requestedRoles(role) {
  return (Array.isArray(role) ? role : [role])
    .flatMap((r) => String(r || "").split(","))
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Contrôle des routes membres et organisation de Better Auth selon la grille
 * Newbi. Les lectures en base sont dans un try/catch fail-closed : un
 * contrôle d'accès qui ne peut pas lire la base refuse.
 */
async function checkOrganizationRoles(ctx) {
  if (ROLE_DEFINITION_PATHS.has(ctx.path)) {
    await forbid(
      "Les rôles se gèrent depuis Paramètres > Membres > Rôles, par le super admin.",
    );
  }

  const isMemberManagement = MEMBER_MANAGEMENT_PATHS.has(ctx.path);
  const isOrgUpdate = ctx.path === "/organization/update";
  if (!isMemberManagement && !isOrgUpdate) return;

  const { getSessionFromCtx } = await import("better-auth/api");
  const session = await getSessionFromCtx(ctx).catch(() => null);
  // Pas de session : Better Auth refusera lui-même la requête
  if (!session?.user?.id) return;

  let denial = null;
  try {
    const { getMongoDb } = await import("./mongodb");
    const { ObjectId } = await import("mongodb");
    const { getAccountLevel, isOwnerRole } =
      await import("./organization-roles");
    const db = await getMongoDb();

    let organizationId =
      ctx.body?.organizationId || session.session?.activeOrganizationId;
    let invitation = null;
    if (ctx.path === "/organization/cancel-invitation") {
      const invitationId = ctx.body?.invitationId;
      invitation = ObjectId.isValid(String(invitationId))
        ? await db
            .collection("invitation")
            .findOne({ _id: new ObjectId(String(invitationId)) })
        : null;
      organizationId = invitation?.organizationId || organizationId;
    }
    if (!organizationId) return;

    const caller = await getAccountLevel(db, {
      userId: session.user.id,
      organizationId,
      moduleKey: isOrgUpdate ? "orgSettings" : "team",
    });
    const callerIsOwner = isOwnerRole(caller.role);

    if (isOrgUpdate) {
      // Archiver l'espace revient à le supprimer : super admin uniquement
      if (ctx.body?.data?.metadata?.archived && !callerIsOwner) {
        denial = "Seul le super admin peut archiver l'espace.";
      } else if (caller.role && caller.level !== "write") {
        denial =
          "Votre rôle ne permet pas de modifier les informations de l'entreprise.";
      }
    } else if (caller.level !== "write") {
      denial = "Votre rôle ne permet pas de gérer les membres de cet espace.";
    } else if (
      (ctx.path === "/organization/invite-member" ||
        ctx.path === "/organization/update-member-role") &&
      requestedRoles(ctx.body?.role).includes("owner")
    ) {
      denial =
        "Le rôle de super admin ne s'attribue pas : le super admin peut le transférer depuis la liste des membres.";
    } else if (
      ctx.path === "/organization/update-member-role" ||
      ctx.path === "/organization/remove-member"
    ) {
      // Le super admin ne se rétrograde ni ne se retire (transfert d'abord)
      const target = ctx.body?.memberId || ctx.body?.memberIdOrEmail;
      const orgObjectId = new ObjectId(String(organizationId));
      const targetMember = ObjectId.isValid(String(target))
        ? await db
            .collection("member")
            .findOne({
              _id: new ObjectId(String(target)),
              organizationId: orgObjectId,
            })
        : null;
      let targetRole = targetMember?.role;
      if (!targetMember && typeof target === "string" && target.includes("@")) {
        const user = await db
          .collection("user")
          .findOne({ email: target.toLowerCase() });
        const byEmail = user
          ? await db
              .collection("member")
              .findOne({ userId: user._id, organizationId: orgObjectId })
          : null;
        targetRole = byEmail?.role;
      }
      if (isOwnerRole(targetRole)) {
        denial =
          "Le super admin ne peut pas être retiré ni changer de rôle. Il doit d'abord transférer son rôle.";
      } else if (
        ctx.path === "/organization/update-member-role" &&
        targetMember &&
        String(targetMember.userId) === String(session.user.id)
      ) {
        // Sans quoi un rôle qui gère les membres pourrait s'attribuer plus
        denial = "Vous ne pouvez pas changer votre propre rôle.";
      }
    }
  } catch (error) {
    console.error(
      "❌ [organizationRolesHook] contrôle impossible:",
      error?.message,
    );
    denial = "Impossible de vérifier vos droits pour le moment. Réessayez.";
  }

  if (denial) await forbid(denial);
}

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
