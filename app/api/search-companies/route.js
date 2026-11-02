/**
 * API Route proxy pour la recherche d'entreprises via API Gouv Data
 * Contourne les problèmes CORS en faisant la requête côté serveur
 */

import { NextResponse } from "next/server";
import { createIpRateLimiter } from "@/src/lib/security/ip-rate-limit";

const API_GOUV_BASE_URL = "https://recherche-entreprises.api.gouv.fr/search";

// Proxy public : l'annuaire de l'État limite puis bloque l'adresse du site
// quand il reçoit trop de requêtes, ce qui casserait la recherche pour tous.
// 60 recherches par minute et par adresse (une saisie en déclenche une par
// pause de frappe).
const isRateLimited = createIpRateLimiter({ windowMs: 60 * 1000, max: 60 });
const MAX_QUERY_LENGTH = 200;
// Nombre de résultats par page accepté par l'annuaire (25 au plus)
const MAX_LIMIT = 25;

export async function GET(request) {
  try {
    if (isRateLimited(request)) {
      return NextResponse.json(
        { error: "Trop de recherches, réessayez dans une minute" },
        { status: 429 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limitParam = searchParams.get("limite") || "10";

    // Validation
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Le terme de recherche doit contenir au moins 2 caractères" },
        { status: 400 },
      );
    }
    if (query.trim().length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        { error: "Le terme de recherche est trop long" },
        { status: 400 },
      );
    }
    if (
      !/^\d{1,2}$/.test(limitParam) ||
      Number(limitParam) < 1 ||
      Number(limitParam) > MAX_LIMIT
    ) {
      return NextResponse.json(
        { error: `Nombre de résultats invalide (1 à ${MAX_LIMIT})` },
        { status: 400 },
      );
    }
    const limit = String(Number(limitParam));

    // Construction de l'URL pour l'API Gouv
    const apiUrl = new URL(API_GOUV_BASE_URL);
    apiUrl.searchParams.append("q", query.trim());
    apiUrl.searchParams.append("limite", limit);

    // Requête vers l'API Gouv (côté serveur, pas de CORS)
    const response = await fetch(apiUrl.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "Newbi/1.0",
      },
      // Pas de cache pour éviter les problèmes de headers dupliqués
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Erreur API Gouv: ${response.status} - ${response.statusText}`,
      );
    }

    const data = await response.json();

    // Retourner les données avec headers CORS propres
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Erreur proxy API Gouv:", error);
    return NextResponse.json(
      {
        error: "Impossible de rechercher les entreprises. Veuillez réessayer.",
      },
      { status: 500 },
    );
  }
}
