import { NextResponse } from "next/server";
import { mongoDb } from "@/src/lib/mongodb";
import { requireSession, withErrorHandler } from "@/src/lib/security";
import { findActiveAccountManagerByUserId } from "@/src/lib/managed-clients";

/**
 * GET /api/gestionnaire/me
 *
 * L'utilisateur connecté est-il gestionnaire ? Sert à l'envoyer vers son
 * espace à la connexion, à afficher l'accès à cet espace dans le tableau de
 * bord et le bandeau « Vous agissez pour le compte de… » dans le dossier
 * d'un client. managedOrganizationIds : ses clients actifs.
 */
async function handler(request) {
  const { user } = await requireSession(request);
  const manager = await findActiveAccountManagerByUserId(mongoDb, user.id);
  if (!manager) {
    return NextResponse.json({ isManager: false });
  }

  const links = await mongoDb
    .collection("managedclients")
    .find(
      { managerId: manager._id, status: "active" },
      { projection: { organizationId: 1 } },
    )
    .toArray();

  return NextResponse.json({
    isManager: true,
    name: manager.name,
    managedOrganizationIds: links.map((l) => String(l.organizationId)),
  });
}

export const GET = withErrorHandler(handler);
