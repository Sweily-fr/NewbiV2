"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Check, Link2, Plus, X } from "lucide-react";
import { Label } from "@/src/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import { toast } from "@/src/utils/debouncedToast";
import { cn } from "@/src/lib/utils";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import {
  SEARCH_TASKS,
  LINK_TASK,
  UNLINK_TASK,
} from "@/src/graphql/kanbanQueries";

/**
 * Section « Tâches liées » de la modale de tâche.
 *
 * Lien purement informatif et symétrique : lier A à B lie aussi B à A (posé
 * côté serveur). Les tâches liées peuvent être sur un autre tableau du
 * workspace ; un clic ouvre la tâche (même tableau) ou navigue vers son
 * tableau (`onOpenTask`).
 *
 * - Mode édition : chaque ajout/retrait part immédiatement en mutation
 *   dédiée (pas via l'auto-save, pour ne pas renvoyer une liste périmée).
 * - Mode création : la liste reste locale et part avec createTask
 *   (`linkedTaskIds`).
 */
export function LinkedTasksField({
  taskId = null,
  boardId,
  workspaceId,
  linkedTasks = [],
  onChange,
  onOpenTask,
  isEditing = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const { data, loading } = useQuery(SEARCH_TASKS, {
    variables: {
      search: debouncedSearch.trim(),
      boardId,
      excludeTaskId: taskId,
      limit: 30,
      workspaceId,
    },
    skip: !open || !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  const [linkTask] = useMutation(LINK_TASK);
  const [unlinkTask] = useMutation(UNLINK_TASK);

  const linkedIds = useMemo(
    () => new Set((linkedTasks || []).map((t) => t.id)),
    [linkedTasks],
  );

  // Résultats groupés : le tableau courant d'abord, puis les autres tableaux
  const groups = useMemo(() => {
    const results = data?.searchTasks || [];
    const byBoard = new Map();
    for (const task of results) {
      const key = task.boardId === boardId ? "__current" : task.boardId;
      if (!byBoard.has(key)) {
        byBoard.set(key, {
          key,
          heading:
            key === "__current"
              ? "Ce tableau"
              : task.boardTitle || "Autre tableau",
          tasks: [],
        });
      }
      byBoard.get(key).tasks.push(task);
    }
    const list = [...byBoard.values()];
    list.sort((a, b) =>
      a.key === "__current" ? -1 : b.key === "__current" ? 1 : 0,
    );
    return list;
  }, [data?.searchTasks, boardId]);

  const applyServerList = useCallback(
    (serverLinkedTasks) => {
      if (Array.isArray(serverLinkedTasks)) onChange?.(serverLinkedTasks);
    },
    [onChange],
  );

  const handleToggle = useCallback(
    async (task) => {
      if (disabled) return;
      const isLinked = linkedIds.has(task.id);
      const previous = linkedTasks || [];
      // Mise à jour optimiste : l'utilisateur voit le lien tout de suite
      const next = isLinked
        ? previous.filter((t) => t.id !== task.id)
        : [...previous, task];
      onChange?.(next);

      if (!isEditing || !taskId) return;
      try {
        const mutation = isLinked ? unlinkTask : linkTask;
        const { data: result } = await mutation({
          variables: { taskId, linkedTaskId: task.id, workspaceId },
        });
        applyServerList(
          isLinked
            ? result?.unlinkTask?.linkedTasks
            : result?.linkTask?.linkedTasks,
        );
      } catch (error) {
        onChange?.(previous);
        toast.error(
          isLinked
            ? "Impossible de délier la tâche"
            : "Impossible de lier la tâche",
          { description: error?.message },
        );
      }
    },
    [
      disabled,
      linkedIds,
      linkedTasks,
      onChange,
      isEditing,
      taskId,
      unlinkTask,
      linkTask,
      workspaceId,
      applyServerList,
    ],
  );

  const handleOpenChange = useCallback((nextOpen) => {
    setOpen(nextOpen);
    if (!nextOpen) setSearch("");
  }, []);

  const hasLinks = (linkedTasks || []).length > 0;

  return (
    <div className="space-y-2 mt-6">
      <Label className="text-sm font-normal flex items-center gap-2">
        <Link2 className="h-4 w-4 text-muted-foreground" />
        Tâches liées
        {hasLinks && (
          <span className="text-xs text-muted-foreground">
            ({linkedTasks.length})
          </span>
        )}
      </Label>

      {hasLinks && (
        <ul className="space-y-1">
          {linkedTasks.map((task) => (
            <LinkedTaskRow
              key={task.id}
              task={task}
              isOtherBoard={!!task.boardId && task.boardId !== boardId}
              onOpen={isEditing && onOpenTask ? () => onOpenTask(task) : null}
              onRemove={disabled ? null : () => handleToggle(task)}
            />
          ))}
        </ul>
      )}

      {!disabled && (
        <Popover modal={false} open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/70 hover:text-muted-foreground transition-colors bg-transparent border-0 p-0 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Lier une tâche
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-0"
            side="bottom"
            align="start"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {/* Le filtrage est fait côté serveur (tout le workspace) */}
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Rechercher une tâche..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList className="max-h-72">
                {!loading && groups.length === 0 && (
                  <CommandEmpty>
                    {debouncedSearch.trim()
                      ? "Aucune tâche trouvée"
                      : "Aucune autre tâche sur ce tableau"}
                  </CommandEmpty>
                )}
                {loading && groups.length === 0 && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Recherche...
                  </div>
                )}
                {groups.map((group) => (
                  <CommandGroup key={group.key} heading={group.heading}>
                    {group.tasks.map((task) => {
                      const isLinked = linkedIds.has(task.id);
                      return (
                        <CommandItem
                          key={task.id}
                          value={task.id}
                          onSelect={() => handleToggle(task)}
                          className="flex items-center gap-2"
                        >
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                              isLinked
                                ? "border-[#5A50FF] bg-[#5A50FF] text-white"
                                : "border-input",
                            )}
                          >
                            {isLinked && <Check className="h-3 w-3" />}
                          </span>
                          <span className="flex-1 min-w-0 truncate text-sm">
                            {task.title || "Sans titre"}
                          </span>
                          {task.columnTitle && (
                            <span className="text-[11px] text-muted-foreground shrink-0 truncate max-w-[6rem]">
                              {task.columnTitle}
                            </span>
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

function LinkedTaskRow({ task, isOtherBoard, onOpen, onRemove }) {
  const content = (
    <>
      <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 min-w-0 truncate text-sm">
        {task.title || "Sans titre"}
      </span>
      {isOtherBoard && task.boardTitle && (
        <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground truncate max-w-[8rem]">
          {task.boardTitle}
        </span>
      )}
      {task.columnTitle && (
        <span className="shrink-0 text-[11px] text-muted-foreground truncate max-w-[6rem]">
          {task.columnTitle}
        </span>
      )}
    </>
  );

  return (
    <li className="group flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 pr-1">
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          title={
            isOtherBoard
              ? `Ouvrir dans le tableau « ${task.boardTitle || ""} »`
              : "Ouvrir la tâche"
          }
          className="flex flex-1 min-w-0 items-center gap-2 px-2.5 py-1.5 text-left bg-transparent border-0 cursor-pointer rounded-md hover:bg-muted/60 transition-colors"
        >
          {content}
        </button>
      ) : (
        <div className="flex flex-1 min-w-0 items-center gap-2 px-2.5 py-1.5">
          {content}
        </div>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Délier la tâche"
          className="shrink-0 rounded-md p-1 text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors bg-transparent border-0 cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}
