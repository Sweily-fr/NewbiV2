import { NextResponse } from "next/server";
import { apiError, withErrorHandler } from "@/src/lib/security";
import {
  backendBaseUrl,
  isObjectIdList,
  requireSharedDocumentsAccess,
} from "@/src/lib/shared-documents-proxy";

async function handler(request) {
  const body = await request.json();
  const { folderIds, documentIds, workspaceId } = body;

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId est requis" },
      { status: 400 },
    );
  }

  if (!isObjectIdList(folderIds) || !isObjectIdList(documentIds)) {
    return apiError(400, "Identifiant invalide");
  }
  const { cookieHeader: cookie } = await requireSharedDocumentsAccess(
    request,
    workspaceId,
  );
  const backendUrl = backendBaseUrl();

  const response = await fetch(
    `${backendUrl}/api/shared-documents/selection-info`,
    {
      method: "POST",
      headers: {
        cookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ folderIds, documentIds, workspaceId }),
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

  const data = await response.json();
  return NextResponse.json(data);
}

export const POST = withErrorHandler(handler);
