import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Non authentifié - Token manquant" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { folderIds, documentIds, workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId est requis" },
        { status: 400 }
      );
    }

    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/$/, "");

    const response = await fetch(
      `${backendUrl}/api/shared-documents/selection-info`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderIds, documentIds, workspaceId }),
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        return NextResponse.json(error, { status: response.status });
      } else {
        return NextResponse.json(
          { error: `Erreur ${response.status}: ${response.statusText}` },
          { status: response.status }
        );
      }
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur proxy selection info:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
