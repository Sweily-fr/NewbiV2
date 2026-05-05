import { NextResponse } from "next/server";
import {
  requireSession,
  requireOrgMembership,
  requireActiveSubscription,
  apiError,
  withErrorHandler,
} from "@/src/lib/security";

/**
 * GET /api/banking-connect/status
 *
 * Proxy to backend to check banking connection status.
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

  // Proxy to backend (strip /graphql if present in base URL)
  const backendUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  )
    .replace(/\/graphql\/?$/, "")
    .replace(/\/$/, "");

  const response = await fetch(`${backendUrl}/banking-connect/status`, {
    headers: {
      "x-workspace-id": workspaceId,
      Cookie: cookieHeader,
      "Content-Type": "application/json",
    },
  });

  // Defensive text → JSON parse (backend may return non-JSON on error)
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: text || "Réponse invalide du serveur" },
      { status: response.status },
    );
  }

  if (!response.ok) {
    return NextResponse.json(data, { status: response.status });
  }

  return NextResponse.json(data);
}

export const GET = withErrorHandler(handler);
