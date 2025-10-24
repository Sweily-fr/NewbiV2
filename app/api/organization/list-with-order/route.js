import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return Response.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer les membres de l'utilisateur avec l'ordre
    const members = await mongoDb
      .collection("member")
      .find({ userId: new ObjectId(session.user.id) })
      .toArray();

    // Récupérer les organisations correspondantes
    const organizationIds = members.map((m) => m.organizationId);
    const organizations = await mongoDb
      .collection("organization")
      .find({ _id: { $in: organizationIds } })
      .toArray();

    // Fusionner les données : ajouter le champ order à chaque organisation
    const organizationsWithOrder = organizations.map((org) => {
      const member = members.find(
        (m) => m.organizationId.toString() === org._id.toString()
      );
      return {
        id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        createdAt: org.createdAt,
        metadata: org.metadata,
        order: member?.order ?? 999, // Si pas d'ordre, mettre à la fin
      };
    });

    // Trier par ordre
    organizationsWithOrder.sort((a, b) => a.order - b.order);

    return Response.json({ organizations: organizationsWithOrder });
  } catch (error) {
    console.error("❌ [LIST-ORG] Erreur:", error);
    return Response.json(
      { error: "Erreur lors de la récupération des organisations" },
      { status: 500 }
    );
  }
}
