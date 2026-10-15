import { NextResponse } from "next/server";
import { mongoDb } from "@/src/lib/mongodb";
import {
  requireOrgMembership,
  requireSession,
  toObjectId,
  withErrorHandler,
} from "@/src/lib/security";
import { findManagerPaidSubscription } from "@/src/lib/manager-billing";
import { getCabinetHandBack } from "@/src/lib/payer-switch";

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
 *        viewerIsManager, linkId?, handBack, endsAt, startsAt } (linkId :
 *   seulement pour le cabinet, pour ouvrir le choix de l'offre depuis son
 *   espace ; handBack : le cabinet a arrêté sa prise en charge, sa dernière
 *   période court jusqu'à endsAt et le client peut déjà choisir son offre ;
 *   startsAt : le cabinet a repris l'abonnement du client et paie à partir
 *   de cette date, fin de la période déjà payée par le client)
 * Auth : membre de l'espace.
 */
async function handler(request, { params }) {
  const { user } = await requireSession(request);
  const { organizationId } = await params;
  const orgObjectId = toObjectId(organizationId);
  await requireOrgMembership(user.id, orgObjectId);

  const [link, paid, handBack] = await Promise.all([
    mongoDb
      .collection("managedclients")
      .findOne(
        { organizationId: orgObjectId, status: "active", payer: "manager" },
        { projection: { managerId: 1, payerChange: 1 } },
      ),
    findManagerPaidSubscription(mongoDb, String(orgObjectId)),
    getCabinetHandBack(mongoDb, String(orgObjectId)),
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
  const startsAt =
    link?.payerChange?.to === "manager" &&
    new Date(link.payerChange.effectiveAt) > new Date()
      ? link.payerChange.effectiveAt
      : null;
  return NextResponse.json({
    paidByManager: true,
    managerName: manager.name,
    subscriptionStatus: paid?.subscription?.status || null,
    viewerIsManager,
    handBack: Boolean(handBack),
    endsAt: handBack?.endsAt || null,
    startsAt,
    ...(viewerIsManager && link ? { linkId: String(link._id) } : {}),
  });
}

export const GET = withErrorHandler(handler);
