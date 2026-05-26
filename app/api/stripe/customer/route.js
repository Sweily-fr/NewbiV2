import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/src/lib/auth";
import { withErrorHandler } from "@/src/lib/security";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

async function handler(request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "Non authentifié" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const stripeCustomerId = url.searchParams.get("customerId");

  if (!stripeCustomerId) {
    return NextResponse.json(
      { success: false, message: "Customer ID manquant" },
      { status: 400 },
    );
  }

  try {
    const [customer, taxIds] = await Promise.all([
      stripe.customers.retrieve(stripeCustomerId),
      stripe.customers
        .listTaxIds(stripeCustomerId, { limit: 1 })
        .catch(() => ({ data: [] })),
    ]);

    if (customer.deleted) {
      return NextResponse.json(
        { success: false, message: "Customer supprimé" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        vatNumber: taxIds?.data?.[0]?.value || null,
        taxIdType: taxIds?.data?.[0]?.type || null,
      },
    });
  } catch (error) {
    console.error("Erreur récupération customer Stripe:", error);

    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json(
        { success: false, message: "Customer ID invalide" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}

export const GET = withErrorHandler(handler);
