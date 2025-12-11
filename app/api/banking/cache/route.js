import { NextResponse } from "next/server";

/**
 * GET /api/banking/cache - Obtenir le statut du cache
 */
export async function GET(request) {
  try {
    const workspaceId =
      request.headers.get("x-workspace-id") ||
      request.nextUrl.searchParams.get("workspaceId");
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

    // URL du backend
    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/$/, "");

    // Faire la requête vers le backend
    const response = await fetch(`${backendUrl}/banking-cache/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-workspace-id": workspaceId,
        Authorization: authHeader,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur proxy banking cache status:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/banking/cache - Invalider tout le cache
 */
export async function POST(request) {
  try {
    const workspaceId =
      request.headers.get("x-workspace-id") ||
      request.nextUrl.searchParams.get("workspaceId");
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

    // URL du backend
    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/$/, "");

    // Faire la requête vers le backend
    const response = await fetch(`${backendUrl}/banking-cache/invalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-workspace-id": workspaceId,
        Authorization: authHeader,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur proxy banking cache invalidate:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
