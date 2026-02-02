import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { SeatSyncService } from "@/src/services/seatSyncService";
import crypto from "crypto";
import { ObjectId } from "mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const seatSyncService = new SeatSyncService();

// ✅ CRITIQUE #2: Plans valides (whitelist)
const VALID_PLANS = ["freelance", "pme", "entreprise"];

// États d'abonnement problématiques qui bloquent les changements
const BLOCKED_SUBSCRIPTION_STATES = [
  "past_due",
  "unpaid",
  "incomplete",
  "incomplete_expired",
];

// ✅ CRITIQUE #7: Vérifier que le secret est configuré
function getSigningSecret() {
  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET environment variable is required");
  }
  return process.env.BETTER_AUTH_SECRET;
}

/**
 * Génère un token de validation pour sécuriser le changement de plan
 * Ce token capture l'état actuel et expire après 5 minutes
 */
function generatePreviewToken(data) {
  const payload = {
    organizationId: data.organizationId,
    currentPlan: data.currentPlan,
    newPlan: data.newPlan,
    isAnnual: data.isAnnual,
    memberCount: data.memberCount,
    pendingInvitationCount: data.pendingInvitationCount,
    paidSeatsCount: data.paidSeatsCount,
    timestamp: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  };

  const payloadString = JSON.stringify(payload);
  // ✅ CRITIQUE #7: Utiliser le secret sécurisé
  const signature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payloadString)
    .digest("hex");

  return Buffer.from(JSON.stringify({ payload, signature })).toString("base64");
}

