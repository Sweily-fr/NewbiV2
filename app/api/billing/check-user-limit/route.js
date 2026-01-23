import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { seatSyncService } from "@/src/services/seatSyncService";

/**
 * API pour vérifier si l'organisation peut inviter un nouveau membre
 * selon les limites de son plan et le rôle demandé
 *
 * Limites :
 * - Freelance : 0 utilisateur, 1 comptable (pas de siège payant)
 * - PME : 10 utilisateurs inclus, 3 comptables, sièges payants possibles (7,49€/mois)
 * - Entreprise : 25 utilisateurs inclus, 5 comptables, sièges payants possibles (7,49€/mois)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { organizationId, role = "member" } = body;

    console.log(
      `🔍 [CHECK-LIMIT] Vérification limite pour org: ${organizationId}, role: ${role}`
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

    // 3. Vérifier la limite via le service avec le rôle
    const result = await seatSyncService.canInviteMember(organizationId, role);

    console.log(`📊 [CHECK-LIMIT] Résultat:`, result);

    // Adapter la réponse pour compatibilité avec l'ancien format
    return NextResponse.json({
      ...result,
      canAdd: result.canInvite, // Compatibilité avec l'ancien nom
    });
  } catch (error) {
    console.error("❌ [CHECK-LIMIT] Erreur:", error);
    return NextResponse.json(
      {
        error: error.message || "Erreur lors de la vérification de la limite",
        canAdd: false,
        canInvite: false,
      },
      { status: 500 }
    );
  }
}
