"use client";

import { use, useState, useEffect, useMemo, Suspense } from "react";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  LoaderCircle,
  Search,
  Trash2,
  AlignLeft,
  Filter,
  Users,
  FileText,
  Euro,
  CircleXIcon,
  Star,
  ChevronRight,
  Smile,
  Flag,
  Calendar,
  UserRoundPlus,
  Pencil,
} from "lucide-react";
import { toast } from "@/src/components/ui/sonner";

// UI Components
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import { Calendar as CalendarComponent } from "@/src/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Badge } from "@/src/components/ui/badge";
import { ColorPicker } from "@/src/components/ui/color-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/src/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { GanttChart } from "lucide-react";

// Custom tab icons
const ListViewIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="1"
      y="2"
      width="14"
      height="2"
      rx="0.5"
      fill="currentColor"
      opacity="0.9"
    />
    <rect
      x="1"
      y="7"
      width="14"
      height="2"
      rx="0.5"
      fill="currentColor"
      opacity="0.6"
    />
    <rect
      x="1"
      y="12"
      width="14"
      height="2"
      rx="0.5"
      fill="currentColor"
      opacity="0.35"
    />
  </svg>
);

const BoardViewIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="1" y="1" width="4" height="14" rx="1" fill="#7B68EE" />
    <rect
      x="6"
      y="1"
      width="4"
      height="10"
      rx="1"
      fill="#7B68EE"
      opacity="0.6"
    />
    <rect
      x="11"
      y="1"
      width="4"
      height="7"
      rx="1"
      fill="#7B68EE"
      opacity="0.35"
    />
  </svg>
);

const GanttViewIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="1" y="2" width="8" height="2.5" rx="0.5" fill="#E8723A" />
    <rect
      x="4"
      y="6.75"
      width="10"
      height="2.5"
      rx="0.5"
      fill="#E8723A"
      opacity="0.6"
    />
    <rect
      x="2"
      y="11.5"
      width="6"
      height="2.5"
      rx="0.5"
      fill="#E8723A"
      opacity="0.35"
    />
  </svg>
);
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";

// Hooks
import { useKanbanBoard } from "./hooks/useKanbanBoard";
import { useKanbanColumns } from "./hooks/useKanbanColumns";
import { useKanbanTasks } from "./hooks/useKanbanTasks";
import { useKanbanDnDSimple } from "./hooks/useKanbanDnDSimple";
import { useKanbanSearch } from "./hooks/useKanbanSearch";
import { useKanbanMemberFilter } from "./hooks/useKanbanMemberFilter";
import { useColumnCollapse } from "./hooks/useColumnCollapse";
import { useViewMode } from "./hooks/useViewMode";
import { useDragToScroll } from "./hooks/useDragToScroll";
import { useKanbanDnD } from "./hooks/useKanbanDnD";
import { useListDnD } from "./hooks/useListDnD";
import { useOrganizationChange } from "@/src/hooks/useOrganizationChange";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";

// Components
import { KanbanColumnSimple } from "./components/KanbanColumnSimple";
import { TaskModal } from "./components/TaskModal";
import { ColumnModal } from "./components/ColumnModal";
import { DeleteConfirmation } from "./components/DeleteConfirmation";
import { KanbanListView } from "./components/KanbanListView";
import { KanbanGanttView } from "./components/KanbanGanttView";
import { MemberFilterButton } from "./components/MemberFilterButton";
import { ShareBoardDialog } from "./components/ShareBoardDialog";
import { SaveTemplateDialog } from "./components/SaveTemplateDialog";
import { ConvertToInvoiceModal } from "./components/ConvertToInvoiceModal";
import { stripHtml } from "@/src/utils/kanbanHelpers";
import {
  KanbanPageSkeleton,
  KanbanListSkeleton,
  KanbanGanttSkeleton,
} from "./components/KanbanPageSkeleton";
import {
  GET_BOARD,
  CREATE_COLUMN,
  UPDATE_COLUMN,
  DELETE_COLUMN,
  REORDER_COLUMNS,
  CREATE_TASK,
  UPDATE_TASK,
  DELETE_TASK,
  MOVE_TASK,
  UPDATE_BOARD,
  TOGGLE_BOARD_FAVORITE,
} from "@/src/graphql/kanbanQueries";

// @hello-pangea/dnd
// DragDropContext removed — list view now uses custom useListDnD hook

import { useMutation } from "@apollo/client";

