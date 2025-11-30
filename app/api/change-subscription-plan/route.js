import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { SeatSyncService } from "@/src/services/seatSyncService";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const seatSyncService = new SeatSyncService();

/**
 * API pour changer le plan d'abonnement
 * Gère les upgrades et downgrades avec vérifications
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

    console.log(
      `🔄 [CHANGE PLAN] Changement vers ${newPlan} (${isAnnual ? "annuel" : "mensuel"})`
    );

    // 3. Récupérer l'abonnement actuel
    const subscription = await mongoDb.collection("subscription").findOne({
      referenceId: organizationId,
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Aucun abonnement trouvé" },
        { status: 404 }
      );
    }

    const currentPlan = subscription.plan;
    console.log(`📋 [CHANGE PLAN] Plan actuel: ${currentPlan}`);

    // 4. Vérifier si c'est un downgrade
    const planHierarchy = { freelance: 1, pme: 2, entreprise: 3 };
    const isDowngrade = planHierarchy[newPlan] < planHierarchy[currentPlan];

    if (isDowngrade) {
      console.log(
        `⬇️ [CHANGE PLAN] Downgrade détecté: ${currentPlan} → ${newPlan}`
      );

      // Vérifier le nombre de membres actuels
      const { ObjectId } = await import("mongodb");
      const members = await mongoDb
        .collection("member")
        .find({ organizationId: new ObjectId(organizationId) })
        .toArray();

      // Exclure les comptables
      const billableMembers = members.filter((m) => m.role !== "accountant");
      const currentMemberCount = billableMembers.length;

      // Récupérer la limite du nouveau plan
      const newPlanLimits = seatSyncService.getPlanLimits(newPlan);
      const newLimit = newPlanLimits.users;

      console.log(
        `📊 [CHANGE PLAN] Membres actuels: ${currentMemberCount}, Nouvelle limite: ${newLimit}`
      );

      if (currentMemberCount > newLimit) {
        return NextResponse.json(
          {
            error: "Impossible de downgrader",
            message: `Vous avez ${currentMemberCount} membres mais le plan ${newPlan.toUpperCase()} limite à ${newLimit}. Veuillez retirer ${currentMemberCount - newLimit} membre(s) avant de downgrader.`,
            currentMembers: currentMemberCount,
            newLimit: newLimit,
          },
          { status: 400 }
        );
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

    console.log(`💳 [CHANGE PLAN] Nouveau Price ID: ${newPriceId}`);

    // 6. Récupérer l'abonnement Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    // 7. Trouver l'item du plan de base (pas les sièges)
    const basePlanItem = stripeSubscription.items.data.find(
      (item) => item.price.id !== process.env.STRIPE_SEAT_PRICE_ID
    );

    if (!basePlanItem) {
      return NextResponse.json(
        { error: "Item du plan de base non trouvé" },
        { status: 500 }
      );
    }

    console.log(`🔄 [CHANGE PLAN] Mise à jour de l'item: ${basePlanItem.id}`);

    // 8. Mettre à jour l'abonnement Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: basePlanItem.id,
          price: newPriceId,
        },
      ],
      proration_behavior: "create_prorations", // Proration automatique
      metadata: {
        ...stripeSubscription.metadata,
        planName: newPlan,
        isAnnual: isAnnual ? "true" : "false",
      },
    });

    console.log(`✅ [CHANGE PLAN] Abonnement Stripe mis à jour`);

    // 9. Mettre à jour dans MongoDB
    await mongoDb.collection("subscription").updateOne(
      { referenceId: organizationId },
      {
        $set: {
          plan: newPlan,
          updatedAt: new Date(),
        },
      }
    );

    console.log(`✅ [CHANGE PLAN] MongoDB mis à jour`);

    // 10. Synchroniser les sièges avec le nouveau plan
    console.log(`🔄 [CHANGE PLAN] Synchronisation des sièges...`);

    try {
      const { auth: authInstance } = await import("@/src/lib/auth");
      const adapter = authInstance.options.database;

      await seatSyncService.syncSeatsAfterInvitationAccepted(
        organizationId,
        adapter
      );

      console.log(`✅ [CHANGE PLAN] Sièges synchronisés avec succès`);
    } catch (seatError) {
      console.error(`⚠️ [CHANGE PLAN] Erreur sync sièges:`, seatError);
      // Ne pas bloquer le changement de plan si la sync échoue
    }

    // 11. Envoyer l'email de confirmation de changement d'abonnement
    try {
      const customer = await stripe.customers.retrieve(
        subscription.stripeCustomerId
      );

      const { sendSubscriptionChangedEmail } = await import(
        "@/src/lib/auth-utils"
      );

      const planHierarchy = { freelance: 1, pme: 2, entreprise: 3 };
      const upgradeCheck = planHierarchy[newPlan] > planHierarchy[currentPlan];

      // Formater le prix
      const priceIds = {
        freelance: { monthly: "14,59€", annual: "13,13€" },
        pme: { monthly: "48,99€", annual: "44,09€" },
        entreprise: { monthly: "94,99€", annual: "85,49€" },
      };

      const formattedPrice = isAnnual
        ? priceIds[newPlan]?.annual
        : priceIds[newPlan]?.monthly;

      await sendSubscriptionChangedEmail({
        to: customer.email,
        customerName: customer.name || customer.email,
        oldPlan: currentPlan.toUpperCase(),
        newPlan: newPlan.toUpperCase(),
        newPrice: `${formattedPrice}/mois`,
        isUpgrade: upgradeCheck,
        effectiveDate: new Date().toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      });

      console.log(
        `✅ [CHANGE PLAN] Email de confirmation envoyé à ${customer.email}`
      );
    } catch (emailError) {
      console.error(
        `⚠️ [CHANGE PLAN] Erreur envoi email confirmation:`,
        emailError
      );
      // Ne pas bloquer le changement de plan si l'email échoue
    }

    return NextResponse.json({
      success: true,
      message: `Plan changé avec succès vers ${newPlan.toUpperCase()}`,
      newPlan,
      isAnnual,
    });
  } catch (error) {
    console.error("❌ [CHANGE PLAN] Erreur:", error);
    return NextResponse.json(
      {
        error: "Erreur lors du changement de plan",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
