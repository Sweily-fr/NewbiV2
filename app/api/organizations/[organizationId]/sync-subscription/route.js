import { NextResponse } from "next/server";
import Stripe from "stripe";
import { mongoDb } from "@/src/lib/mongodb";
import {
  requireSession,
  requireOrgMembership,
  toObjectId,
  withErrorHandler,
} from "@/src/lib/security";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/organizations/[organizationId]/sync-subscription
 *
 * Réactive/synchronise l'abonnement de l'organisation DIRECTEMENT depuis Stripe,
 * sans dépendre du webhook. Appelé au retour d'un paiement (?subscription_success)
 * pour que l'abonnement repasse en "active" même si le webhook est en retard,
 * échoue, ou n'est pas forwardé en local.
 *
 * Idempotent : interroge Stripe pour le customer et met à jour le document
 * `subscription` de l'org (le même qui était expiré) — pas de doublon.
 */
async function handler(request, { params }) {
  const { user } = await requireSession(request);
  const { organizationId } = await params;
  await requireOrgMembership(user.id, organizationId);

  const orgObjectId = toObjectId(organizationId);
  const query = {
    $or: [{ organizationId: orgObjectId }, { referenceId: organizationId }],
  };
  const collection = mongoDb.collection("subscription");
  const existing = await collection.findOne(query);

  // Customer Stripe : depuis le doc abonnement (même client après renouvellement)
  // sinon depuis l'utilisateur.
  const customerId = existing?.stripeCustomerId || user.stripeCustomerId;
  if (!customerId) {
    return NextResponse.json({ synced: false, reason: "no_customer" });
  }

  // Récupérer les abonnements Stripe du client et choisir le plus pertinent.
  const list = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });
  const subs = list.data || [];
  const rank = (s) =>
    s.status === "active" || s.status === "trialing"
      ? 0
      : s.status === "past_due"
        ? 1
        : 2;
  subs.sort((a, b) => rank(a) - rank(b) || b.created - a.created);
  const best = subs[0];

  if (!best) {
    return NextResponse.json({ synced: false, reason: "no_stripe_subscription" });
  }

  const set = {
    status: best.status,
    stripeSubscriptionId: best.id,
    stripeCustomerId: customerId,
    periodStart: new Date(best.current_period_start * 1000),
    periodEnd: new Date(best.current_period_end * 1000),
    cancelAtPeriodEnd: best.cancel_at_period_end || false,
    updatedAt: new Date(),
  };
  if (best.metadata?.planName) set.plan = best.metadata.planName;

  if (existing) {
    // On nettoie un éventuel marqueur de l'outil dev : l'état réel fait foi.
    await collection.updateOne(query, {
      $set: set,
      $unset: { __devBackup: "" },
    });
  } else {
    await collection.insertOne({
      referenceId: organizationId,
      plan: best.metadata?.planName || null,
      ...set,
      createdAt: new Date(),
    });
  }

  return NextResponse.json({ synced: true, status: best.status });
}

export const POST = withErrorHandler(handler);
