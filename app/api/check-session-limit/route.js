import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { mongoDb } from "@/src/lib/mongodb";
import { toObjectId, withErrorHandler } from "@/src/lib/security";
import { enforceSessionLimit } from "@/src/lib/enforce-session-limit";

async function handler() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const userObjectId = toObjectId(session.user.id);
  const now = new Date();

  // Lire les settings de l'organisation (maxSessions, inactivityTimeout)
  let maxSessions = 1;
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
        maxSessions = org.sessionSettings.maxSessions ?? 1;
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

  // Nettoyer les sessions inactives (updatedAt < seuil) en une seule opération
  // MOYEN-25 fix: userId is stored as ObjectId in session collection (ADR-004)
  await mongoDb.collection("session").deleteMany({
    userId: userObjectId,
    updatedAt: { $lt: inactivityThreshold },
    token: { $ne: currentSessionToken },
  });

  // Auto-révocation : si la limite est dépassée, supprimer les sessions
  // les plus anciennes en conservant la session courante.
  const { revokedCount } = await enforceSessionLimit({
    userObjectId,
    currentSessionToken,
    maxSessions,
  });

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
    revokedCount,
    currentSessionToken,
    sessions: activeSessions.map((s) => ({
      id: s._id.toString(),
      token: s.token,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
  });
}

export const GET = withErrorHandler(handler);
