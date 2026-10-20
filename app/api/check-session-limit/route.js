import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { mongoDb } from "@/src/lib/mongodb";
import { toObjectId, withErrorHandler } from "@/src/lib/security";
import { enforceSessionLimit } from "@/src/lib/enforce-session-limit";
import {
  logSessionRevocation,
  tokenPrefix,
} from "@/src/lib/session-revocation-log";

async function handler() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const userObjectId = toObjectId(session.user.id);
  const now = new Date();

  // Lire les settings de l'organisation (maxSessions, inactivityTimeout).
  // Défaut : 3 sessions simultanées (téléphone, ordinateur, 2e navigateur).
  let maxSessions = 3;
  let inactivityTimeoutHours = 12;
  const orgId = session.session?.activeOrganizationId;

  if (orgId) {
    try {
      const org = await mongoDb
        .collection("organization")
        .findOne(
          { _id: toObjectId(orgId) },
          { projection: { sessionSettings: 1 } },
        );
      if (org?.sessionSettings) {
        maxSessions = org.sessionSettings.maxSessions ?? 3;
        inactivityTimeoutHours = org.sessionSettings.inactivityTimeout ?? 12;
      }
    } catch {
      // Continuer avec les valeurs par défaut
    }
  }

  // Seuil d'inactivité : supprimer les sessions sans activité depuis X heures.
  // IMPORTANT : Better Auth ne rafraîchit session.updatedAt qu'une fois par
  // updateAge (1h, cf. session.updateAge dans src/lib/auth.js). Une session
  // activement utilisée peut donc avoir un updatedAt vieux de presque 1h :
  // sans la marge ci-dessous, tout timeout ≤ 1h supprimait des sessions
  // actives à chaque login (déconnexions "fantômes" sur les autres
  // appareils). Le timeout d'inactivité réel est appliqué côté client par
  // useInactivityDetector ; ce nettoyage n'est qu'un filet de sécurité.
  const SESSION_UPDATE_AGE_MS = 60 * 60 * 1000;
  const inactivityThreshold = new Date(
    now.getTime() -
      (inactivityTimeoutHours * 60 * 60 * 1000 + SESSION_UPDATE_AGE_MS),
  );

  const currentSessionToken = session.session?.token || null;

  // Nettoyer les sessions inactives (updatedAt < seuil).
  // Lecture préalable des victimes pour alimenter le journal des révocations.
  // MOYEN-25 fix: userId is stored as ObjectId in session collection (ADR-004)
  const staleSessions = await mongoDb
    .collection("session")
    .find({
      userId: userObjectId,
      updatedAt: { $lt: inactivityThreshold },
      token: { $ne: currentSessionToken },
    })
    .toArray();

  if (staleSessions.length > 0) {
    await mongoDb.collection("session").deleteMany({
      _id: { $in: staleSessions.map((s) => s._id) },
    });
    await logSessionRevocation({
      mechanism: "inactivity_cleanup",
      trigger: "login_check_route",
      userId: userObjectId,
      revokedSessions: staleSessions,
      keptToken: currentSessionToken,
      meta: { inactivityTimeoutHours, thresholdWithUpdateAgeMargin: true },
    });
  }

  // Auto-révocation : si la limite est dépassée, supprimer les sessions
  // les plus anciennes en conservant la session courante.
  const { revokedCount } = await enforceSessionLimit({
    userObjectId,
    currentSessionToken,
    maxSessions,
    trigger: "login_check_route",
  });

  // Limite déjà appliquée à la création de la session (hook Better Auth) :
  // ces révocations, notées au journal pour cette session, sont annoncées
  // une fois à l'utilisateur (sinon il ne savait pas que ses autres
  // appareils avaient été déconnectés)
  let revokedAtCreation = 0;
  if (currentSessionToken) {
    try {
      const log = mongoDb.collection("session_revocation_log");
      const entries = await log
        .find(
          {
            userId: String(userObjectId),
            mechanism: "max_sessions_limit",
            trigger: "login_session_create",
            keptTokenPrefix: tokenPrefix(currentSessionToken),
            announcedAt: { $exists: false },
          },
          { projection: { revokedCount: 1 } },
        )
        .toArray();
      if (entries.length > 0) {
        revokedAtCreation = entries.reduce(
          (total, entry) => total + (entry.revokedCount || 0),
          0,
        );
        await log.updateMany(
          { _id: { $in: entries.map((entry) => entry._id) } },
          { $set: { announcedAt: now } },
        );
      }
    } catch {
      // Le journal ne doit pas empêcher la vérification
    }
  }

  // Récupérer l'état final des sessions (après nettoyage + révocation)
  const activeSessions = await mongoDb
    .collection("session")
    .find({
      userId: userObjectId,
      expiresAt: { $gt: now },
    })
    .toArray();

  return NextResponse.json({
    hasReachedLimit: false,
    sessionCount: activeSessions.length,
    maxSessions,
    revokedCount: revokedCount + revokedAtCreation,
    // Jetons jamais renvoyés au navigateur (cookie httpOnly) : la session
    // courante est signalée par `isCurrent`, la révocation se fait par id.
    sessions: activeSessions.map((s) => ({
      id: s._id.toString(),
      isCurrent: s.token === currentSessionToken,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
  });
}

export const GET = withErrorHandler(handler);
