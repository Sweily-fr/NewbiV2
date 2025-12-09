import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const workspaceId =
      request.headers.get("x-workspace-id") ||
      request.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "WorkspaceId requis" },
        { status: 400 }
      );
    }

    // Récupérer les paramètres de requête
    const limit = request.nextUrl.searchParams.get("limit") || "50";
    const page = request.nextUrl.searchParams.get("page") || "1";
    const accountId = request.nextUrl.searchParams.get("accountId");
    const type = request.nextUrl.searchParams.get("type");
    const status = request.nextUrl.searchParams.get("status");

    // Construire les query params
    const params = new URLSearchParams({ limit, page });
    if (accountId) params.append("accountId", accountId);
    if (type) params.append("type", type);
    if (status) params.append("status", status);

    // URL du backend
    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/$/, "");

    // Faire la requête vers le backend
    const response = await fetch(
      `${backendUrl}/banking/transactions?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": workspaceId,
          Cookie: request.headers.get("cookie") || "",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur proxy banking transactions:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
