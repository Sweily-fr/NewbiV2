import { NextResponse } from "next/server";
import { mongoDb } from "@/src/lib/mongodb";
import {
  requireSession,
  requireOrgBillingVisibility,
  pickFields,
  toObjectId,
  apiError,
  withErrorHandler,
} from "@/src/lib/security";

/**
 * Sans « Voir l'abonnement » : le plan et ses limites de membres, pas les
 * sièges payants ni leur prix.
 */
const MEMBER_SEATS_FIELDS = [
  "plan",
  "includedSeats",
  "currentMembers",
  "availableSeats",
];

/**
 * GET /api/organizations/[organizationId]/seats-info
 *
 * Sièges d'un espace (inclus, occupés, disponibles, payants).
 * Auth : session + membre de l'espace ; sièges payants et prix réservés à
 * « Voir l'abonnement ».
 */
async function handler(request, { params }) {
  const { user } = await requireSession(request);
  const { organizationId } = await params;

  const orgObjectId = toObjectId(organizationId);

  const { canViewBilling } = await requireOrgBillingVisibility(
    user.id,
    orgObjectId,
  );

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

  const seats = {
    includedSeats,
    currentMembers,
    availableSeats,
    additionalSeats,
    plan: subscription.plan,
    seatCost: 7.49,
  };

  return NextResponse.json(
    canViewBilling ? seats : pickFields(seats, MEMBER_SEATS_FIELDS),
  );
}

export const GET = withErrorHandler(handler);
