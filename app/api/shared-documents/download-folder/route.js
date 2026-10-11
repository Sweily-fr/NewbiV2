import { NextResponse } from "next/server";
import { withErrorHandler } from "@/src/lib/security";
import {
  backendBaseUrl,
  requireSharedDocumentsAccess,
} from "@/src/lib/shared-documents-proxy";

async function handler(request) {
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folderId");
  const workspaceId = searchParams.get("workspaceId");

  if (!folderId || !workspaceId) {
    return NextResponse.json(
      { error: "folderId et workspaceId sont requis" },
      { status: 400 },
    );
  }

  // Proxy vers l'API backend — forwarder le cookie session
  const { cookieHeader: cookie } = await requireSharedDocumentsAccess(
    request,
    workspaceId,
    [folderId],
  );
  const backendUrl = backendBaseUrl();

  const response = await fetch(
    `${backendUrl}/api/shared-documents/download-folder?folderId=${encodeURIComponent(folderId)}&workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      headers: {
        cookie,
      },
    },
  );

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    } else {
      return NextResponse.json(
        { error: `Erreur ${response.status}: ${response.statusText}` },
        { status: response.status },
      );
    }
  }

  const blob = await response.blob();
  const headers = new Headers();
  headers.set("Content-Type", "application/zip");
  headers.set(
    "Content-Disposition",
    response.headers.get("Content-Disposition") ||
      "attachment; filename=dossier.zip",
  );

  return new NextResponse(blob, {
    status: 200,
    headers,
  });
}

export const GET = withErrorHandler(handler);
