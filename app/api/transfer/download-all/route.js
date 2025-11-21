import { NextResponse } from "next/server";
import JSZip from "jszip";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shareLink = searchParams.get("shareLink");
    const accessKey = searchParams.get("accessKey");
    const transferId = searchParams.get("transferId");
    const fileIds = searchParams.get("fileIds")?.split(",") || [];

    if (!shareLink || !accessKey || !transferId || fileIds.length === 0) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/";
    const zip = new JSZip();

    // Télécharger chaque fichier et l'ajouter au ZIP
    for (const fileId of fileIds) {
      try {
        // Utiliser la route proxy existante pour télécharger chaque fichier
        const fileResponse = await fetch(
          `${apiUrl}api/files/download/${transferId}/${fileId}`,
          {
            headers: {
              "x-share-link": shareLink,
              "x-access-key": accessKey,
            },
          }
        );

        if (fileResponse.ok) {
          const blob = await fileResponse.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const fileName =
            fileResponse.headers
              .get("content-disposition")
              ?.split("filename=")[1]
              ?.replace(/"/g, "") || `file-${fileId}`;

          zip.file(fileName, arrayBuffer);
        }
      } catch (error) {
        console.error(
          `Erreur lors du téléchargement du fichier ${fileId}:`,
          error
        );
      }
    }

    // Générer le ZIP
    const zipBlob = await zip.generateAsync({ type: "blob" });

    // Retourner le ZIP
    return new NextResponse(zipBlob, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="transfer-${shareLink}.zip"`,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la création du ZIP:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'archive" },
      { status: 500 }
    );
  }
}
