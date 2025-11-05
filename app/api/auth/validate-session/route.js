import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { mongoDb } from "@/src/lib/mongodb";

/**
 * API pour valider si une session existe toujours dans MongoDB
 * Utilisé par useSessionValidator pour détecter les sessions révoquées
 */
export async function GET(req) {
  try {
    console.log("🔍 [VALIDATE-SESSION] Validation de la session...");
    
    // Récupérer la session de l'utilisateur connecté
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      console.log("❌ [VALIDATE-SESSION] Pas de session utilisateur");
      return NextResponse.json(
        { valid: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    console.log("👤 [VALIDATE-SESSION] Utilisateur:", session.user.id);
    console.log("🔑 [VALIDATE-SESSION] Session token:", session.session?.token?.substring(0, 10) + "...");

    // Vérifier si la session existe toujours dans MongoDB
    const sessionToken = session.session?.token;
    
    if (!sessionToken) {
      console.log("❌ [VALIDATE-SESSION] Token de session manquant");
      return NextResponse.json(
        { valid: false, error: "Token manquant" },
        { status: 401 }
      );
    }

    // Chercher la session dans MongoDB
    const now = new Date();
    const dbSession = await mongoDb
      .collection("session")
      .findOne({
        token: sessionToken,
        expiresAt: { $gt: now }, // Session non expirée
      });

    if (!dbSession) {
      console.log("❌ [VALIDATE-SESSION] Session non trouvée ou expirée dans MongoDB");
      return NextResponse.json(
        { valid: false, error: "Session révoquée ou expirée" },
        { status: 401 }
      );
    }

    console.log("✅ [VALIDATE-SESSION] Session valide");
    console.log("📋 [VALIDATE-SESSION] Détails:", {
      userId: dbSession.userId,
      createdAt: dbSession.createdAt,
      expiresAt: dbSession.expiresAt,
    });

    return NextResponse.json({
      valid: true,
      session: {
        userId: dbSession.userId?.toString(),
        createdAt: dbSession.createdAt,
        expiresAt: dbSession.expiresAt,
      },
    });
  } catch (error) {
    console.error("❌ [VALIDATE-SESSION] Erreur:", error);
    return NextResponse.json(
      { valid: false, error: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}
