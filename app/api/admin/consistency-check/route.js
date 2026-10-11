import { NextResponse } from "next/server";
import { requireBackofficeAdmin, withErrorHandler } from "@/src/lib/security";
import { runAllChecks } from "@/src/lib/consistency-checks";

/**
 * GET /api/admin/consistency-check
 *
 * Run all consistency checks and return a structured report.
 *
 * Utilisé en production par l'équipe (rapport de cohérence de la base) :
 * session + liste blanche du back-office (BACKOFFICE_ADMIN_USER_IDS, ids
 * utilisateurs côté serveur), au lieu d'une adresse email codée en dur.
 * Hors liste ou liste vide : 404, pour ne pas révéler la route.
 */
async function handler(request) {
  await requireBackofficeAdmin(request);

  const report = await runAllChecks();

  return NextResponse.json(report);
}

export const GET = withErrorHandler(handler);