function InlineBoardTitle({ title, onSave }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [value, setValue] = React.useState(title);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    setValue(title);
  }, [title]);

  const save = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== title) onSave(trimmed);
    else setValue(title);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-1 group/title">
      <div className="relative h-6 flex items-center">
        <h1
          className={`text-base font-semibold leading-6 whitespace-nowrap ${isEditing ? "invisible" : ""}`}
        >
          {isEditing ? value : title}
        </h1>
        {isEditing && (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
              if (e.key === "Escape") {
                setValue(title);
                setIsEditing(false);
              }
            }}
            onBlur={save}
            className="absolute inset-0 text-base font-semibold text-foreground bg-transparent border-none outline-none caret-[#5A50FF] p-0 m-0 leading-6"
          />
        )}
      </div>
      {!isEditing && (
        <button
          onClick={() => {
            setIsEditing(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className="opacity-0 group-hover/title:opacity-100 transition-opacity cursor-pointer"
        >
          <Pencil className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

const EMOJI_CATEGORIES = {
  Projet: ["📋", "📁", "📂", "🗂️", "📌", "📎", "🔖", "🏷️", "📝", "✏️"],
  Status: ["✅", "⏳", "🚧", "❌", "🔄", "⏸️", "▶️", "🏁", "🎯", "🏆"],
  Idées: ["💡", "🧩", "🔍", "🧪", "🔬", "📐", "🧮", "💭", "🤔", "🗒️"],
  Énergie: ["🚀", "⚡", "🔥", "💪", "🌟", "✨", "💫", "🎉", "🎊", "🪄"],
  Dev: ["🛠️", "⚙️", "🔧", "💻", "🖥️", "📱", "🌐", "🔗", "🗄️", "📡"],
  Business: ["💼", "📊", "📈", "💰", "🏗️", "🏢", "🤝", "📣", "📢", "🎨"],
  Nature: ["🌱", "🌿", "🍀", "🌸", "🌻", "🌈", "☀️", "🌙", "⭐", "🦋"],
  Divers: ["📦", "🎁", "🧰", "🔑", "🛡️", "🎮", "🎵", "📷", "🗺️", "🧭"],
};

function EmojiPicker({ boardEmoji, onSelect, onClear }) {
  const [search, setSearch] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  const filteredCategories = React.useMemo(() => {
    if (!search) return EMOJI_CATEGORIES;
    const filtered = {};
    for (const [cat, emojis] of Object.entries(EMOJI_CATEGORIES)) {
      const match = emojis.filter(() =>
        cat.toLowerCase().includes(search.toLowerCase()),
      );
      if (match.length) filtered[cat] = match;
    }
    // Si pas de match par catégorie, chercher tous les emojis
    if (Object.keys(filtered).length === 0) {
      return EMOJI_CATEGORIES;
    }
    return filtered;
  }, [search]);

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <button className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted/50 transition-colors cursor-pointer text-base">
          {boardEmoji || <Smile className="h-4 w-4 text-muted-foreground/40" />}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" side="bottom" align="start">
        {/* Search */}
        <div className="p-2 pb-1.5">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/50"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full h-7 text-xs pl-7 pr-2 rounded-md bg-muted/30 border border-border/50 outline-none focus:ring-1 focus:ring-[#5A50FF]/30 focus:border-ring placeholder:text-muted-foreground/40"
            />
          </div>
        </div>

        {/* Emoji grid */}
        <div className="px-2 pb-2 max-h-[240px] overflow-y-auto space-y-2">
          {Object.entries(filteredCategories).map(([category, emojis]) => (
            <div key={category}>
              <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider px-0.5">
                {category}
              </span>
              <div className="grid grid-cols-10 gap-0.5 mt-0.5">
                {emojis.map((e) => (
                  <button
                    key={e}
                    onClick={() => {
                      onSelect(e);
                      setIsOpen(false);
                    }}
                    className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted cursor-pointer text-base transition-colors"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Clear */}
        {boardEmoji && (
          <div className="border-t border-border/40 px-2 py-1.5">
            <button
              onClick={() => {
                onClear();
                setIsOpen(false);
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              Supprimer l'icône
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function ExpandableSearch({ searchQuery, setSearchQuery }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const inputRef = React.useRef(null);
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (!searchQuery) setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleClickOutside, true);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside, true);
  }, [isOpen, searchQuery]);

  if (!isOpen && !searchQuery) {
    return (
      <Button
        variant="outline"
        size="icon"
        title="Rechercher"
        onClick={() => setIsOpen(true)}
      >
        <Search size={14} aria-hidden="true" />
      </Button>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-2 h-8 w-[220px] rounded-[9px] border border-[#E6E7EA] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] bg-transparent px-2.5 transition-all duration-200 focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] animate-in fade-in slide-in-from-right-2"
    >
      <Search
        size={14}
        className="text-muted-foreground/80 shrink-0"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Rechercher..."
        className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 p-0"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setSearchQuery("");
            setIsOpen(false);
          }
        }}
      />
      {Boolean(searchQuery) && (
        <button
          className="text-muted-foreground/80 hover:text-foreground cursor-pointer shrink-0 transition-colors outline-none"
          onClick={() => {
            setSearchQuery("");
            inputRef.current?.focus();
          }}
        >
          <CircleXIcon size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function KanbanBoardPageContent({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = use(params);
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const taskIdFromUrl = searchParams.get("task");
  const { isReadOnly, isOwner } = useSubscriptionAccess();
  const readOnlyTooltip = isReadOnly
    ? isOwner
      ? "Mode lecture seule · Renouvelez votre abonnement"
      : "Mode lecture seule · Contactez l'administrateur"
    : undefined;

  // Hook viewMode en premier pour avoir le bon skeleton dès le début
  const {
    viewMode,
    setViewMode,
    isBoard,
    isList,
    isGantt,
    isReady: isViewModeReady,
  } = useViewMode(id);

  // Hooks
  const {
    board,
    loading,
    error,
    refetch,
    getTasksByColumn,
    workspaceId,
    markReorderAction,
  } = useKanbanBoard(id, isRedirecting);
  useWorkspace(); // Nécessaire pour initialiser le workspace, mais loading n'est plus bloquant ici

  const {
    isAddColumnOpen,
    isEditColumnOpen,
    isDeleteColumnDialogOpen,
    columnToDelete,
    editingColumn,
    columnForm,
    loading: columnsLoading,
    createLoading,
    updateLoading,
    deleteLoading,
    setIsAddColumnOpen,
    setIsEditColumnOpen,
    setIsDeleteColumnDialogOpen,
    setColumnToDelete,
    setEditingColumn,
    setColumnForm,
    handleColumnFormChange,
    handleCreateColumn,
    handleUpdateColumn,
    handleDeleteColumn,
    confirmDeleteColumn,
    openEditModal,
    openAddModal,
  } = useKanbanColumns(id, refetch);

  const {
    taskForm,
    editingTask,
    selectedColumnId,
    isAddTaskOpen,
    isEditTaskOpen,
    loading: tasksLoading,
    createTaskLoading,
    updateTaskLoading,
    deleteTaskLoading,
    setTaskForm,
    setEditingTask,
    setSelectedColumnId,
    setIsAddTaskOpen,
    setIsEditTaskOpen,
    handleTaskFormChange,
    handleCreateTask,
    handleUpdateTask,
    handleDeleteTask,
    openAddTaskModal,
    openEditTaskModal,
    closeAddTaskModal,
    closeEditTaskModal,
    addTag,
    removeTag,
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
    addPendingComment,
    removePendingComment,
    updatePendingComment,
    moveTask,
    updateTask,
    createTask,
    initialFormRef,
    localMutationRef,
  } = useKanbanTasks(id, board);

  // Mutation pour réorganiser les colonnes
  const [reorderColumnsMutation] = useMutation(REORDER_COLUMNS);

  // Mutation pour mettre à jour le board
  const [updateBoardMutation] = useMutation(UPDATE_BOARD);
  const updateBoardField = (field, value) => {
    updateBoardMutation({
      variables: { input: { id, [field]: value }, workspaceId },
    });
  };

  // Favori (persisté en base)
  const isFavorite = board?.isFavorite || false;
  const [toggleFavMutation] = useMutation(TOGGLE_BOARD_FAVORITE);
  const toggleFavorite = () => {
    toggleFavMutation({ variables: { boardId: id, workspaceId } });
  };

  // Emoji — persisté en base via updateBoard
  const boardEmoji = board?.emoji || null;
  const handleEmojiSelect = (emoji) => {
    updateBoardField("emoji", emoji);
  };
  const clearEmoji = () => {
    updateBoardField("emoji", null);
  };

  // Priorité, Date, Membres — persistés en base via updateBoard
  const boardPriority = board?.priority || "";
  const boardDueDate = board?.dueDate ? new Date(board.dueDate) : null;
  const boardMemberIds = board?.boardMembers || [];

  // Stats du board
  const boardStats = React.useMemo(() => {
    if (!board?.tasks) return { total: 0, done: 0, percent: 0 };
    const total = board.tasks.length;
    const lastColumn = board?.columns?.[board.columns.length - 1];
    const done = lastColumn
      ? board.tasks.filter((t) => t.columnId === lastColumn.id).length
      : 0;
    return {
      total,
      done,
      percent: total ? Math.round((done / total) * 100) : 0,
    };
  }, [board?.tasks, board?.columns]);

  // Colonnes dérivées du board (synchrone, pas de délai useEffect)
  const boardColumns = React.useMemo(() => {
    if (!board?.columns || !board?.tasks) return [];
    return board.columns.map((column) => ({
      ...column,
      tasks: (board.tasks || [])
        .filter((task) => task.columnId === column.id)
        .sort((a, b) => (a.position || 0) - (b.position || 0)),
    }));
  }, [board?.columns, board?.tasks]);

  // Override local pour les mises à jour optimistes pendant le drag
  const [localColumnsOverride, setLocalColumnsOverride] = React.useState(null);

  // Ref pour tracker le dernier drag
  const lastDragTimeRef = React.useRef(0);

  // Réinitialiser l'override quand les données du board se synchronisent après un drag
  React.useEffect(() => {
    if (localColumnsOverride !== null) {
      const timeSinceLastDrag = Date.now() - lastDragTimeRef.current;
      if (timeSinceLastDrag >= 2000) {
        setLocalColumnsOverride(null);
      }
    }
  }, [board?.columns, board?.tasks, localColumnsOverride]);

  // Colonnes effectives : override pendant le drag, sinon données du board
  const localColumns = localColumnsOverride ?? boardColumns;
  const setLocalColumns = React.useCallback((newColumns) => {
    setLocalColumnsOverride(newColumns);
  }, []);

  // State pour tracker si on drag une colonne
  const [isDraggingColumn, setIsDraggingColumn] = React.useState(false);

  // State pour tracker si on drag (tâche ou colonne) - pour désactiver le scale pendant le drag
  const [isDragging, setIsDragging] = React.useState(false);

  // État pour les tâches sélectionnées
  const [selectedTaskIds, setSelectedTaskIds] = React.useState(new Set());

  // État pour le popover de description du tableau

  // État pour la modale de conversion en facture
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Hook pour le filtrage par membre (AVANT useKanbanDnDSimple pour éviter l'erreur de hoisting)
  const {
    selectedMemberIds,
    toggleMemberId,
    clearSelectedMembers,
    members,
    loading: membersLoading,
    filterTasksByMember,
    fetchMembers,
  } = useKanbanMemberFilter(workspaceId);

  // Hook DnD simplifié avec @hello-pangea/dnd
  const { handleDragEnd: dndHandleDragEnd } = useKanbanDnDSimple(
    moveTask,
    id,
    workspaceId,
    localColumns,
    setLocalColumns,
    reorderColumnsMutation,
    markReorderAction,
    selectedMemberIds, // Passer le filtre pour recalculer les positions correctement
  );

  // Wrapper handleDragEnd — shared by both board (custom DnD) and list (@hello-pangea/dnd)
  const handleDragEnd = React.useCallback(
    async (result) => {
      lastDragTimeRef.current = Date.now();
      setIsDragging(false);
      if (result.type === "column") {
        setIsDraggingColumn(false);
      }
      try {
        await dndHandleDragEnd(result);
      } catch (error) {
        console.error("❌ Erreur mutation:", error);
      }
    },
    [dndHandleDragEnd],
  );

  // Wrapper handleDragStart — shared by both board and list
  const handleDragStart = React.useCallback((info) => {
    setIsDragging(true);
    if (info.type === "column") {
      setIsDraggingColumn(true);
    }
  }, []);

  // Helper pour récupérer les tâches d'une colonne
  const getLocalTasksByColumn = React.useCallback(
    (columnId) => {
      const column = localColumns.find((col) => col.id === columnId);
      return column?.tasks || [];
    },
    [localColumns],
  );

  const {
    searchQuery,
    setSearchQuery,
    filterTasks: filterTasksBySearch,
  } = useKanbanSearch();

  // Ref pour éviter que l'effet de synchronisation URL → modal ne réouvre
  // une tâche qu'on vient de fermer (avant que useSearchParams ne se mette à jour)
  const handledTaskIdRef = React.useRef(null);

  // Ouvrir automatiquement une tâche si le paramètre ?task= est présent dans l'URL
  React.useEffect(() => {
    if (!taskIdFromUrl) {
      handledTaskIdRef.current = null;
      return;
    }
    if (!board?.tasks || loading) return;
    if (handledTaskIdRef.current === taskIdFromUrl) return;

    const taskToOpen = board.tasks.find((t) => t.id === taskIdFromUrl);
    if (taskToOpen) {
      handledTaskIdRef.current = taskIdFromUrl;
      openEditTaskModal(taskToOpen);
    }
  }, [taskIdFromUrl, board?.tasks, loading, openEditTaskModal]);

  // Wrappers qui synchronisent l'URL avec l'état du modal de tâche.
  // window.history.replaceState évite un re-render côté serveur (router.replace
  // en App Router re-déclenche le rendu serveur pour chaque changement).
  const handleOpenEditTaskModal = React.useCallback(
    (task) => {
      if (!task) return;
      const taskId = task?.id || task?._id;
      if (taskId) {
        handledTaskIdRef.current = taskId;
      }
      openEditTaskModal(task);
      if (taskId && typeof window !== "undefined") {
        window.history.replaceState(
          null,
          "",
          `/dashboard/outils/kanban/${id}?task=${taskId}`,
        );
      }
    },
    [openEditTaskModal, id],
  );

  const handleCloseEditTaskModal = React.useCallback(() => {
    // Marque l'id courant comme "déjà traité" pour bloquer l'effet de réouverture
    // le temps que useSearchParams reflète l'URL nettoyée.
    if (taskIdFromUrl) {
      handledTaskIdRef.current = taskIdFromUrl;
    }
    closeEditTaskModal();
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/dashboard/outils/kanban/${id}`);
    }
  }, [closeEditTaskModal, id, taskIdFromUrl]);

  // Fonction de filtrage combinée (recherche + membre)
  const filterTasks = React.useCallback(
    (tasks) => {
      let filtered = filterTasksBySearch(tasks);
      filtered = filterTasksByMember(filtered);
      return filtered;
    },
    [filterTasksBySearch, filterTasksByMember],
  );

  // Calcule le temps effectif en secondes (inclut le timer actif, comme TimerDisplay)
  const getEffectiveSeconds = React.useCallback((tt) => {
    let total = tt.totalSeconds || 0;
    if (tt.isRunning && tt.currentStartTime) {
      const elapsed = Math.floor(
        (Date.now() - new Date(tt.currentStartTime).getTime()) / 1000,
      );
      if (elapsed > 0) total += elapsed;
    }
    return Math.max(0, total);
  }, []);

  // Tâches facturables = temps effectif > 0 ET tarif horaire défini ET prix > 0
  const billableTasks = useMemo(() => {
    if (!board?.tasks) return [];
    return board.tasks.filter((task) => {
      const tt = task.timeTracking;
      if (!tt?.hourlyRate || tt.hourlyRate <= 0) return false;
      const effectiveSeconds = getEffectiveSeconds(tt);
      if (effectiveSeconds <= 0) return false;
      const h = Math.floor(effectiveSeconds / 3600);
      const m = Math.floor((effectiveSeconds % 3600) / 60);
      let billableHours = h + m / 60;
      if (tt.roundingOption === "up") billableHours = Math.ceil(billableHours);
      else if (tt.roundingOption === "down")
        billableHours = Math.floor(billableHours);
      return billableHours * tt.hourlyRate > 0;
    });
  }, [board?.tasks, getEffectiveSeconds]);

  // Prix total du projet
  const projectTotalPrice = useMemo(() => {
    return billableTasks.reduce((sum, task) => {
      const tt = task.timeTracking;
      const totalSec = getEffectiveSeconds(tt);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      let billableHours = h + m / 60;
      if (tt.roundingOption === "up") billableHours = Math.ceil(billableHours);
      else if (tt.roundingOption === "down")
        billableHours = Math.floor(billableHours);
      return sum + billableHours * tt.hourlyRate;
    }, 0);
  }, [billableTasks, getEffectiveSeconds]);

  // Formatage monétaire
  const formatCurrency = React.useCallback(
    (amount) =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount),
    [],
  );

  // Conversion tâches Kanban → facture
  const handleConvertToInvoice = React.useCallback(
    (selectedTasks) => {
      const items = selectedTasks.map((task) => {
        const tt = task.timeTracking;
        const totalSec = getEffectiveSeconds(tt);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        let billableHours = h + m / 60;
        if (tt.roundingOption === "up")
          billableHours = Math.ceil(billableHours);
        else if (tt.roundingOption === "down")
          billableHours = Math.floor(billableHours);
        return {
          description: task.title,
          details: stripHtml(task.description),
          quantity: billableHours,
          unitPrice: tt.hourlyRate,
          vatRate: 20,
          unit: "heure",
          discount: 0,
          discountType: "PERCENTAGE",
          progressPercentage: 100,
        };
      });
      sessionStorage.setItem("kanbanInvoiceItems", JSON.stringify(items));
      if (board?.client) {
        sessionStorage.setItem(
          "kanbanInvoiceClient",
          JSON.stringify(board.client),
        );
      }
      setShowConvertModal(false);
      router.push("/dashboard/outils/factures/new");
    },
    [router, getEffectiveSeconds, board],
  );

  const {
    isColumnCollapsed,
    toggleColumnCollapse,
    expandAll,
    collapsedColumnsCount,
  } = useColumnCollapse(id);

  // Callbacks stables pour les colonnes
  const handleColumnAddTask = React.useCallback(
    (columnId) => {
      openAddTaskModal(columnId);
    },
    [openAddTaskModal],
  );

  const handleColumnEditTask = React.useCallback(
    (task) => {
      handleOpenEditTaskModal(task);
    },
    [handleOpenEditTaskModal],
  );

  const handleColumnDeleteTask = React.useCallback(
    (task) => {
      handleDeleteTask(task);
    },
    [handleDeleteTask],
  );

  const handleColumnEditColumn = React.useCallback(
    (column) => {
      openEditModal(column);
    },
    [openEditModal],
  );

  const handleColumnDeleteColumn = React.useCallback(
    (column) => {
      handleDeleteColumn(column);
    },
    [handleDeleteColumn],
  );

  const handleColumnToggleCollapse = React.useCallback(
    (columnId) => {
      toggleColumnCollapse(columnId);
    },
    [toggleColumnCollapse],
  );

  // Collecter tous les tags du board pour l'autocomplétion
  const allBoardTags = React.useMemo(() => {
    if (!localColumns) return [];
    const tags = [];
    localColumns.forEach((column) => {
      getLocalTasksByColumn(column.id).forEach((task) => {
        (task.tags || []).forEach((tag) => tags.push(tag));
      });
    });
    return tags;
  }, [localColumns, getLocalTasksByColumn]);

  // Rendu des colonnes (custom DnD via data-attributes)
  const columnsContent = React.useMemo(() => {
    if (!localColumns || localColumns.length === 0) {
      return null;
    }

    return (
      <>
        {localColumns.map((column, index) => {
          const columnTasks = filterTasks(getLocalTasksByColumn(column.id));
          const isCollapsed = isColumnCollapsed(column.id);

          return (
            <KanbanColumnSimple
              key={column.id}
              column={column}
              tasks={columnTasks}
              onAddTask={handleColumnAddTask}
              onEditTask={handleColumnEditTask}
              onDeleteTask={handleColumnDeleteTask}
              onEditColumn={handleColumnEditColumn}
              onDeleteColumn={handleColumnDeleteColumn}
              isCollapsed={isCollapsed}
              onToggleCollapse={handleColumnToggleCollapse}
              isLoading={loading}
              columnIndex={index}
              members={board?.members || []}
              createTask={createTask}
              updateTask={updateTask}
              boardId={id}
              workspaceId={workspaceId}
              allBoardTags={allBoardTags}
            />
          );
        })}

        {/* Add Column Button */}
        <Card className="w-[230px] sm:w-[272px] h-fit border border-dashed border-foreground/25 hover:border-foreground/50 transition-colors shadow-none cursor-pointer flex-shrink-0">
          <CardContent className="p-3">
            <Button
              variant="ghost"
              className="w-full h-16 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-transparent cursor-pointer"
              onClick={openAddModal}
              disabled={isReadOnly}
              title={readOnlyTooltip}
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm font-medium">Ajouter une colonne</span>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }, [
    localColumns,
    filterTasks,
    getLocalTasksByColumn,
    isColumnCollapsed,
    handleColumnAddTask,
    handleColumnEditTask,
    handleColumnDeleteTask,
    handleColumnEditColumn,
    handleColumnDeleteColumn,
    handleColumnToggleCollapse,
    loading,
    openAddModal,
    board?.members,
    createTask,
    updateTask,
    id,
    workspaceId,
    allBoardTags,
  ]);

  // Hook pour le drag-to-scroll horizontal (espace vide, hors DnD)
  const scrollElementRef = React.useRef(null);
  const dragToScrollRef = useDragToScroll({
    enabled: isBoard && !isDragging,
    scrollSpeed: 1.5,
  });
  const scrollRef = React.useCallback(
    (node) => {
      scrollElementRef.current = node;
      dragToScrollRef(node);
    },
    [dragToScrollRef],
  );

  // Custom DnD pour le board (auto-scroll intégré, gère le zoom)
  useKanbanDnD({
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    scrollElementRef,
    enabled: isBoard,
  });

  // Custom DnD pour la vue liste (même comportement visuel que le board)
  const listScrollRef = React.useRef(null);
  useListDnD({
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    scrollElementRef: listScrollRef,
    enabled: isList,
  });

  // Détecter les changements d'organisation
  const { hasChangedOrganization } = useOrganizationChange({
    resourceId: id,
    listUrl: "/dashboard/outils/kanban",
    enabled: true,
  });

  // Solution de secours : Rediriger si le workspaceId change
  const previousWorkspaceIdRef = React.useRef(workspaceId);
  useEffect(() => {
    if (
      previousWorkspaceIdRef.current &&
      workspaceId &&
      previousWorkspaceIdRef.current !== workspaceId
    ) {
      console.log(
        "[Kanban] 🔄 Changement de workspace détecté, redirection...",
        {
          from: previousWorkspaceIdRef.current,
          to: workspaceId,
        },
      );
      router.push("/dashboard/outils/kanban");
    }
    previousWorkspaceIdRef.current = workspaceId;
  }, [workspaceId, router]);

  // Rediriger si le board n'existe pas
  useEffect(() => {
    if (error && workspaceId && !isRedirecting) {
      setIsRedirecting(true);
      router.push("/dashboard/outils/kanban");
    }
  }, [error, workspaceId, router, id, isRedirecting]);

  // Pendant le chargement, afficher le skeleton adapté à la vue active
  // Note: workspaceLoading retiré car !board couvre déjà le cas où workspaceId n'est pas dispo
  // (la query est skip si !workspaceId → board reste undefined → !board = true)
  // Cela évite de montrer un skeleton inutile quand les données sont déjà en cache Apollo
  if (loading || !board) {
    if (isList) return <KanbanListSkeleton />;
    if (isGantt) return <KanbanGanttSkeleton />;
    return <KanbanPageSkeleton />;
  }

  if (hasChangedOrganization) {
    return null;
  }

  if (isRedirecting) {
    return null;
  }

  return (
    <div
      key={`kanban-board-${id}-${isBoard ? "board" : "list"}`}
      className="h-[calc(100vh-64px)] flex flex-col overflow-hidden"
      style={{ pointerEvents: isBoard ? "auto" : "auto" }}
    >
      {/* Header - Fixe en haut */}
      <div className="flex-shrink-0 bg-background z-10">
        <div className="flex items-center gap-3 pt-2 pb-2 px-4 sm:px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground/50">
            <span
              className="hover:text-foreground transition-colors cursor-pointer"
              onClick={() => router.push("/dashboard/outils/kanban")}
            >
              Projets
            </span>
            <ChevronRight className="h-3 w-3" />
          </div>

          {/* Emoji + Titre */}
          <div className="flex items-center gap-1">
            <EmojiPicker
              boardEmoji={boardEmoji}
              onSelect={handleEmojiSelect}
              onClear={clearEmoji}
            />
            <InlineBoardTitle
              title={board.title}
              onSave={(title) => updateBoardField("title", title)}
            />
          </div>

          {/* Description — texte tronqué inline, tooltip au hover */}
          {board.description && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground/50 truncate max-w-[200px] cursor-default hidden sm:inline">
                  {board.description}
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="start"
                className="max-w-[320px]"
              >
                <p className="text-xs whitespace-pre-wrap break-words">
                  {board.description}
                </p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Favori */}
          <button
            onClick={toggleFavorite}
            className="cursor-pointer transition-colors"
            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Star
              className={`h-3.5 w-3.5 ${isFavorite ? "text-amber-400 fill-amber-400" : "text-muted-foreground/40 hover:text-amber-400"} transition-colors`}
            />
          </button>

          {/* Séparateur */}
          <div className="h-4 w-px bg-border/60" />

          {/* Priorité / Date / Membres */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-md px-1 py-0.5">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="h-6 px-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors flex items-center"
                  title="Priorité du projet"
                >
                  <Flag
                    className={`h-3.5 w-3.5 transition-colors ${
                      boardPriority === "high"
                        ? "text-red-500 fill-red-500"
                        : boardPriority === "medium"
                          ? "text-yellow-500 fill-yellow-500"
                          : boardPriority === "low"
                            ? "text-green-500 fill-green-500"
                            : "text-muted-foreground/40 hover:text-muted-foreground"
                    }`}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-0" side="bottom" align="start">
                <div className="p-1.5 space-y-0.5">
                  {[
                    {
                      value: "high",
                      label: "Urgent",
                      color: "text-red-500 fill-red-500",
                    },
                    {
                      value: "medium",
                      label: "Moyen",
                      color: "text-yellow-500 fill-yellow-500",
                    },
                    {
                      value: "low",
                      label: "Faible",
                      color: "text-green-500 fill-green-500",
                    },
                    { value: "", label: "Aucune", color: "text-gray-400" },
                  ].map((p) => (
                    <button
                      key={p.value || "none"}
                      onClick={() => updateBoardField("priority", p.value)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer ${boardPriority === p.value || (!boardPriority && !p.value) ? "bg-muted/60" : ""}`}
                    >
                      <Flag className={`h-3.5 w-3.5 ${p.color}`} />
                      <span className="text-xs">{p.label}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Date d'échéance */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="h-6 px-1.5 rounded-md hover:bg-muted flex items-center gap-1 cursor-pointer transition-colors"
                  title="Échéance du projet"
                >
                  <Calendar
                    className={`h-3.5 w-3.5 transition-colors ${boardDueDate ? "text-foreground/70" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                  />
                  {boardDueDate && (
                    <span className="text-[11px] text-foreground/60 font-medium">
                      {format(boardDueDate, "dd MMM", { locale: fr })}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                side="bottom"
                align="start"
              >
                <CalendarComponent
                  mode="single"
                  selected={boardDueDate}
                  onSelect={(date) => {
                    if (date) {
                      date.setHours(18, 0, 0, 0);
                      updateBoardField("dueDate", date.toISOString());
                    }
                  }}
                  locale={fr}
                  fromDate={new Date()}
                  className="border-0 p-2 text-xs [--cell-size:--spacing(8)]"
                />
                {boardDueDate && (
                  <div className="px-2 pb-2">
                    <button
                      onClick={() => updateBoardField("dueDate", null)}
                      className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      Supprimer la date
                    </button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Accès au tableau (membres autorisés) */}
            {(() => {
              const ownerId = board?.userId ? String(board.userId) : null;
              const rawAssigned = (boardMemberIds || [])
                .map((id) => (id ? String(id) : null))
                .filter(Boolean);
              const hasRestriction = rawAssigned.length > 0;
              const assignedSet = new Set(rawAssigned);
              const allMembers = board?.members || [];
              const allNonOwnerIds = allMembers
                .map((m) => String(m.userId || m.id))
                .filter((id) => id !== ownerId);

              const memberHasAccess = (id) => {
                if (ownerId && id === ownerId) return true;
                if (!hasRestriction) return true;
                return assignedSet.has(id);
              };

              const toggleMember = (memberId) => {
                if (ownerId && memberId === ownerId) return;
                let next;
                if (!hasRestriction) {
                  next = new Set(allNonOwnerIds);
                  next.delete(memberId);
                } else {
                  next = new Set(rawAssigned);
                  if (next.has(memberId)) next.delete(memberId);
                  else next.add(memberId);
                }
                const coversEveryone =
                  allNonOwnerIds.length > 0 &&
                  allNonOwnerIds.every((id) => next.has(id));
                updateBoardField(
                  "boardMembers",
                  coversEveryone ? [] : Array.from(next),
                );
              };

              return (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="h-6 px-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors flex items-center gap-1"
                      title="Accès au tableau"
                    >
                      <UserRoundPlus
                        className={`h-3.5 w-3.5 transition-colors ${
                          hasRestriction
                            ? "text-foreground/70"
                            : "text-muted-foreground/50"
                        }`}
                      />
                      {hasRestriction && (
                        <span className="text-[11px] text-foreground/60 font-medium">
                          {rawAssigned.length + (ownerId ? 1 : 0)}
                        </span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-64 p-0"
                    side="bottom"
                    align="start"
                  >
                    <div className="px-3 pt-3 pb-2 border-b border-border/50">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium">
                          Accès au tableau
                        </span>
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
                      <p className="text-[11px] text-muted-foreground">
                        {hasRestriction
                          ? "Seuls les membres cochés voient ce tableau."
                          : "Tous les membres du workspace voient ce tableau."}
                      </p>
                      {hasRestriction && (
                        <button
                          type="button"
                          onClick={() => updateBoardField("boardMembers", [])}
                          className="mt-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Repasser sur "tout le workspace"
                        </button>
                      )}
                    </div>
                    <div className="p-1.5 space-y-0.5 max-h-[280px] overflow-y-auto">
                      {allMembers.map((member) => {
                        const memberId = String(member.userId || member.id);
                        const isOwner = ownerId === memberId;
                        const hasAccess = memberHasAccess(memberId);
                        return (
                          <button
                            key={memberId}
                            onClick={() => toggleMember(memberId)}
                            disabled={isOwner}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-left ${
                              isOwner ? "cursor-default" : "cursor-pointer"
                            }`}
                            title={
                              isOwner
                                ? "Créateur du tableau (toujours inclus)"
                                : undefined
                            }
                          >
                            <div
                              className={`rounded-full flex-shrink-0 ${
                                hasAccess
                                  ? "ring-[1.5px] ring-[#5A50FF] ring-offset-1 ring-offset-background"
                                  : ""
                              }`}
                            >
                              <UserAvatar
                                src={member.image}
                                name={member.name || member.email}
                                size="xs"
                                className="h-5 w-5"
                              />
                            </div>
                            <span className="flex-1 text-left text-xs font-medium truncate">
                              {member.name || member.email}
                              {isOwner && (
                                <span className="ml-1 text-[10px] text-muted-foreground font-normal">
                                  (créateur)
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              );
            })()}
          </div>

          {/* Séparateur */}
          <div className="h-4 w-px bg-border/60" />

          {/* Membres */}
          {board?.members?.length > 0 && (
            <div className="flex items-center">
              <div className="flex -space-x-1.5">
                {board.members.slice(0, 4).map((member) => (
                  <UserAvatar
                    key={member.userId || member.id}
                    src={member.image}
                    name={member.name || member.email}
                    size="xs"
                    className="h-5 w-5 ring-1 ring-background"
                  />
                ))}
                {board.members.length > 4 && (
                  <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center text-[8px] font-medium text-muted-foreground">
                    +{board.members.length - 4}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Sauv. modèle & Partager */}
          <div className="flex items-center gap-1.5">
            <SaveTemplateDialog boardId={id} boardTitle={board.title} />
            <ShareBoardDialog
              boardId={id}
              boardTitle={board.title}
              workspaceId={workspaceId}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-[#eeeff1] dark:border-[#232323] pt-2 pb-[9px] px-4 sm:px-6 kanban-tabs">
          <style>{`
            .kanban-tabs [data-slot="tabs-trigger"][data-state="active"] {
              text-shadow: 0.015em 0 currentColor, -0.015em 0 currentColor;
            }
          `}</style>
          <Tabs
            value={viewMode}
            onValueChange={setViewMode}
            className="w-auto items-center"
          >
            <TabsList className="h-auto rounded-none bg-transparent p-0 gap-1.5">
              <TabsTrigger
                value="list"
                className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground data-[hovered]:shadow-[inset_0_0_0_1px_#EEEFF1] dark:data-[hovered]:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]"
              >
                <ListViewIcon className="h-4 w-4 md:inline hidden" />
                List
              </TabsTrigger>
              <TabsTrigger
                value="board"
                className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground data-[hovered]:shadow-[inset_0_0_0_1px_#EEEFF1] dark:data-[hovered]:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323] hidden md:inline-flex"
              >
                <BoardViewIcon className="h-4 w-4" />
                Board
              </TabsTrigger>
              <TabsTrigger
                value="gantt"
                className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground data-[hovered]:shadow-[inset_0_0_0_1px_#EEEFF1] dark:data-[hovered]:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323] hidden md:inline-flex"
              >
                <GanttViewIcon className="h-4 w-4" />
                Gantt
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            {/* Bouton Recherche expansible */}
            <ExpandableSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />

            {/* Bouton Filtres */}
            <DropdownMenu
              onOpenChange={(open) => {
                if (open) fetchMembers();
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant={selectedMemberIds.length > 0 ? "primary" : "outline"}
                  size="icon"
                  className="relative"
                  title="Filtres"
                >
                  <Filter size={14} aria-hidden="true" />
                  {selectedMemberIds.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#5A50FF] text-[9px] font-bold text-white">
                      {selectedMemberIds.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px]">
                <DropdownMenuItem
                  onClick={() => clearSelectedMembers()}
                  className="cursor-pointer"
                >
                  Effacer le filtre
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="whitespace-nowrap">
                    <Users className="h-4 w-4 mr-2" />
                    Par utilisateurs
                    {selectedMemberIds.length > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {selectedMemberIds.length}
                      </Badge>
                    )}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-[250px]">
                    {membersLoading ? (
                      <div className="text-xs text-muted-foreground px-2 py-4 text-center">
                        Chargement...
                      </div>
                    ) : members && members.length > 0 ? (
                      <div className="space-y-1 p-1">
                        {members.map((member) => (
                          <DropdownMenuItem
                            key={member.id}
                            onSelect={(e) => {
                              e.preventDefault();
                              toggleMemberId(member.id);
                            }}
                            className="flex items-center px-2 py-1.5 cursor-pointer text-sm"
                          >
                            {member.image ? (
                              <img
                                src={member.image}
                                alt={member.name || member.email}
                                className="w-6 h-6 rounded-full mr-2 object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full mr-2 bg-primary/20 flex items-center justify-center text-xs font-medium">
                                {(member.name || member.email)
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}
                            <span className="flex-1">
                              {member.name || member.email}
                            </span>
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                selectedMemberIds.includes(member.id)
                                  ? "bg-primary border-primary"
                                  : "border-muted-foreground/50"
                              }`}
                            >
                              {selectedMemberIds.includes(member.id) && (
                                <span className="text-white text-xs">✓</span>
                              )}
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground px-2 py-4 text-center">
                        Aucun membre
                      </div>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="primary"
              className="cursor-pointer"
              onClick={openAddModal}
              disabled={isReadOnly}
              title={readOnlyTooltip}
            >
              <Plus size={14} strokeWidth={2} aria-hidden="true" />
              {isBoard ? "Ajouter une colonne" : "Nouveau status"}
            </Button>
          </div>
        </div>
      </div>

      {/* Contrôles au même niveau - Lien Déplier, Recherche et Filtre */}
      {isBoard && (
        <div className="sticky left-0 px-4 sm:px-6 py-3 bg-background z-10 flex items-center gap-4">
          <div className="flex items-center gap-2">
            {/* Bouton Convertir en facture */}
            {billableTasks.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowConvertModal(true)}
              >
                <FileText className="h-4 w-4" />
                <span className="hidden lg:inline">Convertir en facture</span>
              </Button>
            )}
          </div>

          {/* Prix total */}
          {billableTasks.length > 0 && (
            <span className="text-sm font-medium whitespace-nowrap">
              Dossier à{" "}
              <span className="bg-[#5b50ff]/10 text-[#5b50ff] px-2.5 py-1 rounded-md text-sm font-semibold ml-1.5">
                {formatCurrency(projectTotalPrice)}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Contrôles pour la vue liste */}
      {isList && (collapsedColumnsCount > 0 || billableTasks.length > 0) && (
        <div className="sticky left-0 px-4 sm:px-6 py-3 bg-background z-10 flex items-center gap-4">
          {billableTasks.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowConvertModal(true)}
              >
                <FileText className="h-4 w-4" />
                <span className="hidden lg:inline">Convertir en facture</span>
              </Button>
              <span className="text-sm font-medium whitespace-nowrap">
                Dossier à{" "}
                <span className="bg-[#5b50ff]/10 text-[#5b50ff] px-2.5 py-1 rounded-md text-sm font-semibold ml-1.5">
                  {formatCurrency(projectTotalPrice)}
                </span>
              </span>
            </>
          )}
        </div>
      )}

      {/* Gantt sans padding */}
      {isGantt && (
        <div className="w-full">
          <KanbanGanttView
            columns={localColumns}
            getTasksByColumn={getLocalTasksByColumn}
            filterTasks={filterTasks}
            onEditTask={handleOpenEditTaskModal}
            onAddTask={openAddTaskModal}
            members={board?.members || []}
            updateTask={updateTask}
            workspaceId={workspaceId}
          />
        </div>
      )}

      {/* Board Content - Zone scrollable pour les colonnes */}
      <div className="flex-1 overflow-hidden">
        {isList && (
          <div
            className="h-full overflow-auto"
            ref={(node) => {
              listScrollRef.current = node;
            }}
          >
            <div className="h-6 bg-background sticky top-0 z-[21]" />
            <KanbanListView
              columns={localColumns}
              getTasksByColumn={getLocalTasksByColumn}
              filterTasks={filterTasks}
              onEditTask={handleOpenEditTaskModal}
              onDeleteTask={handleDeleteTask}
              onAddTask={openAddTaskModal}
              onEditColumn={openEditModal}
              onDeleteColumn={handleDeleteColumn}
              members={board?.members || []}
              selectedTaskIds={selectedTaskIds}
              setSelectedTaskIds={setSelectedTaskIds}
              moveTask={moveTask}
              updateTask={updateTask}
              createTask={createTask}
              boardId={id}
              workspaceId={workspaceId}
            />
          </div>
        )}

        {isBoard && (
          <div
            ref={scrollRef}
            className="h-full overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div
              className="h-full w-max min-w-full origin-top-left flex flex-nowrap items-start px-4 sm:px-6"
              style={{
                gap: "10px",
              }}
            >
              {columnsContent ? (
                columnsContent
              ) : (
                <div className="text-center py-12">
                  <div className="text-muted-foreground mb-4">
                    Ce tableau ne contient aucune colonne
                  </div>
                  <Button variant="default" onClick={openAddModal}>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer votre première colonne
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ColumnModal
        isOpen={isAddColumnOpen}
        onClose={() => setIsAddColumnOpen(false)}
        onSubmit={handleCreateColumn}
        isLoading={createLoading}
        isEditing={false}
        columnForm={columnForm}
        setColumnForm={setColumnForm}
      />

      <ColumnModal
        isOpen={isEditColumnOpen}
        onClose={() => setIsEditColumnOpen(false)}
        onSubmit={handleUpdateColumn}
        isLoading={updateLoading}
        isEditing={true}
        columnForm={columnForm}
        setColumnForm={setColumnForm}
      />

      <TaskModal
        isOpen={isAddTaskOpen}
        onClose={closeAddTaskModal}
        onSubmit={handleCreateTask}
        isLoading={createTaskLoading}
        isEditing={false}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        board={board}
        workspaceId={workspaceId}
        addTag={addTag}
        removeTag={removeTag}
        addChecklistItem={addChecklistItem}
        toggleChecklistItem={toggleChecklistItem}
        removeChecklistItem={removeChecklistItem}
        addPendingComment={addPendingComment}
        removePendingComment={removePendingComment}
        updatePendingComment={updatePendingComment}
      />

      <TaskModal
        isOpen={isEditTaskOpen}
        onClose={handleCloseEditTaskModal}
        onSubmit={handleUpdateTask}
        isLoading={updateTaskLoading}
        isEditing={true}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        board={board}
        workspaceId={workspaceId}
        addTag={addTag}
        removeTag={removeTag}
        addChecklistItem={addChecklistItem}
        toggleChecklistItem={toggleChecklistItem}
        removeChecklistItem={removeChecklistItem}
        openEditTaskModal={handleOpenEditTaskModal}
        updateTask={updateTask}
        initialFormRef={initialFormRef}
        localMutationRef={localMutationRef}
      />

      <AlertDialog
        open={isDeleteColumnDialogOpen}
        onOpenChange={setIsDeleteColumnDialogOpen}
      >
        <AlertDialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la colonne ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la colonne "
              {columnToDelete?.title}" ?
              <br />
              <span className="text-red-500 font-medium">
                Cette action est irréversible et supprimera également toutes les
                tâches qu'elle contient.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteColumn}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {deleteLoading ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConvertToInvoiceModal
        open={showConvertModal}
        onOpenChange={setShowConvertModal}
        tasks={billableTasks}
        onConvert={handleConvertToInvoice}
        getEffectiveSeconds={getEffectiveSeconds}
        columns={localColumns}
        members={members}
        onOpenTask={(task) => {
          setShowConvertModal(false);
          handleOpenEditTaskModal(task);
        }}
      />
    </div>
  );
}

// Wrapper avec Suspense pour useSearchParams
// fallback=null : le composant gère son propre skeleton via la condition loading || !board
// Cela évite un double swap DOM (Suspense skeleton → component skeleton) qui causait un flash visuel
export default function KanbanBoardPage({ params }) {
  return (
    <Suspense fallback={null}>
      <KanbanBoardPageContent params={params} />
    </Suspense>
  );
}
