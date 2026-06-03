import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/src/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(request) {
  let customerId;
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    ({ customerId } = await request.json());

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID requis" },
        { status: 400 },
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin")}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    // Customer introuvable dans le mode Stripe courant (org de test en prod,
    // customer migré/supprimé) : pas de portail possible, on le dit clairement.
    if (
      error.code === "resource_missing" ||
      error.type === "StripeInvalidRequestError"
    ) {
      console.warn(
        "Customer Stripe introuvable pour le portail de facturation:",
        customerId,
      );
      return NextResponse.json(
        { error: "Aucune facturation Stripe associée à cette organisation" },
        { status: 400 },
      );
    }

    console.error("Erreur création session billing portal:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session" },
      { status: 500 },
    );
  }
}
