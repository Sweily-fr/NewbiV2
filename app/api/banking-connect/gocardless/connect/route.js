import { NextResponse } from "next/server";
import {
  requireSession,
  requireOrgMembership,
  requireActiveSubscription,
  apiError,
  withErrorHandler,
} from "@/src/lib/security";

/**
 * GET /api/banking-connect/gocardless/connect
 *
 * Proxy to backend to initiate GoCardless OAuth flow.
 * Auth: session + org membership + active subscription.
 */
async function handler(request) {
  const { user, cookieHeader } = await requireSession(request);

  const workspaceId = request.headers.get("x-workspace-id");

  if (!workspaceId) {
    return apiError(400, "Header x-workspace-id manquant");
  }

  const institutionId = request.nextUrl.searchParams.get("institutionId");

  if (!institutionId) {
    return apiError(400, "InstitutionId requis");
  }

  await requireOrgMembership(user.id, workspaceId);
  await requireActiveSubscription(user.id, workspaceId);

  // Proxy to backend
  const backendUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  ).replace(/\/$/, "");

  const response = await fetch(
    `${backendUrl}/banking-connect/gocardless/connect?institutionId=${institutionId}`,
    {
      headers: {
        "x-workspace-id": workspaceId,
        Cookie: cookieHeader,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    return NextResponse.json(error, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}

export const GET = withErrorHandler(handler);
