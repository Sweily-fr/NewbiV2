import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { mongoDb } from "@/src/lib/mongodb";
import { toObjectId, withErrorHandler } from "@/src/lib/security";

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

  // Seuil d'inactivité : supprimer les sessions sans activité depuis X heures
  const inactivityThreshold = new Date(
    now.getTime() - inactivityTimeoutHours * 60 * 60 * 1000,
  );

  // Nettoyer les sessions inactives (updatedAt < seuil) en une seule opération
  // MOYEN-25 fix: userId is stored as ObjectId in session collection (ADR-004)
  await mongoDb.collection("session").deleteMany({
    userId: userObjectId,
    updatedAt: { $lt: inactivityThreshold },
    // Ne pas supprimer la session actuelle
    token: { $ne: session.session?.token },
  });

  // Récupérer les sessions actives restantes (non expirées)
  const activeSessions = await mongoDb
    .collection("session")
    .find({
      userId: userObjectId,
      expiresAt: { $gt: now },
    })
    .toArray();

  const hasReachedLimit = activeSessions.length > maxSessions;

  return NextResponse.json({
    hasReachedLimit,
    sessionCount: activeSessions.length,
    maxSessions,
    currentSessionToken: session.session?.token || null,
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
