import { NextResponse } from "next/server";
import { mongoDb } from "@/src/lib/mongodb";
import {
  requireSession,
  requireOrgMembership,
  toObjectId,
  apiError,
  withErrorHandler,
} from "@/src/lib/security";
import { isAppTrialEnabled } from "@/src/lib/feature-flags";
import { isTrialAppActive } from "@/src/lib/trial-app";

/**
 * POST /api/organizations/[organizationId]/complete-onboarding
 *
 * Marks onboarding as completed for an organization.
 * Auth: session + org membership with owner or admin role (MOYEN-16).
 */
async function handler(request, { params }) {
  const { user } = await requireSession(request);
  const { organizationId } = await params;

  // MOYEN-16: role check — only owner/admin can complete onboarding
  await requireOrgMembership(user.id, organizationId, ["owner", "admin"]);

  // App-managed trial check (feature-flagged). When the flag is OFF, the
  // legacy Stripe-only validation below runs unchanged.
  let trialAppActive = false;
  if (isAppTrialEnabled()) {
    const orgDoc = await mongoDb
      .collection("organization")
      .findOne(
        { _id: toObjectId(organizationId) },
        { projection: { isTrialActive: 1, trialEndDate: 1 } },
      );
    if (isTrialAppActive(orgDoc)) {
      trialAppActive = true;
    }
  }

  // Verify active subscription before marking onboarding complete
  const subscription = await mongoDb.collection("subscription").findOne({
    $or: [{ organizationId: organizationId }, { referenceId: organizationId }],
  });

  const hasActiveSubscription =
    trialAppActive ||
    (subscription &&
      (subscription.status === "active" ||
        subscription.status === "trialing" ||
        (subscription.status === "canceled" &&
          subscription.periodEnd &&
          new Date(subscription.periodEnd) > new Date())));

  if (!hasActiveSubscription) {
    return apiError(400, "Aucun abonnement actif trouvé");
  }

  // Update organization
  await mongoDb.collection("organization").updateOne(
    { _id: toObjectId(organizationId) },
    {
      $set: {
        onboardingCompleted: true,
        updatedAt: new Date(),
      },
    },
  );

  // Also mark user's onboarding as completed
  await mongoDb.collection("user").updateOne(
    { _id: toObjectId(user.id) },
    {
      $set: {
        hasSeenOnboarding: true,
        onboardingStep: "completed",
        updatedAt: new Date(),
      },
    },
  );

  return NextResponse.json({
    success: true,
    message: "Onboarding complété avec succès",
  });
}

export const POST = withErrorHandler(handler);
