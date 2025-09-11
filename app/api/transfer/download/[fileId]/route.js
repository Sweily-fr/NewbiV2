import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Configuration R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.AWS_S3_API_URL,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function GET(request, { params }) {
  try {
    console.log("=== DEBUT ENDPOINT DOWNLOAD ===");
    const { fileId } = await params;
    const { searchParams } = new URL(request.url);
    const shareLink = searchParams.get("shareLink");
    const accessKey = searchParams.get("accessKey");

    console.log("Paramètres reçus:", { fileId, shareLink, accessKey });

    if (!shareLink || !accessKey) {
      console.log("Paramètres manquants");
      return NextResponse.json(
        { error: "shareLink et accessKey sont requis" },
        { status: 400 }
      );
    }

    // Appel à l'API GraphQL pour vérifier les permissions et obtenir les infos du fichier
    const graphqlQuery = `
      query GetFileTransferByLink($shareLink: String!, $accessKey: String!) {
        getFileTransferByLink(shareLink: $shareLink, accessKey: $accessKey) {
          success
          message
          fileTransfer {
            id
            files {
              id
              originalName
              size
              mimeType
              r2Key
              storageType
              downloadUrl
            }
          }
        }
      }
    `;

    console.log("Variables GraphQL:", { shareLink, accessKey });
    console.log("URL API:", process.env.API_URL);

    const apiUrl = process.env.API_URL || "http://localhost:4000";
    console.log("URL API utilisée:", apiUrl);

    const graphqlResponse = await fetch(`${apiUrl}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { shareLink, accessKey },
      }),
    });

    console.log("Status GraphQL:", graphqlResponse.status);
    const responseText = await graphqlResponse.text();
    console.log("Réponse GraphQL brute:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Erreur parsing JSON:", parseError);
      throw new Error("Réponse GraphQL invalide");
    }

    console.log("Data GraphQL parsée:", JSON.stringify(data, null, 2));

    if (!data?.data?.getFileTransferByLink?.success) {
      console.log("Échec GraphQL:", data?.data?.getFileTransferByLink?.message);
      return NextResponse.json(
        { error: "Accès non autorisé ou transfert non trouvé" },
        { status: 403 }
      );
    }

    // Trouver le fichier spécifique
    console.log("Recherche du fichier avec ID:", fileId);
    console.log(
      "Fichiers disponibles:",
      data.data.getFileTransferByLink.fileTransfer.files
    );

    const file = data.data.getFileTransferByLink.fileTransfer.files.find(
      (f) => f.id === fileId
    );

    if (!file) {
      console.log("Fichier non trouvé avec ID:", fileId);
      return NextResponse.json(
        { error: "Fichier non trouvé" },
        { status: 404 }
      );
    }

    console.log("Fichier trouvé:", file);

    // Si le fichier a une downloadUrl publique, télécharger le fichier
    if (file.downloadUrl && !file.downloadUrl.includes("undefined")) {
      console.log("Téléchargement depuis downloadUrl:", file.downloadUrl);

      // Récupérer le fichier depuis l'URL publique
      const fileResponse = await fetch(file.downloadUrl);
      if (!fileResponse.ok) {
        throw new Error("Impossible de récupérer le fichier");
      }

      const fileBuffer = await fileResponse.arrayBuffer();

      // Retourner le fichier avec les headers appropriés pour forcer le téléchargement
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": file.mimeType || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${file.originalName}"`,
          "Content-Length": file.size.toString(),
        },
      });
    }

    // Sinon, générer une URL signée pour R2
    if (file.storageType === "r2" && file.r2Key) {
      console.log("Génération URL signée pour R2Key:", file.r2Key);
      console.log("Variables env R2:", {
        bucket: process.env.TRANSFER_BUCKET_NAME,
        endpoint: process.env.AWS_S3_API_URL,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      });

      const command = new GetObjectCommand({
        Bucket: process.env.TRANSFER_BUCKET_NAME,
        Key: file.r2Key,
      });

      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 300,
      }); // 5 minutes
      console.log("URL signée générée:", signedUrl);

      return NextResponse.redirect(signedUrl);
    }

    console.log(
      "Impossible de générer le lien - storageType:",
      file.storageType,
      "r2Key:",
      file.r2Key
    );
    return NextResponse.json(
      { error: "Impossible de générer le lien de téléchargement" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Erreur lors du téléchargement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
