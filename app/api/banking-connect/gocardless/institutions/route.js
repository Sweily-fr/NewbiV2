import { NextResponse } from "next/server";
import { requireSession, withErrorHandler } from "@/src/lib/security";

/**
 * GET /api/banking-connect/gocardless/institutions
 *
 * Proxy to backend to list available GoCardless institutions by country.
 * Auth: session only (no workspace check — this is a catalog lookup, not org-scoped data).
 * Principle 1: deny by default — even non-sensitive routes require authentication.
 */
async function handler(request) {
  const { cookieHeader } = await requireSession(request);

  const country = request.nextUrl.searchParams.get("country") || "FR";

  const backendUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  ).replace(/\/$/, "");

  const response = await fetch(
    `${backendUrl}/banking-connect/gocardless/institutions?country=${country}`,
    {
      headers: {
        Cookie: cookieHeader,
      },
    },
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Erreur backend" }));
    return NextResponse.json(error, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}

export const GET = withErrorHandler(handler);
