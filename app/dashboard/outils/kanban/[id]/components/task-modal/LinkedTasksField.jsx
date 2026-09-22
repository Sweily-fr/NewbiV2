"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Link2,
  Plus,
  X,
} from "lucide-react";
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
import {
  SEARCH_TASKS,
  GET_BOARDS_FOR_LINKING,
  LINK_TASK,
  UNLINK_TASK,
} from "@/src/graphql/kanbanQueries";

/**
 * Propriété « Tâches liées » de la modale de tâche.
 *
 * Lien purement informatif et symétrique : lier A à B lie aussi B à A (posé
 * côté serveur). Les tâches liées peuvent être sur un autre tableau du
 * workspace ; un clic sur une pastille ouvre la tâche (même tableau) ou
 * navigue vers son tableau (`onOpenTask`).
 *
 * Le sélecteur fonctionne par étapes pour ne jamais lister toutes les tâches
 * d'un coup : tableau (le courant par défaut) → colonne (l'étape) → tâches de
 * cette colonne, avec une recherche limitée à l'étape choisie.
 *
 * - Mode édition : chaque ajout/retrait part immédiatement en mutation
 *   dédiée (pas via l'auto-save, pour ne pas renvoyer une liste périmée).
 * - Mode création : la liste reste locale et part avec createTask
 *   (`linkedTaskIds`).
 *
 * `layout` : "row" = ligne de la grille des propriétés (label à gauche),
 * "stacked" = label au-dessus (mobile).
 */
