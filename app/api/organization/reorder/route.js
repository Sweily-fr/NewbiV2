import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return Response.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { organizationIds } = await request.json();

    if (!Array.isArray(organizationIds)) {
      return Response.json(
        { error: "organizationIds doit être un tableau" },
        { status: 400 }
      );
    }

    console.log(`🔄 [REORDER] Réorganisation pour user ${session.user.id}`);
    console.log(`📋 [REORDER] Nouvel ordre:`, organizationIds);

    // Mettre à jour l'ordre dans la collection member
    const updatePromises = organizationIds.map((orgId, index) => {
      return mongoDb.collection("member").updateOne(
        {
          userId: new ObjectId(session.user.id),
          organizationId: new ObjectId(orgId),
        },
        {
          $set: { order: index },
        }
      );
    });

    await Promise.all(updatePromises);

    console.log(`✅ [REORDER] Ordre sauvegardé avec succès`);

    return Response.json({ success: true });
  } catch (error) {
    console.error("❌ [REORDER] Erreur:", error);
    return Response.json(
      { error: "Erreur lors de la sauvegarde de l'ordre" },
      { status: 500 }
    );
  }
}
