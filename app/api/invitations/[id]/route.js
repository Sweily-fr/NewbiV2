import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Récupérer la session utilisateur
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    console.log("🔍 Recherche invitation avec ID:", id);
    console.log(
      "👤 Session utilisateur:",
      session?.user?.email || "Pas de session"
    );

    if (!session) {
      return Response.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer toutes les invitations de l'utilisateur
    // Utiliser l'API interne Better Auth avec les bons paramètres
    const invitations = await auth.api.listInvitations({
      headers: await headers(),
      query: {
        email: session.user.email,
      },
    });

    console.log("📋 Invitations trouvées:", invitations?.length || 0);
    console.log(
      "📋 Détail des invitations:",
      invitations?.map((inv) => ({
        id: inv.id,
        email: inv.email,
        status: inv.status,
        expiresAt: inv.expiresAt,
      }))
    );

    // Trouver l'invitation spécifique par ID
    const invitation = invitations?.find((inv) => inv.id === id);

    if (!invitation) {
      console.log("❌ Invitation non trouvée pour ID:", id);
      console.log(
        "❌ IDs disponibles:",
        invitations?.map((inv) => inv.id)
      );
      return Response.json(
        { error: "Invitation non trouvée" },
        { status: 404 }
      );
    }

    console.log("✅ Invitation trouvée:", invitation);
    return Response.json(invitation);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de l'invitation:", error);
    return Response.json(
      { error: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { action } = await request.json();

    // Récupérer la session utilisateur
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return Response.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log(`🎯 Action ${action} sur invitation:`, id);

    if (action === "accept") {
      // ÉTAPE 1: Créer l'organisation personnelle AVANT d'accepter l'invitation
      try {
        console.log("🏢 Création de l'organisation personnelle...");
        
        const user = session.user;
        const personalOrgName = `${user.name || user.email.split('@')[0]} (Personnel)`;
        const personalSlug = `${user.id}-personal`;

        // Créer l'organisation personnelle avec keepCurrentActiveOrganization: true
        const personalOrgResult = await auth.api.createOrganization({
          headers: await headers(),
          body: {
            name: personalOrgName,
            slug: personalSlug,
            keepCurrentActiveOrganization: true, // CRUCIAL: ne pas changer l'orga active
          },
        });

        console.log("✅ Organisation personnelle créée:", personalOrgResult);
      } catch (personalOrgError) {
        console.warn("⚠️ Erreur création organisation personnelle (non bloquante):", personalOrgError);
        // Ne pas faire échouer l'acceptation si la création de l'org perso échoue
      }

      // ÉTAPE 2: Accepter l'invitation (rejoint l'organisation de l'owner)
      const result = await auth.api.acceptInvitation({
        headers: await headers(),
        body: { invitationId: id },
      });

      console.log("✅ Invitation acceptée:", result);

      // ÉTAPE 3: S'assurer que l'organisation de l'owner reste active
      if (result && result.organizationId) {
        try {
          console.log(
            "🎯 Définition de l'organisation active (owner):",
            result.organizationId
          );
          await auth.api.setActiveOrganization({
            headers: await headers(),
            body: { organizationId: result.organizationId },
          });
          console.log("✅ Organisation active définie avec succès");
        } catch (orgError) {
          console.error(
            "❌ Erreur lors de la définition de l'organisation active:",
            orgError
          );
          // Ne pas faire échouer l'acceptation si la définition de l'org active échoue
        }
      }

      return Response.json(result);
    } else if (action === "reject") {
      const result = await auth.api.rejectInvitation({
        headers: await headers(),
        body: { invitationId: id },
      });
      console.log("❌ Invitation rejetée:", result);
      return Response.json(result);
    } else {
      return Response.json({ error: "Action non valide" }, { status: 400 });
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'action sur l'invitation:", error);
    return Response.json(
      { error: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}
