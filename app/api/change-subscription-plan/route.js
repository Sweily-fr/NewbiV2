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
 * Valide le token de preview pour éviter les race conditions
 * Vérifie que les données n'ont pas changé entre le preview et le change
 */
function validatePreviewToken(token, currentData) {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    const { payload, signature } = decoded;

    // ✅ CRITIQUE #7: Vérifier la signature avec secret sécurisé
    const expectedSignature = crypto
      .createHmac("sha256", getSigningSecret())
      .update(JSON.stringify(payload))
      .digest("hex");

    if (signature !== expectedSignature) {
      return { valid: false, reason: "Signature invalide" };
    }

    // Vérifier l'expiration (5 minutes)
    if (Date.now() > payload.expiresAt) {
      return { valid: false, reason: "Token expiré. Veuillez renouveler la prévisualisation." };
    }

    // Vérifier que les données n'ont pas changé
    if (payload.organizationId !== currentData.organizationId) {
      return { valid: false, reason: "L'organisation a changé" };
    }
    if (payload.currentPlan !== currentData.currentPlan) {
      return { valid: false, reason: "Le plan actuel a changé. Veuillez renouveler." };
    }
    if (payload.newPlan !== currentData.newPlan) {
      return { valid: false, reason: "Le plan cible a changé" };
    }
    if (payload.isAnnual !== currentData.isAnnual) {
      return { valid: false, reason: "La périodicité a changé" };
    }

    // ✅ CRITIQUE: Vérifier que le nombre de membres n'a pas augmenté
    if (currentData.memberCount > payload.memberCount) {
      return {
        valid: false,
        reason: `Le nombre de membres a augmenté depuis la prévisualisation (${payload.memberCount} → ${currentData.memberCount}). Veuillez renouveler.`,
        dataChanged: true,
      };
    }

    // ✅ CRITIQUE: Vérifier les invitations pending
    if (currentData.pendingInvitationCount > payload.pendingInvitationCount) {
      return {
        valid: false,
        reason: `De nouvelles invitations ont été envoyées depuis la prévisualisation. Veuillez renouveler.`,
        dataChanged: true,
      };
    }

    return { valid: true, payload };
  } catch (error) {
    console.error("Erreur validation token:", error);
    return { valid: false, reason: "Token invalide ou corrompu" };
  }
}

