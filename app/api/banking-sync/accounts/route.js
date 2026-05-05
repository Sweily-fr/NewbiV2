import { NextResponse } from "next/server";
import {
  requireSession,
  requireOrgMembership,
  requireActiveSubscription,
  apiError,
  withErrorHandler,
} from "@/src/lib/security";

/**
 * POST /api/banking-sync/accounts
 *
 * Proxy to backend banking-sync/accounts.
 * Auth: session + org membership + active subscription (banking is a paid feature).
 * workspaceId from x-workspace-id header, verified against session user's membership.
 */
async function handler(request) {
  // Auth check BEFORE any proxy call
  const { user, cookieHeader } = await requireSession(request);

  const workspaceId = request.headers.get("x-workspace-id");

  if (!workspaceId) {
    return apiError(400, "Header x-workspace-id manquant");
  }

  // Verify user is member of the requested workspace (prevents cross-tenant access)
  await requireOrgMembership(user.id, workspaceId);

  // Banking is a paid feature — verify active subscription
  await requireActiveSubscription(user.id, workspaceId);

  // User authorized — proxy to backend
  const backendUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  ).replace(/\/$/, "");

  const response = await fetch(`${backendUrl}/banking-sync/accounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-workspace-id": workspaceId,
      Cookie: cookieHeader,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(data, { status: response.status });
  }

  return NextResponse.json(data);
}

export const POST = withErrorHandler(handler);
