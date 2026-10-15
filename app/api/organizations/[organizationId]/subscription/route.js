import { NextResponse } from "next/server";
import { mongoDb } from "@/src/lib/mongodb";
import {
  requireSession,
  requireOrgBillingVisibility,
  pickFields,
  toObjectId,
  withErrorHandler,
} from "@/src/lib/security";
import { isAppTrialEnabled } from "@/src/lib/feature-flags";

/**
 * Champs servis à un membre sans « Voir l'abonnement » : ce dont toute
 * l'interface a besoin (accès aux fonctionnalités, lecture seule après
 * expiration, bannières d'essai), sans identifiants Stripe ni détails de
 * facturation. `periodEnd` reste : un abonnement résilié garde l'accès
 * jusqu'à cette date (useSubscriptionAccess, layout du dashboard).
 */
const MEMBER_SUBSCRIPTION_FIELDS = [
  "plan",
  "status",
  "periodEnd",
  "isDefault",
  "isExpired",
  "appTrialEnabled",
  "isTrialActive",
  "trialStartDate",
  "trialEndDate",
  "stripeTrialActive",
  "hasUsedTrial",
];

/**
 * GET /api/organizations/[organizationId]/subscription
 *
 * Abonnement d'un espace.
 * Auth : session + membre de l'espace. Réponse complète (identifiants
 * Stripe, dates de période, résiliation programmée) avec « Voir
 * l'abonnement » ; sinon statut, plan et essai seulement.
 */
async function handler(request, { params }) {
  const { user } = await requireSession(request);
  const { organizationId } = await params;

  const orgObjectId = toObjectId(organizationId);

  const { canViewBilling } = await requireOrgBillingVisibility(
    user.id,
    orgObjectId,
  );
  const respond = (body) =>
    NextResponse.json(
      canViewBilling ? body : pickFields(body, MEMBER_SUBSCRIPTION_FIELDS),
    );

  // Fetch subscription + organization in parallel — the organization carries
  // the app-managed trial flags (trialEndDate / isTrialActive / stripeTrialActive)
  // that the frontend needs to render trial state alongside the Stripe sub.
  const [subscription, orgDoc] = await Promise.all([
    // Tri par updatedAt décroissant : si plusieurs documents coexistent pour la
    // même org (ex: ancien abonnement expiré + nouveau réactivé après
    // renouvellement), on renvoie TOUJOURS le plus récent (le réactivé), jamais
    // l'ancien "canceled/expired".
    mongoDb.collection("subscription").findOne(
      {
        $or: [{ organizationId: orgObjectId }, { referenceId: organizationId }],
      },
      { sort: { updatedAt: -1 } },
    ),
    mongoDb.collection("organization").findOne(
      { _id: orgObjectId },
      {
        projection: {
          isTrialActive: 1,
          trialEndDate: 1,
          trialStartDate: 1,
          stripeTrialActive: 1,
          hasUsedTrial: 1,
        },
      },
    ),
  ]);

  // `appTrialEnabled` is the server-side feature flag mirrored into the
  // response so client components (which cannot read process.env directly)
  // can gate any trial-aware behaviour. When this flag is false, clients
  // MUST ignore the trial fields and behave exactly as before.
  const trial = {
    appTrialEnabled: isAppTrialEnabled(),
    isTrialActive: orgDoc?.isTrialActive ?? false,
    trialStartDate: orgDoc?.trialStartDate ?? null,
    trialEndDate: orgDoc?.trialEndDate ?? null,
    stripeTrialActive: orgDoc?.stripeTrialActive ?? false,
    hasUsedTrial: orgDoc?.hasUsedTrial ?? false,
  };

  if (!subscription) {
    return respond({
      plan: null,
      status: null,
      isDefault: true,
      ...trial,
    });
  }

  // Check if canceled subscription has expired
  const now = new Date();
  const periodEnd = subscription.periodEnd
    ? new Date(subscription.periodEnd)
    : null;
  const isExpired =
    subscription.status === "canceled" && periodEnd && periodEnd < now;

  if (isExpired) {
    return respond({
      plan: subscription.plan,
      status: "expired",
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      periodEnd: subscription.periodEnd,
      isDefault: false,
      isExpired: true,
      ...trial,
    });
  }

  return respond({
    plan: subscription.plan,
    status: subscription.status,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    stripeCustomerId: subscription.stripeCustomerId,
    periodStart: subscription.periodStart || subscription.createdAt,
    periodEnd: subscription.periodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    // Abonnement pris pendant la dernière période payée par le cabinet :
    // premier prélèvement à cette date (ce n'est pas un essai)
    billingStartsAt: subscription.billingStartsAt || null,
    isDefault: false,
    ...trial,
  });
}

export const GET = withErrorHandler(handler);
