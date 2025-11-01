import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req) {
  try {
    console.log("🔍 [CHECK-SESSION-LIMIT] Vérification de la limite de sessions...");
    
    // Récupérer la session de l'utilisateur connecté
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      console.log("❌ [CHECK-SESSION-LIMIT] Pas de session utilisateur");
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    console.log("👤 [CHECK-SESSION-LIMIT] Utilisateur ID (string):", session.user.id);
    console.log("👤 [CHECK-SESSION-LIMIT] Type:", typeof session.user.id);

    // Convertir l'ID utilisateur en ObjectId pour MongoDB
    const userObjectId = new ObjectId(session.user.id);
    console.log("👤 [CHECK-SESSION-LIMIT] Utilisateur ID (ObjectId):", userObjectId);

    // Interroger MongoDB directement pour compter les sessions actives
    const now = new Date();
    
    // Essayer avec ObjectId ET avec string (pour compatibilité)
    const activeSessions = await mongoDb
      .collection("session")
      .find({
        $or: [
          { userId: userObjectId }, // Format ObjectId
          { userId: session.user.id }, // Format string
        ],
        expiresAt: { $gt: now }, // Sessions non expirées
      })
      .toArray();

    console.log("📊 [CHECK-SESSION-LIMIT] Sessions actives trouvées:", activeSessions.length);
    console.log("📋 [CHECK-SESSION-LIMIT] Détails sessions:", activeSessions.map(s => ({
      token: s.token?.substring(0, 10) + "...",
      userAgent: s.userAgent?.substring(0, 50),
      createdAt: s.createdAt,
    })));

    // Limite de sessions (doit correspondre à la config dans auth-plugins.js)
    const MAX_SESSIONS = 1;

    const hasReachedLimit = activeSessions.length > MAX_SESSIONS;

    console.log(`${hasReachedLimit ? '⚠️' : '✅'} [CHECK-SESSION-LIMIT] Limite ${hasReachedLimit ? 'atteinte' : 'OK'} (${activeSessions.length}/${MAX_SESSIONS})`);

    return NextResponse.json({
      hasReachedLimit,
      sessionCount: activeSessions.length,
      maxSessions: MAX_SESSIONS,
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
