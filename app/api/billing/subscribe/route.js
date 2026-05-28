import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { apiError, withErrorHandler, toObjectId } from "@/src/lib/security";
import { isAppTrialEnabled } from "@/src/lib/feature-flags";

/**
 * POST /api/billing/subscribe
 *
 * Dedicated post-trial subscription endpoint (décision #10).
 *
 * For a user who ALREADY has an organization (typically because Lot 3 created
 * one at signup + granted a 30-day app trial) and wants to start a paid plan.
 * Unlike /api/create-org-subscription this endpoint:
 *
 *   - does NOT create a pending_org_data document (the org already exists)
 *   - does NOT set isNewOrganization=true in metadata (no org creation in the
 *     webhook)
 *   - always uses trial_period_days: 0 (no Stripe trial — the app trial is
 *     handled separately and ends as soon as a Stripe sub is active, via
 *     auth-plugins webhook logic)
 *   - success_url stays on /dashboard (no /onboarding/success detour)
 *
 * Body: { plan: "freelance" | "pme" | "entreprise", isAnnual: boolean }
 *
 * Returns: { url: stripeCheckoutUrl } on success
 *
 * Auth: requires Better Auth session with an active organization. The user
 * must be a member of the active org (validated by the Stripe metadata which
 * the webhook will use to attach the sub to the right organizationId).
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const bodySchema = z
  .object({
    plan: z.enum(["freelance", "pme", "entreprise"]),
    isAnnual: z.boolean(),
  })
  .strict();

const PRICE_IDS = {
  freelance: {
    monthly: () => process.env.STRIPE_FREELANCE_MONTHLY_PRICE_ID,
    annual: () => process.env.STRIPE_FREELANCE_YEARLY_PRICE_ID,
  },
  pme: {
    monthly: () => process.env.STRIPE_PME_MONTHLY_PRICE_ID,
    annual: () => process.env.STRIPE_PME_YEARLY_PRICE_ID,
  },
  entreprise: {
    monthly: () => process.env.STRIPE_ENTREPRISE_MONTHLY_PRICE_ID,
    annual: () => process.env.STRIPE_ENTREPRISE_YEARLY_PRICE_ID,
  },
};

async function handler(request) {
  if (!isAppTrialEnabled()) {
    // The endpoint is only meaningful when the app-managed trial flow is
    // active. When OFF the legacy /api/create-org-subscription handles
    // subscriptions including the 30-day Stripe trial — refuse this entry
    // point to avoid duplicate code paths.
    return apiError(
      404,
      "Route disponible uniquement avec le flow app-trial activé",
    );
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return apiError(401, "Non authentifié");
  }

  const organizationId = session.session?.activeOrganizationId;
  if (!organizationId) {
    return apiError(400, "Aucune organisation active");
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Body JSON invalide");
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, "Données invalides", parsed.error.flatten());
  }
  const { plan, isAnnual } = parsed.data;

  // Resolve price id
  const priceFactory = PRICE_IDS[plan];
  const priceId = isAnnual ? priceFactory.annual() : priceFactory.monthly();
  if (!priceId) {
    return apiError(500, `Price ID non configuré pour le plan ${plan}`);
  }

  // Ensure the user is an owner/admin of the active org (gate billing actions)
  const member = await mongoDb.collection("member").findOne({
    userId: toObjectId(session.user.id),
    organizationId: toObjectId(organizationId),
  });
  if (!member) {
    return apiError(403, "Non membre de cette organisation");
  }
  if (!["owner", "admin"].includes((member.role || "").toLowerCase())) {
    return apiError(403, "Seul le propriétaire ou un admin peut souscrire");
  }

  // Resolve or create the Stripe customer.
  let customerId = session.user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: session.user.name,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await mongoDb
      .collection("user")
      .updateOne(
        { _id: toObjectId(session.user.id) },
        { $set: { stripeCustomerId: customerId } },
      );
  }

  const requestOrigin = request.headers.get("origin");
  const baseUrl =
    requestOrigin ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    payment_method_collection: "always",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?subscription_success=true`,
    cancel_url: `${baseUrl}/dashboard?subscription_canceled=true`,
    billing_address_collection: "required",
    allow_promotion_codes: true,
    metadata: {
      userId: session.user.id,
      // Organization already exists — webhook must NOT create one.
      isNewOrganization: "false",
      isOnboarding: "false",
      organizationId,
      planName: plan,
      isAnnual: isAnnual ? "true" : "false",
    },
    subscription_data: {
      // No Stripe trial — app trial handled separately.
      // Stripe rejects `trial_period_days: 0` (minimum is 1) so we omit the
      // field entirely to mean "no trial, charge immediately".
      metadata: {
        userId: session.user.id,
        isNewOrganization: "false",
        organizationId,
        referenceId: organizationId,
        planName: plan,
        isAnnual: isAnnual ? "true" : "false",
        hasTrial: "false",
        trialDays: "0",
      },
    },
    custom_text: {
      submit: {
        message: `Souscription au plan ${plan.toUpperCase()} — paiement immédiat, sans essai supplémentaire`,
      },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}

export const POST = withErrorHandler(handler);
