import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { SeatSyncService } from "@/src/services/seatSyncService";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const seatSyncService = new SeatSyncService();

/**
 * API pour prévisualiser un changement de plan
 * Calcule le prorata via Stripe et retourne les informations de facturation
 */
export async function POST(request) {
  try {
    // 1. Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // 2. Récupérer les paramètres
    const { newPlan, isAnnual, organizationId } = await request.json();

    if (!newPlan || !organizationId) {
      return NextResponse.json(
        { error: "Plan et organizationId requis" },
        { status: 400 }
      );
    }

    // 3. Récupérer l'abonnement actuel
    const subscription = await mongoDb.collection("subscription").findOne({
      referenceId: organizationId,
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "Aucun abonnement trouvé" },
        { status: 404 }
      );
    }

    const currentPlan = subscription.plan;

    // 4. Vérifier si c'est un downgrade et les limites de sièges
    const planHierarchy = { freelance: 1, pme: 2, entreprise: 3 };
    const isDowngrade = planHierarchy[newPlan] < planHierarchy[currentPlan];
    const isUpgrade = planHierarchy[newPlan] > planHierarchy[currentPlan];

    // Vérifier le nombre de membres actuels pour le downgrade
    let memberCheckResult = null;
    if (isDowngrade) {
      const { ObjectId } = await import("mongodb");
      const members = await mongoDb
        .collection("member")
        .find({ organizationId: new ObjectId(organizationId) })
        .toArray();

      // Récupérer les infos utilisateurs pour chaque membre
      const userIds = members.map((m) => m.userId);
      const users = await mongoDb
        .collection("user")
        .find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } })
        .toArray();

      const userMap = users.reduce((acc, user) => {
        acc[user._id.toString()] = user;
        return acc;
      }, {});

      const billableMembers = members
        .filter((m) => m.role !== "accountant")
        .map((m) => ({
          id: m._id.toString(),
          memberId: m._id.toString(),
          userId: m.userId,
          role: m.role,
          email: userMap[m.userId]?.email || "Email inconnu",
          name: userMap[m.userId]?.name || "Utilisateur",
          createdAt: m.createdAt,
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const currentMemberCount = billableMembers.length;
      const newPlanLimits = seatSyncService.getPlanLimits(newPlan);
      const newLimit = newPlanLimits.users;

      if (currentMemberCount > newLimit) {
        // Identifier les membres à retirer (les plus récents, sauf owner)
        const membersToRemoveCount = currentMemberCount - newLimit;
        const removableMembersList = billableMembers
          .filter((m) => m.role !== "owner")
          .slice(0, membersToRemoveCount);

        memberCheckResult = {
          canDowngrade: false,
          currentMembers: currentMemberCount,
          newLimit: newLimit,
          membersToRemove: membersToRemoveCount,
          membersList: removableMembersList,
          allMembers: billableMembers.filter((m) => m.role !== "owner"),
        };
      } else {
        memberCheckResult = {
          canDowngrade: true,
          currentMembers: currentMemberCount,
          newLimit: newLimit,
        };
      }
    }

    // 5. Récupérer le Price ID du nouveau plan
    const priceIds = {
      freelance: {
        monthly: process.env.STRIPE_FREELANCE_MONTHLY_PRICE_ID,
        annual: process.env.STRIPE_FREELANCE_YEARLY_PRICE_ID,
      },
      pme: {
        monthly: process.env.STRIPE_PME_MONTHLY_PRICE_ID,
        annual: process.env.STRIPE_PME_YEARLY_PRICE_ID,
      },
      entreprise: {
        monthly: process.env.STRIPE_ENTREPRISE_MONTHLY_PRICE_ID,
        annual: process.env.STRIPE_ENTREPRISE_YEARLY_PRICE_ID,
      },
    };

    const newPriceId = isAnnual
      ? priceIds[newPlan]?.annual
      : priceIds[newPlan]?.monthly;

    if (!newPriceId) {
      return NextResponse.json(
        { error: `Price ID non configuré pour le plan ${newPlan}` },
        { status: 500 }
      );
    }

    // 6. Récupérer l'abonnement Stripe actuel
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    // 7. Trouver l'item du plan de base
    const basePlanItem = stripeSubscription.items.data.find(
      (item) => item.price.id !== process.env.STRIPE_SEAT_PRICE_ID
    );

    if (!basePlanItem) {
      return NextResponse.json(
        { error: "Item du plan de base non trouvé" },
        { status: 500 }
      );
    }

    // 8. Définir les prix pour l'affichage
    const planPrices = {
      freelance: { monthly: 14.59, annual: 13.13 },
      pme: { monthly: 48.99, annual: 44.09 },
      entreprise: { monthly: 94.99, annual: 85.49 },
    };

    const currentPrice =
      planPrices[currentPlan]?.[isAnnual ? "annual" : "monthly"] || 0;
    const newPrice =
      planPrices[newPlan]?.[isAnnual ? "annual" : "monthly"] || 0;
    const priceDifference = newPrice - currentPrice;

    // 9. Calculer les dates
    const currentPeriodEnd = stripeSubscription.current_period_end
      ? new Date(stripeSubscription.current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const daysRemaining = Math.max(
      0,
      Math.ceil((currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24))
    );

    // 10. Calculer le prorata manuellement (plus fiable que Stripe createPreview)
    const periodEnd =
      stripeSubscription.current_period_end ||
      Date.now() / 1000 + 30 * 24 * 60 * 60;
    const periodStart =
      stripeSubscription.current_period_start || Date.now() / 1000;
    const now = Math.floor(Date.now() / 1000);
    const totalDays = Math.max(1, (periodEnd - periodStart) / (60 * 60 * 24));
    const remainingDays = Math.max(0, (periodEnd - now) / (60 * 60 * 24));
    const prorationRatio = remainingDays / totalDays;

    // Calcul du prorata : différence de prix × ratio des jours restants
    const prorationAmount = priceDifference * prorationRatio;

    const prorationPreview = {
      totalAmount: prorationAmount,
      prorationAmount: prorationAmount,
      subtotal: prorationAmount,
      amountDue: prorationAmount,
      currency: "EUR",
      daysRemaining: Math.round(remainingDays),
      totalDays: Math.round(totalDays),
      ratio: prorationRatio,
    };

    // 11. Récupérer les limites des plans
    const currentPlanLimits = seatSyncService.getPlanLimits(currentPlan);
    const newPlanLimits = seatSyncService.getPlanLimits(newPlan);

    return NextResponse.json({
      success: true,
      preview: {
        currentPlan: {
          name: currentPlan,
          displayName:
            currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1),
          price: currentPrice,
          limits: currentPlanLimits,
        },
        newPlan: {
          name: newPlan,
          displayName: newPlan.charAt(0).toUpperCase() + newPlan.slice(1),
          price: newPrice,
          limits: newPlanLimits,
        },
        billing: {
          isAnnual,
          billingCycle: isAnnual ? "Annuel" : "Mensuel",
          priceDifference,
          currentPeriodEnd: currentPeriodEnd.toISOString(),
          daysRemaining,
          nextBillingDate: currentPeriodEnd.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        },
        proration: prorationPreview,
        change: {
          isUpgrade,
          isDowngrade,
          effectiveDate: "Immédiat",
          memberCheck: memberCheckResult,
        },
      },
    });
  } catch (error) {
    console.error("❌ [PREVIEW PLAN] Erreur:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la prévisualisation",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
