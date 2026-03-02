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
      let organizationId =
        checkoutSession.metadata?.organizationId ||
        session.session?.activeOrganizationId;

      console.log(`🏢 [VERIFY-CHECKOUT] Organization ID initial: ${organizationId}, isNewOrganization: ${isNewOrganization}`);

      // ✅ Si c'est une nouvelle org et qu'on n'a pas d'organizationId, créer l'organisation via shared utility
      if (isNewOrganization && !organizationId) {
        console.log(`🆕 [VERIFY-CHECKOUT] Création de l'organisation (webhook non reçu)...`);

        // Récupérer les données volumineuses depuis MongoDB
        let pendingOrgData = null;
        const pendingOrgDataId = checkoutSession.metadata?.pendingOrgDataId;
        if (pendingOrgDataId) {
          try {
            pendingOrgData = await mongoDb
              .collection("pending_org_data")
              .findOne({ _id: new ObjectId(pendingOrgDataId) });
            console.log(`✅ [VERIFY-CHECKOUT] Données pendantes récupérées: ${pendingOrgDataId}`);
          } catch (e) {
            console.warn(`⚠️ [VERIFY-CHECKOUT] Données pendantes non trouvées: ${pendingOrgDataId}`);
          }
        }

        const { createOrganizationWithSubscription } = await import("@/src/lib/org-creation.js");

        const creationResult = await createOrganizationWithSubscription({
          mongoDb,
          userId: session.user.id,
          orgData: {
            companyName: checkoutSession.metadata?.companyName || checkoutSession.metadata?.orgName || "Mon entreprise",
            orgName: checkoutSession.metadata?.orgName || checkoutSession.metadata?.companyName || "Mon entreprise",
            siret: checkoutSession.metadata?.siret || "",
            siren: checkoutSession.metadata?.siren || "",
            employeeCount: checkoutSession.metadata?.employeeCount || "",
            orgType: checkoutSession.metadata?.orgType || "business",
            legalForm: checkoutSession.metadata?.legalForm || "",
            addressStreet: checkoutSession.metadata?.addressStreet || "",
            addressCity: checkoutSession.metadata?.addressCity || "",
            addressZipCode: checkoutSession.metadata?.addressZipCode || "",
            addressCountry: checkoutSession.metadata?.addressCountry || "France",
            activitySector: checkoutSession.metadata?.activitySector || "",
            activityCategory: checkoutSession.metadata?.activityCategory || "",
          },
          subscriptionInfo: subscriptionObj,
          sessionMetadata: checkoutSession.metadata || {},
          pendingOrgData,
          pendingOrgDataId,
        });

        organizationId = creationResult.organizationId;
        console.log(`✅ [VERIFY-CHECKOUT] Organisation traitée via shared utility: ${organizationId}`);
      } else if (organizationId) {
        // Org exists, just ensure subscription exists
        const existingSub = await mongoDb.collection("subscription").findOne({
          $or: [
            { stripeSubscriptionId: subscriptionId },
            { referenceId: organizationId },
          ],
        });

        if (!existingSub) {
          console.log(`🔄 [VERIFY-CHECKOUT] Création de l'abonnement en base (webhook non reçu)...`);

          const { createOrganizationWithSubscription } = await import("@/src/lib/org-creation.js");

          await createOrganizationWithSubscription({
            mongoDb,
            userId: session.user.id,
            orgData: {
              companyName: checkoutSession.metadata?.companyName || "Mon entreprise",
            },
            subscriptionInfo: subscriptionObj,
            sessionMetadata: checkoutSession.metadata || {},
          });
        } else {
          console.log(`✅ [VERIFY-CHECKOUT] Abonnement déjà existant en base:`, existingSub._id);
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
