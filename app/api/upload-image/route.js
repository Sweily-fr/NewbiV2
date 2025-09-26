import { NextResponse } from 'next/server';

/**
 * API Route pour uploader des images sur Cloudflare R2
 * Utilisé pour les logos sociaux générés dynamiquement
 * Utilise la même infrastructure GraphQL que les images de signature
 */



export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    // const type = formData.get('type'); // Unused variable || 'social-logo';

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Vérifier que c'est bien une image
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Le fichier doit être une image' },
        { status: 400 }
      );
    }

    // Extraire logoType et color des métadonnées du fichier
    const logoType = formData.get('logoType') || 'facebook';
    const color = formData.get('color') || '#1877F2';

    try {
      // Convertir le fichier en buffer pour l'upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Créer un FormData pour l'upload GraphQL
      const uploadFormData = new FormData();
      
      const operations = JSON.stringify({
        query: `
          mutation UploadSocialLogo($file: Upload!, $logoType: String!, $color: String!) {
            uploadSocialLogo(file: $file, logoType: $logoType, color: $color) {
              success
              url
              message
            }
          }
        `,
        variables: {
          file: null,
          logoType,
          color
        }
      });
      
      const map = JSON.stringify({
        '0': ['variables.file']
      });
      
      uploadFormData.append('operations', operations);
      uploadFormData.append('map', map);
      uploadFormData.append('0', new Blob([buffer], { type: file.type }), file.name);
      
      // Faire l'appel direct au backend GraphQL
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        body: uploadFormData
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.data) {
        throw new Error(result.errors?.[0]?.message || 'Erreur lors de l\'upload');
      }
      
      const data = result.data;

      if (!data.uploadSocialLogo.success) {
        throw new Error(data.uploadSocialLogo.message || 'Erreur lors de l\'upload');
      }
      
      return NextResponse.json({
        success: true,
        url: data.uploadSocialLogo.url,
        key: data.uploadSocialLogo.key,
        filename: file.name,
        size: file.size,
        type: file.type,
        contentType: data.uploadSocialLogo.contentType
      });
      
    } catch (uploadError) {
      console.error('Erreur upload Cloudflare:', uploadError);
      
      return NextResponse.json(
        { 
          error: 'Erreur lors de l\'upload sur Cloudflare', 
          details: uploadError.message 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erreur upload image:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload', details: error.message },
      { status: 500 }
    );
  }
}
