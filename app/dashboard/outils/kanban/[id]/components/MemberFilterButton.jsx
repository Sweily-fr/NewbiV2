import React from 'react';
import { Users, X } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { UserAvatar } from '@/src/components/ui/user-avatar';
import { Badge } from '@/src/components/ui/badge';

/**
 * Composant pour filtrer les tâches par utilisateur assigné
 */
export function MemberFilterButton({ members = [], selectedMemberId, onMemberChange, loading }) {
  const selectedMember = members.find(m => m.id === selectedMemberId);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          {selectedMember ? (
            <div className="flex items-center gap-2">
              <UserAvatar 
                src={selectedMember.image} 
                name={selectedMember.name} 
                size="xs"
              />
              <span className="text-xs">{selectedMember.name}</span>
            </div>
          ) : (
            <span className="text-xs">Filtrer par utilisateur</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-3 border-b">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Filtrer par utilisateur
          </h4>
        </div>

        <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
          {/* Bouton pour réinitialiser le filtre */}
          <button
            onClick={() => onMemberChange(null)}
            className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors ${
              !selectedMemberId ? 'bg-accent' : ''
            }`}
          >
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <X className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">Tous les utilisateurs</div>
            </div>
          </button>

          {/* Liste des membres */}
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Chargement des membres...
            </div>
          ) : members.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucun membre
            </div>
          ) : (
            members.map((member) => (
              <button
                key={member.id}
                onClick={() => onMemberChange(member.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors ${
                  selectedMemberId === member.id ? 'bg-accent' : ''
                }`}
              >
                <UserAvatar 
                  src={member.image} 
                  name={member.name} 
                  size="sm"
                />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{member.name}</div>
                  <div className="text-xs text-muted-foreground">{member.email}</div>
                </div>
                {selectedMemberId === member.id && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
