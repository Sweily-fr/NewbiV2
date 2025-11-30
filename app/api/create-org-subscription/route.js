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
    const planName = organizationData.planName || "freelance";
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

    // 4. Créer une session Stripe Checkout
    console.log(`🔄 [CREATE-SUB] Création session Stripe Checkout...`);
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
      // Ne pas appliquer de coupon pour éviter les erreurs si le coupon ne s'applique pas à tous les plans
      // discounts: process.env.STRIPE_NEW_ORG_COUPON_ID
      //   ? [{ coupon: process.env.STRIPE_NEW_ORG_COUPON_ID }]
      //   : [],
      success_url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"}/dashboard?org_created=true&payment_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"}/dashboard`,
      billing_address_collection: "required",
      metadata: {
        userId: session.user.id,
        // ✅ FIX : Toujours "true" pour une nouvelle organisation depuis le modal
        isNewOrganization: "true",
        // Stocker les données de l'organisation pour le webhook
        orgName: organizationData.name,
        orgType: organizationData.type, // "work" ou "personal"
        orgInvitedEmails: JSON.stringify(organizationData.invitedMembers || []),
        planName: planName,
        isAnnual: isAnnual ? "true" : "false",
        organizationId: session.session?.activeOrganizationId || "",
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          // ✅ FIX : Toujours "true" pour une nouvelle organisation depuis le modal
          isNewOrganization: "true",
          orgName: organizationData.name,
          orgType: organizationData.type, // "work" ou "personal"
          planName: planName,
          isAnnual: isAnnual ? "true" : "false",
          organizationId: session.session?.activeOrganizationId || "",
        },
      },
      // Message personnalisé selon le plan
      custom_text: {
        submit: {
          message: `Souscription au plan ${planName.toUpperCase()}`,
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
