import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const workspaceId =
      request.headers.get("x-workspace-id") ||
      new URL(request.url).searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "WorkspaceId requis" },
        { status: 400 }
      );
    }

    // Récupérer le body de la requête
    const body = await request.json().catch(() => ({}));

    // URL du backend
    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/$/, "");

    // Faire la requête vers le backend
    const response = await fetch(`${backendUrl}/banking-sync/full`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-workspace-id": workspaceId,
        Cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur proxy banking-sync full:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
