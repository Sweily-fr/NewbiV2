import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { seatSyncService } from "@/src/services/seatSyncService";
import { withErrorHandler } from "@/src/lib/security";
import { getPlanDisplay } from "@/src/lib/plans-display";
import { getPlanLimits, getSeatPrice } from "@/src/lib/plan-limits";

const PLAN_ORDER = ["freelance", "pme", "entreprise"];

// Coût mensuel d'un plan pour un nombre donné de membres facturables
// (prix de base + sièges au-delà de la limite incluse × prix du siège du plan).
function monthlyCostFor(planKey, billableUsers) {
  const display = getPlanDisplay(planKey);
  const limits = getPlanLimits(planKey);
  if (!display) return Infinity;
  const extra = Math.max(0, billableUsers - (limits.invitableUsers ?? 0));
  return display.monthlyPrice + extra * (limits.seatPrice ?? 7.49);
}

// Suggère le plan supérieur le moins cher SI, pour le nombre de membres projeté,
// il revient moins cher (ou égal) que le plan actuel + sièges payants.
// = recommandation « plus judicieuse » fondée sur le coût réel.
function getUpgradeSuggestion(currentPlanKey, projectedBillableUsers) {
  const key = (currentPlanKey || "freelance").toLowerCase();
  const idx = PLAN_ORDER.indexOf(key);
  if (idx === -1) return null;

  const currentMonthly = monthlyCostFor(key, projectedBillableUsers);
  let best = null;
  for (let i = idx + 1; i < PLAN_ORDER.length; i++) {
    const targetKey = PLAN_ORDER[i];
    const targetMonthly = monthlyCostFor(targetKey, projectedBillableUsers);
    if (
      targetMonthly <= currentMonthly &&
      (!best || targetMonthly < best.targetMonthly)
    ) {
      const display = getPlanDisplay(targetKey);
      best = {
        targetPlan: targetKey,
        targetPlanName: display?.displayName ?? targetKey,
        targetMonthly: Math.round(targetMonthly * 100) / 100,
        currentMonthly: Math.round(currentMonthly * 100) / 100,
        savings: Math.round((currentMonthly - targetMonthly) * 100) / 100,
      };
    }
  }
  return best;
}

/**
 * API pour vérifier si l'organisation peut inviter un nouveau membre
 * selon les limites de son plan et le rôle demandé
 *
 * Limites :
 * - Freelance : 0 utilisateur inclus, 1 comptable, sièges payants possibles (7,49€/mois)
 * - PME : 10 utilisateurs inclus, 3 comptables, sièges payants possibles (7,49€/mois)
 * - Entreprise : 25 utilisateurs inclus, 5 comptables, sièges payants possibles (5,99€/mois)
 */
async function handler(request) {
  try {
    const body = await request.json();
    const { organizationId, role = "member" } = body;

    console.log(
      `🔍 [CHECK-LIMIT] Vérification limite pour org: ${organizationId}, role: ${role}`,
    );

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId requis" },
        { status: 400 },
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
        { status: 403 },
      );
    }

    // 3. Vérifier la limite via le service avec le rôle
    const result = await seatSyncService.canInviteMember(organizationId, role);

    console.log(`📊 [CHECK-LIMIT] Résultat:`, result);

    // 3.5. Prix du siège dépendant du plan (Entreprise = 5,99€, sinon 7,49€).
    // Le service renvoie un montant fixe → on le corrige selon le plan réel.
    if (result.isPaid && result.planName) {
      const seatPrice = getSeatPrice(result.planName);
      result.additionalCost = seatPrice;
      if (typeof result.totalAdditionalSeats === "number") {
        result.totalAdditionalCost = result.totalAdditionalSeats * seatPrice;
      }
    }

    // 4. Recommandation d'upgrade (utilisateurs uniquement — les comptables
    // sont gratuits). Projection = membres facturables actuels + celui qu'on
    // s'apprête à inviter.
    let recommendation = null;
    if (role !== "accountant" && typeof result.totalUsers === "number") {
      recommendation = getUpgradeSuggestion(
        result.planName,
        result.totalUsers + 1,
      );
    }

    // Adapter la réponse pour compatibilité avec l'ancien format
    return NextResponse.json({
      ...result,
      recommendation,
      canAdd: result.canInvite, // Compatibilité avec l'ancien nom
    });
  } catch (error) {
    console.error("❌ [CHECK-LIMIT] Erreur:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la vérification de la limite",
        canAdd: false,
        canInvite: false,
      },
      { status: 500 },
    );
  }
}

export const POST = withErrorHandler(handler);
