import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import CustomSocialIconService from '@/src/services/customSocialIconService.js';

export async function PUT(request) {
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

    const body = await request.json();
    const { userId, signatureId, socialNetworks, socialColors } = body;

    // Validation des données
    if (!userId || !signatureId) {
      return NextResponse.json(
        { success: false, message: 'userId et signatureId sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur peut modifier cette signature
    if (session.user.id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé à modifier cette signature' },
        { status: 403 }
      );
    }

    console.log(`🔄 Mise à jour icônes personnalisées pour user ${userId}, signature ${signatureId}`);

    // Supprimer les anciennes icônes
    await CustomSocialIconService.deleteCustomIcons(userId, signatureId);

    // Générer les nouvelles icônes avec les nouvelles couleurs
    const customIcons = await CustomSocialIconService.generateAllCustomIcons(
      userId,
      signatureId,
      socialColors || {},
      socialNetworks || {}
    );

    return NextResponse.json({
      success: true,
      message: 'Icônes personnalisées mises à jour avec succès',
      customIcons,
    });

  } catch (error) {
    console.error('❌ Erreur API mise à jour icônes personnalisées:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Erreur lors de la mise à jour des icônes personnalisées' 
      },
      { status: 500 }
    );
  }
}
