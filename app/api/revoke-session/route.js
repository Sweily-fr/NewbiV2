import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { mongoDb } from "@/src/lib/mongodb";
import { withErrorHandler } from "@/src/lib/security";

async function handler(req) {
  console.log("🗑️ [REVOKE-SESSION] Demande de révocation de session...");

  // Récupérer la session de l'utilisateur connecté
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    console.log("❌ [REVOKE-SESSION] Pas de session utilisateur");
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Récupérer le token de la session à révoquer
  const body = await req.json();
  const { sessionToken } = body;

  if (!sessionToken) {
    console.log("❌ [REVOKE-SESSION] Token de session manquant");
    return NextResponse.json(
      { error: "Token de session requis" },
      { status: 400 },
    );
  }

  console.log(
    "🔍 [REVOKE-SESSION] Token à révoquer:",
    sessionToken.substring(0, 10) + "...",
  );
  console.log("👤 [REVOKE-SESSION] Utilisateur:", session.user.id);

  // Récupérer d'abord la session pour vérifier qu'elle existe
  const sessionToRevoke = await mongoDb
    .collection("session")
    .findOne({ token: sessionToken });

  if (!sessionToRevoke) {
    console.log("⚠️ [REVOKE-SESSION] Session non trouvée");
    return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
  }

  console.log("📋 [REVOKE-SESSION] Session trouvée:", {
    userId: sessionToRevoke.userId,
    createdAt: sessionToRevoke.createdAt,
  });

  // Supprimer la session de MongoDB
  const result = await mongoDb.collection("session").deleteOne({
    token: sessionToken,
  });

  console.log("📊 [REVOKE-SESSION] Résultat suppression:", result);

  if (result.deletedCount === 0) {
    console.log("⚠️ [REVOKE-SESSION] Échec de la suppression");
    return NextResponse.json(
      { error: "Échec de la suppression" },
      { status: 500 },
    );
  }

  console.log("✅ [REVOKE-SESSION] Session révoquée avec succès");

  return NextResponse.json({
    success: true,
    message: "Session révoquée",
    revokedSession: {
      token: sessionToken.substring(0, 10) + "...",
      userId: sessionToRevoke.userId,
    },
  });
}

export const POST = withErrorHandler(handler);
