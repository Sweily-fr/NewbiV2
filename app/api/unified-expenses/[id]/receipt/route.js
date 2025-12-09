import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.BACKEND_API_URL ||
  "http://localhost:4000";

/**
 * POST /api/unified-expenses/[id]/receipt
 * Upload un justificatif pour une transaction bancaire
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieHeader = allCookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    // Récupérer le FormData de la requête
    const formData = await request.formData();

    // Transférer vers le backend
    const response = await fetch(
      `${BACKEND_URL}/unified-expenses/${id}/receipt`,
      {
        method: "POST",
        headers: {
          Cookie: cookieHeader,
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Erreur lors de l'upload" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Erreur upload receipt:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/unified-expenses/[id]/receipt
 * Supprimer le justificatif d'une transaction
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieHeader = allCookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const response = await fetch(
      `${BACKEND_URL}/unified-expenses/${id}/receipt`,
      {
        method: "DELETE",
        headers: {
          Cookie: cookieHeader,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Erreur lors de la suppression" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Erreur delete receipt:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
