import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const country = request.nextUrl.searchParams.get("country") || "FR";

    // Proxy vers l'API backend
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:4000";
    const response = await fetch(
      `${backendUrl}/banking-connect/bridge/institutions?country=${country}`,
      {
        headers: {
          Cookie: request.headers.get("cookie") || "",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur proxy institutions Bridge:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
