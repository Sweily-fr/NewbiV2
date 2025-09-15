import { auth } from "@/src/lib/auth";
import { NextResponse } from "next/server";

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
        { status: 403 }
      );
    }

    // Désactiver le compte (mettre isActive à false) via MongoDB directement
    const { mongoDb } = await import("@/src/lib/mongodb");
    const usersCollection = mongoDb.collection("user");

    const updateResult = await usersCollection.updateOne(
      { _id: new (await import("mongodb")).ObjectId(session.user.id) },
      {
        $set: {
          isActive: false,
          updatedAt: new Date(),
        },
      }
    );

    // Invalider toutes les sessions de l'utilisateur
    await auth.api.signOut({
      headers: request.headers,
    });

    return NextResponse.json({
      success: true,
      message: "Compte désactivé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la désactivation du compte:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
