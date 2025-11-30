import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { seatSyncService } from "@/src/services/seatSyncService";

/**
 * API pour vérifier si l'organisation peut ajouter un nouvel utilisateur
 * selon les limites de son plan (Freelance: 1, PME: 10, Entreprise: 25)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { organizationId } = body;

    console.log(
      `🔍 [CHECK-LIMIT] Vérification limite pour org: ${organizationId}`
    );

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId requis" },
        { status: 400 }
      );
    }

    // 1. Vérifier la session utilisateur
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // 2. Vérifier si l'utilisateur est membre de l'organisation
    const { mongoDb } = await import("@/src/lib/mongodb");
    const { ObjectId } = await import("mongodb");

    const member = await mongoDb.collection("member").findOne({
      organizationId: new ObjectId(organizationId),
      userId: new ObjectId(session.user.id),
    });

    if (!member) {
      return NextResponse.json(
        { error: "Vous n'êtes pas membre de cette organisation" },
        { status: 403 }
      );
    }

    // 3. Vérifier la limite via le service
    const result = await seatSyncService.canAddMember(organizationId, null);

    console.log(`📊 [CHECK-LIMIT] Résultat:`, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ [CHECK-LIMIT] Erreur:", error);
    return NextResponse.json(
      {
        error: error.message || "Erreur lors de la vérification de la limite",
        canAdd: false,
      },
      { status: 500 }
    );
  }
}
