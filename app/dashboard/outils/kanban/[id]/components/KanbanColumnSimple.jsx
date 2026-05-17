import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Plus,
  Edit,
  Pencil,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  Flag,
  CornerDownLeft,
  Search,
  Check,
  Settings,
  ChevronsDownUp,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/src/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Calendar as CalendarComponent } from "@/src/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TaskCard } from "./TaskCard";
import { TaskCardSkeleton } from "./TaskCardSkeleton";

// Styles pour le scrollbar personnalisé
const scrollbarStyles = `
  .kanban-column-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .kanban-column-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .kanban-column-scroll::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground) / 0.2);
    border-radius: 3px;
  }
  .kanban-column-scroll::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--muted-foreground) / 0.4);
  }
  .kanban-column-scroll {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--muted-foreground) / 0.2) transparent;
  }
`;

const PRIORITIES = [
  {
    value: "high",
    label: "Urgent",
    color: "text-red-500",
    fill: "fill-red-500",
  },
  {
    value: "medium",
    label: "Moyen",
    color: "text-yellow-500",
    fill: "fill-yellow-500",
  },
  {
    value: "low",
    label: "Faible",
    color: "text-green-500",
    fill: "fill-green-500",
  },
  { value: "", label: "Aucune", color: "text-gray-400", fill: "fill-gray-400" },
];

