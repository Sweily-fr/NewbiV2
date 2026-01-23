import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return Response.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'état du tutoriel depuis la base de données
    const user = await mongoDb.collection("user").findOne({
      _id: new ObjectId(session.user.id),
    });

    return Response.json({
      hasCompletedTutorial: user?.hasCompletedTutorial ?? false,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du statut du tutoriel:",
      error
    );
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
