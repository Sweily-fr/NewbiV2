"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/src/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import { useAssignClientMembers } from "@/src/hooks/useClients";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function AssignMembersDialog({ open, onOpenChange, client }) {
  const { getAllCollaborators } = useOrganizationInvitations();
  const { assignClientMembers, loading: assigning } = useAssignClientMembers();

  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    const result = await getAllCollaborators();
    if (result.success) {
      // Only keep active members (not invitations)
      const activeMembers = result.data
        .filter((c) => c.type === "member")
        .map((m) => ({
          id: m.userId || m.id,
          name: m.user?.name || m.name || m.email,
          email: m.user?.email || m.email,
          image: m.user?.image || m.image || null,
          role: m.role,
        }));
      setMembers(activeMembers);
    }
    setLoadingMembers(false);
  }, [getAllCollaborators]);

  useEffect(() => {
    if (open) {
      fetchMembers();
      setSelectedIds(client?.assignedMembers || []);
    }
  }, [open, client?.assignedMembers, fetchMembers]);

  const toggleMember = (memberId) => {
    setSelectedIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSave = async () => {
    await assignClientMembers(client.id, selectedIds);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assigner des membres</DialogTitle>
          <DialogDescription>
            Sélectionnez les membres du workspace à assigner à ce contact.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[300px] overflow-y-auto -mx-1 px-1">
          {loadingMembers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun membre dans le workspace.
            </p>
          ) : (
            <div className="space-y-1">
              {members.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.includes(member.id)}
                    onCheckedChange={() => toggleMember(member.id)}
                  />
                  <Avatar className="size-7">
                    {member.image && <AvatarImage src={member.image} alt={member.name} />}
                    <AvatarFallback className="text-[10px]">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={assigning || loadingMembers}>
            {assigning && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
