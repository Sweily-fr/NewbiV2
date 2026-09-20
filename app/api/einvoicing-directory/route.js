import { NextResponse } from "next/server";

/**
 * GET /api/einvoicing-directory?siren=123456789
 *
 * Proxy public vers le backend : inscription d'une entreprise dans l'annuaire
 * de la facturation électronique (plateforme agréée). Utilisé par le
 * simulateur « Es-tu concerné ? » de la LP facturation électronique.
 * Réponse : { available, registered?, pdpName? }
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const siren = (searchParams.get("siren") || "").replace(/\s/g, "");

  if (!/^\d{9}$/.test(siren)) {
    return NextResponse.json({ error: "SIREN invalide" }, { status: 400 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      { available: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const res = await fetch(
      `${apiUrl.replace(/\/$/, "")}/api/public/einvoicing/directory?siren=${siren}`,
      {
        headers: {
          Accept: "application/json",
          "x-forwarded-for": request.headers.get("x-forwarded-for") || "",
        },
        cache: "no-store",
      },
    );
    if (!res.ok)
      return NextResponse.json(
        { available: false },
        { headers: { "Cache-Control": "no-store" } },
      );
    const data = await res.json();
    // Ne met en cache que les réponses utiles : une indisponibilité passagère
    // ne doit pas rester collée 1 h dans le navigateur
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": data.available
          ? "public, max-age=3600"
          : "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Erreur proxy annuaire e-invoicing:", error);
    return NextResponse.json(
      { available: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
