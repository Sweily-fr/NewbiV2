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

    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/$/, "");

    const response = await fetch(`${backendUrl}/unified-expenses/unlink`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur proxy unified-expenses/unlink:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
