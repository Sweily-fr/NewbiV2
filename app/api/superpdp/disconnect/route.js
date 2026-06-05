import { NextResponse } from "next/server";
import {
  requireSession,
  requireOrgMembership,
  apiError,
  withErrorHandler,
} from "@/src/lib/security";

/**
 * POST /api/superpdp/disconnect
 *
 * Authentifie la session + vérifie l'appartenance à l'organisation, puis proxifie
 * vers le backend Express (sécurisé par x-internal-secret).
 */
async function handler(request) {
  const body = await request.json();
  const organizationId = body?.organizationId;

  if (!organizationId) {
    return apiError(400, "organizationId est requis");
  }

  const { user } = await requireSession(request);
  await requireOrgMembership(user.id, organizationId);

  const backendUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  ).replace(/\/$/, "");

  const response = await fetch(`${backendUrl}/api/superpdp/disconnect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
    },
    body: JSON.stringify({ organizationId }),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export const POST = withErrorHandler(handler);
