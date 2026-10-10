import { NextResponse } from "next/server";

// Ancienne URL de téléchargement direct d'un fichier : elle servait le
// fichier avec le seul lien de partage (ni mot de passe, ni filigrane, ni
// paiement contrôlés). Comme /api/transfer/download-all, on redirige vers la
// page de transfert, qui applique ces règles et passe par l'API.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shareLink = searchParams.get("shareLink");
  const accessKey = searchParams.get("accessKey");

  if (!shareLink || !accessKey) {
    return NextResponse.json(
      { error: "shareLink et accessKey sont requis" },
      { status: 400 },
    );
  }

  return NextResponse.redirect(
    new URL(
      `/transfer/${encodeURIComponent(shareLink)}?key=${encodeURIComponent(
        accessKey,
      )}`,
      request.url,
    ),
  );
}
