import { NextResponse } from "next/server";
import { apiError, withErrorHandler } from "@/src/lib/security";
import {
  backendBaseUrl,
  isObjectIdList,
  requireSharedDocumentsAccess,
} from "@/src/lib/shared-documents-proxy";

async function handler(request) {
  const body = await request.json();
  const { folderIds, documentIds, excludedFolderIds, workspaceId } = body;

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId est requis" },
      { status: 400 },
    );
  }

  if (
    !isObjectIdList(folderIds) ||
    !isObjectIdList(documentIds) ||
    !isObjectIdList(excludedFolderIds)
  ) {
    return apiError(400, "Identifiant invalide");
  }
  const { cookieHeader: cookie } = await requireSharedDocumentsAccess(
    request,
    workspaceId,
  );
  const backendUrl = backendBaseUrl();

  const response = await fetch(
    `${backendUrl}/api/shared-documents/download-selection`,
    {
      method: "POST",
      headers: {
        cookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        folderIds,
        documentIds,
        excludedFolderIds,
        workspaceId,
      }),
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
      "attachment; filename=documents.zip",
  );

  return new NextResponse(blob, {
    status: 200,
    headers,
  });
}

export const POST = withErrorHandler(handler);
