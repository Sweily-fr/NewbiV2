import React, { useState, useEffect } from 'react';
import { Users, X, Plus, Check } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { UserAvatar } from '@/src/components/ui/user-avatar';
import { Badge } from '@/src/components/ui/badge';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { useOrganizationInvitations } from '@/src/hooks/useOrganizationInvitations';
import { useSession } from '@/src/lib/auth-client';

/**
 * Composant pour sélectionner les membres assignés à une tâche
 */
export function MemberSelector({ workspaceId, selectedMembers = [], onMembersChange }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { getAllCollaborators } = useOrganizationInvitations();
  const { data: session } = useSession();
  
  const currentUser = session?.user;

  console.log('🔍 [MemberSelector] workspaceId:', workspaceId);
  console.log('👤 [MemberSelector] Current user:', {
    id: currentUser?.id,
    email: currentUser?.email,
    name: currentUser?.name
  });

  // Récupérer les membres de l'organisation via Better Auth (comme espaces-section)
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const result = await getAllCollaborators(workspaceId);

        if (result.success) {
          console.log('✅ [MemberSelector] Membres récupérés:', result.data.length);
          
          // Formatter les membres (seulement les membres actifs, pas les invitations)
          const formattedMembers = result.data
            .filter(item => item.type === 'member') // Seulement les membres actifs
            .map(item => {
              const member = {
                id: item.user?.id || item.id,
                name: item.user?.name || item.name || item.user?.email?.split('@')[0] || 'Utilisateur',
                email: item.user?.email || item.email,
                image: item.user?.image || item.user?.avatar || item.avatar || null,
                role: item.role,
              };
              
              console.log('👤 [MemberSelector] Membre formaté:', {
                name: member.name,
                hasImage: !!member.image,
                imageUrl: member.image,
                rawData: item
              });
              
              return member;
            });
          
          console.log('👥 [MemberSelector] Membres formatés:', formattedMembers);
          
          // Ajouter l'utilisateur connecté s'il n'est pas dans la liste
          const currentUserInList = formattedMembers.some(m => 
            m.id === currentUser?.id || m.email === currentUser?.email
          );
          
          console.log('🔍 [MemberSelector] Utilisateur dans la liste?', {
            currentUserInList,
            currentUserId: currentUser?.id,
            currentUserEmail: currentUser?.email,
            membersIds: formattedMembers.map(m => m.id),
            membersEmails: formattedMembers.map(m => m.email)
          });
          
          if (currentUser && !currentUserInList) {
            console.log('➕ [MemberSelector] Ajout de l\'utilisateur connecté à la liste');
            formattedMembers.unshift({
              id: currentUser.id,
              name: currentUser.name || currentUser.email?.split('@')[0] || 'Moi',
              email: currentUser.email,
              image: currentUser.image || currentUser.avatar || null,
              role: 'owner', // L'utilisateur connecté est au moins membre
            });
          }
          
          setMembers(formattedMembers);
        } else {
          console.error('❌ [MemberSelector] Erreur:', result.error);
          setMembers([]);
        }
      } catch (error) {
        console.error('❌ [MemberSelector] Exception:', error);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]); // Retirer getAllCollaborators des dépendances pour éviter la boucle
  
  console.log('📋 [MemberSelector] Membres:', members.length, 'Loading:', loading);

  // Vérifier si un membre est sélectionné
  const isMemberSelected = (memberId) => {
    return selectedMembers.some(m => m.userId === memberId);
  };

  // Ajouter ou retirer un membre
  const toggleMember = (member) => {
    const isSelected = isMemberSelected(member.id);
    
    console.log('🔄 [MemberSelector] Toggle member:', {
      member,
      isSelected,
      hasImage: !!member.image,
      imageUrl: member.image
    });
    
    if (isSelected) {
      // Retirer le membre
      onMembersChange(selectedMembers.filter(m => m.userId !== member.id));
    } else {
      // Ajouter le membre avec l'image
      const newMember = {
        userId: member.id,
        name: member.name,
        email: member.email,
        image: member.image || null,
      };
      
      console.log('➕ [MemberSelector] Ajout membre:', newMember);
      
      onMembersChange([
        ...selectedMembers,
        newMember,
      ]);
    }
  };

  const removeMember = (memberId, e) => {
    e.stopPropagation();
    onMembersChange(selectedMembers.filter(m => m.userId !== memberId));
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Membres</Label>
      
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMembers.map((member) => {
            const isCurrentUserMember = currentUser && member.userId === currentUser.id;
            
            return (
              <Badge
                key={member.userId}
                variant="secondary"
                className="flex items-center gap-1.5 pl-1 pr-2 py-1"
              >
                <UserAvatar 
                  src={member.image} 
                  name={member.name} 
                  size="xs"
                />
                <span className="text-xs">
                  {member.name}
                  {isCurrentUserMember && (
                    <span className="text-muted-foreground ml-1">(Moi)</span>
                  )}
                </span>
                <button
                  onClick={(e) => removeMember(member.userId, e)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Bouton pour ajouter des membres */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-muted-foreground"
          >
            <Plus className="mr-2 h-4 w-4" />
            {selectedMembers.length === 0
              ? 'Ajouter des membres'
              : 'Ajouter d\'autres membres'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Membres de l'organisation
            </h4>
          </div>
          
          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Chargement des membres...
              </div>
            ) : members.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Aucun membre dans cette organisation
              </div>
            ) : (
              <div className="p-2">
                {members.map((member) => {
                  const isSelected = isMemberSelected(member.id);
                  const isCurrentUserMember = currentUser && member.id === currentUser.id;
                  
                  // Debug: Comparer les IDs
                  if (member.email === currentUser?.email) {
                    console.log('🔍 [MemberSelector] Comparaison IDs pour:', member.name, {
                      memberId: member.id,
                      memberIdType: typeof member.id,
                      currentUserId: currentUser?.id,
                      currentUserIdType: typeof currentUser?.id,
                      isEqual: member.id === currentUser?.id,
                      emailMatch: member.email === currentUser?.email
                    });
                  }
                  
                  return (
                    <button
                      key={member.id}
                      onClick={() => toggleMember(member)}
                      className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors ${
                        isSelected ? 'bg-accent' : ''
                      }`}
                    >
                      <UserAvatar 
                        src={member.image} 
                        name={member.name} 
                        size="sm"
                      />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">
                          {member.name}
                          {isCurrentUserMember && (
                            <span className="text-muted-foreground ml-1">(Moi)</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.email}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
