import { auth } from "@/src/lib/auth";
import { NextResponse } from "next/server";
import { toObjectId } from "@/src/lib/security";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    // Vérifier la session utilisateur
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'email correspond à l'utilisateur connecté
    if (session.user.email !== email) {
      return NextResponse.json(
        { error: "Email non autorisé" },
        { status: 403 },
      );
    }

    // Désactiver le compte (mettre isActive à false) via MongoDB directement
    const { mongoDb } = await import("@/src/lib/mongodb");
    const usersCollection = mongoDb.collection("user");

    await usersCollection.updateOne(
      { _id: new (await import("mongodb")).ObjectId(session.user.id) },
      {
        $set: {
          isActive: false,
          updatedAt: new Date(),
        },
      },
    );

    // Invalider TOUTES les sessions de l'utilisateur (multi-device)
    // signOut only revokes the current session token; deleteMany ensures
    // all devices are logged out immediately (Principle 5 — isActive effect is immediate)
    await mongoDb.collection("session").deleteMany({
      userId: toObjectId(session.user.id),
    });

    return NextResponse.json({
      success: true,
      message: "Compte désactivé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la désactivation du compte:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
