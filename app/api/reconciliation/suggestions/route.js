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

    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/$/, "");

    const response = await fetch(`${backendUrl}/reconciliation/suggestions`, {
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
    console.error("Erreur proxy reconciliation suggestions:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
