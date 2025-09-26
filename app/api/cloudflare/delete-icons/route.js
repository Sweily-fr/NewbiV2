import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';

export async function DELETE(request) {
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

    const { userId, signatureId } = await request.json();

    if (!userId || !signatureId) {
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

    // Supprimer les icônes via AWS SDK v3
    const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = await import('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Lister tous les fichiers dans le dossier custom-icons/userId/signatureId/
    const prefix = `custom-icons/${userId}/${signatureId}/`;
    
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });

    const listResult = await s3Client.send(listCommand);
    
    if (!listResult.Contents || listResult.Contents.length === 0) {
      console.log(`ℹ️ Aucune icône à supprimer pour ${prefix}`);
      return NextResponse.json({
        success: true,
        message: 'Aucune icône à supprimer',
        deletedCount: 0,
      });
    }

    // Supprimer tous les fichiers trouvés
    const objectsToDelete = listResult.Contents.map(obj => ({ Key: obj.Key }));
    
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: objectsToDelete,
        Quiet: false,
      },
    });

    const deleteResult = await s3Client.send(deleteCommand);

    console.log(`✅ ${objectsToDelete.length} icônes supprimées pour signature ${signatureId}`);

    return NextResponse.json({
      success: true,
      message: `${objectsToDelete.length} icônes supprimées`,
      deletedCount: objectsToDelete.length,
      deleted: deleteResult.Deleted?.map(obj => obj.Key) || [],
    });

  } catch (error) {
    console.error('❌ Erreur API suppression icônes:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