function InlineNewTask({
  columnId,
  boardId,
  members,
  createTask,
  workspaceId,
  onCancel,
  onEditTask,
}) {
  const [title, setTitle] = useState("");
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [dueDate, setDueDate] = useState(null);
  const [priority, setPriority] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fermer quand on clique à l'extérieur
  useEffect(() => {
    function handleClickOutside(e) {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        if (e.target.closest("[data-radix-popper-content-wrapper]")) return;
        if (cardRef.current.querySelector('[data-state="open"]')) return;
        onCancel();
      }
    }
    document.addEventListener("pointerdown", handleClickOutside, true);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside, true);
  }, [onCancel]);

  const handleSave = async (openAfter = false) => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const result = await createTask({
        variables: {
          input: {
            title: title.trim(),
            columnId,
            boardId,
            position: 0,
            assignedMembers,
            dueDate: dueDate ? dueDate.toISOString() : null,
            priority: priority || "",
            tags: [],
            checklist: [],
          },
          workspaceId,
        },
      });
      onCancel();
      if (openAfter && onEditTask && result?.data?.createTask) {
        onEditTask(result.data.createTask);
      }
    } catch (e) {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave(e.metaKey || e.ctrlKey);
    }
    if (e.key === "Escape") onCancel();
  };

  return (
    <div
      ref={cardRef}
      className="relative bg-card rounded-xl border border-[#4840D9] shadow-sm p-3 mb-1.5 sm:mb-2 space-y-1.5"
    >
      {/* Save button en haut à droite */}
      <Button
        size="sm"
        className="absolute top-2 right-2 h-7 px-3 text-xs gap-1 text-white"
        style={{ backgroundColor: "#4840D9" }}
        onClick={handleSave}
        disabled={!title.trim() || saving}
      >
        Créer <CornerDownLeft className="h-3 w-3" />
      </Button>

      {/* Titre */}
      <div className="pr-20">
        <input
          ref={inputRef}
          type="text"
          placeholder="Nom de la tâche..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full text-sm font-medium bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Assigner */}
      <Popover
        onOpenChange={(open) => {
          if (open) setSearchQuery("");
        }}
      >
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full py-1.5 rounded-md hover:bg-muted/60 px-2">
            {assignedMembers.length > 0 ? (
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1">
                  {assignedMembers.slice(0, 3).map((userId) => {
                    const member = members.find(
                      (m) => (m.userId || m.id) === userId,
                    );
                    return member ? (
                      <UserAvatar
                        key={userId}
                        src={member.image || member.user?.image}
                        name={member.name || member.user?.name}
                        size="xs"
                        className="h-4 w-4 ring-1 ring-background"
                      />
                    ) : null;
                  })}
                </div>
                <span>
                  {assignedMembers.length} assigné
                  {assignedMembers.length > 1 ? "s" : ""}
                </span>
              </div>
            ) : (
              <>
                <Users className="h-3.5 w-3.5" />
                <span>Assigner</span>
              </>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-0" align="start">
          <div className="px-2 pt-2 pb-1.5">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="h-7 text-xs pl-7 pr-2 bg-muted/30 border-border/50 focus-visible:ring-1 focus-visible:ring-[#5A50FF]/30"
              />
            </div>
          </div>
          <div className="px-2 pb-0.5">
            <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
              Assigné
            </span>
          </div>
          <div className="p-1.5 pt-0.5 space-y-0.5 max-h-[280px] overflow-y-auto">
            {members
              .filter((m) =>
                (m.name || m.user?.name || "")
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()),
              )
              .map((member) => {
                const memberId = member.userId || member.id;
                const memberName = member.name || member.user?.name || memberId;
                const memberImage = member.image || member.user?.image;
                const isSelected = assignedMembers.includes(memberId);
                return (
                  <button
                    key={memberId}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAssignedMembers((prev) =>
                        isSelected
                          ? prev.filter((id) => id !== memberId)
                          : [...prev, memberId],
                      );
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div
                      className={`rounded-full flex-shrink-0 ${isSelected ? "ring-[1.5px] ring-[#5A50FF] ring-offset-1 ring-offset-background" : ""}`}
                    >
                      <UserAvatar
                        src={memberImage}
                        name={memberName}
                        size="xs"
                        className="h-5 w-5"
                      />
                    </div>
                    <span className="flex-1 text-left text-xs font-medium truncate">
                      {memberName}
                    </span>
                  </button>
                );
              })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Échéance */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full py-1.5 rounded-md hover:bg-muted/60 px-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {dueDate
                ? format(dueDate, "dd MMM yyyy", { locale: fr })
                : "Ajouter une date"}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={dueDate}
            onSelect={(date) => {
              if (date) {
                date.setHours(18, 0, 0, 0);
                setDueDate(date);
              }
            }}
            locale={fr}
            fromDate={new Date()}
            className="border-0 p-2 text-xs [--cell-size:--spacing(8)]"
          />
        </PopoverContent>
      </Popover>

      {/* Priorité */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full py-1.5 rounded-md hover:bg-muted/60 px-2">
            <Flag
              className={`h-3.5 w-3.5 ${priority ? PRIORITIES.find((p) => p.value === priority)?.color || "text-gray-400" : ""}`}
            />
            <span>
              {priority
                ? PRIORITIES.find((p) => p.value === priority)?.label ||
                  "Aucune"
                : "Ajouter une priorité"}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-0" align="start">
          <div className="px-2 pt-2 pb-0.5">
            <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
              Priorité
            </span>
          </div>
          <div className="p-1.5 pt-0.5 space-y-0.5">
            {PRIORITIES.map((p) => {
              const isActive =
                (p.value === "" && !priority) || priority === p.value;
              return (
                <button
                  key={p.value || "none"}
                  onClick={() => setPriority(p.value)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors cursor-pointer ${isActive ? "bg-muted/60" : ""}`}
                >
                  <Flag className={`h-3.5 w-3.5 ${p.color} ${p.fill}`} />
                  <span className="flex-1 text-left text-xs font-normal">
                    {p.label}
                  </span>
                  {isActive && <Check className="w-3.5 h-3.5 text-[#5A50FF]" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Composant pour une colonne Kanban (custom DnD via data-attributes)
 */
function KanbanColumnSimpleInner({
  column,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onEditColumn,
  onDeleteColumn,
  isCollapsed,
  onToggleCollapse,
  isLoading,
  columnIndex,
  members = [],
  createTask,
  updateTask,
  boardId,
  workspaceId,
  allBoardTags = [],
}) {
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const baseOffset = 240;
  const maxHeight = `calc(100vh - ${baseOffset}px)`;

  // Ref pour le conteneur scrollable de la colonne
  const scrollContainerRef = useRef(null);

  // Force le scroll vertical sur la colonne, même si un élément enfant
  // (tooltip, popover, overflow-hidden) essaie de capturer l'événement wheel
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      // Ignorer si le scroll est majoritairement horizontal (scroll du board)
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;

      // Si la colonne n'a pas de contenu dépassant, laisser passer
      if (el.scrollHeight <= el.clientHeight) return;

      const atTop = el.scrollTop <= 0 && e.deltaY < 0;
      const atBottom =
        el.scrollTop + el.clientHeight >= el.scrollHeight - 1 && e.deltaY > 0;

      // Aux limites, laisser l'événement se propager normalement
      if (atTop || atBottom) return;

      // Forcer le scroll de la colonne
      e.preventDefault();
      e.stopPropagation();
      el.scrollTop += e.deltaY;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      {isCollapsed ? (
        /* ── Colonne collapsed — barre verticale étroite ── */
        <div
          data-dnd-column={column.id}
          data-dnd-column-index={columnIndex}
          data-dnd-column-color={column.color || "#94a3b8"}
          className="rounded-xl p-1.5 min-w-[44px] max-w-[44px] flex flex-col items-center flex-shrink-0 cursor-pointer"
          style={{ backgroundColor: `${column.color || "#94a3b8"}12` }}
          onClick={() => onToggleCollapse(column.id)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 mb-2"
            style={{ color: column.color || "#94a3b8" }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(column.id);
            }}
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </Button>
          <div
            className="px-1.5 py-2 rounded-md text-xs font-medium border flex items-center justify-center"
            style={{
              backgroundColor: `${column.color || "#94a3b8"}20`,
              borderColor: `${column.color || "#94a3b8"}20`,
              color: column.color || "#94a3b8",
              writingMode: "vertical-lr",
              textOrientation: "mixed",
            }}
          >
            {column.title}
          </div>
          <span
            className="mt-2 text-xs font-medium"
            style={{ color: column.color || "#94a3b8" }}
          >
            {tasks.length}
          </span>
        </div>
      ) : (
        /* ── Colonne ouverte ── */
        <div
          data-dnd-column={column.id}
          data-dnd-column-index={columnIndex}
          data-dnd-column-color={column.color || "#94a3b8"}
          className="group/col rounded-xl p-1 sm:p-1.5 min-w-[230px] max-w-[230px] sm:min-w-[272px] sm:max-w-[272px] flex flex-col flex-shrink-0"
          style={{ backgroundColor: `${column.color || "#94a3b8"}12` }}
        >
          {/* Header de la colonne — drag handle for column reorder */}
          <div
            data-dnd-column-handle
            className="flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing px-2 pt-0.5 mb-1 sm:mb-1.5"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className="px-2 py-1 rounded-md flex-shrink-0 text-xs font-medium border flex items-center gap-1"
                style={{
                  backgroundColor: `${column.color || "#94a3b8"}20`,
                  borderColor: `${column.color || "#94a3b8"}20`,
                  color: column.color || "#94a3b8",
                }}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: column.color || "#94a3b8" }}
                />
                <span className="truncate">{column.title}</span>
              </div>
              <span
                className="flex-shrink-0 text-xs font-medium"
                style={{ color: column.color || "#94a3b8" }}
              >
                {tasks.length}
              </span>
            </div>

            <div
              className="flex items-center opacity-0 group-hover/col:opacity-100 transition-opacity"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                style={{ color: column.color || "#94a3b8" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse(column.id);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${column.color || "#94a3b8"}25`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    style={{ color: column.color || "#94a3b8" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${column.color || "#94a3b8"}25`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" strokeWidth={2.5} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                    Options du groupe
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => onEditColumn(column)}
                    className="gap-2"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Renommer
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onEditColumn(column)}
                    className="gap-2"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Modifier le status
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onToggleCollapse(column.id)}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Replier le groupe
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDeleteColumn(column)}
                    variant="destructive"
                    className="gap-2 text-destructive hover:text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10 [&_svg]:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                style={{ color: column.color || "#94a3b8" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInlineAdd(true);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${column.color || "#94a3b8"}25`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
              </Button>
            </div>
          </div>

          {/* Zone drop pour les tâches */}
          <div
            ref={scrollContainerRef}
            data-dnd-drop-zone={column.id}
            className="kanban-column-scroll p-1 pb-2 rounded-lg transition-colors overflow-y-auto"
            style={{ minHeight: "50px", maxHeight }}
          >
            {showInlineAdd && (
              <InlineNewTask
                columnId={column.id}
                boardId={boardId}
                members={members}
                createTask={createTask}
                workspaceId={workspaceId}
                onCancel={() => setShowInlineAdd(false)}
                onEditTask={onEditTask}
              />
            )}
            {isLoading ? (
              <div className="flex flex-col gap-2 sm:gap-3">
                <TaskCardSkeleton />
                <TaskCardSkeleton />
                <TaskCardSkeleton />
              </div>
            ) : (
              tasks.map((task, index) => (
                <div
                  key={task.id}
                  data-dnd-task={task.id}
                  data-dnd-column-id={column.id}
                  data-dnd-index={index}
                  className="cursor-grab active:cursor-grabbing mb-1.5 sm:mb-2 last:mb-0"
                >
                  <TaskCard
                    task={task}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    isDragging={false}
                    updateTask={updateTask}
                    workspaceId={workspaceId}
                    allBoardTags={allBoardTags}
                    members={members}
                  />
                </div>
              ))
            )}

            {!showInlineAdd && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 justify-start transition-colors flex-shrink-0"
                style={{ color: column.color || "#94a3b8" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${column.color || "#94a3b8"}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                onClick={() => setShowInlineAdd(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une tâche
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Comparateur sur mesure : ne re-render que si les props impactant le DOM changent
function tasksShallowEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const ta = a[i];
    const tb = b[i];
    if (ta === tb) continue;
    if (!ta || !tb) return false;
    if (
      ta.id !== tb.id ||
      ta.updatedAt !== tb.updatedAt ||
      ta.position !== tb.position ||
      ta.title !== tb.title ||
      ta.columnId !== tb.columnId ||
      ta.priority !== tb.priority ||
      ta.dueDate !== tb.dueDate
    ) {
      return false;
    }
  }
  return true;
}

export const KanbanColumnSimple = React.memo(
  KanbanColumnSimpleInner,
  (prev, next) => {
    return (
      prev.column === next.column &&
      prev.isCollapsed === next.isCollapsed &&
      prev.isLoading === next.isLoading &&
      prev.columnIndex === next.columnIndex &&
      prev.boardId === next.boardId &&
      prev.workspaceId === next.workspaceId &&
      prev.members === next.members &&
      prev.allBoardTags === next.allBoardTags &&
      prev.onAddTask === next.onAddTask &&
      prev.onEditTask === next.onEditTask &&
      prev.onDeleteTask === next.onDeleteTask &&
      prev.onEditColumn === next.onEditColumn &&
      prev.onDeleteColumn === next.onDeleteColumn &&
      prev.onToggleCollapse === next.onToggleCollapse &&
      prev.createTask === next.createTask &&
      prev.updateTask === next.updateTask &&
      tasksShallowEqual(prev.tasks, next.tasks)
    );
  },
);
