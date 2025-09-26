import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';

export async function POST(request) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { userId, newSignatureId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId requis' },
        { status: 400 }
      );
    }

    console.log('🗑️ Nettoyage des fichiers temporaires pour utilisateur:', userId);
    console.log('🆔 Nouveau signatureId:', newSignatureId);

    // Appeler le service CloudflareService pour nettoyer les fichiers temporaires
    const graphqlEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';
    
    const mutation = `
      mutation CleanupTemporaryFiles($userId: String!, $newSignatureId: String) {
        cleanupTemporaryFiles(userId: $userId, newSignatureId: $newSignatureId) {
          success
          deletedCount
          message
        }
      }
    `;

    const graphqlResponse = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          userId: userId,
          newSignatureId: newSignatureId,
        },
      }),
    });

    if (!graphqlResponse.ok) {
      const errorText = await graphqlResponse.text();
      console.error('❌ Erreur HTTP GraphQL cleanup:', graphqlResponse.status, errorText);
      throw new Error(`Erreur GraphQL cleanup: ${graphqlResponse.status} - ${errorText}`);
    }

    const graphqlResult = await graphqlResponse.json();
    console.log('📥 Réponse GraphQL cleanup:', JSON.stringify(graphqlResult, null, 2));

    if (graphqlResult.errors) {
      console.error('❌ Erreurs GraphQL cleanup:', JSON.stringify(graphqlResult.errors, null, 2));
      throw new Error(graphqlResult.errors[0]?.message || 'Erreur GraphQL cleanup');
    }

    const cleanupResult = graphqlResult.data?.cleanupTemporaryFiles;
    
    if (!cleanupResult) {
      throw new Error('Aucun résultat de nettoyage retourné par GraphQL');
    }

    console.log('✅ Nettoyage terminé:', cleanupResult);

    return NextResponse.json({
      success: true,
      deletedCount: cleanupResult.deletedCount,
      message: cleanupResult.message,
    });

  } catch (error) {
    console.error('❌ Erreur API nettoyage fichiers temporaires:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
