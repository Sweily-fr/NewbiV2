import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { mongoDb } from "@/src/lib/mongodb";
import { toObjectId } from "@/src/lib/security";

export async function POST() {
  try {
    // Récupérer la session de l'utilisateur connecté
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userObjectId = toObjectId(session.user.id);
    const currentSessionToken = session.session?.token;

    if (!currentSessionToken) {
      return NextResponse.json(
        { error: "Token de session actuelle introuvable" },
        { status: 400 },
      );
    }

    // MOYEN-25 fix: userId is stored as ObjectId in session collection (ADR-004)
    const result = await mongoDb.collection("session").deleteMany({
      userId: userObjectId,
      token: { $ne: currentSessionToken },
    });

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} session(s) révoquée(s)`,
      revokedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ [REVOKE-ALL] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error.message },
      { status: 500 },
    );
  }
}
