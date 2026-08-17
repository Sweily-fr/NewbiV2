import { NextResponse } from "next/server";
import {
  requireSession,
  requireOrgMembership,
  apiError,
  withErrorHandler,
} from "@/src/lib/security";

/**
 * GET /api/superpdp/authorize
 *
 * Authentifie la session, vérifie l'appartenance à l'organisation, puis proxifie
 * vers le backend Express (sécurisé par x-internal-secret) qui génère l'URL OAuth.
 */
async function handler(request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");
  // Origine de l'activation : "mobile" fait rediriger le callback OAuth vers le
  // deep link newbi:// au lieu du dashboard desktop (cf. superpdp-oauth.js).
  const source = searchParams.get("source");

  if (!organizationId) {
    return apiError(400, "organizationId est requis");
  }

  const { user } = await requireSession(request);
  await requireOrgMembership(user.id, organizationId);

  const backendUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  ).replace(/\/$/, "");

  const url = new URL(`${backendUrl}/api/superpdp/authorize`);
  url.searchParams.set("organizationId", organizationId);
  if (source) {
    url.searchParams.set("source", source);
  }
  if (user.email) {
    // Pré-remplit l'email côté SuperPDP (KYC/KYB)
    url.searchParams.set("login_hint", user.email);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
    },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export const GET = withErrorHandler(handler);
