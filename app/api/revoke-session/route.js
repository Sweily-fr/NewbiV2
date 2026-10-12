import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { mongoDb } from "@/src/lib/mongodb";
import { toObjectId, withErrorHandler } from "@/src/lib/security";

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

  // Session à révoquer : par son id (page Appareils) ou, pour les anciens
  // appels, par son jeton
  const body = await req.json();
  const { sessionId, sessionToken } = body || {};
  const byId =
    typeof sessionId === "string" && /^[0-9a-f]{24}$/.test(sessionId);

  if (!byId && (!sessionToken || typeof sessionToken !== "string")) {
    console.log("❌ [REVOKE-SESSION] Token de session manquant");
    return NextResponse.json(
      { error: "Token de session requis" },
      { status: 400 },
    );
  }

  console.log("👤 [REVOKE-SESSION] Utilisateur:", session.user.id);

  // Seules les sessions de l'utilisateur connecté peuvent être révoquées :
  // le filtre porte aussi sur son id (stocké en ObjectId, ou en chaîne sur
  // d'anciens documents). Une session d'un autre compte = introuvable.
  const ownSessionFilter = {
    ...(byId ? { _id: toObjectId(sessionId) } : { token: sessionToken }),
    userId: { $in: [toObjectId(session.user.id), String(session.user.id)] },
  };
  const sessionToRevoke = await mongoDb
    .collection("session")
    .findOne(ownSessionFilter);

  if (!sessionToRevoke) {
    console.log("⚠️ [REVOKE-SESSION] Session non trouvée");
    return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
  }

  console.log("📋 [REVOKE-SESSION] Session trouvée:", {
    userId: sessionToRevoke.userId,
    createdAt: sessionToRevoke.createdAt,
  });

  // Supprimer la session de MongoDB
  const result = await mongoDb
    .collection("session")
    .deleteOne(ownSessionFilter);

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
    revokedSession: { id: sessionToRevoke._id.toString() },
  });
}

export const POST = withErrorHandler(handler);
