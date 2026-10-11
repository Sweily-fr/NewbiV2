import { NextResponse } from "next/server";
import { apiError, requireSession, withErrorHandler } from "@/src/lib/security";
import { detectRasterImageType } from "@/src/lib/security/raster-image";

/**
 * POST /api/cloudflare/upload-icon
 *
 * Upload d'une icône de réseau social personnalisée (signatures de mail)
 * sur le bucket public R2, sous `custom-icons/{userId de la session}/...`.
 *
 * Le fichier était stocké tel quel en `image/svg+xml`, sans limite de
 * taille : un SVG peut porter du script, des attributs `on*` ou des
 * références externes, servi ensuite depuis un domaine public. Désormais :
 * 1 Mo maximum, PNG, JPEG, GIF ou WebP reconnus à leur signature (le SVG
 * est refusé), type de contenu et extension déduits du contenu réel,
 * paramètres du chemin validés.
 */
const MAX_SIZE = 1024 * 1024;
const SAFE_SEGMENT = /^[A-Za-z0-9_-]{1,64}$/;
const HEX_COLOR = /^#?[0-9A-F]{6}$/i;

async function handler(request) {
  const { user } = await requireSession(request);

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return apiError(400, "Formulaire invalide");
  }
  const file = formData.get("file");
  const userId = formData.get("userId");
  const signatureId = formData.get("signatureId");
  const platform = formData.get("platform");
  const color = formData.get("color");

  if (
    !file ||
    typeof file === "string" ||
    !userId ||
    !signatureId ||
    !platform ||
    !color
  ) {
    return NextResponse.json(
      { success: false, message: "Paramètres manquants" },
      { status: 400 },
    );
  }

  // Vérifier que l'utilisateur peut modifier cette signature
  if (String(user.id) !== String(userId)) {
    return NextResponse.json(
      { success: false, message: "Non autorisé" },
      { status: 403 },
    );
  }

  if (
    !SAFE_SEGMENT.test(String(signatureId)) ||
    !SAFE_SEGMENT.test(String(platform)) ||
    !HEX_COLOR.test(String(color))
  ) {
    return apiError(400, "Paramètres invalides");
  }

  if (!file.size || file.size > MAX_SIZE) {
    return apiError(400, "Icône trop volumineuse (1 Mo maximum)");
  }

  // Convertir le fichier en buffer et vérifier son contenu réel
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_SIZE) {
    return apiError(400, "Icône trop volumineuse (1 Mo maximum)");
  }
  const imageType = detectRasterImageType(buffer);
  if (!imageType) {
    return apiError(
      400,
      "Format d'icône non supporté (PNG, JPEG, GIF ou WebP)",
    );
  }

  // Générer le nom de fichier (identifiant de la session, jamais du client)
  const cleanColor = String(color).replace("#", "");
  const timestamp = Date.now();
  const fileName = `custom-icons/${user.id}/${signatureId}/${platform}-${cleanColor}-${timestamp}.${imageType.ext}`;

  // Configuration Cloudflare R2
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.error("❌ Variables d'environnement Cloudflare manquantes");
    return NextResponse.json(
      { success: false, message: "Configuration Cloudflare manquante" },
      { status: 500 },
    );
  }

  // Upload vers Cloudflare R2 via AWS SDK v3
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  // Upload vers R2
  const uploadCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: buffer,
    ContentType: imageType.mime,
    CacheControl: "public, max-age=31536000", // Cache 1 an
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
}

export const POST = withErrorHandler(handler);
