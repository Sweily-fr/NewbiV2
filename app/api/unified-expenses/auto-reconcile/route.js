import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.BACKEND_API_URL ||
  "http://localhost:4000";

/**
 * POST /api/unified-expenses/auto-reconcile
 * Rapprocher automatiquement un justificatif OCR avec une transaction bancaire
 */
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieHeader = allCookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    // Récupérer le FormData de la requête
    const incomingFormData = await request.formData();

    // Reconstruire le FormData pour le backend
    const backendFormData = new FormData();

    // Copier tous les champs
    for (const [key, value] of incomingFormData.entries()) {
      if (value instanceof File || value instanceof Blob) {
        // Pour les fichiers, on doit les convertir correctement
        const buffer = await value.arrayBuffer();
        const blob = new Blob([buffer], { type: value.type });
        backendFormData.append(key, blob, value.name || "file");
      } else {
        backendFormData.append(key, value);
      }
    }

    console.log("[API] auto-reconcile - Envoi vers backend:", {
      workspaceId: incomingFormData.get("workspaceId"),
      transactionId: incomingFormData.get("transactionId"),
      hasFile: incomingFormData.has("file"),
      ocrData: incomingFormData.get("ocrData"),
    });

    // Transférer vers le backend
    const response = await fetch(
      `${BACKEND_URL}/unified-expenses/auto-reconcile`,
      {
        method: "POST",
        headers: {
          Cookie: cookieHeader,
        },
        body: backendFormData,
      }
    );

    const data = await response.json();

    console.log("[API] auto-reconcile - Réponse backend:", data);

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Erreur lors du rapprochement" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Erreur auto-reconcile:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
