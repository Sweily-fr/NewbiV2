import { NextResponse } from "next/server";
import { mongoDb } from "@/src/lib/mongodb";
import {
  requireSession,
  requireOrgMembership,
  toObjectId,
  apiError,
  withErrorHandler,
} from "@/src/lib/security";

/**
 * GET /api/organizations/[organizationId]/seats-info
 *
 * Retrieve seat info (included, current, available) for an organization.
 * Auth: session + org membership (any role can view seats).
 */
async function handler(request, { params }) {
  const { user } = await requireSession(request);
  const { organizationId } = await params;

  await requireOrgMembership(user.id, organizationId);

  const orgObjectId = toObjectId(organizationId);

  // Subscription lookup (referenceId is stored as string by org-creation.js)
  const subscription = await mongoDb.collection("subscription").findOne({
    $or: [{ organizationId: orgObjectId }, { referenceId: organizationId }],
  });

  if (!subscription) {
    return apiError(404, "Aucun abonnement trouvé");
  }

  const planLimits = {
    freelance: { users: 1 },
    pme: { users: 10 },
    entreprise: { users: 25 },
  };

  const includedSeats = planLimits[subscription.plan]?.users || 1;

  const members = await mongoDb
    .collection("member")
    .find({
      organizationId: orgObjectId,
      status: { $in: ["active", "pending"] },
    })
    .toArray();

  const billableMembers = members.filter((m) => m.role !== "accountant");
  const currentMembers = billableMembers.length;
  const availableSeats = Math.max(0, includedSeats - currentMembers);
  const additionalSeats = Math.max(0, currentMembers - includedSeats);

  return NextResponse.json({
    includedSeats,
    currentMembers,
    availableSeats,
    additionalSeats,
    plan: subscription.plan,
    seatCost: 7.49,
  });
}

export const GET = withErrorHandler(handler);
