import { NextResponse } from "next/server";

// Le ZIP est généré en streaming par le backend Express (archiver).
// L'ancienne implémentation chargeait tous les fichiers en mémoire dans la
// fonction serverless Vercel, ce qui la faisait crasher (erreur 500) dès que
// le transfert dépassait la mémoire disponible.
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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/";

  return NextResponse.redirect(
    `${apiUrl}file-transfer/download-all?link=${encodeURIComponent(
      shareLink,
    )}&key=${encodeURIComponent(accessKey)}`,
  );
}
