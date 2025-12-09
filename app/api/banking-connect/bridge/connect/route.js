import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const workspaceId = request.headers.get("x-workspace-id");
    const providerId = request.nextUrl.searchParams.get("providerId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "WorkspaceId requis" },
        { status: 400 }
      );
    }

    // Construire l'URL avec le providerId si fourni
    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/$/, "");
    let url = `${backendUrl}/banking-connect/bridge/connect`;
    if (providerId) {
      url += `?providerId=${providerId}`;
    }

    const response = await fetch(url, {
      headers: {
        "x-workspace-id": workspaceId,
        Cookie: request.headers.get("cookie") || "",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur proxy banking connect:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
