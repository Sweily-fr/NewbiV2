import { NextResponse } from "next/server";

// Ancienne URL de téléchargement direct : rediriger vers la page de
// transfert — elle affiche l'interface Newbi et l'utilisateur lance le
// téléchargement lui-même, au lieu de naviguer vers le fichier sur une
// page vide.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shareLink = searchParams.get("shareLink");
  const accessKey = searchParams.get("accessKey");

  if (!shareLink || !accessKey) {
    return NextResponse.json(
      { error: "Paramètres manquants" },
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
