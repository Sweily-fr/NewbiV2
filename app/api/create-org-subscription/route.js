import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { organizationData } = body;

    console.log(`🔄 [CREATE-SUB] Création session Stripe pour organisation`);

    if (!organizationData) {
      return NextResponse.json(
        { error: "organizationData requis" },
        { status: 400 }
      );
    }

    // Déterminer le plan (par défaut freelance si non spécifié)
    const VALID_PLANS = ["freelance", "pme", "entreprise"];
    const planName = organizationData.planName || "freelance";

    if (!VALID_PLANS.includes(planName)) {
      return NextResponse.json(
        { error: "Plan invalide" },
        { status: 400 }
      );
    }

    const isAnnual = organizationData.isAnnual || false;

    // 1. Vérifier la session utilisateur
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log(
      `✅ [CREATE-SUB] User: ${session.user.id} (${session.user.email})`
    );

    // 2. Récupérer ou créer le customer Stripe
    let customerId = session.user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name,
        metadata: {
          userId: session.user.id,
        },
      });
      customerId = customer.id;
      console.log(`✅ [CREATE-SUB] Customer Stripe créé: ${customerId}`);

      // Mettre à jour l'utilisateur avec le customerId
      const { mongoDb } = await import("@/src/lib/mongodb");
      await mongoDb
        .collection("user")
        .updateOne(
          { id: session.user.id },
          { $set: { stripeCustomerId: customerId } }
        );
    } else {
      console.log(`✅ [CREATE-SUB] Customer Stripe existant: ${customerId}`);
    }

    // 3. Déterminer le Price ID selon le plan et la période (mensuel/annuel)
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

    const priceId = isAnnual
      ? priceIds[planName]?.annual
      : priceIds[planName]?.monthly;

    console.log(
      `📋 [CREATE-SUB] Plan: ${planName}, Période: ${isAnnual ? "Annuel" : "Mensuel"}, Price ID: ${priceId}`
    );

    if (!priceId) {
      console.error(
        `❌ [CREATE-SUB] Price ID manquant pour le plan: ${planName}`
      );
      return NextResponse.json(
        {
          error: `Price ID non configuré pour le plan ${planName}. Vérifiez les variables d'environnement.`,
          details: {
            planName,
            availablePlans: Object.keys(priceIds).filter(
              (key) => priceIds[key]
            ),
          },
        },
        { status: 500 }
      );
    }

    // 4. Déterminer si c'est une nouvelle organisation ou un upgrade d'abonnement existant
    const isNewOrganization = organizationData.type !== "existing";
    const isOnboarding = organizationData.type === "onboarding";
    const baseUrl =
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000";

    // URL de succès différente selon le cas
    let successUrl;
    let cancelUrl;

    if (isOnboarding) {
      // Flux onboarding : redirection vers page de succès dédiée
      successUrl = `${baseUrl}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`;
      cancelUrl = `${baseUrl}/onboarding?step=4&canceled=true`;
    } else if (isNewOrganization) {
      successUrl = `${baseUrl}/dashboard?org_created=true&payment_success=true`;
      cancelUrl = `${baseUrl}/create-workspace/payment-error`;
    } else {
      successUrl = `${baseUrl}/dashboard?subscription_success=true`;
      cancelUrl = `${baseUrl}/dashboard`;
    }

    // 5. Stocker les données volumineuses dans MongoDB (évite la limite Stripe de 500 chars/clé)
    const { mongoDb } = await import("@/src/lib/mongodb");
    const pendingData = {
      userId: session.user.id,
      invitedMembers: organizationData.invitedMembers || [],
      logo: organizationData.logo || null,
      createdAt: new Date(),
      // TTL : le document sera nettoyé après 24h si jamais le webhook ne le supprime pas
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
    const pendingResult = await mongoDb
      .collection("pending_org_data")
      .insertOne(pendingData);
    const pendingOrgDataId = pendingResult.insertedId.toString();
    console.log(`✅ [CREATE-SUB] Données pendantes stockées: ${pendingOrgDataId}`);

    console.log(`🔄 [CREATE-SUB] Création session Stripe Checkout...`);
    console.log(
      `📋 [CREATE-SUB] Type: ${isNewOrganization ? "Nouvelle organisation" : "Upgrade abonnement existant"}`
    );

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: "required",
      // Activer les codes promo dans l'interface Stripe Checkout
      allow_promotion_codes: true,
      metadata: {
        userId: session.user.id,
        isNewOrganization: isNewOrganization ? "true" : "false",
        isOnboarding: isOnboarding ? "true" : "false",
        // Référence vers les données complètes en MongoDB
        pendingOrgDataId: pendingOrgDataId,
        // Données légères pour le webhook (pas de limite de taille ici)
        orgName: organizationData.name || "",
        orgType: organizationData.type || "",
        planName: planName,
        isAnnual: isAnnual ? "true" : "false",
        organizationId: session.session?.activeOrganizationId || "",
        // Données entreprise
        employeeCount: organizationData.employeeCount || "",
        companyName: organizationData.companyName || "",
        siret: organizationData.siret || "",
        siren: organizationData.siren || "",
        legalForm: organizationData.legalForm || "",
        addressStreet: (organizationData.addressStreet || "").substring(0, 100),
        addressCity: organizationData.addressCity || "",
        addressZipCode: organizationData.addressZipCode || "",
        addressCountry: organizationData.addressCountry || "France",
        activitySector: organizationData.activitySector || "",
        activityCategory: (organizationData.activityCategory || "").substring(0, 100),
      },
      subscription_data: {
        // ✅ Trial de 30 jours - L'utilisateur ne sera pas prélevé avant 30 jours
        trial_period_days: 30,
        metadata: {
          userId: session.user.id,
          isNewOrganization: isNewOrganization ? "true" : "false",
          isOnboarding: isOnboarding ? "true" : "false",
          orgName: organizationData.name || "",
          orgType: organizationData.type || "",
          planName: planName,
          isAnnual: isAnnual ? "true" : "false",
          organizationId: session.session?.activeOrganizationId || "",
          employeeCount: organizationData.employeeCount || "",
          hasTrial: "true",
          trialDays: "30",
        },
      },
      // Message personnalisé avec info trial 30 jours
      custom_text: {
        submit: {
          message: isOnboarding
            ? `Essai gratuit 30 jours - Aucun prélèvement avant la fin de l'essai`
            : `Souscription au plan ${planName.toUpperCase()} - 30 jours d'essai gratuit`,
        },
      },
    });

    console.log(`✅ [CREATE-SUB] Session Stripe créée: ${checkoutSession.id}`);
    console.log(`📋 [CREATE-SUB] Metadata session:`, checkoutSession.metadata);
    console.log(
      `📋 [CREATE-SUB] Metadata subscription:`,
      checkoutSession.subscription_data?.metadata
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("❌ [CREATE-SUB] Erreur création checkout:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création du checkout" },
      { status: 500 }
    );
  }
}
