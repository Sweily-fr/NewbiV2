import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return Response.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Réinitialiser l'état du tutoriel
    await mongoDb.collection("user").updateOne(
      { _id: new ObjectId(session.user.id) },
      {
        $set: {
          hasCompletedTutorial: false,
        },
        $unset: {
          tutorialCompletedAt: "",
        },
      }
    );

    return Response.json({
      success: true,
      message: "Tutoriel réinitialisé",
    });
  } catch (error) {
    console.error("Erreur lors de la réinitialisation du tutoriel:", error);
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
