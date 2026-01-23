import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { getPlanLimits } from "@/src/lib/plan-limits";

/**
 * API pour vérifier si un changement de rôle est autorisé
 * Vérifie notamment la limite de comptables
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { organizationId, memberId, currentRole, newRole } = body;

    console.log(
      `🔍 [CHECK-ROLE] Vérification changement: ${currentRole} → ${newRole}`
    );

    if (!organizationId || !newRole) {
      return NextResponse.json(
        { error: "organizationId et newRole requis" },
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

    // 2. Récupérer l'abonnement et les membres
    const { mongoDb } = await import("@/src/lib/mongodb");
    const { ObjectId } = await import("mongodb");

    const subscription = await mongoDb.collection("subscription").findOne({
      referenceId: organizationId,
    });

    if (!subscription) {
      return NextResponse.json(
        { canChange: false, reason: "Aucun abonnement actif." },
        { status: 200 }
      );
    }

    // 3. Si le nouveau rôle n'est pas comptable, pas de restriction
    if (newRole !== "accountant") {
      return NextResponse.json({
        canChange: true,
        reason: "OK",
      });
    }

    // 4. Vérifier la limite de comptables
    const planLimits = getPlanLimits(subscription.plan);

    // Compter les comptables actuels
    const members = await mongoDb
      .collection("member")
      .find({ organizationId: new ObjectId(organizationId) })
      .toArray();

    const currentAccountants = members.filter(
      (m) => m.role === "accountant"
    ).length;

    // Compter les invitations comptables pending
    const pendingAccountants = await mongoDb
      .collection("invitation")
      .countDocuments({
        organizationId: new ObjectId(organizationId),
        role: "accountant",
        status: "pending",
      });

    const totalAccountants = currentAccountants + pendingAccountants;

    // Si le membre actuel est déjà comptable, il ne compte pas dans le total
    const adjustedTotal =
      currentRole === "accountant" ? totalAccountants - 1 : totalAccountants;

    console.log(`📊 [CHECK-ROLE] Comptables:`, {
      current: currentAccountants,
      pending: pendingAccountants,
      total: totalAccountants,
      adjusted: adjustedTotal,
      limit: planLimits.accountants,
    });

    if (adjustedTotal >= planLimits.accountants) {
      return NextResponse.json({
        canChange: false,
        reason: `Limite de ${planLimits.accountants} comptable(s) atteinte pour le plan ${subscription.plan.toUpperCase()}. Passez à un plan supérieur pour ajouter plus de comptables.`,
        currentAccountants,
        pendingAccountants,
        limit: planLimits.accountants,
      });
    }

    return NextResponse.json({
      canChange: true,
      reason: "OK",
      currentAccountants: adjustedTotal,
      limit: planLimits.accountants,
      available: planLimits.accountants - adjustedTotal - 1,
    });
  } catch (error) {
    console.error("❌ [CHECK-ROLE] Erreur:", error);
    return NextResponse.json(
      {
        error: error.message || "Erreur lors de la vérification",
        canChange: false,
      },
      { status: 500 }
    );
  }
}
