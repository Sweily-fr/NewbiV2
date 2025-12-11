import { NextResponse } from "next/server";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

/**
 * POST /api/unified-expenses/[id]/receipt
 * Upload un justificatif pour une transaction bancaire
 */
export async function POST(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Non authentifié - Token manquant" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Récupérer le FormData de la requête
    const formData = await request.formData();

    // Transférer vers le backend
    const response = await fetch(
      `${BACKEND_URL}/unified-expenses/${id}/receipt`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
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
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Non authentifié - Token manquant" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const response = await fetch(
      `${BACKEND_URL}/unified-expenses/${id}/receipt`,
      {
        method: "DELETE",
        headers: {
          Authorization: authHeader,
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
