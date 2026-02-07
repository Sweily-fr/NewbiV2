import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userObjectId = new ObjectId(userId);
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
            { _id: new ObjectId(orgId) },
            { projection: { sessionSettings: 1 } }
          );
        if (org?.sessionSettings) {
          maxSessions = org.sessionSettings.maxSessions ?? 1;
          inactivityTimeoutHours = org.sessionSettings.inactivityTimeout ?? 12;
        }
      } catch (e) {
        // Continuer avec les valeurs par défaut
      }
    }

    // Seuil d'inactivité : supprimer les sessions sans activité depuis X heures
    const inactivityThreshold = new Date(
      now.getTime() - inactivityTimeoutHours * 60 * 60 * 1000
    );

    // Nettoyer les sessions inactives (updatedAt < seuil) en une seule opération
    await mongoDb.collection("session").deleteMany({
      $or: [
        { userId: userObjectId },
        { userId: userId },
      ],
      updatedAt: { $lt: inactivityThreshold },
      // Ne pas supprimer la session actuelle
      token: { $ne: session.session?.token },
    });

    // Récupérer les sessions actives restantes (non expirées)
    const activeSessions = await mongoDb
      .collection("session")
      .find({
        $or: [
          { userId: userObjectId },
          { userId: userId },
        ],
        expiresAt: { $gt: now },
      })
      .toArray();

    const hasReachedLimit = activeSessions.length > maxSessions;

    return NextResponse.json({
      hasReachedLimit,
      sessionCount: activeSessions.length,
      maxSessions,
      sessions: activeSessions.map(s => ({
        id: s._id.toString(),
        token: s.token,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error) {
    console.error("❌ [CHECK-SESSION-LIMIT] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}