/**
 * API pour changer le plan d'abonnement
 * Gère les upgrades et downgrades avec vérifications renforcées
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
    const { newPlan, isAnnual, organizationId, validationToken } = await request.json();

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
        { error: "Seul le propriétaire de l'organisation peut changer le plan d'abonnement" },
        { status: 403 }
      );
    }

    console.log(
      `🔄 [CHANGE PLAN] Changement vers ${newPlan} (${isAnnual ? "annuel" : "mensuel"}) par owner ${session.user.id}`
    );

    // 3. Récupérer l'abonnement actuel avec lock pour éviter les requêtes concurrentes
    // ✅ CRITIQUE #5: Lock pour éviter les modifications concurrentes
    const lockResult = await mongoDb.collection("subscription").findOneAndUpdate(
      {
        referenceId: organizationId,
        $or: [
          { _lock: { $exists: false } },
          { _lock: false },
          { _lockUntil: { $lt: Date.now() } }
        ]
      },
      {
        $set: {
          _lock: true,
          _lockUntil: Date.now() + 30000 // Lock pour 30 secondes max
        }
      },
      { returnDocument: "after" }
    );

    if (!lockResult) {
      return NextResponse.json(
        { error: "Un changement de plan est déjà en cours. Veuillez réessayer dans quelques secondes." },
        { status: 409 }
      );
    }

    // Fonction pour libérer le lock
    const releaseLock = async () => {
      try {
        await mongoDb.collection("subscription").updateOne(
          { referenceId: organizationId },
          { $set: { _lock: false }, $unset: { _lockUntil: 1 } }
        );
      } catch (e) {
        console.error("Erreur libération lock:", e);
      }
    };

    try {
    // 3. Utiliser l'abonnement récupéré avec le lock
    const subscription = lockResult;

    if (!subscription) {
      await releaseLock();
      return NextResponse.json(
        { error: "Aucun abonnement trouvé" },
        { status: 404 }
      );
    }

    const currentPlan = subscription.plan;
    const previousPlan = currentPlan; // Garder pour rollback
    console.log(`📋 [CHANGE PLAN] Plan actuel: ${currentPlan}`);

    // 4. Récupérer l'abonnement Stripe
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
        },
        { status: 400 }
      );
    }

    // 5. Vérifier si c'est un downgrade
    const planHierarchy = { freelance: 1, pme: 2, entreprise: 3 };
    const isDowngrade = planHierarchy[newPlan] < planHierarchy[currentPlan];

    // ✅ AMÉLIORATION CRITIQUE #2: Vérifier les sièges payants
    const seatItem = stripeSubscription.items.data.find(
      (item) => item.price.id === process.env.STRIPE_SEAT_PRICE_ID
    );
    const paidSeatsCount = seatItem?.quantity || 0;

    if (isDowngrade && paidSeatsCount > 0) {
      return NextResponse.json(
        {
          error: "Impossible de downgrader",
          message: `Vous avez ${paidSeatsCount} siège(s) supplémentaire(s) payant(s) actif(s). Veuillez d'abord retirer ces sièges dans la section "Espaces" avant de changer de plan.`,
          paidSeats: paidSeatsCount,
        },
        { status: 400 }
      );
    }

    // Variables pour comptage actuel
    let memberCount = 0;
    let pendingInvitationCount = 0;

    if (isDowngrade) {
      console.log(
        `⬇️ [CHANGE PLAN] Downgrade détecté: ${currentPlan} → ${newPlan}`
      );

      // ObjectId déjà importé en haut du fichier

      // Vérifier le nombre de membres actuels (exclure owner et accountants)
      const members = await mongoDb
        .collection("member")
        .find({ organizationId: new ObjectId(organizationId) })
        .toArray();

      const billableMembers = members.filter(
        (m) => m.role !== "accountant" && m.role !== "owner"
      );
      memberCount = billableMembers.length;

      // Compter aussi les invitations pending (exclure comptables et owner)
      const pendingInvitations = await mongoDb
        .collection("invitation")
        .find({
          organizationId: new ObjectId(organizationId),
          status: "pending",
          role: { $nin: ["accountant", "owner"] },
        })
        .toArray();
      pendingInvitationCount = pendingInvitations.length;

      // Total = membres actuels + invitations pending
      const totalAfterPending = memberCount + pendingInvitationCount;

      // Récupérer la limite du nouveau plan
      const newPlanLimits = seatSyncService.getPlanLimits(newPlan);
      const newLimit = newPlanLimits.users;

      console.log(`📊 [CHANGE PLAN] Vérification downgrade:`, {
        currentMembers: memberCount,
        pendingInvitations: pendingInvitationCount,
        totalAfterPending,
        newLimit,
      });

      // ✅ AMÉLIORATION CRITIQUE #1: Valider le token si fourni
      if (validationToken) {
        const tokenValidation = validatePreviewToken(validationToken, {
          organizationId,
          currentPlan,
          newPlan,
          isAnnual,
          memberCount,
          pendingInvitationCount,
        });

        if (!tokenValidation.valid) {
          console.log(`⚠️ [CHANGE PLAN] Token invalide: ${tokenValidation.reason}`);
          return NextResponse.json(
            {
              error: "Prévisualisation expirée ou données modifiées",
              message: tokenValidation.reason,
              requireNewPreview: true,
            },
            { status: 400 }
          );
        }
        console.log(`✅ [CHANGE PLAN] Token validé`);
      }

      // Vérifier si le total dépasse la limite
      if (totalAfterPending > newLimit) {
        const excess = totalAfterPending - newLimit;
        const message =
          pendingInvitationCount > 0
            ? `Vous avez ${memberCount} membre(s) actif(s) et ${pendingInvitationCount} invitation(s) en attente, soit ${totalAfterPending} au total. Le plan ${newPlan.toUpperCase()} limite à ${newLimit}. Veuillez retirer ${excess} membre(s) ou annuler des invitations avant de downgrader.`
            : `Vous avez ${memberCount} membres mais le plan ${newPlan.toUpperCase()} limite à ${newLimit}. Veuillez retirer ${excess} membre(s) avant de downgrader.`;

        return NextResponse.json(
          {
            error: "Impossible de downgrader",
            message,
            currentMembers: memberCount,
            pendingInvitations: pendingInvitationCount,
            totalAfterPending,
            newLimit,
          },
          { status: 400 }
        );
      }

      // Vérifier aussi les comptables
      const currentAccountants = members.filter(
        (m) => m.role === "accountant"
      ).length;
      const pendingAccountants = await mongoDb
        .collection("invitation")
        .countDocuments({
          organizationId: new ObjectId(organizationId),
          status: "pending",
          role: "accountant",
        });
      const totalAccountants = currentAccountants + pendingAccountants;

      if (totalAccountants > newPlanLimits.accountants) {
        const excess = totalAccountants - newPlanLimits.accountants;
        return NextResponse.json(
          {
            error: "Impossible de downgrader",
            message: `Vous avez ${currentAccountants} comptable(s) actif(s) et ${pendingAccountants} invitation(s) comptable en attente, soit ${totalAccountants} au total. Le plan ${newPlan.toUpperCase()} limite à ${newPlanLimits.accountants}. Veuillez retirer ${excess} comptable(s) ou annuler des invitations avant de downgrader.`,
            currentAccountants,
            pendingAccountants,
            totalAccountants,
            newAccountantLimit: newPlanLimits.accountants,
          },
          { status: 400 }
        );
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

    console.log(`💳 [CHANGE PLAN] Nouveau Price ID: ${newPriceId}`);

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

    // ✅ CRITIQUE #4: Clé d'idempotence pour éviter les doubles charges
    const idempotencyKey = `plan_change_${organizationId}_${newPlan}_${isAnnual}_${Date.now()}`;

    // 8. Mettre à jour l'abonnement Stripe
    let stripeUpdateSuccess = false;
    try {
      await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          items: [
            {
              id: basePlanItem.id,
              price: newPriceId,
            },
          ],
          proration_behavior: "create_prorations",
          metadata: {
            ...stripeSubscription.metadata,
            planName: newPlan,
            isAnnual: isAnnual ? "true" : "false",
          },
        },
        { idempotencyKey }
      );
      stripeUpdateSuccess = true;
      console.log(`✅ [CHANGE PLAN] Abonnement Stripe mis à jour`);
    } catch (stripeError) {
      console.error(`❌ [CHANGE PLAN] Erreur Stripe:`, stripeError);
      await releaseLock();
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour Stripe", details: stripeError.message },
        { status: 500 }
      );
    }

    // 9. Mettre à jour dans MongoDB
    // ✅ CRITIQUE #3: Rollback Stripe si MongoDB échoue
    try {
      await mongoDb.collection("subscription").updateOne(
        { referenceId: organizationId },
        {
          $set: {
            plan: newPlan,
            updatedAt: new Date(),
            _lock: false,
          },
          $unset: { _lockUntil: 1 },
        }
      );
      console.log(`✅ [CHANGE PLAN] MongoDB mis à jour`);
    } catch (mongoError) {
      console.error(`❌ [CHANGE PLAN] Erreur MongoDB, tentative de rollback Stripe:`, mongoError);

      // Tenter de rollback Stripe
      if (stripeUpdateSuccess) {
        try {
          const rollbackPriceId = isAnnual
            ? priceIds[previousPlan]?.annual
            : priceIds[previousPlan]?.monthly;

          await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            items: [{ id: basePlanItem.id, price: rollbackPriceId }],
            proration_behavior: "none", // Pas de prorata pour le rollback
            metadata: { ...stripeSubscription.metadata, planName: previousPlan },
          });
          console.log(`✅ [CHANGE PLAN] Rollback Stripe effectué`);
        } catch (rollbackError) {
          console.error(`❌ [CHANGE PLAN] CRITIQUE: Rollback Stripe échoué!`, rollbackError);
          // TODO: Envoyer alerte admin, créer ticket support
        }
      }

      await releaseLock();
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour. Veuillez réessayer.", details: mongoError.message },
        { status: 500 }
      );
    }

    // ✅ CRITIQUE #6: Collecter les warnings pour informer l'utilisateur
    const warnings = [];

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
      warnings.push({
        type: "seat_sync",
        message: "La synchronisation des sièges a échoué. Rechargez la page pour vérifier.",
      });
    }

    // 11. Envoyer l'email de confirmation
    try {
      const customer = await stripe.customers.retrieve(
        subscription.stripeCustomerId
      );

      const { sendSubscriptionChangedEmail } = await import(
        "@/src/lib/auth-utils"
      );

      const upgradeCheck = planHierarchy[newPlan] > planHierarchy[currentPlan];

      // Prix à afficher
      const planPrices = {
        freelance: { monthly: "17,99€", annual: "16,19€" },
        pme: { monthly: "48,99€", annual: "44,09€" },
        entreprise: { monthly: "94,99€", annual: "85,49€" },
      };

      const formattedPrice = isAnnual
        ? planPrices[newPlan]?.annual
        : planPrices[newPlan]?.monthly;

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
      warnings.push({
        type: "email",
        message: "L'email de confirmation n'a pas pu être envoyé.",
      });
    }

    // ✅ CRITIQUE #6: Retourner les warnings à l'utilisateur
    return NextResponse.json({
      success: true,
      message: warnings.length > 0
        ? `Plan changé vers ${newPlan.toUpperCase()} avec ${warnings.length} avertissement(s)`
        : `Plan changé avec succès vers ${newPlan.toUpperCase()}`,
      newPlan,
      isAnnual,
      warnings: warnings.length > 0 ? warnings : undefined,
    });

    } catch (error) {
      // Libérer le lock en cas d'erreur non gérée
      await releaseLock();
      throw error;
    }
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
