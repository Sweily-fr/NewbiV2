import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Accès direct à MongoDB pour récupérer l'invitation
    const { mongoDb } = await import("@/src/lib/mongodb");
    const { ObjectId } = await import("mongodb");

    // Récupérer l'invitation directement depuis MongoDB
    const invitation = await mongoDb
      .collection("invitation")
      .findOne({ _id: new ObjectId(id) });

    if (!invitation) {
      return Response.json(
        { error: "Invitation non trouvée" },
        { status: 404 }
      );
    }

    // Enrichir avec les données d'organisation
    let organizationName = "Organisation inconnue";
    if (invitation.organizationId) {
      try {
        const organization = await mongoDb
          .collection("organization")
          .findOne({ _id: invitation.organizationId });

        organizationName = organization?.name || organizationName;
      } catch (orgError) {
        console.warn("⚠️ Erreur récupération organisation:", orgError);
      }
    }

    const enrichedInvitation = {
      id: invitation._id.toString(),
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      organizationId: invitation.organizationId?.toString(),
      organizationName,
      inviterId: invitation.inviterId?.toString(),
    };

    return Response.json(enrichedInvitation);
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

    if (action === "accept") {
      // ÉTAPE 1: Créer l'organisation personnelle AVANT d'accepter l'invitation
      try {
        const user = session.user;
        const personalOrgName = `${user.name || user.email.split("@")[0]} (Personnel)`;
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
      } catch (personalOrgError) {
        console.warn(
          "⚠️ Erreur création organisation personnelle (non bloquante):",
          personalOrgError
        );
        // Ne pas faire échouer l'acceptation si la création de l'org perso échoue
      }

      // ÉTAPE 2: Accepter l'invitation (rejoint l'organisation de l'owner)
      const result = await auth.api.acceptInvitation({
        headers: await headers(),
        body: { invitationId: id },
      });

      // ÉTAPE 3: S'assurer que l'organisation de l'owner reste active
      if (result && result.organizationId) {
        try {
          await auth.api.setActiveOrganization({
            headers: await headers(),
            body: { organizationId: result.organizationId },
          });
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
