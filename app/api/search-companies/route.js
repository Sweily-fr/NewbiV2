/**
 * API Route proxy pour la recherche d'entreprises via API Gouv Data
 * Contourne les problèmes CORS en faisant la requête côté serveur
 */

import { NextResponse } from 'next/server';

const API_GOUV_BASE_URL = 'https://recherche-entreprises.api.gouv.fr/search';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = searchParams.get('limite') || '10';

    // Validation
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Le terme de recherche doit contenir au moins 2 caractères' },
        { status: 400 }
      );
    }

    // Construction de l'URL pour l'API Gouv
    const apiUrl = new URL(API_GOUV_BASE_URL);
    apiUrl.searchParams.append('q', query.trim());
    apiUrl.searchParams.append('limite', limit);

    // Requête vers l'API Gouv (côté serveur, pas de CORS)
    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Newbi/1.0'
      },
      // Pas de cache pour éviter les problèmes de headers dupliqués
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Erreur API Gouv: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    // Retourner les données avec headers CORS propres
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });

  } catch (error) {
    console.error('Erreur proxy API Gouv:', error);
    return NextResponse.json(
      { error: 'Impossible de rechercher les entreprises. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}
