import { NextResponse } from "next/server";
import { mongoDb } from "@/src/lib/mongodb";
import {
  requireSession,
  requireOrgMembership,
  toObjectId,
  withErrorHandler,
} from "@/src/lib/security";

/**
 * GET /api/organizations/[organizationId]/subscription
 *
 * Retrieve subscription details for an organization.
 * Auth: session + org membership (any role can view subscription).
 */
async function handler(request, { params }) {
  const { user } = await requireSession(request);
  const { organizationId } = await params;

  await requireOrgMembership(user.id, organizationId);

  // Subscription lookup (referenceId stored as string by org-creation.js)
  const orgObjectId = toObjectId(organizationId);
  const subscription = await mongoDb.collection("subscription").findOne({
    $or: [{ organizationId: orgObjectId }, { referenceId: organizationId }],
  });

  if (!subscription) {
    return NextResponse.json({
      plan: null,
      status: null,
      isDefault: true,
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
    return NextResponse.json({
      plan: subscription.plan,
      status: "expired",
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      periodEnd: subscription.periodEnd,
      isDefault: false,
      isExpired: true,
    });
  }

  return NextResponse.json({
    plan: subscription.plan,
    status: subscription.status,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    stripeCustomerId: subscription.stripeCustomerId,
    periodStart: subscription.periodStart || subscription.createdAt,
    periodEnd: subscription.periodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    isDefault: false,
  });
}

export const GET = withErrorHandler(handler);
