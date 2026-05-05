import { NextResponse } from "next/server";
import { withErrorHandler } from "@/src/lib/security";

// Cette route retourne simplement les données
// La génération PDF se fait côté client avec html2canvas + jsPDF
async function handler(request) {
  const { data, type, filename } = await request.json();

  // Validation des données
  if (!data || !type) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  // TODO: Vérifier l'authentification
  // const session = await getServerSession();
  // if (!session) {
  //   return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  // }

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
