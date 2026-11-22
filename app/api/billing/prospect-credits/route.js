import { NextResponse } from "next/server";
import Stripe from "stripe";
import { mongoDb } from "@/src/lib/mongodb";
import {
  apiError,
  requireOrgAction,
  requireOrgMembership,
  requireSession,
  toObjectId,
  withErrorHandler,
} from "@/src/lib/security";
import { getOrgStripeCustomerIds } from "@/src/lib/security/org-stripe-customer";
import {
  getPaidPlan,
  getProspectCreditPrice,
  MAX_PROSPECT_CREDITS,
  MIN_PROSPECT_CREDITS,
  PROSPECT_CREDITS_PLAN,
  PROSPECT_CREDITS_PURPOSE,
  readCreditQuantity,
} from "@/src/lib/prospect-credits";

const OBJECT_ID = /^[a-f\d]{24}$/i;

function readOrganizationId(value) {
  return typeof value === "string" && OBJECT_ID.test(value) ? value : null;
}

function stripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });
}

/**
 * GET /api/billing/prospect-credits?organizationId=…
 * Prix d'un crédit de prospection et droit d'en acheter (offre Entreprise
 * et droit « Gérer l'abonnement »). Ouvert à tout membre de l'espace.
 */
async function getHandler(request) {
  const { user } = await requireSession(request);
  const organizationId = readOrganizationId(
    new URL(request.url).searchParams.get("organizationId"),
  );
  if (!organizationId) return apiError(400, "Identifiant d'espace invalide");
  await requireOrgMembership(user.id, organizationId);

  let canManageBilling = true;
  try {
    await requireOrgAction(user.id, organizationId, "billing", "manage");
  } catch {
    canManageBilling = false;
  }

  let price = null;
  try {
    price = await getProspectCreditPrice(stripeClient());
  } catch (error) {
    console.error("[Crédits prospects] Prix illisible :", error?.message);
  }
  const plan = await getPaidPlan(mongoDb, organizationId);

  return NextResponse.json({
    available: Boolean(price),
    unitAmount: price?.unitAmount ?? null,
    currency: price?.currency ?? "eur",
    taxBehavior: price?.taxBehavior ?? null,
    min: MIN_PROSPECT_CREDITS,
    max: MAX_PROSPECT_CREDITS,
    planAllowsPurchase: plan === PROSPECT_CREDITS_PLAN,
    canManageBilling,
  });
}

/**
 * POST /api/billing/prospect-credits
 * Body : { organizationId, credits }. Ouvre un paiement Stripe unique pour
 * ce nombre de crédits ; payés, ils forment une commande activée par l'API
 * dès que son stock chez le fournisseur la couvre.
 */
async function postHandler(request) {
  const { user } = await requireSession(request);
  let body = {};
  try {
    body = (await request.json()) || {};
  } catch {
    body = {};
  }
  const organizationId = readOrganizationId(body.organizationId);
  if (!organizationId) return apiError(400, "Identifiant d'espace invalide");
  await requireOrgAction(user.id, organizationId, "billing", "manage");

  const credits = readCreditQuantity(body.credits);
  if (!credits) {
    return apiError(
      400,
      `Choisissez entre ${MIN_PROSPECT_CREDITS} et ${MAX_PROSPECT_CREDITS} crédits.`,
    );
  }

  // En Standard et en Premium, on passe d'abord à l'offre au-dessus
  if ((await getPaidPlan(mongoDb, organizationId)) !== PROSPECT_CREDITS_PLAN) {
    return apiError(
      409,
      "L'achat de crédits est réservé à l'offre Entreprise. Passez d'abord à l'offre au-dessus.",
    );
  }

  const stripe = stripeClient();
  const price = await getProspectCreditPrice(stripe);
  if (!price) {
    return apiError(503, "L'achat de crédits n'est pas encore disponible.");
  }

  // Facture au nom de l'espace : client Stripe de son abonnement, sinon
  // celui de l'utilisateur (créé au besoin)
  let customerId = (await getOrgStripeCustomerIds(organizationId))[0] || null;
  if (!customerId) {
    const account = await mongoDb
      .collection("user")
      .findOne(
        { _id: toObjectId(user.id) },
        { projection: { stripeCustomerId: 1, email: 1, name: 1 } },
      );
    customerId = account?.stripeCustomerId || null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: account?.email || user.email,
        name: account?.name || user.name,
        metadata: { userId: String(user.id) },
      });
      customerId = customer.id;
      await mongoDb
        .collection("user")
        .updateOne(
          { _id: toObjectId(user.id) },
          { $set: { stripeCustomerId: customerId } },
        );
    }
  }

  const baseUrl =
    request.headers.get("origin") ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    "http://localhost:3000";
  const metadata = {
    purpose: PROSPECT_CREDITS_PURPOSE,
    organizationId,
    credits: String(credits),
    userId: String(user.id),
  };

  const checkout = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      { price: process.env.STRIPE_PROSPECT_CREDIT_PRICE_ID, quantity: credits },
    ],
    invoice_creation: {
      enabled: true,
      invoice_data: {
        description: `${credits} crédits de prospection Newbi`,
        metadata,
      },
    },
    billing_address_collection: "required",
    customer_update: { address: "auto", name: "auto" },
    metadata,
    payment_intent_data: { metadata },
    // Pas de « session_id » : le tableau de bord (useDashboardLayoutSimple)
    // le prend pour un retour d'abonnement, vide l'adresse et recharge la
    // page avant que la page Contacts ne confirme l'achat
    success_url: `${baseUrl}/dashboard/clients?credits_prospects=ok&credits_session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/dashboard/clients?credits_prospects=annule`,
    custom_text: {
      submit: {
        message: `${credits} crédits de prospection, ajoutés à votre espace dès qu'ils sont prêts (en général sous 24 h) : vous serez prévenu par e-mail. Sans expiration, utilisés après les crédits offerts du mois.`,
      },
    },
  });

  return NextResponse.json({ url: checkout.url });
}

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
