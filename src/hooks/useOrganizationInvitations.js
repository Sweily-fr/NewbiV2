import { useState, useCallback, useEffect } from "react";
import { organization, useSession, authClient } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";

export const useOrganizationInvitations = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [activeOrgSet, setActiveOrgSet] = useState(false);

  // Utiliser les hooks Better Auth
  const { data: organizations } = authClient.useListOrganizations();
  const { data: activeOrganization } = authClient.useActiveOrganization();

  // ⚠️ NE PAS définir automatiquement l'organisation active ici !
  // Better Auth gère déjà la persistance de l'organisation active dans la session
  // Ce useEffect causait un bug : il réinitialisait toujours à la première organisation
  // après chaque rechargement de page

  // useEffect(() => {
  //   const setActiveOrg = async () => {
  //     if (
  //       !activeOrgSet &&
  //       organizations &&
  //       organizations.length > 0 &&
  //       !activeOrganization
  //     ) {
  //       try {
  //         await organization.setActive({
  //           organizationId: organizations[0].id,
  //         });
  //         setActiveOrgSet(true);
  //       } catch (error) {
  //         console.error(
  //           "Erreur lors de la définition de l'organisation active:",
  //           error
  //         );
  //       }
  //     }
  //   };
  //
  //   setActiveOrg();
  // }, [organizations, activeOrganization, activeOrgSet]);

  // Récupérer l'organisation de l'utilisateur
  const getUserOrganization = useCallback(() => {
    if (activeOrganization) {
      return activeOrganization;
    }
    if (organizations && organizations.length > 0) {
      return organizations[0];
    }
    return null;
  }, [activeOrganization, organizations]);

  // Inviter un membre
  const inviteMember = useCallback(
    async ({ email, role = "member", organizationId = null }) => {
      setInviting(true);
      try {
        if (!session?.user) {
          throw new Error("Utilisateur non connecté");
        }

        // Utiliser l'organizationId fourni ou récupérer l'organisation active
        const userOrg = organizationId ? { id: organizationId } : getUserOrganization();

        if (!userOrg?.id) {
          throw new Error("Aucune organisation trouvée pour cet utilisateur");
        }

        // ✅ Vérifier les limites selon le plan et le rôle (BLOQUANT)
        try {
          const response = await fetch("/api/billing/check-user-limit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ organizationId: userOrg.id, role }),
          });

          const result = await response.json();

          if (!result.canInvite) {
            toast.error(result.reason || "Limite atteinte pour votre plan.");
            return { success: false, error: result.reason };
          }

          // Afficher un avertissement si c'est un siège payant
          if (result.isPaid) {
            console.log(
              `💰 Siège payant: ${result.additionalCost}€/mois supplémentaire`
            );
            // Note: On pourrait ajouter une confirmation ici si nécessaire
          }

          console.log(
            `✅ Limite vérifiée pour ${role}: canInvite=${result.canInvite}`
          );
        } catch (limitError) {
          console.error("❌ Erreur vérification limite:", limitError);
          toast.error(
            "Impossible de vérifier les limites. Veuillez réessayer."
          );
          return { success: false, error: "Erreur vérification limite" };
        }

        const { data, error } = await organization.inviteMember({
          email,
          role,
          organizationId: userOrg.id, // Spécifier explicitement l'ID de l'organisation
        });

        if (error) {
          // Essayer d'extraire un message d'erreur plus détaillé
          const errorMessage =
            error.message ||
            error.error ||
            error.details ||
            "Erreur lors de l'envoi de l'invitation";
          toast.error(errorMessage);
          return { success: false, error };
        }

        toast.success(`Invitation envoyée à ${email}`);
        return { success: true, data };
      } catch (error) {
        toast.error(error.message || "Erreur lors de l'envoi de l'invitation");
        return { success: false, error: error.message };
      } finally {
        setInviting(false);
      }
    },
    [session, getUserOrganization]
  );

  // Lister les membres de l'organisation
  const listMembers = useCallback(
    async (organizationId = null) => {
      setLoading(true);
      try {
        const userOrg = getUserOrganization();
        const orgId = organizationId || userOrg?.id;

        if (!orgId) {
          return { success: false, error: "Aucune organisation trouvée" };
        }

        // Utiliser getFullOrganization qui fonctionne mieux côté client
        const { data: fullOrg, error } = await organization.getFullOrganization(
          {
            organizationId: orgId,
            membersLimit: 100,
          }
        );

        if (error) {
          return { success: false, error };
        }

        // Filtrer les membres pour exclure les owners
        const filteredMembers = (fullOrg?.members || []).filter(
          (member) => member.role !== "owner"
        );

        return { success: true, data: filteredMembers };
      } catch (error) {
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    },
    [getUserOrganization]
  );

  // Lister les invitations en attente
  const listInvitations = useCallback(
    async (organizationId = null) => {
      setLoading(true);
      try {
        const userOrg = getUserOrganization();
        const orgId = organizationId || userOrg?.id;

        if (!orgId) {
          return { success: false, error: "Aucune organisation trouvée" };
        }

        // Utiliser getFullOrganization pour récupérer les invitations
        const { data: fullOrg, error } = await organization.getFullOrganization(
          {
            organizationId: orgId,
          }
        );

        if (error) {
          console.error(
            "Erreur lors de la récupération de l'organisation complète:",
            error
          );
          return { success: false, error };
        }

        return { success: true, data: fullOrg?.invitations || [] };
      } catch (error) {
        console.error("Erreur lors de la récupération des invitations:", error);
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    },
    [getUserOrganization]
  );

  // Supprimer un membre
  const removeMember = useCallback(
    async (memberIdOrEmail, organizationId = null) => {
      try {
        const orgId = organizationId || getUserOrganization()?.id;

        console.log(
          "🗑️ Suppression du membre:",
          memberIdOrEmail,
          "de l'org:",
          orgId
        );

        // 1. Supprimer le membre via Better Auth
        const { data, error } = await organization.removeMember({
          memberIdOrEmail,
          organizationId: orgId,
        });

        console.log("📊 Résultat Better Auth removeMember:", { data, error });

        if (error) {
          console.error("❌ Erreur Better Auth:", error);
          toast.error("Erreur lors de la suppression du membre");
          return { success: false, error };
        }

        console.log("✅ Membre supprimé avec succès de Better Auth");

        // 2. Synchroniser la facturation des sièges (non-bloquant)
        try {
          console.log(
            `💳 Synchronisation facturation après suppression de membre`
          );

          const response = await fetch("/api/billing/sync-seats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ organizationId: orgId }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.warn(
              "⚠️ Erreur sync facturation (non-bloquant):",
              errorData
            );
          } else {
            const result = await response.json();
            console.log(`✅ Facturation synchronisée:`, result);
          }
        } catch (billingError) {
          // Ne pas faire échouer la suppression si la facturation échoue
          console.warn(
            "⚠️ Erreur sync facturation (non-bloquant):",
            billingError
          );
        }

        toast.success("Membre supprimé avec succès");
        return { success: true, data };
      } catch (error) {
        toast.error(error.message || "Erreur lors de la suppression du membre");
        return { success: false, error: error.message };
      }
    },
    [getUserOrganization]
  );

  // Annuler une invitation
  const cancelInvitation = useCallback(async (invitationId) => {
    try {
      const { data, error } = await organization.cancelInvitation({
        invitationId,
      });

      if (error) {
        toast.error("Erreur lors de l'annulation de l'invitation");
        return { success: false, error };
      }

      toast.success("Invitation annulée avec succès");
      return { success: true, data };
    } catch (error) {
      toast.error(
        error.message || "Erreur lors de l'annulation de l'invitation"
      );
      return { success: false, error: error.message };
    }
  }, []);

  // Renvoyer une invitation (annule l'ancienne et en crée une nouvelle)
  const resendInvitation = useCallback(
    async (email, role, invitationId, { silent = false } = {}) => {
      try {
        // 1. Annuler l'ancienne invitation silencieusement
        if (invitationId) {
          await organization.cancelInvitation({ invitationId });
        }

        // 2. Créer une nouvelle invitation
        const userOrg = getUserOrganization();
        if (!userOrg) {
          toast.error("Aucune organisation trouvée");
          return { success: false, error: "Aucune organisation trouvée" };
        }

        const { data, error } = await organization.inviteMember({
          email,
          role,
          organizationId: userOrg.id,
        });

        if (error) {
          const errorMessage =
            error.message || error.error || "Erreur lors du renvoi de l'invitation";
          if (!silent) toast.error(errorMessage);
          return { success: false, error };
        }

        if (!silent) toast.success(`Invitation renvoyée à ${email}`);
        return { success: true, data };
      } catch (error) {
        if (!silent) toast.error(error.message || "Erreur lors du renvoi de l'invitation");
        return { success: false, error: error.message };
      }
    },
    [getUserOrganization]
  );

  // Mettre à jour le rôle d'un membre
  const updateMemberRole = useCallback(
    async (memberId, newRole, organizationId = null, currentRole = null) => {
      try {
        const userOrg = getUserOrganization();
        const orgId = organizationId || userOrg?.id;

        if (!orgId) {
          toast.error("Aucune organisation trouvée");
          return { success: false, error: "Aucune organisation trouvée" };
        }

        console.log("🔄 Mise à jour du rôle:", {
          memberId,
          currentRole,
          newRole,
          orgId,
          type: typeof memberId,
        });

        // Vérifier les limites si changement vers comptable
        if (newRole === "accountant") {
          try {
            const response = await fetch("/api/billing/check-role-change", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                organizationId: orgId,
                memberId,
                currentRole,
                newRole,
              }),
            });

            const result = await response.json();

            if (!result.canChange) {
              toast.error(result.reason || "Limite de comptables atteinte");
              return { success: false, error: result.reason };
            }
          } catch (checkError) {
            console.error("❌ Erreur vérification limite:", checkError);
            toast.error("Impossible de vérifier les limites. Veuillez réessayer.");
            return { success: false, error: "Erreur vérification limite" };
          }
        }

        // Better Auth attend 'memberId' et 'role' comme paramètres
        console.log("🔄 updateMemberRole params:", { memberId, role: newRole, orgId });

        const { data, error } = await organization.updateMemberRole({
          memberId: memberId,
          role: newRole,  // ✅ Better Auth utilise "role", pas "newRole"
          organizationId: orgId,
        });

        if (error) {
          console.error("❌ Erreur updateMemberRole:", error);
          // Afficher le message d'erreur détaillé
          const errorMessage = error.message || error.error || error.statusText || "Erreur lors de la mise à jour du rôle";
          toast.error(errorMessage);
          return { success: false, error };
        }

        console.log("✅ Rôle mis à jour avec succès:", data);
        toast.success("Rôle mis à jour avec succès");
        return { success: true, data };
      } catch (error) {
        console.error("❌ Exception updateMemberRole:", error);
        toast.error(error.message || "Erreur lors de la mise à jour du rôle");
        return { success: false, error: error.message };
      }
    },
    [getUserOrganization]
  );

  // Fonction pour récupérer tous les collaborateurs (membres + invitations)
  const getAllCollaborators = useCallback(
    async (organizationId = null) => {
      setLoading(true);
      try {
        const userOrg = getUserOrganization();
        const orgId = organizationId || userOrg?.id;

        if (!orgId) {
          return { success: false, error: "Aucune organisation trouvée" };
        }

        // Utiliser getFullOrganization pour récupérer membres et invitations
        console.log(`🔍 getAllCollaborators - Demande pour orgId: ${orgId}`);
        const { data: fullOrg, error } = await organization.getFullOrganization(
          {
            organizationId: orgId,
            membersLimit: 100,
          }
        );

        if (error) {
          console.error(`❌ Erreur getFullOrganization:`, error);
          return { success: false, error };
        }

        console.log(
          `📋 Organisation récupérée: ${fullOrg?.name} (ID: ${fullOrg?.id})`
        );

        // Récupérer TOUS les membres (y compris les owners)
        const allMembers = fullOrg?.members || [];
        const invitations = fullOrg?.invitations || [];

        console.log(
          `📊 getAllCollaborators pour "${fullOrg?.name}" - Membres:`,
          allMembers.length
        );
        console.log(
          "📊 getAllCollaborators - Invitations:",
          invitations.length
        );
        console.log(
          "📋 Détails membres:",
          allMembers.map((m) => ({
            email: m.email || m.user?.email,
            role: m.role,
            avatar: m.avatar || m.user?.avatar,
            user: m.user ? "présent" : "absent",
          }))
        );

        // Log détaillé de la structure du premier membre
        if (allMembers.length > 0) {
          console.log(
            "🔍 Structure complète du premier membre:",
            JSON.stringify(allMembers[0], null, 2)
          );
        }
        console.log(
          "📋 Détails invitations:",
          invitations.map((i) => ({ email: i.email, status: i.status }))
        );

        // Combiner membres et invitations avec un type pour les différencier
        const collaborators = [
          ...allMembers.map((member) => ({ ...member, type: "member" })),
          ...invitations.map((invitation) => ({
            ...invitation,
            type: "invitation",
          })),
        ];

        console.log("✅ Total collaborateurs:", collaborators.length);

        return { success: true, data: collaborators };
      } catch (error) {
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    },
    [getUserOrganization]
  );

  return {
    // Actions
    inviteMember,
    listMembers,
    listInvitations,
    getAllCollaborators,
    removeMember,
    cancelInvitation,
    resendInvitation,
    updateMemberRole,

    // États
    loading,
    inviting,
  };
};
