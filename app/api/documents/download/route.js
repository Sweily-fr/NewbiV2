import { NextResponse } from 'next/server';

// Cette route retourne simplement les données
// La génération PDF se fait côté client avec html2canvas + jsPDF
export async function POST(request) {
  try {
    const { data, type, filename } = await request.json();

    // Validation des données
    if (!data || !type) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
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
  } catch (error) {
    console.error('Erreur validation données:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la validation', details: error.message },
      { status: 500 }
    );
  }
}
