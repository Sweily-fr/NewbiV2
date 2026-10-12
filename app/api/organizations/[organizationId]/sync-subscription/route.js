import { NextResponse } from "next/server";
import Stripe from "stripe";
import { mongoDb } from "@/src/lib/mongodb";
import {
  requireSession,
  requireOrgMembership,
  toObjectId,
  withErrorHandler,
} from "@/src/lib/security";
import { getAccountActions } from "@/src/lib/organization-roles";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Un abonnement Stripe peut-il être recopié sur cet espace ?
 *
 * Un même client Stripe (celui de l'utilisateur) peut payer plusieurs
 * espaces : sans ce filtre, l'abonnement actif d'un espace A était recopié
 * sur un espace B expiré ou en essai (réactivation gratuite).
 *
 *   - déjà rattaché à cet espace en base : oui ;
 *   - métadonnées `referenceId` : seulement si c'est cet espace ;
 *   - métadonnées `organizationId` d'un abonnement d'espace existant :
 *     seulement si c'est cet espace ;
 *   - abonnement d'un NOUVEL espace (`isNewOrganization`) : son
 *     `organizationId` est l'ancien espace actif, il n'identifie rien ; il
 *     n'est repris que s'il est déjà rattaché en base (cas du premier tiret) ;
 *   - sans aucune métadonnée d'espace (anciens abonnements) : seulement si
 *     le client Stripe vient de l'abonnement de l'espace lui-même.
 */
function belongsToOrganization(
  sub,
  { organizationId, linkedIds, orgCustomer },
) {
  if (linkedIds.has(sub.id)) return true;
  const meta = sub.metadata || {};
  if (meta.referenceId) return meta.referenceId === organizationId;
  if (meta.isNewOrganization === "true") return false;
  if (meta.organizationId) return meta.organizationId === organizationId;
  return orgCustomer;
}

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
 *
 * Client Stripe : celui de l'abonnement de l'espace ; à défaut, celui de
 * l'utilisateur, mais seulement s'il a le droit « Gérer l'abonnement » de
 * cet espace (c'est lui qui vient de payer). Seuls les abonnements Stripe de
 * cet espace sont repris (cf. belongsToOrganization), et jamais un
 * abonnement déjà rattaché à un autre espace.
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
  // sinon depuis l'utilisateur, s'il gère l'abonnement de cet espace.
  let customerId = existing?.stripeCustomerId || null;
  const orgCustomer = Boolean(customerId);
  if (!customerId && user.stripeCustomerId) {
    const { actions } = await getAccountActions(mongoDb, {
      userId: user.id,
      organizationId,
      moduleKey: "billing",
    });
    if (actions.includes("manage")) {
      customerId = user.stripeCustomerId;
    }
  }
  if (!customerId) {
    return NextResponse.json({ synced: false, reason: "no_customer" });
  }

  // Récupérer les abonnements Stripe du client et choisir le plus pertinent.
  const list = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });
  const linkedIds = new Set(
    existing?.stripeSubscriptionId ? [existing.stripeSubscriptionId] : [],
  );
  const subs = (list.data || []).filter((s) =>
    belongsToOrganization(s, { organizationId, linkedIds, orgCustomer }),
  );
  const rank = (s) =>
    s.status === "active" || s.status === "trialing"
      ? 0
      : s.status === "past_due"
        ? 1
        : 2;
  subs.sort((a, b) => rank(a) - rank(b) || b.created - a.created);
  const best = subs[0];

  if (!best) {
    return NextResponse.json({
      synced: false,
      reason: "no_stripe_subscription",
    });
  }

  // Un abonnement déjà rattaché à un autre espace n'est jamais déplacé ici.
  if (!linkedIds.has(best.id)) {
    const owner = await collection.findOne(
      { stripeSubscriptionId: best.id },
      { projection: { referenceId: 1, organizationId: 1 } },
    );
    const ownerId = owner
      ? String(owner.referenceId || owner.organizationId || "")
      : null;
    if (ownerId && ownerId !== organizationId) {
      return NextResponse.json({
        synced: false,
        reason: "subscription_of_other_organization",
      });
    }
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
