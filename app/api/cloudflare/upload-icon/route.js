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

    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId');
    const signatureId = formData.get('signatureId');
    const platform = formData.get('platform');
    const color = formData.get('color');

    if (!file || !userId || !signatureId || !platform || !color) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur peut modifier cette signature
    if (session.user.id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Générer le nom de fichier
    const cleanColor = color.replace('#', '');
    const timestamp = Date.now();
    const fileName = `custom-icons/${userId}/${signatureId}/${platform}-${cleanColor}-${timestamp}.svg`;

    // Configuration Cloudflare R2
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      console.error('❌ Variables d\'environnement Cloudflare manquantes');
      return NextResponse.json(
        { success: false, message: 'Configuration Cloudflare manquante' },
        { status: 500 }
      );
    }

    // Upload vers Cloudflare R2 via AWS SDK v3
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Convertir le fichier en buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload vers R2
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: 'image/svg+xml',
      CacheControl: 'public, max-age=31536000', // Cache 1 an
    });

    await s3Client.send(uploadCommand);

    // Retourner l'URL publique
    const publicUrl = `https://pub-4ab56834c87d44b9a4fee1c84196b095.r2.dev/${fileName}`;

    console.log(`✅ Icône ${platform} uploadée sur Cloudflare: ${publicUrl}`);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      platform,
      color,
    });

  } catch (error) {
    console.error('❌ Erreur API upload icône:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
