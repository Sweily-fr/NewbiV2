import { NextResponse } from "next/server";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

/**
 * POST /api/unified-expenses/auto-reconcile
 * Rapprocher automatiquement un justificatif OCR avec une transaction bancaire
 */
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Non authentifié - Token manquant" },
        { status: 401 }
      );
    }

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
          Authorization: authHeader,
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
