import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * GET /api/organizations/[organizationId]/subscription
 * Récupère l'abonnement d'une organisation
 */
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { organizationId } = params;

    // Vérifier que l'utilisateur appartient à cette organisation
    // Essayer avec string et ObjectId car le format peut varier
    const memberCheck = await mongoDb.collection("member").findOne({
      userId: new ObjectId(session.user.id),
      $or: [
        { organizationId: organizationId },
        { organizationId: new ObjectId(organizationId) },
      ],
    });

    if (!memberCheck) {
      console.log(
        `❌ Membre non trouvé pour userId: ${session.user.id}, orgId: ${organizationId}`
      );
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Récupérer l'abonnement (peut être stocké avec referenceId ou organizationId)
    const subscription = await mongoDb.collection("subscription").findOne({
      $or: [
        { organizationId: organizationId },
        { referenceId: organizationId },
      ],
    });

    if (!subscription) {
      // Retourner un plan par défaut si pas d'abonnement
      return NextResponse.json({
        plan: "freelance",
        status: "active",
        isDefault: true,
      });
    }

    return NextResponse.json({
      plan: subscription.plan,
      status: subscription.status,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      periodEnd: subscription.periodEnd,
      isDefault: false,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'abonnement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
