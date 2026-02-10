import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    // Récupérer la session de l'utilisateur connecté
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
    const currentSessionToken = session.session?.token;

    if (!currentSessionToken) {
      return NextResponse.json(
        { error: "Token de session actuelle introuvable" },
        { status: 400 }
      );
    }

    const userObjectId = new ObjectId(userId);

    // Supprimer toutes les sessions de l'utilisateur SAUF la session actuelle
    const result = await mongoDb
      .collection("session")
      .deleteMany({
        $or: [
          { userId: userObjectId },
          { userId: userId },
        ],
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
      { status: 500 }
    );
  }
}
