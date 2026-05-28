"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/src/components/ui/avatar";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import { useAssignClientMembers } from "@/src/hooks/useClients";
import { useAssignedMembersInfo } from "@/src/hooks/useAssignedMembersInfo";

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
  const [selectedId, setSelectedId] = useState(null);

  const getAllCollaboratorsRef = useRef(getAllCollaborators);
  getAllCollaboratorsRef.current = getAllCollaborators;

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const fetchMembers = async () => {
      setLoadingMembers(true);
      const result = await getAllCollaboratorsRef.current();
      if (!cancelled && result.success) {
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
      if (!cancelled) setLoadingMembers(false);
    };

    fetchMembers();
    setSelectedId(client?.assignedMembers?.[0] || null);

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Enrichir avec usersInfo (même source que le kanban) pour les avatars
  const memberIds = useMemo(() => members.map((m) => m.id), [members]);
  const { members: usersInfo } = useAssignedMembersInfo(memberIds);
  const usersInfoById = useMemo(() => {
    const map = {};
    (usersInfo || []).forEach((u) => {
      if (u?.id) map[u.id] = u;
    });
    return map;
  }, [usersInfo]);

  const toggleMember = (memberId) => {
    setSelectedId((prev) => (prev === memberId ? null : memberId));
  };

  const handleSave = async () => {
    await assignClientMembers(client.id, selectedId ? [selectedId] : []);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assigner des membres</DialogTitle>
          <DialogDescription>
            Sélectionnez un membre du workspace à assigner à ce contact.
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
              {members.map((member) => {
                const isSelected = selectedId === member.id;
                const enriched = usersInfoById[member.id];
                const displayName = enriched?.name || member.name;
                const displayEmail = enriched?.email || member.email;
                const displayImage = enriched?.image || member.image;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMember(member.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors text-left",
                      isSelected
                        ? "bg-muted ring-1 ring-primary/30"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <Avatar className="size-7">
                      {displayImage && (
                        <AvatarImage src={displayImage} alt={displayName} />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {displayEmail}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={assigning || loadingMembers}>
            {assigning && (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            )}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
