import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const workspaceId = request.headers.get("x-workspace-id");
    const { invoiceId } = params;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "WorkspaceId requis" },
        { status: 400 }
      );
    }

    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.BACKEND_API_URL ||
      "http://localhost:4000";

    const response = await fetch(
      `${backendUrl}/reconciliation/transactions-for-invoice/${invoiceId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": workspaceId,
          Cookie: request.headers.get("cookie") || "",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur proxy transactions-for-invoice:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
