import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * GET /api/verify-checkout-session?session_id=xxx
 * Vérifie directement avec Stripe si le checkout a réussi
 * Utilisé comme fallback si le webhook prend trop de temps
 */
export async function GET(request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id requis" },
        { status: 400 }
      );
    }

    console.log(`🔍 [VERIFY-CHECKOUT] Vérification session: ${sessionId}`);
    console.log(`👤 [VERIFY-CHECKOUT] User: ${session.user.id} (${session.user.email})`);
    console.log(`🏢 [VERIFY-CHECKOUT] Active Org: ${session.session?.activeOrganizationId}`);

    // Récupérer la session Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });

    if (!checkoutSession) {
      return NextResponse.json(
        { error: "Session non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que la session appartient à l'utilisateur actuel
    // Le customer est déjà expandé dans la requête
    const customer = checkoutSession.customer;
    console.log(`📋 [VERIFY-CHECKOUT] Customer: ${customer?.id}, metadata:`, customer?.metadata);
    console.log(`📋 [VERIFY-CHECKOUT] Session metadata:`, checkoutSession.metadata);

    if (customer?.metadata?.userId !== session.user.id) {
      // Vérifier aussi via l'email
      if (customer?.email !== session.user.email) {
        console.warn(
          `⚠️ [VERIFY-CHECKOUT] Session ne correspond pas à l'utilisateur (customer userId: ${customer?.metadata?.userId}, user.id: ${session.user.id})`
        );
        // On autorise quand même si le userId dans les metadata de la session checkout correspond
        if (checkoutSession.metadata?.userId !== session.user.id) {
          return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
        }
        console.log(`✅ [VERIFY-CHECKOUT] Autorisé via checkout session metadata`);
      }
    }

    // Vérifier le statut du paiement
    // Pour les abonnements avec trial, payment_status est "no_payment_required" (pas de prélèvement immédiat)
    // Pour les abonnements sans trial, payment_status est "paid"
    const validPaymentStatuses = ["paid", "no_payment_required"];
    if (!validPaymentStatuses.includes(checkoutSession.payment_status)) {
      console.log(
        `⚠️ [VERIFY-CHECKOUT] Paiement non complété: ${checkoutSession.payment_status}`
      );
      return NextResponse.json({
        success: false,
        paymentStatus: checkoutSession.payment_status,
        message: "Paiement non complété",
      });
    }

    console.log(
      `✅ [VERIFY-CHECKOUT] Statut paiement valide: ${checkoutSession.payment_status}`
    );

    // Récupérer l'abonnement Stripe si présent
    let subscriptionStatus = null;
    let subscriptionId = null;

    // L'abonnement est déjà expandé dans la requête
    const subscription = checkoutSession.subscription;
    if (subscription) {
      // subscription peut être un objet ou un string selon le contexte
      const subscriptionObj = typeof subscription === "string"
        ? await stripe.subscriptions.retrieve(subscription)
        : subscription;

      subscriptionStatus = subscriptionObj.status;
      subscriptionId = subscriptionObj.id;

      console.log(
        `✅ [VERIFY-CHECKOUT] Abonnement trouvé: ${subscriptionId}, status: ${subscriptionStatus}`
      );

      // ✅ NOUVEAU FLUX: Vérifier si c'est une nouvelle organisation
      const isNewOrganization = checkoutSession.metadata?.isNewOrganization === "true";
      const isOnboarding = checkoutSession.metadata?.isOnboarding === "true";
      let organizationId =
        checkoutSession.metadata?.organizationId ||
        session.session?.activeOrganizationId;

      console.log(`🏢 [VERIFY-CHECKOUT] Organization ID initial: ${organizationId}, isNewOrganization: ${isNewOrganization}`);

      // ✅ Si c'est une nouvelle org et qu'on n'a pas d'organizationId, créer l'organisation
      if (isNewOrganization && !organizationId) {
        console.log(`🆕 [VERIFY-CHECKOUT] Création de l'organisation (webhook non reçu)...`);

        const orgName = checkoutSession.metadata?.orgName || checkoutSession.metadata?.companyName || "Mon entreprise";
        const companyName = checkoutSession.metadata?.companyName || orgName;
        const siret = checkoutSession.metadata?.siret;
        const siren = checkoutSession.metadata?.siren;

        // ✅ Vérifier que le SIRET n'est pas déjà utilisé (double sécurité)
        if (siret) {
          const existingOrg = await mongoDb.collection("organization").findOne({
            siret: siret,
          });

          if (existingOrg) {
            console.error(
              `❌ [VERIFY-CHECKOUT] SIRET ${siret} déjà utilisé par l'organisation: ${existingOrg.name}`
            );
            return NextResponse.json({
              success: false,
              error: "Ce numéro SIRET est déjà associé à un compte existant.",
            }, { status: 409 });
          }
        }
        const employeeCount = checkoutSession.metadata?.employeeCount;
        const orgType = checkoutSession.metadata?.orgType || "business";
        const legalForm = checkoutSession.metadata?.legalForm;
        const addressStreet = checkoutSession.metadata?.addressStreet;
        const addressCity = checkoutSession.metadata?.addressCity;
        const addressZipCode = checkoutSession.metadata?.addressZipCode;
        const addressCountry = checkoutSession.metadata?.addressCountry || "France";
        const activitySector = checkoutSession.metadata?.activitySector;
        const activityCategory = checkoutSession.metadata?.activityCategory;
        const userId = session.user.id;

        const orgSlug = `org-${userId.slice(-8)}-${Date.now().toString(36)}`;

        const newOrg = {
          name: orgName,
          slug: orgSlug,
          createdAt: new Date(),
          companyName: companyName,
          siret: siret || "",
          siren: siren || "",
          employeeCount: employeeCount || "",
          organizationType: orgType,
          legalForm: legalForm || "",
          addressStreet: addressStreet || "",
          addressCity: addressCity || "",
          addressZipCode: addressZipCode || "",
          addressCountry: addressCountry || "France",
          activitySector: activitySector || "",
          activityCategory: activityCategory || "",
          onboardingCompleted: true,
          metadata: JSON.stringify({
            type: orgType,
            createdAt: new Date().toISOString(),
            createdViaFallback: true,
          }),
        };

        const orgResult = await mongoDb.collection("organization").insertOne(newOrg);
        const organizationObjectId = orgResult.insertedId;
        organizationId = organizationObjectId.toString();

        console.log(`✅ [VERIFY-CHECKOUT] Organisation créée: ${organizationId}`);

        // Créer le membre owner
        await mongoDb.collection("member").insertOne({
          userId: new ObjectId(userId),
          organizationId: organizationObjectId,
          role: "owner",
          createdAt: new Date(),
        });

        // Mettre à jour les sessions
        await mongoDb.collection("session").updateMany(
          { userId: userId },
          { $set: { activeOrganizationId: organizationId } }
        );

        // Mettre à jour l'utilisateur
        await mongoDb.collection("user").updateOne(
          { _id: new ObjectId(userId) },
          {
            $set: {
              hasSeenOnboarding: true,
              updatedAt: new Date(),
            },
          }
        );

        console.log(`✅ [VERIFY-CHECKOUT] Membre owner créé et sessions mises à jour`);
      }

      console.log(`🏢 [VERIFY-CHECKOUT] Organization ID pour abonnement: ${organizationId}`);

      if (organizationId) {
        const existingSub = await mongoDb.collection("subscription").findOne({
          $or: [
            { stripeSubscriptionId: subscriptionId },
            { referenceId: organizationId },
            { organizationId: organizationId },
          ],
        });

        if (!existingSub) {
          console.log(
            `🔄 [VERIFY-CHECKOUT] Création de l'abonnement en base (webhook non reçu)...`
          );

          const planName =
            subscriptionObj.metadata?.planName ||
            checkoutSession.metadata?.planName ||
            "freelance";

          console.log(`📋 [VERIFY-CHECKOUT] Plan: ${planName}`);

          const subscriptionData = {
            plan: planName,
            referenceId: organizationId,
            stripeCustomerId: typeof subscriptionObj.customer === "string"
              ? subscriptionObj.customer
              : subscriptionObj.customer?.id,
            status: subscriptionObj.status,
            seats: 1,
            cancelAtPeriodEnd: subscriptionObj.cancel_at_period_end || false,
            periodEnd: subscriptionObj.current_period_end
              ? new Date(subscriptionObj.current_period_end * 1000)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            periodStart: subscriptionObj.current_period_start
              ? new Date(subscriptionObj.current_period_start * 1000)
              : new Date(),
            stripeSubscriptionId: subscriptionObj.id,
            currentPeriodEnd: subscriptionObj.current_period_end
              ? new Date(subscriptionObj.current_period_end * 1000)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            currentPeriodStart: subscriptionObj.current_period_start
              ? new Date(subscriptionObj.current_period_start * 1000)
              : new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            createdVia: "verify-checkout-fallback",
          };

          console.log(`📋 [VERIFY-CHECKOUT] Données abonnement:`, JSON.stringify(subscriptionData, null, 2));

          await mongoDb.collection("subscription").insertOne(subscriptionData);

          console.log(
            `✅ [VERIFY-CHECKOUT] Abonnement créé en base pour org: ${organizationId}`
          );

          // Mettre à jour l'organisation (trial status + onboardingCompleted)
          const updateData = {
            onboardingCompleted: true,
            updatedAt: new Date(),
          };

          if (subscriptionObj.status === "trialing") {
            const trialEnd = subscriptionObj.trial_end
              ? new Date(subscriptionObj.trial_end * 1000)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            updateData.isTrialActive = true;
            updateData.trialStartDate = new Date().toISOString();
            updateData.trialEndDate = trialEnd.toISOString();
            updateData.stripeTrialActive = true;
          }

          // Essayer avec ObjectId, sinon avec string
          try {
            const orgObjectId = new ObjectId(organizationId);
            const orgUpdateResult = await mongoDb.collection("organization").updateOne(
              { _id: orgObjectId },
              { $set: updateData }
            );
            console.log(
              `✅ [VERIFY-CHECKOUT] Organisation mise à jour (ObjectId): ${organizationId}, modified: ${orgUpdateResult.modifiedCount}`
            );
          } catch (objectIdError) {
            // Si l'ID n'est pas un ObjectId valide, essayer avec string
            const orgUpdateResult = await mongoDb.collection("organization").updateOne(
              { id: organizationId },
              { $set: updateData }
            );
            console.log(
              `✅ [VERIFY-CHECKOUT] Organisation mise à jour (string id): ${organizationId}, modified: ${orgUpdateResult.modifiedCount}`
            );
          }
        } else {
          console.log(
            `✅ [VERIFY-CHECKOUT] Abonnement déjà existant en base:`, existingSub._id
          );
        }
      } else {
        console.error(`❌ [VERIFY-CHECKOUT] Pas d'organizationId trouvé !`);
      }
    }

    return NextResponse.json({
      success: true,
      paymentStatus: checkoutSession.payment_status,
      subscriptionStatus: subscriptionStatus,
      subscriptionId: subscriptionId,
      message: "Paiement vérifié avec succès",
    });
  } catch (error) {
    console.error("[VERIFY-CHECKOUT] Erreur:", error);

    // Gérer les erreurs Stripe spécifiques
    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json(
        { error: "Session Stripe invalide" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
