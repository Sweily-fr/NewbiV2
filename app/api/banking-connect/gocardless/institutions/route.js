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

  try {
    const response = await fetch(
      `${backendUrl}/banking-connect/gocardless/institutions?country=${country}`,
      {
        headers: {
          Cookie: cookieHeader,
        },
      },
    );

    // TEMPORAIRE — debug log pour identifier le 500
    console.warn("❌ [GOCARDLESS INSTITUTIONS DEBUG]", {
      status: response.status,
      ok: response.ok,
      backendUrl: `${backendUrl}/banking-connect/gocardless/institutions?country=${country}`,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("❌ [GOCARDLESS INSTITUTIONS DEBUG] Error body:", errorText);
      try {
        return NextResponse.json(JSON.parse(errorText), {
          status: response.status,
        });
      } catch {
        return NextResponse.json(
          { error: "Erreur backend" },
          { status: response.status },
        );
      }
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ [GOCARDLESS INSTITUTIONS DEBUG]", {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });
    throw error;
  }
}

export const GET = withErrorHandler(handler);
