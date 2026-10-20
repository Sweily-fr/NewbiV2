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

  // ── 2 bis. Plafonds de l'offre : rôles, sièges, espaces ──
  await checkPlanLimits(ctx);

  // ── 3. Rôles des espaces : membres, organisation, définition des rôles ──
  await checkOrganizationRoles(ctx);

  // ── 4. Liste des membres : tri et filtre limités à l'identité ──
  await checkMemberListQuery(ctx);
});

// ── Rôles des espaces (cf. src/lib/organization-roles.js) ──
// Les rôles se définissent par l'API (seul le super admin) : routes de
// Better Auth fermées.
const ROLE_DEFINITION_PATHS = new Set([
  "/organization/create-role",
  "/organization/update-role",
  "/organization/delete-role",
]);

// Inviter, retirer, changer un rôle : cases de la page « Membres »
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

// Rôles prédéfinis soumis à l'offre (availableRoles de plan-limits) ; les
// rôles personnalisés de l'espace sont proposés sur toutes les offres.
const PLAN_ROLE_LABELS = {
  admin: "Administrateur",
  member: "Éditeur",
  viewer: "Membre",
  accountant: "Comptable",
};

/**
 * Plafonds de l'offre (src/lib/plan-limits.js) que l'interface applique et
 * que le serveur fait respecter face à un appel direct à Better Auth :
 *   - rôles proposés (pas d'Administrateur sur l'offre d'entrée), à
 *     l'invitation comme au changement de rôle ;
 *   - sièges, par le même calcul que l'interface (canInviteMember) ;
 *   - espaces : un nouvel espace se crée avec son abonnement (création au
 *     paiement), /organization/create ne sert qu'au tout premier.
 * Fail-open sur une erreur de lecture, comme le contrôle d'abonnement.
 */
