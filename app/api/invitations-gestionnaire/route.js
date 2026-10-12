import { NextResponse } from "next/server";
import { mongoDb } from "@/src/lib/mongodb";
import { requireSession, withErrorHandler } from "@/src/lib/security";
import { listPendingClientInvitations } from "@/src/lib/managed-client-invitations";

/**
 * GET /api/invitations-gestionnaire : invitations de cabinets en attente
 * pour l'utilisateur connecté (panneau Notifications > Invitations et
 * compteur de la barre latérale), quel que soit l'espace actif.
 */
async function handler(request) {
  const { user } = await requireSession(request);
  const invitations = await listPendingClientInvitations(mongoDb, user.id);
  return NextResponse.json({ invitations });
}

export const GET = withErrorHandler(handler);
