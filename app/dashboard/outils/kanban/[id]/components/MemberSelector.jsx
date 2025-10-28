import React, { useState, useEffect } from 'react';
import { Users, X, Plus, Check } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { UserAvatar } from '@/src/components/ui/user-avatar';
import { Badge } from '@/src/components/ui/badge';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { useSession } from '@/src/lib/auth-client';
import { GET_ORGANIZATION_MEMBERS } from '@/src/graphql/kanbanQueries';
import { useWorkspace } from '@/src/hooks/useWorkspace';
import { useAssignedMembersInfo } from '@/src/hooks/useAssignedMembersInfo';

/**
 * Composant pour sélectionner les membres assignés à une tâche
 */
export function MemberSelector({ workspaceId, selectedMembers = [], onMembersChange }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState([]);
  
  const { data: session } = useSession();
  const { workspaceId: contextWorkspaceId } = useWorkspace();
  
  const currentUser = session?.user;
  const finalWorkspaceId = workspaceId || contextWorkspaceId;

  // Récupérer les membres de l'organisation directement via GraphQL
  const { data, loading, error } = useQuery(GET_ORGANIZATION_MEMBERS, {
    variables: { workspaceId: finalWorkspaceId },
    skip: !finalWorkspaceId,
  });

  // Récupérer les infos complètes des membres sélectionnés
  const { members: selectedMembersInfo } = useAssignedMembersInfo(selectedMembers);

  // Traiter les données GraphQL des membres du workspace
  useEffect(() => {
    if (data?.organizationMembers) {
      const formattedMembers = data.organizationMembers.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        image: member.image || null,
        role: member.role,
      }));
      setMembers(formattedMembers);
    } else {
      setMembers([]);
    }
  }, [data]);

  // Vérifier si un membre est sélectionné
  const isMemberSelected = (memberId) => {
    return selectedMembers.includes(memberId);
  };

  // Ajouter ou retirer un membre
  const toggleMember = (member) => {
    const isSelected = isMemberSelected(member.id);
    
    if (isSelected) {
      // Retirer le membre
      onMembersChange(selectedMembers.filter(id => id !== member.id));
    } else {
      // Ajouter seulement l'ID du membre
      onMembersChange([...selectedMembers, member.id]);
    }
  };

  const removeMember = (memberId, e) => {
    e.stopPropagation();
    onMembersChange(selectedMembers.filter(id => id !== memberId));
  };

  const handleWheel = (e) => {
    // Permettre le scroll avec la molette/trackpad
    e.stopPropagation();
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Membres</Label>
      
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMembersInfo.map((member) => {
            const isCurrentUserMember = currentUser && member.id === currentUser.id;
            
            return (
              <Badge
                key={member.id}
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
                  onClick={(e) => removeMember(member.id, e)}
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
          
          <div 
            className="h-[240px] overflow-y-scroll overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            onWheel={handleWheel}
            style={{
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
            }}
          >
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
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
