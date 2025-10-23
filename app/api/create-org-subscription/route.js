import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { organizationData } = body;

    console.log(`🔄 [CREATE-SUB] Création session Stripe pour nouvelle organisation`);

    if (!organizationData) {
      return NextResponse.json(
        { error: "organizationData requis" },
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

    console.log(`✅ [CREATE-SUB] User: ${session.user.id} (${session.user.email})`);

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
      await mongoDb.collection("user").updateOne(
        { id: session.user.id },
        { $set: { stripeCustomerId: customerId } }
      );
    } else {
      console.log(`✅ [CREATE-SUB] Customer Stripe existant: ${customerId}`);
    }

    // 3. Créer une session Stripe Checkout
    console.log(`🔄 [CREATE-SUB] Création session Stripe Checkout...`);
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_MONTH,
          quantity: 1,
        },
      ],
      discounts: process.env.STRIPE_NEW_ORG_COUPON_ID
        ? [{ coupon: process.env.STRIPE_NEW_ORG_COUPON_ID }]
        : [],
      success_url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"}/dashboard?org_created=true&payment_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"}/dashboard`,
      billing_address_collection: "required",
      metadata: {
        userId: session.user.id,
        isNewOrganization: "true",
        // Stocker les données de l'organisation pour le webhook
        orgName: organizationData.name,
        orgType: organizationData.type,
        orgInvitedEmails: JSON.stringify(organizationData.invitedEmails || []),
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          isNewOrganization: "true",
          orgName: organizationData.name,
          orgType: organizationData.type,
        },
      },
      custom_text: {
        submit: {
          message:
            "🎉 Réduction de 25% appliquée sur votre nouvelle organisation !",
        },
      },
    });

    console.log(`✅ [CREATE-SUB] Session Stripe créée: ${checkoutSession.id}`);
    console.log(`📋 [CREATE-SUB] Metadata session:`, checkoutSession.metadata);
    console.log(`📋 [CREATE-SUB] Metadata subscription:`, checkoutSession.subscription_data?.metadata);

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("❌ [CREATE-SUB] Erreur création checkout:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création du checkout" },
      { status: 500 }
    );
  }
}
