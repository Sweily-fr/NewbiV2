import { NextResponse } from "next/server";
import { mongoDb } from "@/src/lib/mongodb";
import { apiError, withErrorHandler } from "@/src/lib/security";
import { requireAccountManager } from "@/src/lib/gestionnaire-auth";
import { ManagedClientError } from "@/src/lib/managed-clients";
import { relaunchClientInvitation } from "@/src/lib/managed-client-invitations";

/**
 * POST /api/gestionnaire/invitations/:id/relancer : nouvelle invitation
 * pour un client dont l'invitation a expiré ou qu'il a refusée.
 */
async function handler(request, { params }) {
  const { user, manager } = await requireAccountManager(request);
  const { id } = await params;
  try {
    const invitation = await relaunchClientInvitation({
      mongoDb,
      manager,
      id,
      actor: { type: "manager", email: user.email },
    });
    return NextResponse.json({ invitation });
  } catch (error) {
    if (error instanceof ManagedClientError) {
      return apiError(error.status, error.message);
    }
    throw error;
  }
}

export const POST = withErrorHandler(handler);
