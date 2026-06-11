"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Check, Plus, Users, RotateCcw, Lock } from "lucide-react";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Input } from "@/src/components/ui/input";
import { toast } from "@/src/components/ui/sonner";
import { useSession } from "@/src/lib/auth-client";
import {
  GET_BOARDS,
  GET_ORGANIZATION_MEMBERS,
  UPDATE_BOARD,
} from "@/src/graphql/kanbanQueries";

/**
 * Popover pour gérer l'accès au board (vue liste Kanban).
 *
 * Règle :
 * - board.boardMembers vide  → tout le workspace a accès (défaut)
 * - board.boardMembers rempli → seuls le propriétaire + les ids listés ont accès
 *
 * Le composant est défensif : la liste des membres workspace est pré-chargée
 * dès le montage, on ne dépend pas du contenu de board.members (qui peut être
 * filtré ou stale dans la cache).
 */
export function BoardMembersPopover({
  board,
  workspaceId,
  triggerClassName = "",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ? String(session.user.id) : null;

  // Pré-charger la liste des membres workspace dès que possible — pas seulement
  // à l'ouverture du popover — pour que les checkboxes soient correctes
  // instantanément quand l'utilisateur l'ouvre.
  const { data, loading: loadingMembers } = useQuery(GET_ORGANIZATION_MEMBERS, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-first",
  });

  const [updateBoard, { loading: saving }] = useMutation(UPDATE_BOARD, {
    refetchQueries: [{ query: GET_BOARDS, variables: { workspaceId } }],
    awaitRefetchQueries: false,
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const orgMembers = data?.organizationMembers || [];
  const ownerId = board?.userId ? String(board.userId) : null;
  // Seul le créateur peut modifier la liste d'accès
  const canEdit = !!ownerId && !!currentUserId && ownerId === currentUserId;

  // Liste explicite enregistrée côté serveur. Filtrer les valeurs falsy pour
  // éviter qu'un null isolé fasse passer la board en "mode restreint".
  const rawAssigned = (board?.boardMembers || [])
    .map((id) => (id ? String(id) : null))
    .filter(Boolean);
  const hasRestriction = rawAssigned.length > 0;
  const assignedIds = new Set(rawAssigned);

  // IDs des membres workspace hors propriétaire (utilisé pour basculer entre
  // les modes "tous" / "spécifiques")
  const allNonOwnerIds = orgMembers
    .map((m) => String(m.id))
    .filter((id) => id !== ownerId);

  // Le créateur du tableau est affiché à part (toujours inclus, jamais
  // décochable) — on le retire de la liste togglable pour ne pas laisser
  // croire qu'il peut être retiré.
  const creator = ownerId
    ? orgMembers.find((m) => String(m.id) === ownerId)
    : null;

  const filtered = orgMembers
    .filter((m) => String(m.id) !== ownerId)
    .filter((m) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        (m.name || "").toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q)
      );
    });

  const memberHasAccess = (memberId) => {
    if (ownerId && memberId === ownerId) return true; // créateur toujours inclus
    if (!hasRestriction) return true; // mode par défaut = tout le monde
    return assignedIds.has(memberId);
  };

  const saveMembers = async (nextIds) => {
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
    if (!canEdit) return; // seul le créateur peut modifier
    if (saving) return;
    if (ownerId && memberId === ownerId) return; // créateur toujours inclus
    // Si la liste des membres workspace n'est pas encore chargée, on ne peut
    // pas calculer correctement le diff → ne rien faire (le clic réessayera
    // une fois les données arrivées).
    if (allNonOwnerIds.length === 0) return;

    let nextSelected;
    if (!hasRestriction) {
      // On part de "tout le monde". Décocher → mode liste explicite avec
      // tous les autres (sauf le créateur).
      nextSelected = new Set(allNonOwnerIds);
      nextSelected.delete(memberId);
    } else {
      nextSelected = new Set(assignedIds);
      if (nextSelected.has(memberId)) nextSelected.delete(memberId);
      else nextSelected.add(memberId);
    }

    // Si la sélection couvre tous les non-créateurs, on remet à [] pour
    // repasser sur le défaut "tout le monde".
    const coversEveryone = allNonOwnerIds.every((id) => nextSelected.has(id));

    let toSave;
    if (coversEveryone) {
      toSave = [];
    } else if (nextSelected.size === 0 && ownerId) {
      // En mode restreint, si on décoche tout le monde, on garde au moins
      // le créateur dans la liste pour rester en mode restreint (sinon []
      // retomberait sur "tout le monde a accès").
      toSave = [ownerId];
    } else {
      toSave = Array.from(nextSelected);
    }

    await saveMembers(toSave);
  };

  const handleResetToAll = () => {
    if (!canEdit) return;
    if (!hasRestriction || saving) return;
    saveMembers([]);
  };

  // Avatars affichés dans le trigger.
  // Préfère board.members (filtré côté serveur) ; si vide ou non chargé,
  // fallback sur orgMembers pour ne jamais montrer un trigger "vide".
  const triggerMembers =
    board?.members && board.members.length > 0
      ? board.members
      : !hasRestriction
        ? orgMembers
        : [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={`flex items-center cursor-pointer rounded-md hover:bg-muted/50 transition-colors px-1 py-0.5 ${triggerClassName}`}
          title="Gérer l'accès"
        >
          {triggerMembers.length === 0 ? (
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground hover:text-foreground hover:border-foreground/60">
              <Plus className="h-3 w-3" />
            </span>
          ) : (
            <div className="flex items-center -space-x-1.5">
              {triggerMembers.slice(0, 3).map((m) => (
                <UserAvatar
                  key={m.userId || m.id}
                  src={m.image}
                  name={m.name || m.email}
                  size="xs"
                  className="h-6 w-6 ring-2 ring-background"
                />
              ))}
              {triggerMembers.length > 3 && (
                <span className="h-6 w-6 rounded-full bg-muted text-[10px] font-normal flex items-center justify-center text-muted-foreground ring-2 ring-background">
                  +{triggerMembers.length - 3}
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
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Accès au tableau</span>
            </div>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                hasRestriction
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {hasRestriction ? "Restreint" : "Tout le workspace"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">
            {hasRestriction
              ? "Seuls les membres cochés voient ce tableau."
              : "Tous les membres du workspace voient ce tableau par défaut."}
          </p>
          {!canEdit && (
            <div className="mb-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/40 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" />
              Lecture seule — seul le créateur peut modifier
            </div>
          )}
          <Input
            placeholder="Rechercher un membre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs"
          />
          {hasRestriction && canEdit && (
            <button
              type="button"
              onClick={handleResetToAll}
              disabled={saving}
              className="mt-2 w-full flex items-center justify-center gap-1.5 text-[11px] text-[#5b50FF] hover:text-[#5b50FF]/80 transition-colors py-1 rounded-md hover:bg-muted/40 disabled:opacity-40"
            >
              <RotateCcw className="h-3 w-3" />
              Repasser sur "tout le workspace"
            </button>
          )}
        </div>
        {creator && (
          <div className="px-3 py-2 bg-muted/30 border-b border-border/50 flex items-center gap-2">
            <UserAvatar
              src={creator.image}
              name={creator.name || creator.email}
              size="xs"
              className="h-6 w-6 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">
                {creator.name || creator.email}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Créateur du tableau
              </div>
            </div>
          </div>
        )}
        <div className="max-h-[280px] overflow-y-auto p-1">
          {loadingMembers && orgMembers.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Chargement...
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Aucun autre membre dans le workspace
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
                  disabled={isOwner || saving || !canEdit}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-left ${
                    !canEdit
                      ? "cursor-default"
                      : isOwner
                        ? "opacity-100 cursor-default"
                        : "cursor-pointer hover:bg-accent/50"
                  }`}
                  title={
                    !canEdit
                      ? "Seul le créateur du tableau peut modifier l'accès"
                      : isOwner
                        ? "Créateur du tableau (toujours inclus)"
                        : undefined
                  }
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
                          (créateur)
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
                        : "border-muted-foreground/40 bg-background"
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
