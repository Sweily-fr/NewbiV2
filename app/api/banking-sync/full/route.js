import { NextResponse } from "next/server";
import {
  requireSession,
  requireOrgMembership,
  requireActiveSubscription,
  apiError,
  withErrorHandler,
} from "@/src/lib/security";

/**
 * POST /api/banking-sync/full
 *
 * Proxy to backend banking-sync/full (accounts + transactions sync).
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

  // Parse body for forwarding
  const body = await request.json().catch(() => ({}));

  // Proxy to backend
  const backendUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  ).replace(/\/$/, "");

  const response = await fetch(`${backendUrl}/banking-sync/full`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-workspace-id": workspaceId,
      Cookie: cookieHeader,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(data, { status: response.status });
  }

  return NextResponse.json(data);
}

export const POST = withErrorHandler(handler);
