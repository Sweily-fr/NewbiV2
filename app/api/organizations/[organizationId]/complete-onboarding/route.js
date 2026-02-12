import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * POST /api/organizations/[organizationId]/complete-onboarding
 * Marque l'onboarding comme complété pour une organisation
 * Cette API sert de fallback si Better Auth organization.update échoue
 */
export async function POST(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { organizationId } = await params;

    // Vérifier que l'utilisateur appartient à cette organisation
    const memberCheck = await mongoDb.collection("member").findOne({
      userId: new ObjectId(session.user.id),
      $or: [
        { organizationId: organizationId },
        { organizationId: new ObjectId(organizationId) },
      ],
    });

    if (!memberCheck) {
      console.log(
        `❌ [COMPLETE-ONBOARDING] Membre non trouvé pour userId: ${session.user.id}, orgId: ${organizationId}`
      );
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Vérifier que l'organisation a bien un abonnement actif avant de marquer l'onboarding comme complété
    const subscription = await mongoDb.collection("subscription").findOne({
      $or: [
        { organizationId: organizationId },
        { referenceId: organizationId },
      ],
    });

    const hasActiveSubscription =
      subscription &&
      (subscription.status === "active" ||
        subscription.status === "trialing" ||
        (subscription.status === "canceled" &&
          subscription.periodEnd &&
          new Date(subscription.periodEnd) > new Date()));

    if (!hasActiveSubscription) {
      console.log(
        `❌ [COMPLETE-ONBOARDING] Pas d'abonnement actif pour orgId: ${organizationId}`
      );
      return NextResponse.json(
        { error: "Aucun abonnement actif trouvé" },
        { status: 400 }
      );
    }

    // Mettre à jour l'organisation
    const updateResult = await mongoDb.collection("organization").updateOne(
      {
        $or: [
          { _id: new ObjectId(organizationId) },
          { id: organizationId },
        ],
      },
      {
        $set: {
          onboardingCompleted: true,
          updatedAt: new Date(),
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      console.warn(
        `⚠️ [COMPLETE-ONBOARDING] Organisation non trouvée ou déjà mise à jour: ${organizationId}`
      );
    } else {
      console.log(
        `✅ [COMPLETE-ONBOARDING] onboardingCompleted défini à true pour org: ${organizationId}`
      );
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding complété avec succès",
    });
  } catch (error) {
    console.error("[COMPLETE-ONBOARDING] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
