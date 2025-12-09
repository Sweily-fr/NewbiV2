import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.BACKEND_API_URL ||
      "http://localhost:4000";

    const response = await fetch(`${backendUrl}/unified-expenses/link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur proxy unified-expenses/link:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
