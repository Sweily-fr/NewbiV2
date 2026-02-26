import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const workspaceId = searchParams.get("workspaceId");

    if (!folderId || !workspaceId) {
      return NextResponse.json(
        { error: "folderId et workspaceId sont requis" },
        { status: 400 }
      );
    }

    // Proxy vers l'API backend — forwarder le cookie session
    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/$/, "");

    const cookie = request.headers.get("cookie") || "";

    const response = await fetch(
      `${backendUrl}/api/shared-documents/download-folder?folderId=${folderId}&workspaceId=${workspaceId}`,
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
      } else {
        return NextResponse.json(
          { error: `Erreur ${response.status}: ${response.statusText}` },
          { status: response.status }
        );
      }
    }

    const blob = await response.blob();
    const headers = new Headers();
    headers.set("Content-Type", "application/zip");
    headers.set(
      "Content-Disposition",
      response.headers.get("Content-Disposition") || "attachment; filename=dossier.zip"
    );

    return new NextResponse(blob, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Erreur proxy download folder:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
