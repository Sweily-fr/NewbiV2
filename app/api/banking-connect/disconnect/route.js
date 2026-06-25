import { NextResponse } from "next/server";
import {
  requireSession,
  requireOrgMembership,
  requireActiveSubscription,
  apiError,
  withErrorHandler,
} from "@/src/lib/security";

/**
 * POST /api/banking-connect/disconnect
 *
 * Proxy to backend to disconnect banking provider.
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

  // Transmettre le body envoyé par le client (accountId / itemId / provider).
  // Sans ça, le backend recevait un body vide et déconnectait TOUT.
  const body = await request.text();

  // Proxy to backend
  const backendUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  ).replace(/\/$/, "");

  const response = await fetch(`${backendUrl}/banking-connect/disconnect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-workspace-id": workspaceId,
      Cookie: cookieHeader,
    },
    body: body || "{}",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Erreur backend" }));
    return NextResponse.json(error, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}

export const POST = withErrorHandler(handler);
