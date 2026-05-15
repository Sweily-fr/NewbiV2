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
  GET_BOARDS,
  GET_ORGANIZATION_MEMBERS,
  UPDATE_BOARD,
} from "@/src/graphql/kanbanQueries";

/**
 * Popover pour gérer les membres d'un board (vue liste Kanban).
 *
 * Règle d'accès :
 * - board.members vide → tout le workspace voit le board (par défaut)
 * - board.members rempli → seuls les userIds listés + le propriétaire voient
 *
 * UX :
 * - Tous les membres workspace sont affichés et cochés par défaut.
 * - Décocher quelqu'un fait basculer en mode "liste explicite" : on enregistre
 *   tous les autres (non-propriétaire) dans board.members.
 * - Si l'utilisateur recoche tout le monde, on remet board.members à [] pour
 *   repasser sur le défaut "tout le monde".
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
    // Refetcher la liste des boards pour s'assurer que la colonne Membres
    // (et les filtres d'accès) reflètent immédiatement la mise à jour, même
    // si la subscription BOARD_UPDATED arrive après ou avec un payload
    // partiel.
    refetchQueries: [{ query: GET_BOARDS, variables: { workspaceId } }],
    awaitRefetchQueries: false,
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const orgMembers = data?.organizationMembers || [];
  const ownerId = board?.userId ? String(board.userId) : null;
  const rawAssigned = (board?.boardMembers || []).map((id) => String(id));
  const hasRestriction = rawAssigned.length > 0;
  const assignedIds = new Set(rawAssigned);

  const filtered = orgMembers.filter((m) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (m.name || "").toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q)
    );
  });

  // Un membre est considéré comme ayant accès si :
  // - aucune restriction (par défaut tout le monde), ou
  // - il est dans la liste explicite, ou
  // - il est le propriétaire (toujours inclus)
  const memberHasAccess = (memberId) => {
    if (ownerId && memberId === ownerId) return true;
    if (!hasRestriction) return true;
    return assignedIds.has(memberId);
  };

  // IDs des membres workspace hors propriétaire
  const allNonOwnerIds = orgMembers
    .map((m) => String(m.id))
    .filter((id) => id !== ownerId);

  const saveMembers = async (nextIds) => {
    // Liste optimiste des membres affichés après la mise à jour : si plus
    // aucune restriction → tous les membres du workspace, sinon le
    // propriétaire + les ids explicitement listés.
    const allowedSet = new Set(
      nextIds.length === 0
        ? orgMembers.map((m) => String(m.id))
        : [ownerId, ...nextIds].filter(Boolean),
    );
    const optimisticMembersList = orgMembers
      .filter((m) => allowedSet.has(String(m.id)))
      .map((m) => ({
        __typename: "OrganizationMember",
        id: String(m.id),
        userId: String(m.id),
        name: m.name || m.email || "",
        email: m.email || "",
        image: m.image || null,
      }));

    try {
      await updateBoard({
        variables: {
          input: {
            id: board.id,
            boardMembers: nextIds,
          },
          workspaceId,
        },
        optimisticResponse: {
          updateBoard: {
            __typename: "Board",
            id: board.id,
            title: board.title,
            description: board.description ?? null,
            clientId: board.clientId ?? null,
            client: board.client ?? null,
            columns: board.columns ?? [],
            priority: board.priority ?? null,
            dueDate: board.dueDate ?? null,
            boardMembers: nextIds,
            members: optimisticMembersList,
            totalBillableAmount: board.totalBillableAmount ?? null,
            category: board.category ?? null,
            color: board.color ?? null,
            emoji: board.emoji ?? null,
            status: board.status ?? null,
            createdAt: board.createdAt,
            updatedAt: new Date().toISOString(),
          },
        },
      });
    } catch (err) {
      // géré par onError
    }
  };

  const toggleMember = async (memberId) => {
    if (saving) return;
    if (ownerId && memberId === ownerId) return; // owner toujours inclus

    let nextSelected;
    if (!hasRestriction) {
      // On part du défaut "tout le monde". Décocher quelqu'un fait passer en
      // mode liste explicite avec tous les autres (sauf le propriétaire).
      nextSelected = new Set(allNonOwnerIds);
      nextSelected.delete(memberId);
    } else {
      nextSelected = new Set(assignedIds);
      if (nextSelected.has(memberId)) nextSelected.delete(memberId);
      else nextSelected.add(memberId);
    }

    // Si la sélection couvre désormais tous les non-propriétaires, on remet
    // à [] pour repasser sur le défaut "tout le monde".
    const coversEveryone =
      allNonOwnerIds.length > 0 &&
      allNonOwnerIds.every((id) => nextSelected.has(id));

    await saveMembers(coversEveryone ? [] : Array.from(nextSelected));
  };

  // Avatars affichés dans le trigger (= membres ayant accès)
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
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Accès au tableau</span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">
            {hasRestriction
              ? "Accès restreint aux membres cochés."
              : "Visible par défaut pour tout le workspace."}
          </p>
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
              const hasAccess = memberHasAccess(memberId);
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
                      hasAccess
                        ? "bg-primary border-primary text-white"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {hasAccess && <Check className="h-3 w-3" />}
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
