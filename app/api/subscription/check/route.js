import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * API interne pour vérifier si un utilisateur a un abonnement actif
 * Appelée par le middleware pour vérifier l'accès au dashboard
 *
 * @param {Request} request
 * @returns {Response} JSON avec hasSubscription et reason
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const organizationId = searchParams.get("organizationId");

    if (!userId) {
      return Response.json(
        { hasSubscription: false, reason: "missing_user_id" },
        { status: 400 }
      );
    }

    console.log(`[API/subscription/check] userId: ${userId}, orgId: ${organizationId}`);

    const userObjectId = new ObjectId(userId);

    // 1. Récupérer l'organisation active de l'utilisateur
    let activeOrgId = organizationId;

    if (!activeOrgId) {
      // Fallback: Trouver une organisation où l'utilisateur est membre
      // Priorité: owner > admin > member > viewer
      const members = await mongoDb
        .collection("member")
        .find({ userId: userObjectId })
        .toArray();

      if (!members || members.length === 0) {
        console.log("[API/subscription/check] Utilisateur sans organisation");
        return Response.json({
          hasSubscription: false,
          reason: "no_organization",
        });
      }

      // Trier par priorité de rôle
      const rolePriority = { owner: 0, admin: 1, member: 2, viewer: 3, accountant: 2 };
      members.sort((a, b) => {
        const priorityA = rolePriority[a.role] ?? 99;
        const priorityB = rolePriority[b.role] ?? 99;
        return priorityA - priorityB;
      });

      activeOrgId = members[0].organizationId.toString();
      console.log(`[API/subscription/check] Organisation trouvée via membership: ${activeOrgId}`);
    }

    // 2. Vérifier si l'organisation a un abonnement actif
    const subscription = await mongoDb.collection("subscription").findOne({
      referenceId: activeOrgId,
    });

    if (!subscription) {
      console.log(`[API/subscription/check] Aucun abonnement pour org: ${activeOrgId}`);
      return Response.json({
        hasSubscription: false,
        reason: "no_subscription",
      });
    }

    console.log(`[API/subscription/check] Abonnement trouvé - Status: ${subscription.status}`);

    // 3. Vérifier si l'abonnement est valide
    const isActive =
      subscription.status === "active" || subscription.status === "trialing";

    // Vérifier si canceled mais encore dans la période payée
    const isCanceledButValid =
      subscription.status === "canceled" &&
      subscription.periodEnd &&
      new Date(subscription.periodEnd) > new Date();

    if (isActive || isCanceledButValid) {
      return Response.json({
        hasSubscription: true,
        status: subscription.status,
        plan: subscription.plan,
        periodEnd: subscription.periodEnd,
      });
    }

    console.log("[API/subscription/check] Abonnement expiré ou invalide");
    return Response.json({
      hasSubscription: false,
      reason: "subscription_expired",
      status: subscription.status,
    });
  } catch (error) {
    console.error("[API/subscription/check] Erreur:", error);
    return Response.json(
      { hasSubscription: false, reason: "error", error: error.message },
      { status: 500 }
    );
  }
}
