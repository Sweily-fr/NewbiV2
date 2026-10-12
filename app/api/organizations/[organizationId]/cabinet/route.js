import { NextResponse } from "next/server";
import { mongoDb } from "@/src/lib/mongodb";
import {
  requireOrgMembership,
  requireSession,
  toObjectId,
  withErrorHandler,
} from "@/src/lib/security";
import { findManagerPaidSubscription } from "@/src/lib/manager-billing";

/**
 * GET /api/organizations/[organizationId]/cabinet
 *
 * L'abonnement de cet espace est-il pris en charge par un cabinet
 * (gestionnaire) ? { paidByManager, managerName }. Sert à Paramètres >
 * Abonnement : le client n'y choisit ni ne résilie l'offre, c'est son
 * cabinet qui la gère. Auth : membre de l'espace.
 */
async function handler(request, { params }) {
  const { user } = await requireSession(request);
  const { organizationId } = await params;
  const orgObjectId = toObjectId(organizationId);
  await requireOrgMembership(user.id, orgObjectId);

  const [link, paid] = await Promise.all([
    mongoDb
      .collection("managedclients")
      .findOne(
        { organizationId: orgObjectId, status: "active", payer: "manager" },
        { projection: { managerId: 1 } },
      ),
    findManagerPaidSubscription(mongoDb, String(orgObjectId)),
  ]);
  const manager =
    paid?.manager ||
    (link
      ? await mongoDb
          .collection("accountmanagers")
          .findOne({ _id: link.managerId }, { projection: { name: 1 } })
      : null);

  return NextResponse.json(
    manager
      ? { paidByManager: true, managerName: manager.name }
      : { paidByManager: false },
  );
}

export const GET = withErrorHandler(handler);
