import { NextResponse } from "next/server";
import { mapCategoryToEnum } from "@/app/dashboard/outils/transactions/components/transactions/utils/mappers";

/**
 * POST /api/unified-expenses/auto-reconcile
 * Upload un justificatif et l'associe à une transaction existante ou en crée une nouvelle
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const workspaceId = formData.get("workspaceId");
    const transactionId = formData.get("transactionId");
    const ocrDataStr = formData.get("ocrData");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId requis" },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "Fichier requis" },
        { status: 400 }
      );
    }

    // Récupérer le token d'auth
    const authCookie = request.cookies.get("better-auth.session_token")?.value
      || request.cookies.get("__Secure-better-auth.session_token")?.value;
    const authHeader = request.headers.get("authorization");

    const graphqlUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/").replace(/\/$/, "") + "/graphql";

    const headers = {};
    if (authCookie) {
      headers["Cookie"] = `better-auth.session_token=${authCookie}`;
    }
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    let ocrData = null;
    if (ocrDataStr) {
      try {
        ocrData = JSON.parse(ocrDataStr);
      } catch (e) {
        console.warn("⚠️ Impossible de parser ocrData");
      }
    }

    // Si un transactionId est fourni, on lie le fichier à la transaction existante
    if (transactionId) {
      // Upload du justificatif via la mutation GraphQL uploadTransactionReceipt
      const uploadFormData = new FormData();

      const operations = JSON.stringify({
        query: `
          mutation UploadTransactionReceipt($transactionId: ID!, $workspaceId: ID!, $file: Upload!) {
            uploadTransactionReceipt(transactionId: $transactionId, workspaceId: $workspaceId, file: $file) {
              success
              message
              receiptFile {
                url
                key
                filename
                mimetype
                size
                uploadedAt
              }
              transaction {
                id
                receiptFile {
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
          file: null,
        },
      });

      uploadFormData.append("operations", operations);
      uploadFormData.append("map", JSON.stringify({ "0": ["variables.file"] }));
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
          { status: 500 }
        );
      }

      const result = data.data?.uploadTransactionReceipt;
      if (result?.success) {
        return NextResponse.json({
          success: true,
          action: transactionId ? "linked" : "auto-matched",
          transactionId,
          matchedTransaction: result.transaction,
        });
      } else {
        return NextResponse.json(
          { error: result?.message || "Erreur lors de l'upload" },
          { status: 500 }
        );
      }
    }

    // Pas de transactionId : créer une nouvelle transaction manuelle depuis les données OCR
    const isIncome = ocrData?.amount > 0;
    const amount = isIncome
      ? Math.abs(ocrData?.amount || 0)
      : -Math.abs(ocrData?.amount || 0);

    const createQuery = `
      mutation CreateTransaction($input: CreateTransactionInput!) {
        createTransaction(input: $input) {
          id
          amount
          description
          category
          date
          metadata
          createdAt
        }
      }
    `;

    const createResponse = await fetch(graphqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        query: createQuery,
        variables: {
          input: {
            workspaceId,
            amount: amount,
            currency: ocrData?.currency || "EUR",
            description: ocrData?.vendor || ocrData?.merchant || "Dépense OCR",
            type: isIncome ? "CREDIT" : "DEBIT",
            date: ocrData?.date || new Date().toISOString().split("T")[0],
            category: mapCategoryToEnum(ocrData?.category),
            vendor: ocrData?.vendor || ocrData?.merchant || "",
            notes: "Créé depuis OCR",
          },
        },
      }),
    });

    const createData = await createResponse.json();

    if (createData.errors) {
      console.error("GraphQL create errors:", createData.errors);
      return NextResponse.json(
        { error: createData.errors[0]?.message || "Erreur lors de la création" },
        { status: 500 }
      );
    }

    const createdTransaction = createData.data?.createTransaction;

    // Si la transaction a été créée, uploader le justificatif
    if (createdTransaction?.id) {
      try {
        const uploadFormData = new FormData();

        const operations = JSON.stringify({
          query: `
            mutation UploadTransactionReceipt($transactionId: ID!, $workspaceId: ID!, $file: Upload!) {
              uploadTransactionReceipt(transactionId: $transactionId, workspaceId: $workspaceId, file: $file) {
                success
                message
                receiptFile {
                  url
                  key
                  filename
                }
              }
            }
          `,
          variables: {
            transactionId: createdTransaction.id,
            workspaceId,
            file: null,
          },
        });

        uploadFormData.append("operations", operations);
        uploadFormData.append("map", JSON.stringify({ "0": ["variables.file"] }));
        uploadFormData.append("0", file);

        await fetch(graphqlUrl, {
          method: "POST",
          headers,
          body: uploadFormData,
        });
      } catch (uploadError) {
        console.warn("⚠️ Erreur upload justificatif (transaction créée quand même):", uploadError);
      }
    }

    return NextResponse.json({
      success: true,
      action: "created",
      transactionId: createdTransaction?.id,
      expenseId: createdTransaction?.id,
    });
  } catch (error) {
    console.error("❌ [AUTO-RECONCILE] Error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}
