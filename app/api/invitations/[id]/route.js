import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { seatSyncService } from "@/src/services/seatSyncService";

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
      // ÉTAPE 1: Accepter l'invitation (rejoint l'organisation de l'owner)
      const result = await auth.api.acceptInvitation({
        headers: await headers(),
        body: { invitationId: id },
      });

      if (!result || !result.organizationId) {
        return Response.json(
          { error: "Échec de l'acceptation de l'invitation" },
          { status: 500 }
        );
      }

      console.log(`✅ Invitation acceptée, membre ajouté à l'organisation ${result.organizationId}`);

      // ÉTAPE 3: Définir l'organisation comme active IMMÉDIATEMENT
      try {
        await auth.api.setActiveOrganization({
          headers: await headers(),
          body: { organizationId: result.organizationId },
        });
        console.log(`✅ Organisation ${result.organizationId} définie comme active`);
      } catch (orgError) {
        console.error("❌ Erreur lors de la définition de l'organisation active:", orgError);
        // Ne pas bloquer si ça échoue, mais logger l'erreur
      }

      // ÉTAPE 4: Synchroniser la facturation des sièges
      try {
        console.log(`💳 Synchronisation facturation pour organisation ${result.organizationId}`);
        
        const { auth: authInstance } = await import("@/src/lib/auth");
        const adapter = authInstance.options.database;

        await seatSyncService.syncSeatsAfterInvitationAccepted(
          result.organizationId,
          adapter
        );

        console.log(`✅ Facturation synchronisée avec succès`);
      } catch (billingError) {
        console.error("❌ Erreur synchronisation facturation:", billingError);
        
        // ROLLBACK: Supprimer le membre si la facturation échoue
        try {
          console.log(`🔄 Rollback: suppression du membre ${session.user.email}`);
          
          await auth.api.removeMember({
            headers: await headers(),
            body: {
              memberIdOrEmail: session.user.email,
              organizationId: result.organizationId
            }
          });

          console.log(`✅ Rollback effectué avec succès`);
        } catch (rollbackError) {
          console.error("❌ Échec du rollback:", rollbackError);
          // Si le rollback échoue, l'admin devra supprimer manuellement
        }

        return Response.json({
          error: "Échec de la facturation. Veuillez contacter le support ou réessayer.",
          details: billingError.message
        }, { status: 500 });
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
