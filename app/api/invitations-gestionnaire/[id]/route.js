import { NextResponse } from "next/server";
import { mongoDb } from "@/src/lib/mongodb";
import { requireSession, apiError, withErrorHandler } from "@/src/lib/security";
import { ManagedClientError } from "@/src/lib/managed-clients";
import {
  getClientInvitation,
  respondToClientInvitation,
} from "@/src/lib/managed-client-invitations";

/**
 * Invitation d'un cabinet, côté client (destinataire seulement).
 * GET  → détail et espaces que l'utilisateur peut confier
 * POST → { action: "accept", organizationIds: [...] } ou { action: "refuse" }
 */
const fail = (error) => {
  if (error instanceof ManagedClientError) {
    return apiError(error.status, error.message);
  }
  throw error;
};

async function getHandler(request, { params }) {
  const { user } = await requireSession(request);
  const { id } = await params;
  try {
    return NextResponse.json({
      invitation: await getClientInvitation(mongoDb, { id, user }),
    });
  } catch (error) {
    return fail(error);
  }
}

async function postHandler(request, { params }) {
  const { user } = await requireSession(request);
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return apiError(400, "Requête invalide");
  }
  try {
    const result = await respondToClientInvitation({
      mongoDb,
      id,
      user,
      action: body.action,
      organizationIds: body.organizationIds,
      organizationId: body.organizationId,
      proof: {
        ip:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        userAgent: request.headers.get("user-agent") || null,
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return fail(error);
  }
}

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
