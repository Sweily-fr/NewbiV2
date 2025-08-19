import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    // Récupérer la session utilisateur
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return Response.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log('🔍 Recherche invitation avec ID:', id);
    console.log('👤 Session utilisateur:', session.user.email);

    // Récupérer toutes les invitations de l'utilisateur
    // Utiliser l'API interne Better Auth avec les bons paramètres
    const invitations = await auth.api.listInvitations({
      headers: await headers(),
      query: {
        email: session.user.email
      }
    });

    console.log('📋 Invitations trouvées:', invitations?.length || 0);

    // Trouver l'invitation spécifique par ID
    const invitation = invitations?.find(inv => inv.id === id);

    if (!invitation) {
      console.log('❌ Invitation non trouvée pour ID:', id);
      return Response.json({ error: "Invitation non trouvée" }, { status: 404 });
    }

    console.log('✅ Invitation trouvée:', invitation);
    return Response.json(invitation);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de l'invitation:", error);
    return Response.json({ error: "Erreur serveur", details: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { action } = await request.json();
    
    // Récupérer la session utilisateur
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return Response.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log(`🎯 Action ${action} sur invitation:`, id);

    if (action === 'accept') {
      const result = await auth.api.acceptInvitation({
        headers: await headers(),
        body: { invitationId: id }
      });
      console.log('✅ Invitation acceptée:', result);
      return Response.json(result);
    } else if (action === 'reject') {
      const result = await auth.api.rejectInvitation({
        headers: await headers(),
        body: { invitationId: id }
      });
      console.log('❌ Invitation rejetée:', result);
      return Response.json(result);
    } else {
      return Response.json({ error: "Action non valide" }, { status: 400 });
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'action sur l'invitation:", error);
    return Response.json({ error: "Erreur serveur", details: error.message }, { status: 500 });
  }
}
