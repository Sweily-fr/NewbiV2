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
 * L'abonnement de cet espace est-il pris en charge par un cabinet (compte
 * gestionnaire) ? Sert aux Paramètres (Abonnement, Facturation) et aux
 * bandeaux d'essai et de lecture seule : le client n'y choisit ni ne
 * résilie l'offre, c'est son cabinet.
 *
 * → { paidByManager: false }
 *   ou { paidByManager: true, managerName, subscriptionStatus,
 *        viewerIsManager, linkId? } (linkId : seulement pour le cabinet,
 *   pour ouvrir le choix de l'offre depuis son espace)
 * Auth : membre de l'espace.
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
          .findOne(
            { _id: link.managerId },
            { projection: { name: 1, userId: 1 } },
          )
      : null);
  if (!manager) return NextResponse.json({ paidByManager: false });

  const viewerIsManager = String(manager.userId) === String(user.id);
  return NextResponse.json({
    paidByManager: true,
    managerName: manager.name,
    subscriptionStatus: paid?.subscription?.status || null,
    viewerIsManager,
    ...(viewerIsManager && link ? { linkId: String(link._id) } : {}),
  });
}

export const GET = withErrorHandler(handler);
