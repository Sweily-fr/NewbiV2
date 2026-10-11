import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  requireSession,
  requireOrgStripeCustomer,
  resolveBillingOrgId,
  withErrorHandler,
} from "@/src/lib/security";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

/**
 * GET /api/stripe/invoices?customerId=&organizationId=
 *
 * Factures d'abonnement du client Stripe de l'espace actif (ou de l'espace
 * passé dans `organizationId`), avec le droit « Voir » sur l'abonnement. Un
 * `customerId` qui n'appartient pas à l'espace est refusé.
 */
async function handler(request) {
  const { user, session } = await requireSession(request);

  const url = new URL(request.url);
  const orgId = resolveBillingOrgId(
    session,
    url.searchParams.get("organizationId"),
  );
  const stripeCustomerId = await requireOrgStripeCustomer({
    userId: user.id,
    orgId,
    action: "view",
    customerId: url.searchParams.get("customerId"),
  });

  // Espace sans client Stripe : aucun historique de facturation.
  if (!stripeCustomerId) {
    return NextResponse.json({ success: true, invoices: [], count: 0 });
  }

  try {
    // Récupérer les factures Stripe pour ce customer
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 100, // Limiter à 100 factures max
      expand: ["data.subscription"], // Inclure les détails de l'abonnement
    });

    // Filtrer et formater les factures
    const formattedInvoices = invoices.data
      .filter((invoice) => invoice.status !== "draft") // Exclure les brouillons
      .map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        created: invoice.created,
        due_date: invoice.due_date,
        amount_due: invoice.amount_due,
        amount_paid: invoice.amount_paid,
        amount_remaining: invoice.amount_remaining,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        currency: invoice.currency,
        description: invoice.description,
        hosted_invoice_url: invoice.hosted_invoice_url,
        invoice_pdf: invoice.invoice_pdf,
        period_start: invoice.period_start,
        period_end: invoice.period_end,
        subscription_id: invoice.subscription,
        customer_email: invoice.customer_email,
        customer_name: invoice.customer_name,
        lines: invoice.lines.data.map((line) => ({
          id: line.id,
          description: line.description,
          amount: line.amount,
          currency: line.currency,
          quantity: line.quantity,
          period: line.period,
        })),
      }))
      .sort((a, b) => b.created - a.created); // Trier par date décroissante

    return NextResponse.json({
      success: true,
      invoices: formattedInvoices,
      count: formattedInvoices.length,
      customer_id: stripeCustomerId,
    });
  } catch (error) {
    // Customer introuvable dans le mode Stripe courant (ex: customer créé en
    // mode test alors que la prod tourne en live, customer migré ou supprimé).
    // On renvoie un historique vide plutôt qu'une erreur : l'organisation n'a
    // simplement aucune facture d'abonnement rattachée à ce compte Stripe.
    if (
      error.code === "resource_missing" ||
      error.type === "StripeInvalidRequestError"
    ) {
      console.warn(
        "Customer Stripe introuvable lors de la récupération des factures:",
        error.param || error.message,
      );
      return NextResponse.json({ success: true, invoices: [], count: 0 });
    }

    console.error("Erreur lors de la récupération des factures Stripe:", error);

    // Gestion des erreurs Stripe spécifiques
    if (error.type === "StripeCardError") {
      return NextResponse.json(
        { success: false, message: "Erreur de carte de paiement" },
        { status: 400 },
      );
    }

    if (error.type === "StripeRateLimitError") {
      return NextResponse.json(
        {
          success: false,
          message: "Trop de requêtes, veuillez réessayer plus tard",
        },
        { status: 429 },
      );
    }

    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json(
        { success: false, message: "Requête invalide" },
        { status: 400 },
      );
    }

    if (error.type === "StripeAPIError") {
      return NextResponse.json(
        { success: false, message: "Erreur de l'API Stripe" },
        { status: 500 },
      );
    }

    if (error.type === "StripeConnectionError") {
      return NextResponse.json(
        { success: false, message: "Erreur de connexion à Stripe" },
        { status: 503 },
      );
    }

    if (error.type === "StripeAuthenticationError") {
      return NextResponse.json(
        { success: false, message: "Erreur d'authentification Stripe" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Erreur interne du serveur",
      },
      { status: 500 },
    );
  }
}

export const GET = withErrorHandler(handler);
