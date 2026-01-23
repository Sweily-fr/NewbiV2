import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const workspaceId = request.headers.get("x-workspace-id");
    const institutionId = request.nextUrl.searchParams.get("institutionId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "WorkspaceId requis" },
        { status: 400 }
      );
    }

    if (!institutionId) {
      return NextResponse.json(
        { error: "InstitutionId requis" },
        { status: 400 }
      );
    }

    // Proxy vers l'API backend
    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/$/, "");
    const response = await fetch(
      `${backendUrl}/banking-connect/gocardless/connect?institutionId=${institutionId}`,
      {
        headers: {
          "x-workspace-id": workspaceId,
          Cookie: request.headers.get("cookie") || "",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur proxy gocardless connect:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
