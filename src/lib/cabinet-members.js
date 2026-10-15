import { ObjectId } from "mongodb";
import { getPlanLimits } from "./plan-limits.js";

/**
 * Membres de l'espace sans le cabinet (compte gestionnaire) qui le suit : il
 * ne prend pas la place gratuite de comptable du client et n'est jamais
 * facturé comme utilisateur, quel que soit le rôle que le client lui donne.
 */
export async function withoutCabinetMembers(mongoDb, organizationId, members) {
  try {
    const raw = String(organizationId || "");
    if (!ObjectId.isValid(raw)) return members;
    const links = await mongoDb
      .collection("managedclients")
      .find(
        { organizationId: new ObjectId(raw), status: "active" },
        { projection: { managerId: 1 } },
      )
      .toArray();
    if (links.length === 0) return members;
    const managers = await mongoDb
      .collection("accountmanagers")
      .find(
        { _id: { $in: links.map((l) => l.managerId) } },
        { projection: { userId: 1 } },
      )
      .toArray();
    const cabinetUserIds = new Set(managers.map((m) => String(m.userId)));
    return members.filter((m) => !cabinetUserIds.has(String(m.userId)));
  } catch (error) {
    console.error("[SEATS] Cabinet non exclu du décompte:", error?.message);
    return members;
  }
}

/**
 * Utilisateurs à facturer en plus de ceux inclus dans l'offre : membres de
 * l'espace hors super admin, comptables et cabinet, au-delà de la limite de
 * l'offre. Même règle que seatSyncService.getAdditionalSeatsCount, pour une
 * offre donnée (celle que l'on s'apprête à souscrire).
 */
export async function countAdditionalSeats(mongoDb, organizationId, plan) {
  const raw = String(organizationId || "");
  if (!ObjectId.isValid(raw)) return 0;
  const members = await withoutCabinetMembers(
    mongoDb,
    raw,
    await mongoDb
      .collection("member")
      .find(
        { organizationId: new ObjectId(raw) },
        { projection: { userId: 1, role: 1 } },
      )
      .toArray(),
  );
  const billable = members.filter(
    (m) => m.role !== "owner" && m.role !== "accountant",
  ).length;
  return Math.max(0, billable - getPlanLimits(plan).invitableUsers);
}
