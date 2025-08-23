import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const workspaceId = request.headers.get('x-workspace-id') || new URL(request.url).searchParams.get('workspaceId');
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'WorkspaceId requis' }, { status: 400 });
    }

    // Récupérer le body de la requête
    const body = await request.json().catch(() => ({}));
    
    // Récupérer les cookies pour l'authentification
    const cookieHeader = request.headers.get('cookie');
    
    // URL du backend
    const backendUrl = process.env.BACKEND_URL || process.env.BACKEND_API_URL || 'http://localhost:4000';
    
    // Faire la requête vers le backend
    const response = await fetch(`${backendUrl}/banking-sync/full`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-workspace-id': workspaceId,
        ...(cookieHeader && { 'Cookie': cookieHeader })
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Erreur proxy banking-sync full:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
