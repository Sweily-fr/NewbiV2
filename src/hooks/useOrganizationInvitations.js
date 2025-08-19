import { useState, useCallback, useEffect } from 'react';
import { organization, useSession, authClient } from '@/src/lib/auth-client';
import { toast } from '@/src/components/ui/sonner';

export const useOrganizationInvitations = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [activeOrgSet, setActiveOrgSet] = useState(false);
  
  // Utiliser les hooks Better Auth
  const { data: organizations } = authClient.useListOrganizations();
  const { data: activeOrganization } = authClient.useActiveOrganization();

  // Définir l'organisation active si ce n'est pas déjà fait
  useEffect(() => {
    const setActiveOrg = async () => {
      if (!activeOrgSet && organizations && organizations.length > 0 && !activeOrganization) {
        console.log('Définition de l\'organisation active:', organizations[0]);
        try {
          await organization.setActive({
            organizationId: organizations[0].id,
          });
          setActiveOrgSet(true);
          console.log('Organisation active définie avec succès');
        } catch (error) {
          console.error('Erreur lors de la définition de l\'organisation active:', error);
        }
      }
    };
    
    setActiveOrg();
  }, [organizations, activeOrganization, activeOrgSet]);
  
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
  const inviteMember = useCallback(async ({ email, role = 'member' }) => {
    setInviting(true);
    try {
      console.log('Invitation d\'un membre:', { email, role });
      
      if (!session?.user) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer l'organisation de l'utilisateur
      const userOrg = getUserOrganization();
      
      if (!userOrg) {
        throw new Error('Aucune organisation trouvée pour cet utilisateur');
      }
      
      console.log('Organisation trouvée:', userOrg);

      const { data, error } = await organization.inviteMember({
        email,
        role,
        organizationId: userOrg.id, // Spécifier explicitement l'ID de l'organisation
      });

      if (error) {
        console.error('Erreur lors de l\'invitation:', error);
        // Essayer d'extraire un message d'erreur plus détaillé
        const errorMessage = error.message || error.error || error.details || 'Erreur lors de l\'envoi de l\'invitation';
        toast.error(errorMessage);
        return { success: false, error };
      }

      console.log('Invitation envoyée avec succès:', data);
      toast.success(`Invitation envoyée à ${email}`);
      return { success: true, data };
      
    } catch (error) {
      console.error('Erreur lors de l\'invitation:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi de l\'invitation');
      return { success: false, error: error.message };
    } finally {
      setInviting(false);
    }
  }, [session, getUserOrganization]);

  // Lister les membres de l'organisation
  const listMembers = useCallback(async (organizationId = null) => {
    setLoading(true);
    try {
      const userOrg = getUserOrganization();
      const orgId = organizationId || userOrg?.id;
      
      if (!orgId) {
        console.error('Aucune organisation trouvée');
        return { success: false, error: 'Aucune organisation trouvée' };
      }
      
      console.log('Récupération des membres pour l\'organisation:', orgId);
      
      // Utiliser getFullOrganization qui fonctionne mieux côté client
      const { data: fullOrg, error } = await organization.getFullOrganization({
        organizationId: orgId,
        membersLimit: 100,
      });

      if (error) {
        console.error("Erreur lors de la récupération de l'organisation complète:", error);
        return { success: false, error };
      }

      console.log('Organisation complète récupérée:', fullOrg);
      
      // Filtrer les membres pour exclure les owners
      const filteredMembers = (fullOrg?.members || []).filter(member => member.role !== 'owner');
      
      console.log('Membres filtrés (sans owners):', filteredMembers);
      return { success: true, data: filteredMembers };
    } catch (error) {
      console.error("Erreur lors de la récupération des membres:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [getUserOrganization]);

  // Lister les invitations en attente
  const listInvitations = useCallback(async (organizationId = null) => {
    setLoading(true);
    try {
      const userOrg = getUserOrganization();
      const orgId = organizationId || userOrg?.id;
      
      if (!orgId) {
        console.error('Aucune organisation trouvée');
        return { success: false, error: 'Aucune organisation trouvée' };
      }
      
      console.log('Récupération des invitations pour l\'organisation:', orgId);
      
      // Utiliser getFullOrganization pour récupérer les invitations
      const { data: fullOrg, error } = await organization.getFullOrganization({
        organizationId: orgId,
      });

      if (error) {
        console.error("Erreur lors de la récupération de l'organisation complète:", error);
        return { success: false, error };
      }

      console.log('Invitations récupérées:', fullOrg?.invitations);
      return { success: true, data: fullOrg?.invitations || [] };
    } catch (error) {
      console.error("Erreur lors de la récupération des invitations:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [getUserOrganization]);

  // Supprimer un membre
  const removeMember = useCallback(
    async (memberIdOrEmail, organizationId = null) => {
      try {
        const { data, error } = await organization.removeMember({
          memberIdOrEmail,
          organizationId: organizationId || getUserOrganization()?.id, // Utiliser l'organisation active si pas spécifiée
        });

        if (error) {
          console.error("Erreur lors de la suppression du membre:", error);
          toast.error("Erreur lors de la suppression du membre");
          return { success: false, error };
        }

        toast.success("Membre supprimé avec succès");
        return { success: true, data };
      } catch (error) {
        console.error("Erreur lors de la suppression du membre:", error);
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
        console.error("Erreur lors de l'annulation de l'invitation:", error);
        toast.error("Erreur lors de l'annulation de l'invitation");
        return { success: false, error };
      }

      toast.success("Invitation annulée avec succès");
      return { success: true, data };
    } catch (error) {
      console.error("Erreur lors de l'annulation de l'invitation:", error);
      toast.error(
        error.message || "Erreur lors de l'annulation de l'invitation"
      );
      return { success: false, error: error.message };
    }
  }, []);

  // Mettre à jour le rôle d'un membre
  const updateMemberRole = useCallback(
    async (memberId, role, organizationId = null) => {
      try {
        const { data, error } = await organization.updateMemberRole({
          memberId,
          role,
          organizationId,
        });

        if (error) {
          console.error("Erreur lors de la mise à jour du rôle:", error);
          toast.error("Erreur lors de la mise à jour du rôle");
          return { success: false, error };
        }

        toast.success("Rôle mis à jour avec succès");
        return { success: true, data };
      } catch (error) {
        console.error("Erreur lors de la mise à jour du rôle:", error);
        toast.error(error.message || "Erreur lors de la mise à jour du rôle");
        return { success: false, error: error.message };
      }
    },
    []
  );

  // Fonction pour récupérer tous les collaborateurs (membres + invitations)
  const getAllCollaborators = useCallback(async (organizationId = null) => {
    setLoading(true);
    try {
      const userOrg = getUserOrganization();
      const orgId = organizationId || userOrg?.id;
      
      if (!orgId) {
        console.error('Aucune organisation trouvée');
        return { success: false, error: 'Aucune organisation trouvée' };
      }
      
      console.log('Récupération de tous les collaborateurs pour l\'organisation:', orgId);
      
      // Utiliser getFullOrganization pour récupérer membres et invitations
      const { data: fullOrg, error } = await organization.getFullOrganization({
        organizationId: orgId,
        membersLimit: 100,
      });

      if (error) {
        console.error("Erreur lors de la récupération de l'organisation complète:", error);
        return { success: false, error };
      }

      // Filtrer les membres pour exclure les owners
      const filteredMembers = (fullOrg?.members || []).filter(member => member.role !== 'owner');
      const invitations = fullOrg?.invitations || [];
      
      // Combiner membres et invitations avec un type pour les différencier
      const collaborators = [
        ...filteredMembers.map(member => ({ ...member, type: 'member' })),
        ...invitations.map(invitation => ({ ...invitation, type: 'invitation' }))
      ];
      
      console.log('Tous les collaborateurs (membres + invitations):', collaborators);
      return { success: true, data: collaborators };
    } catch (error) {
      console.error("Erreur lors de la récupération des collaborateurs:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [getUserOrganization]);

  return {
    // Actions
    inviteMember,
    listMembers,
    listInvitations,
    getAllCollaborators,
    removeMember,
    cancelInvitation,
    updateMemberRole,

    // États
    loading,
    inviting,
  };
};
