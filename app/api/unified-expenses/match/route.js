import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

/**
 * POST /api/unified-expenses/match
 * Chercher une transaction bancaire correspondante pour un montant/date donnés
 */
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieHeader = allCookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const body = await request.json();

    console.log("[API] match - Recherche:", body);

    const response = await fetch(`${BACKEND_URL}/unified-expenses/match`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    console.log("[API] match - Résultat:", data);

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Erreur lors de la recherche" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Erreur match:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
