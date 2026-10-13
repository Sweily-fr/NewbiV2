import { NextResponse } from "next/server";
import { mongoDb } from "@/src/lib/mongodb";
import { apiError, withErrorHandler } from "@/src/lib/security";
import { requireAccountManager } from "@/src/lib/gestionnaire-auth";
import { ManagedClientError } from "@/src/lib/managed-clients";
import { inviteExistingClient } from "@/src/lib/managed-client-invitations";

/**
 * POST /api/gestionnaire/invitations : le cabinet invite un client qui a
 * déjà un compte Newbi. Corps : { email }.
 */
async function handler(request) {
  const { user, manager } = await requireAccountManager(request);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return apiError(400, "Requête invalide");
  }

  try {
    const invitation = await inviteExistingClient({
      mongoDb,
      managerId: manager._id,
      email: body.email,
      actor: { type: "manager", email: user.email },
    });
    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    if (error instanceof ManagedClientError) {
      return apiError(error.status, error.message);
    }
    throw error;
  }
}

export const POST = withErrorHandler(handler);
