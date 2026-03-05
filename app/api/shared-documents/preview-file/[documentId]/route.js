import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { documentId } = await params;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!documentId || !workspaceId) {
      return NextResponse.json(
        { error: "documentId et workspaceId sont requis" },
        { status: 400 }
      );
    }

    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/$/, "");

    const cookie = request.headers.get("cookie") || "";

    const response = await fetch(
      `${backendUrl}/api/shared-documents/preview-file/${documentId}?workspaceId=${workspaceId}`,
      {
        headers: {
          cookie,
        },
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        return NextResponse.json(error, { status: response.status });
      }
      return NextResponse.json(
        { error: `Erreur ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Streamer directement la réponse sans buffer en mémoire
    const headers = new Headers();
    headers.set(
      "Content-Type",
      response.headers.get("Content-Type") || "application/octet-stream"
    );
    if (response.headers.get("Content-Disposition")) {
      headers.set("Content-Disposition", response.headers.get("Content-Disposition"));
    }
    if (response.headers.get("Content-Length")) {
      headers.set("Content-Length", response.headers.get("Content-Length"));
    }
    headers.set("Cache-Control", "public, max-age=3600");

    return new NextResponse(response.body, { status: 200, headers });
  } catch (error) {
    console.error("Erreur proxy preview file:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
