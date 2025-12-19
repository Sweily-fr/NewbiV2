import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * GET /api/organizations/[organizationId]/seats-info
 * Récupère les informations sur les sièges disponibles pour une organisation
 */
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Next.js 15 : params doit être await avant d'accéder à ses propriétés
    const { organizationId } = await params;

    // Vérifier que l'utilisateur appartient à cette organisation via la collection member
    const memberCheck = await mongoDb.collection("member").findOne({
      userId: new ObjectId(session.user.id),
      organizationId: organizationId,
    });

    if (!memberCheck) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // 1. Récupérer l'abonnement de l'organisation
    const subscription = await mongoDb.collection("subscription").findOne({
      organizationId: organizationId,
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Aucun abonnement trouvé" },
        { status: 404 }
      );
    }

    // 2. Déterminer le nombre de sièges inclus selon le plan
    const planLimits = {
      freelance: { users: 1 },
      pme: { users: 10 },
      entreprise: { users: 25 },
    };

    const includedSeats = planLimits[subscription.plan]?.users || 1;

    // 3. Compter les membres actuels (hors comptables)
    const members = await mongoDb
      .collection("member")
      .find({
        organizationId: organizationId,
        status: { $in: ["active", "pending"] },
      })
      .toArray();

    // Filtrer les membres facturables (tous sauf comptables)
    const billableMembers = members.filter((m) => m.role !== "accountant");
    const currentMembers = billableMembers.length;

    // 4. Calculer les sièges disponibles
    const availableSeats = Math.max(0, includedSeats - currentMembers);

    // 5. Calculer les sièges additionnels déjà utilisés
    const additionalSeats = Math.max(0, currentMembers - includedSeats);

    return NextResponse.json({
      includedSeats,
      currentMembers,
      availableSeats,
      additionalSeats,
      plan: subscription.plan,
      seatCost: 7.49, // Prix par siège additionnel
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des sièges:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
