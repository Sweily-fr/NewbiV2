import { NextResponse } from "next/server";
import { requireSession, withErrorHandler } from "@/src/lib/security";

// Cette route retourne simplement les données
// La génération PDF se fait côté client avec html2canvas + jsPDF
async function handler(request) {
  // Plus d'appel sans session (l'authentification était restée en TODO)
  await requireSession(request);

  const { data, type, filename } = await request.json();

  // Validation des données
  if (!data || !type) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  // TODO: Log pour conservation 6 ans (conformité légale)
  // await logDocumentGeneration({
  //   userId: session.user.id,
  //   type,
  //   numero: data.number,
  // });

  // Retourner les données validées
  return NextResponse.json({
    success: true,
    data,
    type,
    filename,
  });
}

export const POST = withErrorHandler(handler);