/**
 * API pour prévisualiser un changement de plan
 * Calcule le prorata et retourne les informations de facturation
 * Génère un token de validation pour sécuriser le changement
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

    // ✅ CRITIQUE #2: Valider le nom du plan (whitelist)
    if (!VALID_PLANS.includes(newPlan)) {
      return NextResponse.json(
        { error: "Plan invalide", validPlans: VALID_PLANS },
        { status: 400 }
      );
    }

    // ✅ CRITIQUE #1: Vérifier que l'utilisateur est owner de l'organisation
    const member = await mongoDb.collection("member").findOne({
      userId: new ObjectId(session.user.id),
      organizationId: new ObjectId(organizationId),
    });

    if (!member) {
      return NextResponse.json(
        { error: "Vous n'êtes pas membre de cette organisation" },
        { status: 403 }
      );
    }

    if (member.role !== "owner") {
      return NextResponse.json(
        { error: "Seul le propriétaire de l'organisation peut prévisualiser un changement de plan" },
        { status: 403 }
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

    // 4. Récupérer l'abonnement Stripe pour vérifier l'état
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    // ✅ AMÉLIORATION CRITIQUE #3: Vérifier les états problématiques
    if (BLOCKED_SUBSCRIPTION_STATES.includes(stripeSubscription.status)) {
      const statusMessages = {
        past_due:
          "Votre paiement est en retard. Veuillez régulariser votre situation avant de changer de plan.",
        unpaid:
          "Votre abonnement est impayé. Veuillez effectuer le paiement avant de changer de plan.",
        incomplete:
          "Votre abonnement est incomplet. Veuillez finaliser le paiement initial.",
        incomplete_expired:
          "Votre session de paiement a expiré. Veuillez renouveler votre abonnement.",
      };

      return NextResponse.json(
        {
          error: "Changement de plan impossible",
          message:
            statusMessages[stripeSubscription.status] ||
            "Votre abonnement présente un problème. Contactez le support.",
          subscriptionStatus: stripeSubscription.status,
          blockedState: true,
        },
        { status: 400 }
      );
    }

    // 5. Vérifier si c'est un downgrade et les limites de sièges
    const planHierarchy = { freelance: 1, pme: 2, entreprise: 3 };
    const isDowngrade = planHierarchy[newPlan] < planHierarchy[currentPlan];
    const isUpgrade = planHierarchy[newPlan] > planHierarchy[currentPlan];

    // ✅ AMÉLIORATION CRITIQUE #2: Vérifier les sièges payants
    const seatItem = stripeSubscription.items.data.find(
      (item) => item.price.id === process.env.STRIPE_SEAT_PRICE_ID
    );
    const paidSeatsCount = seatItem?.quantity || 0;

    // Variables pour le token
    let memberCount = 0;
    let pendingInvitationCount = 0;

    // Vérifier le nombre de membres actuels pour le downgrade
    let memberCheckResult = null;
    if (isDowngrade) {
      // ObjectId déjà importé en haut du fichier

      // ✅ AMÉLIORATION CRITIQUE #2: Bloquer si sièges payants
      if (paidSeatsCount > 0) {
        return NextResponse.json(
          {
            error: "Impossible de downgrader",
            message: `Vous avez ${paidSeatsCount} siège(s) supplémentaire(s) payant(s) actif(s). Veuillez d'abord retirer ces sièges avant de changer de plan.`,
            paidSeats: paidSeatsCount,
            paidSeatsBlocking: true,
          },
          { status: 400 }
        );
      }

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

      // ✅ Comptage unifié : exclure owner ET accountant
      const billableMembers = members
        .filter((m) => m.role !== "accountant" && m.role !== "owner")
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

      // Compter les invitations pending
      const pendingInvitations = await mongoDb
        .collection("invitation")
        .find({
          organizationId: new ObjectId(organizationId),
          status: "pending",
          role: { $nin: ["accountant", "owner"] },
        })
        .toArray();

      memberCount = billableMembers.length;
      pendingInvitationCount = pendingInvitations.length;
      const totalAfterPending = memberCount + pendingInvitationCount;

      const newPlanLimits = seatSyncService.getPlanLimits(newPlan);
      const newLimit = newPlanLimits.users;

      if (totalAfterPending > newLimit) {
        // Identifier les membres à retirer (les plus récents, sauf owner)
        const membersToRemoveCount = totalAfterPending - newLimit;
        const removableMembersList = billableMembers
          .filter((m) => m.role !== "owner")
          .slice(0, membersToRemoveCount);

        memberCheckResult = {
          canDowngrade: false,
          currentMembers: memberCount,
          pendingInvitations: pendingInvitationCount,
          totalAfterPending,
          newLimit: newLimit,
          membersToRemove: membersToRemoveCount,
          // ✅ Sécurité : ne pas exposer les emails complets
          membersList: removableMembersList.map((m) => ({
            id: m.id,
            name: m.name,
            role: m.role,
          })),
        };
      } else {
        memberCheckResult = {
          canDowngrade: true,
          currentMembers: memberCount,
          pendingInvitations: pendingInvitationCount,
          totalAfterPending,
          newLimit: newLimit,
        };
      }
    }

    // 6. Récupérer le Price ID du nouveau plan
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
      freelance: { monthly: 17.99, annual: 16.19 },
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

    // 10. Calculer le prorata manuellement
    const periodEnd =
      stripeSubscription.current_period_end ||
      Date.now() / 1000 + 30 * 24 * 60 * 60;
    const periodStart =
      stripeSubscription.current_period_start || Date.now() / 1000;
    const now = Math.floor(Date.now() / 1000);
    const totalDays = Math.max(1, (periodEnd - periodStart) / (60 * 60 * 24));
    const remainingDays = Math.max(0, (periodEnd - now) / (60 * 60 * 24));
    const prorationRatio = remainingDays / totalDays;

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
      // ✅ Clarification pour l'utilisateur
      isCredit: prorationAmount < 0,
      message:
        prorationAmount < 0
          ? `Vous recevrez un crédit de ${Math.abs(prorationAmount).toFixed(2)}€ sur votre prochaine facture.`
          : prorationAmount > 0
            ? `Un montant de ${prorationAmount.toFixed(2)}€ sera ajouté à votre prochaine facture.`
            : "Aucun ajustement de facturation.",
    };

    // 11. Récupérer les limites des plans
    const currentPlanLimits = seatSyncService.getPlanLimits(currentPlan);
    const newPlanLimits = seatSyncService.getPlanLimits(newPlan);

    // ✅ AMÉLIORATION CRITIQUE #1: Générer le token de validation
    const previewToken = generatePreviewToken({
      organizationId,
      currentPlan,
      newPlan,
      isAnnual,
      memberCount,
      pendingInvitationCount,
      paidSeatsCount,
    });

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
          paidSeats: paidSeatsCount,
        },
        // ✅ Token pour validation côté change
        validationToken: previewToken,
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
