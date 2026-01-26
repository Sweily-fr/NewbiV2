import { NextResponse } from "next/server";

// DÉSACTIVÉ: SuperPDP API pas encore active
export async function POST(request) {
  return NextResponse.json(
    {
      success: false,
      error: "La facturation électronique (SuperPDP) n'est pas encore disponible",
      disabled: true,
    },
    { status: 503 }
  );
}

/* Code original commenté - à réactiver quand SuperPDP sera disponible:
export async function POST(request) {
  try {
    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "organizationId est requis" },
        { status: 400 }
      );
    }

    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/$/, "");

    const response = await fetch(`${backendUrl}/api/superpdp/disconnect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ organizationId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || "Erreur lors de la déconnexion",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur API SuperPDP disconnect:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
*/
