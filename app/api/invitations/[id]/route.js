import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { seatSyncService } from "@/src/services/seatSyncService";
import { emailTemplates } from "@/src/lib/email-templates";
import { sendEmail } from "@/src/lib/auth-utils";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Accès direct à MongoDB pour récupérer l'invitation
    const { mongoDb } = await import("@/src/lib/mongodb");
    const { ObjectId } = await import("mongodb");

    // Récupérer l'invitation directement depuis MongoDB par _id
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
    console.log("🔵 POST /api/invitations/[id] - Début");

    const { id } = await params;
    const { action } = await request.json();

    console.log(`📋 Invitation ID: ${id}, Action: ${action}`);

    // Récupérer la session utilisateur
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    console.log(
      `👤 Session utilisateur:`,
      session?.user?.email || "Non connecté"
    );

    if (!session) {
      console.log("❌ Non authentifié");
      return Response.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (action === "accept") {
      console.log("✅ Action: Accepter l'invitation");

      // Vérifier que l'utilisateur est bien le destinataire de l'invitation
      const { mongoDb } = await import("@/src/lib/mongodb");
      const { ObjectId } = await import("mongodb");

      const invitation = await mongoDb
        .collection("invitation")
        .findOne({ _id: new ObjectId(id) });

      if (!invitation) {
        console.log("❌ Invitation non trouvée");
        return Response.json(
          { error: "Invitation non trouvée" },
          { status: 404 }
        );
      }

      // Vérifier si l'invitation a expiré
      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        console.log(`❌ Invitation expirée: ${invitation.expiresAt}`);
        return Response.json(
          {
            error: "Invitation expirée",
            details: `Cette invitation a expiré le ${new Date(invitation.expiresAt).toLocaleDateString("fr-FR")}. Veuillez demander une nouvelle invitation.`,
          },
          { status: 410 }
        );
      }

      // Vérifier si l'invitation a déjà été traitée
      if (invitation.status !== "pending") {
        console.log(`❌ Invitation déjà traitée: ${invitation.status}`);
        return Response.json(
          {
            error: "Invitation déjà traitée",
            details: `Cette invitation a déjà été ${invitation.status === "accepted" ? "acceptée" : invitation.status === "rejected" ? "refusée" : "annulée"}.`,
          },
          { status: 400 }
        );
      }

      console.log(`📧 Email invitation: ${invitation.email}`);
      console.log(`📧 Email utilisateur: ${session.user.email}`);

      if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
        console.log(
          "❌ L'utilisateur n'est pas le destinataire de cette invitation"
        );
        return Response.json(
          {
            error: "Vous n'êtes pas le destinataire de cette invitation",
            details: `Cette invitation a été envoyée à ${invitation.email}, mais vous êtes connecté avec ${session.user.email}`,
          },
          { status: 403 }
        );
      }

      // NOTE: La vérification de limite se fait à l'ENVOI de l'invitation, pas à l'acceptation
      // Si une invitation existe et est valide, l'acceptation doit fonctionner

      // ÉTAPE 1: Accepter l'invitation (rejoint l'organisation de l'owner)
      console.log("🔄 ÉTAPE 1: Appel Better Auth acceptInvitation...");
      console.log(`📋 _id MongoDB: ${id}`);

      let result;
      try {
        result = await auth.api.acceptInvitation({
          headers: await headers(),
          body: { invitationId: id },
        });
      } catch (acceptError) {
        console.error("❌ Erreur acceptInvitation:", acceptError);
        throw acceptError;
      }

      console.log("📊 Résultat acceptInvitation:", result);

      // Better Auth retourne { invitation: {...}, member: {...} }
      const organizationId =
        result?.invitation?.organizationId || result?.organizationId;

      if (!result || !organizationId) {
        console.log("❌ Échec acceptInvitation: pas d'organizationId");
        return Response.json(
          { error: "Échec de l'acceptation de l'invitation" },
          { status: 500 }
        );
      }

      console.log(
        `✅ ÉTAPE 1 OK: Membre ajouté à l'organisation ${organizationId}`
      );

      // ÉTAPE 2: Nettoyer les flags d'utilisateur invité
      // L'utilisateur est maintenant un membre à part entière
      try {
        console.log("🔄 ÉTAPE 2: Nettoyage des flags utilisateur invité...");
        await mongoDb.collection("user").updateOne(
          { _id: new ObjectId(session.user.id) },
          {
            $set: {
              isInvitedUser: false,
              pendingInvitationId: "",
            },
          }
        );
        console.log("✅ ÉTAPE 2 OK: Flags utilisateur nettoyés");
      } catch (cleanupError) {
        console.warn("⚠️ Erreur nettoyage flags (non-bloquant):", cleanupError);
      }

      // ÉTAPE 3: Définir l'organisation comme active IMMÉDIATEMENT
      try {
        console.log("🔄 ÉTAPE 3: Appel Better Auth setActiveOrganization...");
        await auth.api.setActiveOrganization({
          headers: await headers(),
          body: { organizationId },
        });
        console.log(
          `✅ ÉTAPE 3 OK: Organisation ${organizationId} définie comme active (session courante)`
        );

        // ✅ FIX CRITIQUE: Mettre à jour TOUTES les sessions de l'utilisateur
        // Pas seulement la session actuelle (pour les appareils multiples)
        const updateResult = await mongoDb
          .collection("session")
          .updateMany(
            { userId: new ObjectId(session.user.id) },
            { $set: { activeOrganizationId: organizationId } }
          );
        console.log(
          `✅ ÉTAPE 3 OK: ${updateResult.modifiedCount} session(s) mise(s) à jour avec organizationId`
        );
      } catch (orgError) {
        console.error("⚠️ Erreur setActiveOrganization:", orgError);
        // Ne pas bloquer si ça échoue, mais logger l'erreur
      }

      // ÉTAPE 4: Synchroniser la facturation des sièges (NON-BLOQUANT)
      try {
        console.log(
          `🔄 ÉTAPE 4: Synchronisation facturation pour organisation ${organizationId}`
        );
        console.log(`👤 Utilisateur invité: ${session.user.email}`);

        const { mongoDb } = await import("@/src/lib/mongodb");
        const { ObjectId } = await import("mongodb");

        // Vérifier que l'organisation a un abonnement avant de synchroniser
        const subscription = await mongoDb.collection("subscription").findOne({
          referenceId: organizationId,
        });

        if (!subscription || !subscription.stripeSubscriptionId) {
          console.log(
            `ℹ️ Organisation ${organizationId} en plan Free, pas de facturation à synchroniser`
          );
        } else {
          console.log(
            `📋 Organisation ${organizationId} a un abonnement Pro, synchronisation...`
          );

          const { auth: authInstance } = await import("@/src/lib/auth");
          const adapter = authInstance.options.database;

          await seatSyncService.syncSeatsAfterInvitationAccepted(
            organizationId,
            adapter
          );

          console.log(`✅ Facturation synchronisée avec succès`);
        }
      } catch (billingError) {
        // NE PAS bloquer l'acceptation si la facturation échoue
        console.error(
          "⚠️ Erreur synchronisation facturation (non-bloquant):",
          billingError
        );
        console.warn(
          "⚠️ Le membre a été ajouté mais la facturation n'a pas été synchronisée"
        );
        // Continuer sans erreur
      }

      // ÉTAPE 5: Envoyer les emails de notification (NON-BLOQUANT)
      try {
        console.log("🔄 ÉTAPE 5: Envoi des emails de notification...");

        console.log("📋 Récupération des informations...");
        console.log("Organization ID:", organizationId);
        console.log("Inviter ID:", result.invitation.inviterId);
        console.log("Member User ID:", result.member.userId);

        // Récupérer les informations complètes (convertir les IDs en ObjectId)
        const [organization, inviter, memberUser] = await Promise.all([
          mongoDb
            .collection("organization")
            .findOne({ _id: new ObjectId(organizationId) }),
          mongoDb
            .collection("user")
            .findOne({ _id: new ObjectId(result.invitation.inviterId) }),
          mongoDb
            .collection("user")
            .findOne({ _id: new ObjectId(result.member.userId) }),
        ]);

        console.log("📊 Données récupérées:");
        console.log("- Organization:", organization?.name);
        console.log("- Inviter:", inviter?.email);
        console.log("- Member:", memberUser?.email);

        // Trouver l'owner de l'organisation
        const ownerMember = await mongoDb.collection("member").findOne({
          organizationId: new ObjectId(organizationId),
          role: "owner",
        });

        const owner = ownerMember
          ? await mongoDb.collection("user").findOne({
              _id: new ObjectId(ownerMember.userId),
            })
          : null;

        console.log("- Owner:", owner?.email);

        const emailData = {
          organization: { name: organization?.name || "Organisation" },
          member: {
            user: {
              name: memberUser?.name,
              email: memberUser?.email,
            },
            role: result.member.role,
          },
        };

        // Envoyer l'email à l'owner (si différent de l'inviter)
        if (owner && owner.email !== inviter?.email) {
          console.log(`📧 Envoi email à l'owner: ${owner.email}`);
          await sendEmail({
            to: owner.email,
            subject: `${memberUser?.name || memberUser?.email} a rejoint ${organization?.name}`,
            html: emailTemplates.memberJoinedNotificationOwner(emailData),
          });
          console.log(`✅ Email envoyé à l'owner: ${owner.email}`);
        } else {
          console.log(
            `ℹ️ Pas d'email à l'owner (owner = inviter ou owner non trouvé)`
          );
        }

        // Envoyer l'email à l'inviter
        if (inviter?.email) {
          console.log(`📧 Envoi email à l'inviter: ${inviter.email}`);
          await sendEmail({
            to: inviter.email,
            subject: `${memberUser?.name || memberUser?.email} a accepté votre invitation`,
            html: emailTemplates.memberJoinedNotificationInviter(emailData),
          });
          console.log(`✅ Email envoyé à l'inviter: ${inviter.email}`);
        }

        // Envoyer l'email de confirmation au nouveau membre
        if (memberUser?.email) {
          console.log(
            `📧 Envoi email de confirmation au membre: ${memberUser.email}`
          );
          await sendEmail({
            to: memberUser.email,
            subject: `Bienvenue dans ${organization?.name}`,
            html: emailTemplates.memberJoinedConfirmation(emailData),
          });
          console.log(
            `✅ Email de confirmation envoyé au nouveau membre: ${memberUser.email}`
          );
        }

        console.log("✅ ÉTAPE 5 OK: Emails de notification envoyés");
      } catch (emailError) {
        // NE PAS bloquer si l'envoi d'email échoue
        console.error("⚠️ Erreur envoi emails (non-bloquant):", emailError);
        console.error("Stack:", emailError.stack);
        // Continuer sans erreur
      }

      console.log("✅ TOUTES LES ÉTAPES TERMINÉES AVEC SUCCÈS");
      return Response.json({
        success: true,
        organizationId,
        member: result.member,
      });
    } else if (action === "reject") {
      // Vérifier l'invitation avant de la rejeter
      const { mongoDb } = await import("@/src/lib/mongodb");
      const { ObjectId } = await import("mongodb");

      const invitation = await mongoDb
        .collection("invitation")
        .findOne({ _id: new ObjectId(id) });

      if (!invitation) {
        return Response.json(
          { error: "Invitation non trouvée" },
          { status: 404 }
        );
      }

      // Si l'invitation est expirée ou déjà traitée, la marquer comme rejetée directement
      if (invitation.status !== "pending" || (invitation.expiresAt && new Date(invitation.expiresAt) < new Date())) {
        await mongoDb.collection("invitation").updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: "rejected" } }
        );
        return Response.json({ success: true });
      }

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
