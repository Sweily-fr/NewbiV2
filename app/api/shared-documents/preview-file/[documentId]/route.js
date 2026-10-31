import { NextResponse } from "next/server";
import {
  safeFileHeaders,
  SHARED_PREVIEW_EXTRA_TYPES,
} from "@/src/lib/safe-file-headers";
import { withErrorHandler } from "@/src/lib/security";
import {
  backendBaseUrl,
  requireSharedDocumentsAccess,
} from "@/src/lib/shared-documents-proxy";

async function handler(request, { params }) {
  const { documentId } = await params;
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!documentId || !workspaceId) {
    return NextResponse.json(
      { error: "documentId et workspaceId sont requis" },
      { status: 400 },
    );
  }

  const { cookieHeader: cookie } = await requireSharedDocumentsAccess(
    request,
    workspaceId,
    [documentId],
  );
  const backendUrl = backendBaseUrl();

  const response = await fetch(
    `${backendUrl}/api/shared-documents/preview-file/${encodeURIComponent(documentId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
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
    }
    return NextResponse.json(
      { error: `Erreur ${response.status}: ${response.statusText}` },
      { status: response.status },
    );
  }

  // Streamer directement la réponse sans buffer en mémoire. Fichier choisi
  // par l'utilisateur, servi sur l'origine du site : seuls les formats qui ne
  // s'exécutent pas s'affichent, le reste se télécharge (safeFileHeaders).
  const headers = safeFileHeaders(response.headers, {
    extraInlineTypes: SHARED_PREVIEW_EXTRA_TYPES,
  });
  // Document privé : jamais en cache partagé
  headers.set("Cache-Control", "private, max-age=3600");

  return new NextResponse(response.body, { status: 200, headers });
}

export const GET = withErrorHandler(handler);
