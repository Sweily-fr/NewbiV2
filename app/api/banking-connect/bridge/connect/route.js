import { NextResponse } from "next/server";
import {
  requireSession,
  requireOrgMembership,
  requireActiveSubscription,
  apiError,
  withErrorHandler,
} from "@/src/lib/security";

/**
 * GET /api/banking-connect/bridge/connect
 *
 * Proxy to backend to initiate Bridge OAuth flow.
 * Auth: session + org membership + active subscription.
 */
async function handler(request) {
  const { user, cookieHeader } = await requireSession(request);

  const workspaceId = request.headers.get("x-workspace-id");

  if (!workspaceId) {
    return apiError(400, "Header x-workspace-id manquant");
  }

  await requireOrgMembership(user.id, workspaceId);
  await requireActiveSubscription(user.id, workspaceId);

  // Forward providerId query param if present
  const providerId = request.nextUrl.searchParams.get("providerId");

  const backendUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  ).replace(/\/$/, "");
  let url = `${backendUrl}/banking-connect/bridge/connect`;
  if (providerId) {
    url += `?providerId=${providerId}`;
  }

  const response = await fetch(url, {
    headers: {
      "x-workspace-id": workspaceId,
      Cookie: cookieHeader,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    return NextResponse.json(error, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}

export const GET = withErrorHandler(handler);