async function checkPlanLimits(ctx) {
  const isInvite = ctx.path === "/organization/invite-member";
  const isRoleChange = ctx.path === "/organization/update-member-role";
  const isCreate = ctx.path === "/organization/create";
  if (!isInvite && !isRoleChange && !isCreate) return;

  const { getSessionFromCtx } = await import("better-auth/api");
  const session = await getSessionFromCtx(ctx).catch(() => null);
  // Pas de session : Better Auth refusera lui-même la requête
  if (!session?.user?.id) return;

  let denial = null;
  try {
    const { getMongoDb } = await import("./mongodb");
    const { ObjectId } = await import("mongodb");
    const db = await getMongoDb();

    if (isCreate) {
      const userId = String(session.user.id);
      const membership = await db.collection("member").findOne(
        {
          userId: {
            $in: ObjectId.isValid(userId)
              ? [new ObjectId(userId), userId]
              : [userId],
          },
        },
        { projection: { _id: 1 } },
      );
      if (membership) {
        denial =
          "Un nouvel espace se crée avec son propre abonnement, depuis la création d'espace du tableau de bord.";
      }
    } else {
      const organizationId =
        ctx.body?.organizationId || session.session?.activeOrganizationId;
      if (organizationId) {
        const roles = requestedRoles(ctx.body?.role);
        const subscription = await db
          .collection("subscription")
          .findOne({ referenceId: String(organizationId) });
        const { getPlanLimits } = await import("./plan-limits");
        const available = getPlanLimits(subscription?.plan).availableRoles;
        const unavailable = roles.find(
          (r) => PLAN_ROLE_LABELS[r] && !available?.includes(r),
        );
        if (unavailable) {
          denial = `Le rôle ${PLAN_ROLE_LABELS[unavailable]} n'est pas compris dans votre offre.`;
        } else if (isInvite) {
          const { seatSyncService } =
            await import("../services/seatSyncService.js");
          const seats = await seatSyncService.canInviteMember(
            String(organizationId),
            roles.length === 1 ? roles[0] : roles.join(",") || "member",
          );
          if (!seats?.canInvite) {
            denial =
              seats?.reason || "Limite de membres atteinte pour votre offre.";
          }
        }
      }
    }
  } catch (error) {
    console.error(
      "⚠️ [planLimits] contrôle impossible, autorisé :",
      error?.message,
    );
  }

  if (denial) await forbid(denial);
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
    const { getAccountActions, getRoleAccountPowers, isOwnerRole } =
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

    const caller = await getAccountActions(db, {
      userId: session.user.id,
      organizationId,
      moduleKey: isOrgUpdate ? "orgSettings" : "team",
    });
    const callerIsOwner = isOwnerRole(caller.role);
    // Rôle du membre visé (changement de rôle, retrait), lu plus bas
    let targetRole = null;
    // Case de la page Membres exigée par chaque route
    const requiredTeamAction = {
      "/organization/invite-member": "invite",
      "/organization/cancel-invitation": "invite",
      "/organization/update-member-role": "changeRole",
      "/organization/remove-member": "remove",
    }[ctx.path];

    if (isOrgUpdate) {
      // Archiver l'espace revient à le supprimer : super admin uniquement
      if (ctx.body?.data?.metadata?.archived && !callerIsOwner) {
        denial = "Seul le super admin peut archiver l'espace.";
      } else if (caller.role && !caller.actions.includes("edit")) {
        denial =
          "Votre rôle ne permet pas de modifier les informations de l'entreprise.";
      }
    } else if (!caller.actions.includes(requiredTeamAction)) {
      denial = {
        invite: "Votre rôle ne permet pas d'inviter des membres.",
        changeRole: "Votre rôle ne permet pas de changer les rôles.",
        remove: "Votre rôle ne permet pas de retirer des membres.",
      }[requiredTeamAction];
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
        ? await db.collection("member").findOne({
            _id: new ObjectId(String(target)),
            organizationId: orgObjectId,
          })
        : null;
      targetRole = targetMember?.role;
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

    // Pas de rôle plus élevé que le sien : hors super admin, on n'attribue
    // (invitation, changement de rôle) qu'un rôle dont les pouvoirs sur le
    // compte (membres, informations de l'entreprise, applications,
    // abonnement) sont aussi les siens, et on ne modifie ni ne retire un
    // membre qui en a davantage. Sans quoi un rôle qui gère les membres
    // invitait une autre de ses adresses comme Administrateur.
    if (!denial && !isOrgUpdate && !callerIsOwner) {
      const own = await getRoleAccountPowers(db, {
        organizationId,
        role: caller.role,
      });
      const exceedsOwn = (powers) => [...powers].some((p) => !own.has(p));
      if (
        ctx.path === "/organization/invite-member" ||
        ctx.path === "/organization/update-member-role"
      ) {
        for (const role of requestedRoles(ctx.body?.role)) {
          const powers = await getRoleAccountPowers(db, {
            organizationId,
            role,
          });
          if (exceedsOwn(powers)) {
            denial =
              "Vous ne pouvez pas attribuer un rôle qui a plus de droits que le vôtre sur le compte (membres, informations de l'entreprise, applications, abonnement).";
            break;
          }
        }
      }
      if (!denial && targetRole) {
        const powers = await getRoleAccountPowers(db, {
          organizationId,
          role: targetRole,
        });
        if (exceedsOwn(powers)) {
          denial =
            "Vous ne pouvez pas modifier ni retirer un membre qui a plus de droits que vous sur le compte.";
        }
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

// ── Visibilité des membres et invitations (cf. security/members-visibility.js) ──
// Le plugin organisation renvoie à tout membre la liste complète des membres
// (rôles, dates) et des invitations en attente. Ces lectures suivent la
// règle de la route /api/organizations/[organizationId]/members : complètes
// avec « Voir les membres », sinon l'identité des autres membres seulement.
const MEMBER_VISIBILITY_PATHS = new Set([
  "/organization/get-full-organization",
  "/organization/list-members",
  "/organization/list-invitations",
  "/organization/get-active-member-role",
]);

/**
 * Espace visé par une lecture du plugin, résolu comme lui : slug, sinon
 * organizationId, sinon espace actif de la session.
 */
async function resolveQueryOrganizationId(ctx, db, session) {
  const slug = ctx.query?.organizationSlug;
  if (slug) {
    const organization = await db
      .collection("organization")
      .findOne({ slug: String(slug) }, { projection: { _id: 1 } });
    return organization?._id ? String(organization._id) : null;
  }
  return (
    ctx.query?.organizationId || session?.session?.activeOrganizationId || null
  );
}

/**
 * list-members : un tri ou un filtre sur le rôle (ou la date d'arrivée)
 * révélerait par le nombre ou l'ordre des résultats ce que la réponse
 * filtrée cache. Sans « Voir les membres », seuls les champs d'identité
 * sont acceptés. Fail-closed si les droits ne peuvent pas être lus.
 */
async function checkMemberListQuery(ctx) {
  if (ctx.path !== "/organization/list-members") return;

  const { IDENTITY_MEMBER_QUERY_FIELDS, getMembersVisibility } =
    await import("./security/members-visibility");
  const queriedFields = [ctx.query?.filterField, ctx.query?.sortBy].filter(
    Boolean,
  );
  if (queriedFields.every((f) => IDENTITY_MEMBER_QUERY_FIELDS.has(String(f)))) {
    return;
  }

  const { getSessionFromCtx } = await import("better-auth/api");
  const session = await getSessionFromCtx(ctx).catch(() => null);
  // Pas de session : Better Auth refusera lui-même la requête
  if (!session?.user?.id) return;

  let denial = null;
  try {
    const { getMongoDb } = await import("./mongodb");
    const db = await getMongoDb();
    const organizationId = await resolveQueryOrganizationId(ctx, db, session);
    const { canViewTeam } = organizationId
      ? await getMembersVisibility(db, {
          userId: session.user.id,
          organizationId,
        })
      : { canViewTeam: false };
    if (!canViewTeam) {
      denial =
        "Votre rôle ne permet pas de trier ni de filtrer les membres sur ce champ.";
    }
  } catch (error) {
    console.error(
      "❌ [membersVisibility] contrôle impossible:",
      error?.message,
    );
    denial = "Impossible de vérifier vos droits pour le moment. Réessayez.";
  }

  if (denial) await forbid(denial);
}

/**
 * Filtre la réponse d'une lecture des membres ou des invitations selon les
 * droits de l'appelant sur l'espace concerné. Ne renvoie rien (réponse
 * inchangée) quand l'appelant a le droit de tout voir. Si les droits ne
 * peuvent pas être lus, la réponse est restreinte (fail-closed) ; l'appelant
 * garde toujours sa propre adhésion.
 */
async function filterMembersVisibility(ctx) {
  const returned = ctx.context?.returned;
  // Erreur du plugin ou réponse vide : rien à filtrer
  if (!returned || typeof returned !== "object" || returned instanceof Error) {
    return;
  }

  const session =
    ctx.context.session ||
    (await import("better-auth/api")
      .then(({ getSessionFromCtx }) => getSessionFromCtx(ctx))
      .catch(() => null));
  const userId = session?.user?.id || null;

  // Son propre rôle : toujours visible
  const otherUserId =
    ctx.path === "/organization/get-active-member-role"
      ? ctx.query?.userId
      : null;
  if (
    ctx.path === "/organization/get-active-member-role" &&
    (!otherUserId || String(otherUserId) === String(userId))
  ) {
    return;
  }

  const visibilityModule = await import("./security/members-visibility");
  let visibility = visibilityModule.RESTRICTED_VISIBILITY;
  try {
    const { getMongoDb } = await import("./mongodb");
    const db = await getMongoDb();
    let organizationId = null;
    if (ctx.path === "/organization/get-full-organization") {
      organizationId = returned.id;
    } else if (ctx.path === "/organization/list-members") {
      organizationId = returned.members?.[0]?.organizationId;
      // Liste vide : rien à cacher
      if (!organizationId) return;
    } else if (ctx.path === "/organization/list-invitations") {
      organizationId = Array.isArray(returned)
        ? returned[0]?.organizationId
        : null;
      if (!organizationId) return;
    } else {
      organizationId = await resolveQueryOrganizationId(ctx, db, session);
    }
    if (userId && organizationId) {
      visibility = await visibilityModule.getMembersVisibility(db, {
        userId,
        organizationId,
      });
    }
  } catch (error) {
    console.error(
      "❌ [membersVisibility] droits illisibles, réponse restreinte:",
      error?.message,
    );
  }

  if (visibility.canViewTeam && visibility.canViewInvitations) return;
  const scope = { userId, ...visibility };

  switch (ctx.path) {
    case "/organization/get-full-organization":
      return ctx.json(visibilityModule.filterFullOrganization(returned, scope));
    case "/organization/list-members":
      return ctx.json(visibilityModule.filterMemberList(returned, scope));
    case "/organization/list-invitations":
      return ctx.json(visibilityModule.filterInvitations(returned, scope));
    default: {
      const role = visibilityModule.visibleRoleOfOtherMember(
        returned.role,
        scope,
      );
      if (role === null) {
        await forbid(
          "Votre rôle ne permet pas de consulter le rôle des autres membres.",
        );
      }
      return ctx.json({ ...returned, role });
    }
  }
}

// Hook après — visibilité des membres, OAuth callback, nettoyage members
// après suppression user
export const afterHook = createAuthMiddleware(async (ctx) => {
  // ========================================
  // 0. Lectures des membres et invitations filtrées selon les droits
  // ========================================
  if (MEMBER_VISIBILITY_PATHS.has(ctx.path)) {
    return filterMembersVisibility(ctx);
  }

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
  // 2. Mot de passe changé : les autres sessions sont fermées
  // ========================================
  if (ctx.path === "/change-password") {
    const { getSessionFromCtx, isAPIError } = await import("better-auth/api");
    const returned = ctx.context?.returned;
    if (!returned || isAPIError(returned)) return;
    try {
      const current = await getSessionFromCtx(ctx);
      const userId = current?.user?.id || current?.session?.userId;
      // revokeOtherSessions demandé par le client : Better Auth a déjà
      // remplacé la session, on garde la nouvelle (returned.token)
      const keepToken = returned.token || current?.session?.token;
      if (userId && keepToken) {
        const { revokeSessionsAfterPasswordChange } =
          await import("./revoke-sessions-after-password");
        await revokeSessionsAfterPasswordChange({
          userId,
          keepToken,
          trigger: "change_password",
        });
      }
    } catch (error) {
      console.error(
        "❌ [PASSWORD] Fermeture des autres sessions :",
        error?.message,
      );
    }
    return;
  }

  // ========================================
  // 3. OAuth callback — vérification des organisations
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
