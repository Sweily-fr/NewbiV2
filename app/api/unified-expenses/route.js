import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const workspaceId = request.headers.get("x-workspace-id");
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);

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

    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/$/, "");

    // Construire les query params
    const params = new URLSearchParams();
    params.set("workspaceId", workspaceId);

    if (searchParams.get("page")) params.set("page", searchParams.get("page"));
    if (searchParams.get("limit"))
      params.set("limit", searchParams.get("limit"));
    if (searchParams.get("startDate"))
      params.set("startDate", searchParams.get("startDate"));
    if (searchParams.get("endDate"))
      params.set("endDate", searchParams.get("endDate"));
    if (searchParams.get("category"))
      params.set("category", searchParams.get("category"));

    const response = await fetch(
      `${backendUrl}/unified-expenses?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur proxy unified-expenses:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
