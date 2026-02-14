import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const workspaceId = request.headers.get("x-workspace-id");
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Non authentifié - Token manquant" },
        { status: 401 }
      );
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: "WorkspaceId requis" },
        { status: 400 }
      );
    }

    // Proxy vers l'API backend (strip /graphql si présent)
    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/graphql\/?$/, "").replace(/\/$/, "");
    const response = await fetch(`${backendUrl}/banking-connect/status`, {
      headers: {
        "x-workspace-id": workspaceId,
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: text || "Réponse invalide du serveur" },
        { status: response.status }
      );
    }

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur proxy banking status:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
