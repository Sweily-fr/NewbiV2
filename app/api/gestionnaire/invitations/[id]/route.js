import { NextResponse } from "next/server";
import { mongoDb } from "@/src/lib/mongodb";
import { apiError, withErrorHandler } from "@/src/lib/security";
import { requireAccountManager } from "@/src/lib/gestionnaire-auth";
import { ManagedClientError } from "@/src/lib/managed-clients";
import { cancelClientInvitation } from "@/src/lib/managed-client-invitations";

/**
 * DELETE /api/gestionnaire/invitations/:id : le cabinet retire une de ses
 * invitations, en attente, expirée ou refusée.
 */
async function handler(request, { params }) {
  const { manager } = await requireAccountManager(request);
  const { id } = await params;
  try {
    return NextResponse.json(
      await cancelClientInvitation(mongoDb, { managerId: manager._id, id }),
    );
  } catch (error) {
    if (error instanceof ManagedClientError) {
      return apiError(error.status, error.message);
    }
    throw error;
  }
}

export const DELETE = withErrorHandler(handler);
