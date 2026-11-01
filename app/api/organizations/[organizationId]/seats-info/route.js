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
import { getPlanLimits } from "@/src/lib/plan-limits";
import { withoutCabinetMembers } from "@/src/lib/cabinet-members";

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

  // Même décompte que la facturation des sièges (seatSyncService) : les
  // membres de Better Auth n'ont pas de champ status ; le super admin, les
  // comptables et le cabinet qui suit l'espace ne sont pas facturés.
  const includedSeats = getPlanLimits(subscription.plan).invitableUsers;

  const members = await withoutCabinetMembers(
    mongoDb,
    organizationId,
    await mongoDb
      .collection("member")
      .find({ organizationId: orgObjectId })
      .toArray(),
  );

  const billableMembers = members.filter(
    (m) => m.role !== "owner" && m.role !== "accountant",
  );
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
