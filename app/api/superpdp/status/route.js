import { NextResponse } from "next/server";

// DÉSACTIVÉ: SuperPDP API pas encore active
export async function GET(request) {
  return NextResponse.json(
    {
      success: false,
      error: "La facturation électronique (SuperPDP) n'est pas encore disponible",
      disabled: true,
      isConnected: false,
    },
    { status: 503 }
  );
}

/* Code original commenté - à réactiver quand SuperPDP sera disponible:
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "organizationId est requis" },
        { status: 400 }
      );
    }

    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/$/, "");

    const response = await fetch(
      `${backendUrl}/api/superpdp/status?organizationId=${organizationId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || "Erreur lors de la vérification du statut",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur API SuperPDP status:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
*/
