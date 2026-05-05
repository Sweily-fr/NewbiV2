import { NextResponse } from "next/server";
import {
  requireSession,
  requireOrgMembership,
  requireActiveSubscription,
  apiError,
  withErrorHandler,
} from "@/src/lib/security";

/**
 * GET /api/banking/accounts
 *
 * Proxy to backend banking/accounts.
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

  // Proxy to backend
  const backendUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  ).replace(/\/$/, "");

  const response = await fetch(`${backendUrl}/banking/accounts`, {
    headers: {
      "x-workspace-id": workspaceId,
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Erreur serveur" }));
    return NextResponse.json(error, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}

export const GET = withErrorHandler(handler);
