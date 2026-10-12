import { NextResponse } from "next/server";
import {
  requireSession,
  requireOrgMembership,
  apiError,
  withErrorHandler,
} from "@/src/lib/security";

/**
 * GET /api/calendar-connect/microsoft/authorize
 *
 * Proxy vers l'API : URL d'autorisation OAuth Microsoft. L'espace actif
 * (en-tête x-workspace-id) est transmis : l'API y exige le droit « Modifier »
 * du calendrier.
 */
async function handler(request) {
  const { user, cookieHeader } = await requireSession(request);

  const workspaceId = request.headers.get("x-workspace-id");
  if (!workspaceId) {
    return apiError(400, "Header x-workspace-id manquant");
  }
  await requireOrgMembership(user.id, workspaceId);

  const backendUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  ).replace(/\/+$/, "");

  const response = await fetch(
    `${backendUrl}/calendar-connect/microsoft/authorize`,
    {
      headers: {
        Cookie: cookieHeader,
        "Content-Type": "application/json",
        "x-workspace-id": workspaceId,
      },
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return NextResponse.json(data, { status: response.status });
  }

  return NextResponse.json(data);
}

export const GET = withErrorHandler(handler);
