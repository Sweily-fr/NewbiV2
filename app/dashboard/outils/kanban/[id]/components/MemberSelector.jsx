import React, { useState, useEffect } from 'react';
import { Users, X, Plus, Check } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { useOrganizationInvitations } from '@/src/hooks/useOrganizationInvitations';

/**
 * Composant pour sélectionner les membres assignés à une tâche
 */
export function MemberSelector({ workspaceId, selectedMembers = [], onMembersChange }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { getAllCollaborators } = useOrganizationInvitations();

  console.log('🔍 [MemberSelector] workspaceId:', workspaceId);

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
            .map(item => ({
              id: item.user?.id || item.id,
              name: item.user?.name || item.name || item.user?.email?.split('@')[0] || 'Utilisateur',
              email: item.user?.email || item.email,
              image: item.user?.image || item.user?.avatar || item.avatar || null,
              role: item.role,
            }));
          
          console.log('👥 [MemberSelector] Membres formatés:', formattedMembers);
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
    if (isMemberSelected(member.id)) {
      // Retirer le membre
      onMembersChange(selectedMembers.filter(m => m.userId !== member.id));
    } else {
      // Ajouter le membre (utiliser la même structure que Better Auth)
      onMembersChange([
        ...selectedMembers,
        {
          userId: member.id,
          name: member.name,
          email: member.email,
          image: member.image,
        },
      ]);
    }
  };

  // Retirer un membre depuis les badges
  const removeMember = (memberId, e) => {
    e.stopPropagation();
    onMembersChange(selectedMembers.filter(m => m.userId !== memberId));
  };

  // Obtenir les initiales d'un nom
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Membres</Label>
      
      {/* Membres sélectionnés */}
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMembers.map((member) => (
            <Badge
              key={member.userId}
              variant="secondary"
              className="flex items-center gap-1.5 pl-1 pr-2 py-1"
            >
              <Avatar className="h-5 w-5">
                <AvatarImage src={member.image} alt={member.name} />
                <AvatarFallback className="text-[10px]">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">{member.name}</span>
              <button
                onClick={(e) => removeMember(member.userId, e)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
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
                  return (
                    <button
                      key={member.id}
                      onClick={() => toggleMember(member)}
                      className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors ${
                        isSelected ? 'bg-accent' : ''
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.image} alt={member.name} />
                        <AvatarFallback className="text-xs">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{member.name}</div>
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
