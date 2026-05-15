"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Check, Plus, Users } from "lucide-react";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Input } from "@/src/components/ui/input";
import { toast } from "@/src/components/ui/sonner";
import {
  GET_ORGANIZATION_MEMBERS,
  UPDATE_BOARD,
} from "@/src/graphql/kanbanQueries";

/**
 * Popover pour gérer les membres d'un board (vue liste Kanban).
 * - Clic sur la stack d'avatars (ou le bouton +) ouvre le popover
 * - Coche/décoche les membres workspace à inclure
 * - Le propriétaire du board est toujours inclus (non décochable)
 */
export function BoardMembersPopover({
  board,
  workspaceId,
  triggerClassName = "",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data, loading: loadingMembers } = useQuery(GET_ORGANIZATION_MEMBERS, {
    variables: { workspaceId },
    skip: !open || !workspaceId,
    fetchPolicy: "cache-first",
  });

  const [updateBoard, { loading: saving }] = useMutation(UPDATE_BOARD, {
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const orgMembers = data?.organizationMembers || [];
  const ownerId = board?.userId ? String(board.userId) : null;
  const assignedIds = new Set(
    (board?.boardMembers || []).map((id) => String(id)),
  );

  const filtered = orgMembers.filter((m) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (m.name || "").toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q)
    );
  });

  const toggleMember = async (memberId) => {
    if (saving) return;
    if (ownerId && memberId === ownerId) return; // owner toujours inclus
    const next = new Set(assignedIds);
    if (next.has(memberId)) next.delete(memberId);
    else next.add(memberId);
    try {
      await updateBoard({
        variables: {
          input: {
            id: board.id,
            boardMembers: Array.from(next),
          },
          workspaceId,
        },
      });
    } catch (err) {
      // géré par onError
    }
  };

  // Liste des membres affichés (assignés + propriétaire)
  const displayedMembers = board?.members || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={`flex items-center cursor-pointer rounded-md hover:bg-muted/50 transition-colors px-1 py-0.5 ${triggerClassName}`}
          title="Gérer les membres"
        >
          {displayedMembers.length === 0 ? (
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground hover:text-foreground hover:border-foreground/60">
              <Plus className="h-3 w-3" />
            </span>
          ) : (
            <div className="flex items-center -space-x-1.5">
              {displayedMembers.slice(0, 3).map((m) => (
                <UserAvatar
                  key={m.userId || m.id}
                  src={m.image}
                  name={m.name || m.email}
                  size="xs"
                  className="h-6 w-6 ring-2 ring-background"
                />
              ))}
              {displayedMembers.length > 3 && (
                <span className="h-6 w-6 rounded-full bg-muted text-[10px] font-normal flex items-center justify-center text-muted-foreground ring-2 ring-background">
                  +{displayedMembers.length - 3}
                </span>
              )}
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-0"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 pt-3 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Membres du tableau</span>
          </div>
          <Input
            placeholder="Rechercher un membre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="max-h-[280px] overflow-y-auto p-1">
          {loadingMembers ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Chargement...
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Aucun membre
            </div>
          ) : (
            filtered.map((member) => {
              const memberId = String(member.id);
              const isOwner = ownerId === memberId;
              const isAssigned = isOwner || assignedIds.has(memberId);
              return (
                <button
                  key={memberId}
                  type="button"
                  onClick={() => toggleMember(memberId)}
                  disabled={isOwner || saving}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors text-left ${
                    isOwner ? "opacity-100 cursor-default" : "cursor-pointer"
                  }`}
                  title={isOwner ? "Propriétaire (toujours inclus)" : undefined}
                >
                  <UserAvatar
                    src={member.image}
                    name={member.name || member.email}
                    size="xs"
                    className="h-6 w-6"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">
                      {member.name || member.email}
                      {isOwner && (
                        <span className="ml-1 text-[10px] text-muted-foreground font-normal">
                          (propriétaire)
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {member.email}
                    </div>
                  </div>
                  <span
                    className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                      isAssigned
                        ? "bg-primary border-primary text-white"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {isAssigned && <Check className="h-3 w-3" />}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
