import { NextResponse } from "next/server";
import { withErrorHandler } from "@/src/lib/security";

/**
 * POST /api/unified-expenses/auto-reconcile
 * Upload un justificatif et l'associe à une transaction existante.
 * Aucune transaction n'est créée automatiquement : sans transactionId, l'appel échoue.
 */
async function handler(request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const workspaceId = formData.get("workspaceId");
  const transactionId = formData.get("transactionId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId requis" }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }

  // Récupérer le token d'auth
  const authCookie =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;
  const authHeader = request.headers.get("authorization");

  const graphqlUrl =
    (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/").replace(
      /\/$/,
      "",
    ) + "/graphql";

  const headers = {};
  if (authCookie) {
    headers["Cookie"] = `better-auth.session_token=${authCookie}`;
  }
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  // Un justificatif ne peut être attaché qu'à une transaction existante.
  // Aucune transaction n'est créée automatiquement depuis un justificatif/OCR :
  // le lien transaction <-> facture se fait uniquement par rapprochement manuel.
  if (!transactionId) {
    return NextResponse.json(
      {
        error:
          "Aucune transaction sélectionnée. Sélectionnez une transaction à laquelle attacher ce justificatif.",
      },
      { status: 400 },
    );
  }

  // Upload du justificatif via la mutation GraphQL uploadTransactionReceipt
  {
    const uploadFormData = new FormData();

    const operations = JSON.stringify({
      query: `
          mutation UploadTransactionReceipt($transactionId: ID!, $workspaceId: ID!, $files: [Upload!]!) {
            uploadTransactionReceipt(transactionId: $transactionId, workspaceId: $workspaceId, files: $files) {
              success
              message
              receiptFiles {
                id
                url
                key
                filename
                mimetype
                size
                uploadedAt
              }
              transaction {
                id
                receiptFiles {
                  id
                  url
                  filename
                }
                receiptRequired
              }
            }
          }
        `,
      variables: {
        transactionId,
        workspaceId,
        files: [null],
      },
    });

    uploadFormData.append("operations", operations);
    uploadFormData.append("map", JSON.stringify({ 0: ["variables.files.0"] }));
    uploadFormData.append("0", file);

    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers,
      body: uploadFormData,
    });

    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return NextResponse.json(
        { error: data.errors[0]?.message || "Erreur lors de l'upload" },
        { status: 500 },
      );
    }

    const result = data.data?.uploadTransactionReceipt;
    if (result?.success) {
      return NextResponse.json({
        success: true,
        action: "linked",
        transactionId,
        matchedTransaction: result.transaction,
      });
    } else {
      return NextResponse.json(
        { error: result?.message || "Erreur lors de l'upload" },
        { status: 500 },
      );
    }
  }
}

export const POST = withErrorHandler(handler);