export function LinkedTasksField({
  taskId = null,
  boardId,
  boardTitle = "",
  columns = [],
  workspaceId,
  linkedTasks = [],
  onChange,
  onOpenTask,
  isEditing = false,
  disabled = false,
  layout = "row",
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [linkTask] = useMutation(LINK_TASK);
  const [unlinkTask] = useMutation(UNLINK_TASK);

  const linkedIds = useMemo(
    () => new Set((linkedTasks || []).map((t) => t.id)),
    [linkedTasks],
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
        const serverList = isLinked
          ? result?.unlinkTask?.linkedTasks
          : result?.linkTask?.linkedTasks;
        if (Array.isArray(serverList)) onChange?.(serverList);
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
    ],
  );

  const hasLinks = (linkedTasks || []).length > 0;

  const trigger = disabled ? null : (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {hasLinks ? (
          <button
            type="button"
            aria-label="Lier une autre tâche"
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors bg-transparent border-0 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span
            className="text-sm px-3 py-1 rounded-md hover:bg-muted/60 transition-colors cursor-pointer"
            style={{ color: "#8D8D8D" }}
          >
            Lier une tâche
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        side="bottom"
        align="start"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {open && (
          <LinkedTaskPicker
            taskId={taskId}
            currentBoard={{ id: boardId, title: boardTitle, columns }}
            workspaceId={workspaceId}
            linkedIds={linkedIds}
            onToggle={handleToggle}
          />
        )}
      </PopoverContent>
    </Popover>
  );

  // Au-delà de quelques liens, la ligne de propriété enflerait et pousserait
  // la description : on replie le surplus derrière un « +N » dépliable.
  const VISIBLE_CHIPS = 4;
  const all = linkedTasks || [];
  const hidden = expanded ? 0 : Math.max(0, all.length - VISIBLE_CHIPS);
  const shown = hidden > 0 ? all.slice(0, VISIBLE_CHIPS) : all;

  const value = (
    <div className="flex flex-wrap items-center gap-1 min-w-0">
      {shown.map((task) => (
        <LinkedTaskChip
          key={task.id}
          task={task}
          isOtherBoard={!!task.boardId && task.boardId !== boardId}
          onOpen={isEditing && onOpenTask ? () => onOpenTask(task) : null}
          onRemove={disabled ? null : () => handleToggle(task)}
        />
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          +{hidden}
        </button>
      )}
      {expanded && all.length > VISIBLE_CHIPS && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="px-1 text-xs text-muted-foreground/70 hover:text-foreground transition-colors bg-transparent border-0 cursor-pointer"
        >
          Réduire
        </button>
      )}
      {trigger}
      {disabled && !hasLinks && (
        <span className="text-sm px-3 py-1" style={{ color: "#8D8D8D" }}>
          Vide
        </span>
      )}
    </div>
  );

  if (layout === "stacked") {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-normal flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          Tâches liées
        </Label>
        {value}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 py-2.5">
      <Label
        className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2"
        style={{ color: "#8D8D8D" }}
      >
        <Link2 className="h-4 w-4" />
        Tâches liées
      </Label>
      <div className="flex-1 min-w-0">{value}</div>
    </div>
  );
}

// Couleur de colonne (#rgb ou #rrggbb) utilisée comme couleur de TEXTE : le
// titre d'une tâche liée prend la couleur de sa colonne, sans fond teinté.
//
// Les couleurs de colonne sont choisies pour des pastilles, pas pour du
// texte : un jaune clair devient illisible sur fond blanc, un bleu nuit sur
// fond sombre. On renvoie donc DEUX variantes, assombrie ou éclaircie selon
// la luminance, appliquées via des variables CSS (`--lt` / `--lt-dark`) pour
// que le thème bascule sans re-render. Retourne null si la couleur est
// illisible → style neutre.
const parseHex = (color) => {
  if (typeof color !== "string") return null;
  const hex = color.trim().replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

const toHex = (rgb) =>
  `#${rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;

const mix = (rgb, target, ratio) =>
  rgb.map((v, i) => v + (target[i] - v) * ratio);

// Luminance perçue (0 = noir, 1 = blanc)
const luminance = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

export const columnTextColors = (color) => {
  const rgb = parseHex(color);
  if (!rgb) return null;
  const l = luminance(rgb);
  // Thème clair : on assombrit les couleurs trop claires
  const light = l > 0.62 ? toHex(mix(rgb, [0, 0, 0], (l - 0.5) * 0.9)) : toHex(rgb);
  // Thème sombre : on éclaircit les couleurs trop sombres
  const dark =
    l < 0.45 ? toHex(mix(rgb, [255, 255, 255], (0.6 - l) * 0.85)) : toHex(rgb);
  return { light, dark };
};

const columnColors = (column) => columnTextColors(column?.color);
const cssColorVars = (colors) =>
  colors ? { "--lt": colors.light, "--lt-dark": colors.dark } : undefined;

// La modale de tâche est un Radix Dialog : react-remove-scroll pose un
// verrou de scroll sur le document et annule la molette pour tout ce qui est
// hors de la modale. Le popover étant rendu dans un portail (donc hors de la
// modale), ses listes ne défilaient pas. On arrête la propagation avant que
// le listener du document ne voie l'événement : le navigateur fait défiler
// normalement. Même mécanique que les autres sélecteurs du produit
// (client-combobox, category-search-select).
const stopScrollLock = {
  onWheel: (e) => e.stopPropagation(),
  onTouchMove: (e) => e.stopPropagation(),
};

function LinkedTaskChip({ task, isOtherBoard, onOpen, onRemove }) {
  const colors = columnTextColors(task.columnColor);
  const label = (
    <>
      <span
        className={cn(
          "truncate max-w-[10rem]",
          colors && "text-[color:var(--lt)] dark:text-[color:var(--lt-dark)]",
        )}
      >
        {task.title || "Sans titre"}
      </span>
      {isOtherBoard && task.boardTitle && (
        <span className="shrink-0 rounded bg-background/60 px-1 text-[10px] text-muted-foreground truncate max-w-[6rem]">
          {task.boardTitle}
        </span>
      )}
      {onOpen && (
        <ArrowUpRight className="h-3 w-3 shrink-0 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
      )}
    </>
  );
  const title = isOtherBoard
    ? `${task.title} · ${task.boardTitle || "autre tableau"}${
        task.columnTitle ? ` · ${task.columnTitle}` : ""
      }`
    : `${task.title}${task.columnTitle ? ` · ${task.columnTitle}` : ""}`;

  return (
    <span
      className="group inline-flex max-w-full items-center gap-0.5 rounded-md border border-border/60 bg-muted/40 pr-0.5 text-xs transition-colors hover:border-border"
      style={
        colors ? { "--lt": colors.light, "--lt-dark": colors.dark } : undefined
      }
    >
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          title={title}
          className="flex min-w-0 items-center gap-1 rounded-md py-0.5 pl-2 pr-1 bg-transparent border-0 cursor-pointer"
        >
          {label}
        </button>
      ) : (
        <span
          title={title}
          className="flex min-w-0 items-center gap-1 py-0.5 pl-2 pr-1"
        >
          {label}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Délier la tâche"
          className="shrink-0 rounded p-0.5 text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors bg-transparent border-0 cursor-pointer"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

/**
 * Sélecteur par étapes : tableau → colonne → tâches de la colonne.
 * S'ouvre directement sur les colonnes du tableau courant.
 */
function LinkedTaskPicker({
  taskId,
  currentBoard,
  workspaceId,
  linkedIds,
  onToggle,
}) {
  // Monté à chaque ouverture du popover : on repart toujours des colonnes
  // du tableau courant.
  const [step, setStep] = useState("column");
  const [board, setBoard] = useState(currentBoard);
  const [column, setColumn] = useState(null);

  // Tableaux + colonnes + nombre de tâches par colonne. Chargé dès
  // l'ouverture : le compteur n'est pas dans GET_BOARD (l'ajouter casserait
  // les écritures de cache faites par les subscriptions de colonnes).
  const { data: boardsData, loading: boardsLoading } = useQuery(
    GET_BOARDS_FOR_LINKING,
    {
      variables: { workspaceId },
      skip: !workspaceId,
      fetchPolicy: "cache-and-network",
    },
  );

  const { data: tasksData, loading: tasksLoading } = useQuery(SEARCH_TASKS, {
    variables: {
      boardId: board?.id,
      columnId: column?.id,
      excludeTaskId: taskId,
      limit: 200,
      workspaceId,
    },
    skip: step !== "tasks" || !column?.id || !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  const boards = useMemo(() => {
    const list = boardsData?.boards || [];
    // Le tableau courant en premier
    return [...list].sort((a, b) =>
      a.id === currentBoard?.id ? -1 : b.id === currentBoard?.id ? 1 : 0,
    );
  }, [boardsData?.boards, currentBoard?.id]);

  // Colonnes du tableau affiché : celles de la requête (avec compteur) dès
  // qu'elles sont là, sinon celles déjà connues du tableau courant pour que
  // la liste s'affiche tout de suite.
  const sortedColumns = useMemo(() => {
    const fetched = (boardsData?.boards || []).find((b) => b.id === board?.id);
    const list = fetched?.columns?.length ? fetched.columns : board?.columns;
    return [...(list || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [boardsData?.boards, board?.id, board?.columns]);

  const tasks = tasksData?.searchTasks || [];
  const isCurrentBoard = board?.id === currentBoard?.id;

  if (step === "board") {
    return (
      <div>
        <PickerHeader
          onBack={() => setStep("column")}
          backLabel="Étapes"
          title="Choisir un tableau"
        />
        <div className="max-h-72 overflow-y-auto p-1.5" {...stopScrollLock}>
          {boardsLoading && boards.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground/70">
              Chargement des tableaux...
            </p>
          )}
          {boards.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setBoard(b);
                setColumn(null);
                setStep("column");
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer text-left bg-transparent border-0"
            >
              {b.emoji && <span className="text-sm">{b.emoji}</span>}
              <span className="flex-1 min-w-0 truncate text-sm">
                {b.title}
              </span>
              {b.id === currentBoard?.id && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  ce tableau
                </span>
              )}
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "column") {
    return (
      <div>
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
          <span className="min-w-0 truncate text-xs text-muted-foreground">
            {isCurrentBoard ? "Ce tableau" : board?.title || "Tableau"}
          </span>
          <button
            type="button"
            onClick={() => setStep("board")}
            className="shrink-0 text-xs text-[#5A50FF] hover:underline bg-transparent border-0 p-0 cursor-pointer"
          >
            Autre tableau
          </button>
        </div>
        <div className="px-2 pt-2 pb-0.5">
          <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
            Choisir une étape
          </span>
        </div>
        <div
          className="max-h-72 overflow-y-auto p-1.5 pt-0.5"
          {...stopScrollLock}
        >
          {sortedColumns.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground/70">
              Aucune colonne sur ce tableau
            </p>
          )}
          {sortedColumns.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setColumn(c);
                setStep("tasks");
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer text-left bg-transparent border-0"
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: c.color || "#8D8D8D" }}
              />
              <span
                className={cn(
                  "flex-1 min-w-0 truncate text-sm font-medium",
                  columnColors(c) &&
                    "text-[color:var(--lt)] dark:text-[color:var(--lt-dark)]",
                )}
                style={cssColorVars(columnColors(c))}
              >
                {c.title}
              </span>
              {typeof c.taskCount === "number" && (
                <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground tabular-nums">
                  {c.taskCount}
                </span>
              )}
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // step === "tasks" : les tâches de l'étape, filtrées localement
  return (
    <Command>
      <PickerHeader
        onBack={() => {
          setColumn(null);
          setStep("column");
        }}
        backLabel="Étapes"
        title={column?.title || ""}
        color={column?.color}
      />
      <CommandInput placeholder="Rechercher dans cette étape..." />
      <CommandList className="max-h-64" {...stopScrollLock}>
        {tasksLoading && tasks.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground/70">
            Chargement des tâches...
          </div>
        ) : (
          <CommandEmpty>Aucune tâche dans cette étape</CommandEmpty>
        )}
        {tasks.length > 0 && (
          <CommandGroup>
            {tasks.map((task) => {
              const isLinked = linkedIds.has(task.id);
              return (
                <CommandItem
                  key={task.id}
                  value={task.id}
                  keywords={[task.title || ""]}
                  onSelect={() => onToggle(task)}
                  className="group flex items-center gap-2"
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
                      isLinked
                        ? "border-[#5A50FF] bg-[#5A50FF] text-white"
                        : "border-input/70 group-hover:border-input",
                    )}
                  >
                    {isLinked && <Check className="h-3 w-3" />}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-sm">
                    {task.title || "Sans titre"}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}

function PickerHeader({ onBack, backLabel, title, color }) {
  return (
    <div className="flex items-center gap-2 border-b px-2 py-2">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground bg-transparent border-0 p-0 cursor-pointer shrink-0"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {backLabel}
      </button>
      <span className="text-muted-foreground/40 text-xs">/</span>
      {color && (
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="min-w-0 truncate text-sm font-medium">{title}</span>
    </div>
  );
}
