"use client";

import { use, useState, useEffect, useMemo, Suspense } from "react";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, LoaderCircle, Search, Trash2, AlignLeft, Filter, Users, ZoomIn, ZoomOut, FileText, Euro, CircleXIcon } from "lucide-react";
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
import { LayoutGrid, List, GanttChart } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";

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
import { useOrganizationChange } from "@/src/hooks/useOrganizationChange";
import { useWorkspace } from "@/src/hooks/useWorkspace";

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
import { KanbanPageSkeleton, KanbanListSkeleton } from "./components/KanbanPageSkeleton";
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
} from "@/src/graphql/kanbanQueries";

// @hello-pangea/dnd
import { DragDropContext } from '@hello-pangea/dnd';

import { useMutation } from "@apollo/client";

function KanbanBoardPageContent({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = use(params);
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const taskIdFromUrl = searchParams.get("task");

  // Hook viewMode en premier pour avoir le bon skeleton dès le début
  const { viewMode, setViewMode, isBoard, isList, isGantt, isReady: isViewModeReady } = useViewMode(id);

  // Hooks
  const { board, loading, error, refetch, getTasksByColumn, workspaceId, markReorderAction } =
    useKanbanBoard(id, isRedirecting);
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
  } = useKanbanTasks(id, board);

  // Mutation pour réorganiser les colonnes
  const [reorderColumnsMutation] = useMutation(REORDER_COLUMNS);

  // Colonnes dérivées du board (synchrone, pas de délai useEffect)
  const boardColumns = React.useMemo(() => {
    if (!board?.columns || !board?.tasks) return [];
    return board.columns.map(column => ({
      ...column,
      tasks: (board.tasks || [])
        .filter(task => task.columnId === column.id)
        .sort((a, b) => (a.position || 0) - (b.position || 0))
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
  const [showBoardDescriptionPopover, setShowBoardDescriptionPopover] = React.useState(false);

  // État pour le niveau de zoom du Kanban (0.7 = 70%, 1 = 100%, 1.3 = 130%)
  const [zoomLevel, setZoomLevel] = React.useState(1);

  // État pour la modale de conversion en facture
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Hook pour le filtrage par membre (AVANT useKanbanDnDSimple pour éviter l'erreur de hoisting)
  const {
    selectedMemberId,
    setSelectedMemberId,
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
    selectedMemberId // Passer le filtre pour recalculer les positions correctement
  );
  
  // Wrapper handleDragEnd — shared by both board (custom DnD) and list (@hello-pangea/dnd)
  const handleDragEnd = React.useCallback(async (result) => {
    lastDragTimeRef.current = Date.now();
    setIsDragging(false);
    if (result.type === 'column') {
      setIsDraggingColumn(false);
    }
    try {
      await dndHandleDragEnd(result);
    } catch (error) {
      console.error('❌ Erreur mutation:', error);
    }
  }, [dndHandleDragEnd]);

  // Wrapper handleDragStart — shared by both board and list
  const handleDragStart = React.useCallback((info) => {
    setIsDragging(true);
    if (info.type === 'column') {
      setIsDraggingColumn(true);
    }
  }, []);

  // Helper pour récupérer les tâches d'une colonne
  const getLocalTasksByColumn = React.useCallback((columnId) => {
    const column = localColumns.find(col => col.id === columnId);
    return column?.tasks || [];
  }, [localColumns]);


  const { searchQuery, setSearchQuery, filterTasks: filterTasksBySearch } = useKanbanSearch();

  // Ouvrir automatiquement une tâche si le paramètre ?task= est présent dans l'URL
  React.useEffect(() => {
    if (taskIdFromUrl && board?.tasks && !loading) {
      const taskToOpen = board.tasks.find(t => t.id === taskIdFromUrl);
      if (taskToOpen && !isEditTaskOpen) {
        openEditTaskModal(taskToOpen);
        // Supprimer le paramètre de l'URL après ouverture pour éviter de réouvrir
        router.replace(`/dashboard/outils/kanban/${id}`, { scroll: false });
      }
    }
  }, [taskIdFromUrl, board?.tasks, loading, isEditTaskOpen, openEditTaskModal, router, id]);

  // Fonction de filtrage combinée (recherche + membre)
  const filterTasks = React.useCallback((tasks) => {
    let filtered = filterTasksBySearch(tasks);
    filtered = filterTasksByMember(filtered);
    return filtered;
  }, [filterTasksBySearch, filterTasksByMember]);

  // Calcule le temps effectif en secondes (inclut le timer actif, comme TimerDisplay)
  const getEffectiveSeconds = React.useCallback((tt) => {
    let total = tt.totalSeconds || 0;
    if (tt.isRunning && tt.currentStartTime) {
      const elapsed = Math.floor((Date.now() - new Date(tt.currentStartTime).getTime()) / 1000);
      if (elapsed > 0) total += elapsed;
    }
    return Math.max(0, total);
  }, []);

  // Tâches facturables = temps effectif > 0 ET tarif horaire défini
  const billableTasks = useMemo(() => {
    if (!board?.tasks) return [];
    return board.tasks.filter(task => {
      if (!task.timeTracking?.hourlyRate || task.timeTracking.hourlyRate <= 0) return false;
      return getEffectiveSeconds(task.timeTracking) > 0;
    });
  }, [board?.tasks, getEffectiveSeconds]);

  // Prix total du projet
  const projectTotalPrice = useMemo(() => {
    return billableTasks.reduce((sum, task) => {
      const tt = task.timeTracking;
      const hours = getEffectiveSeconds(tt) / 3600;
      let billableHours = hours;
      if (tt.roundingOption === 'up') billableHours = Math.ceil(hours);
      else if (tt.roundingOption === 'down') billableHours = Math.floor(hours);
      return sum + (billableHours * tt.hourlyRate);
    }, 0);
  }, [billableTasks, getEffectiveSeconds]);

  // Formatage monétaire
  const formatCurrency = React.useCallback((amount) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency", currency: "EUR",
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(amount), []);

  // Conversion tâches Kanban → facture
  const handleConvertToInvoice = React.useCallback((selectedTasks) => {
    const items = selectedTasks.map(task => {
      const tt = task.timeTracking;
      const hours = getEffectiveSeconds(tt) / 3600;
      let billableHours = hours;
      if (tt.roundingOption === 'up') billableHours = Math.ceil(hours);
      else if (tt.roundingOption === 'down') billableHours = Math.floor(hours);
      return {
        description: task.title,
        details: task.description || "",
        quantity: billableHours,
        unitPrice: tt.hourlyRate,
        vatRate: 20,
        unit: "heure",
        discount: 0,
        discountType: "PERCENTAGE",
        progressPercentage: 100,
      };
    });
    sessionStorage.setItem('kanbanInvoiceItems', JSON.stringify(items));
    setShowConvertModal(false);
    router.push('/dashboard/outils/factures/new');
  }, [router, getEffectiveSeconds]);

  const {
    isColumnCollapsed,
    toggleColumnCollapse,
    expandAll,
    collapsedColumnsCount,
  } = useColumnCollapse(id);

  // Callbacks stables pour les colonnes
  const handleColumnAddTask = React.useCallback((columnId) => {
    openAddTaskModal(columnId);
  }, [openAddTaskModal]);

  const handleColumnEditTask = React.useCallback((task) => {
    openEditTaskModal(task);
  }, [openEditTaskModal]);

  const handleColumnDeleteTask = React.useCallback((task) => {
    handleDeleteTask(task);
  }, [handleDeleteTask]);

  const handleColumnEditColumn = React.useCallback((column) => {
    openEditModal(column);
  }, [openEditModal]);

  const handleColumnDeleteColumn = React.useCallback((column) => {
    handleDeleteColumn(column);
  }, [handleDeleteColumn]);

  const handleColumnToggleCollapse = React.useCallback((columnId) => {
    toggleColumnCollapse(columnId);
  }, [toggleColumnCollapse]);

  // Rendu des colonnes (custom DnD via data-attributes)
  const columnsContent = React.useMemo(() => {
    if (!localColumns || localColumns.length === 0) {
      return null;
    }

    return (
      <>
        {localColumns.map((column, index) => {
          const columnTasks = filterTasks(
            getLocalTasksByColumn(column.id)
          );
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
              zoomLevel={zoomLevel}
            />
          );
        })}

        {/* Add Column Button */}
        <Card className="w-72 sm:w-80 h-fit border-2 border-dashed border-border/50 hover:border-foreground/30 transition-colors shadow-none cursor-pointer flex-shrink-0">
          <CardContent className="p-3">
            <Button
              variant="ghost"
              className="w-full h-16 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-transparent cursor-pointer"
              onClick={openAddModal}
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm font-medium">
                Ajouter une colonne
              </span>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }, [localColumns, filterTasks, getLocalTasksByColumn, isColumnCollapsed, handleColumnAddTask, handleColumnEditTask, handleColumnDeleteTask, handleColumnEditColumn, handleColumnDeleteColumn, handleColumnToggleCollapse, loading, openAddModal, zoomLevel]);

  // Hook pour le drag-to-scroll horizontal (espace vide, hors DnD)
  const scrollElementRef = React.useRef(null);
  const dragToScrollRef = useDragToScroll({ enabled: isBoard && !isDragging, scrollSpeed: 1.5 });
  const scrollRef = React.useCallback((node) => {
    scrollElementRef.current = node;
    dragToScrollRef(node);
  }, [dragToScrollRef]);

  // Custom DnD pour le board (auto-scroll intégré, gère le zoom)
  useKanbanDnD({
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    scrollElementRef,
    zoomLevel,
    enabled: isBoard,
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
    if (previousWorkspaceIdRef.current && workspaceId && previousWorkspaceIdRef.current !== workspaceId) {
      console.log("[Kanban] 🔄 Changement de workspace détecté, redirection...", {
        from: previousWorkspaceIdRef.current,
        to: workspaceId,
      });
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

  // Pendant le chargement, afficher le skeleton
  // Note: workspaceLoading retiré car !board couvre déjà le cas où workspaceId n'est pas dispo
  // (la query est skip si !workspaceId → board reste undefined → !board = true)
  // Cela évite de montrer un skeleton inutile quand les données sont déjà en cache Apollo
  if (loading || !board) {
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
      key={`kanban-board-${id}-${isBoard ? 'board' : 'list'}`}
      className="h-[calc(100vh-64px)] flex flex-col overflow-hidden"
      style={{ pointerEvents: isBoard ? 'auto' : 'auto' }}
    >
      {/* Header - Fixe en haut */}
      <div className="flex-shrink-0 bg-background z-10">
        <div className="flex items-center gap-2 pt-2 pb-2 border-b px-4 sm:px-6">
          <h1 className="text-base font-semibold">{board.title}</h1>
          {board.description && (
            <Popover open={showBoardDescriptionPopover} onOpenChange={setShowBoardDescriptionPopover}>
              <PopoverTrigger asChild>
                <div
                  className="cursor-pointer text-muted-foreground/70 hover:text-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBoardDescriptionPopover(!showBoardDescriptionPopover);
                  }}
                >
                  <AlignLeft className="h-4 w-4" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80" side="top">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                    {board.description}
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        
        <div className="flex items-center justify-between gap-3 border-b border-[#eeeff1] dark:border-[#232323] pt-2 pb-[9px] px-4 sm:px-6 kanban-tabs">
          <style>{`
            .kanban-tabs [data-slot="tabs-trigger"][data-state="active"] {
              text-shadow: 0.015em 0 currentColor, -0.015em 0 currentColor;
            }
          `}</style>
          <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto items-center">
            <TabsList className="h-auto rounded-none bg-transparent p-0 gap-1.5">
              <TabsTrigger
                value="board"
                className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground hover:shadow-[inset_0_0_0_1px_#EEEFF1] dark:hover:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323] hidden md:inline-flex"
              >
                <LayoutGrid className="h-4 w-4" />
                Board
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground hover:shadow-[inset_0_0_0_1px_#EEEFF1] dark:hover:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323]"
              >
                <List className="h-4 w-4 md:inline hidden" />
                List
              </TabsTrigger>
              <TabsTrigger
                value="gantt"
                className="relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground hover:shadow-[inset_0_0_0_1px_#EEEFF1] dark:hover:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323] hidden md:inline-flex"
              >
                <GanttChart className="h-4 w-4" />
                Gantt
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2">
            {/* Bouton Supprimer si des tâches sont sélectionnées */}
            {selectedTaskIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  // Supprimer chaque tâche sélectionnée
                  for (const taskId of selectedTaskIds) {
                    try {
                      await handleDeleteTask(taskId);
                    } catch (error) {
                      console.error('Erreur suppression tâche:', error);
                    }
                  }
                  // Réinitialiser la sélection
                  setSelectedTaskIds(new Set());
                  toast.success(`${selectedTaskIds.size} tâche(s) supprimée(s)`);
                }}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer ({selectedTaskIds.size})
              </Button>
            )}
            
            {/* Bouton sauvegarder modèle + partage */}
            <SaveTemplateDialog
              boardId={id}
              boardTitle={board.title}
            />
            <ShareBoardDialog
              boardId={id}
              boardTitle={board.title}
              workspaceId={workspaceId}
            />
            
            <Button
              variant="primary"
              className="cursor-pointer"
              onClick={openAddModal}
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
          {/* Lien Déplier toutes */}
          {collapsedColumnsCount > 0 && (
            <button
              onClick={expandAll}
              className="text-sm text-muted-foreground hover:text-foreground cursor-pointer whitespace-nowrap transition-colors"
            >
              Déplier toutes ({collapsedColumnsCount})
            </button>
          )}

          {/* Recherche + Filtres */}
          <div className="flex items-center gap-2">
            {/* Barre de recherche */}
            <div className="flex items-center gap-2 h-8 w-full sm:w-[300px] rounded-[9px] border border-[#E6E7EA] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] bg-transparent px-3 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]">
              <Search size={16} className="text-muted-foreground/80 shrink-0" aria-hidden="true" />
              <Input
                variant="ghost"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher des tâches..."
                aria-label="Filter tasks"
              />
              {Boolean(searchQuery) && (
                <button
                  className="text-muted-foreground/80 hover:text-foreground cursor-pointer shrink-0 transition-colors outline-none"
                  aria-label="Clear filter"
                  onClick={() => setSearchQuery("")}
                >
                  <CircleXIcon size={16} aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Bouton Filtres avec dropdown utilisateur */}
            <DropdownMenu onOpenChange={(open) => { if (open) fetchMembers(); }}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={selectedMemberId ? "primary" : "filter"}
                >
                  <Filter size={14} aria-hidden="true" />
                  Filtres
                  {selectedMemberId && (
                    <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                      1
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px]">
                {/* Effacer le filtre */}
                <DropdownMenuItem
                  onClick={() => setSelectedMemberId(null)}
                  className="cursor-pointer"
                >
                  Effacer le filtre
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Sous-menu Filtre par utilisateur */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="whitespace-nowrap">
                    <Users className="h-4 w-4 mr-2" />
                    Par utilisateurs
                    {selectedMemberId && (
                      <Badge variant="secondary" className="ml-auto">
                        1
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
                            onClick={() => setSelectedMemberId(selectedMemberId === member.id ? null : member.id)}
                            className="flex items-center px-2 py-1.5 cursor-pointer text-sm"
                          >
                            {/* Avatar */}
                            {member.image ? (
                              <img
                                src={member.image}
                                alt={member.name || member.email}
                                className="w-6 h-6 rounded-full mr-2 object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full mr-2 bg-primary/20 flex items-center justify-center text-xs font-medium">
                                {(member.name || member.email).charAt(0).toUpperCase()}
                              </div>
                            )}

                            {/* Nom et checkbox */}
                            <span className="flex-1">{member.name || member.email}</span>
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                selectedMemberId === member.id
                                  ? 'bg-primary border-primary'
                                  : 'border-muted-foreground/50'
                              }`}
                            >
                              {selectedMemberId === member.id && (
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
              Dossier à <span className="bg-[#5b50ff]/10 text-[#5b50ff] px-2.5 py-1 rounded-md text-sm font-semibold ml-1.5">{formatCurrency(projectTotalPrice)}</span>
            </span>
          )}

          {/* Contrôles de zoom */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-12 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.1))}
                disabled={zoomLevel >= 1.5}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contrôles pour la vue liste - Recherche et Filtre */}
      {isList && (
        <div className="sticky left-0 px-4 sm:px-6 py-3 bg-background z-10 flex items-center gap-4">
          {/* Lien Déplier toutes */}
          {collapsedColumnsCount > 0 && (
            <button
              onClick={expandAll}
              className="text-sm text-muted-foreground hover:text-foreground cursor-pointer whitespace-nowrap transition-colors"
            >
              Déplier toutes ({collapsedColumnsCount})
            </button>
          )}

          {/* Recherche + Filtres */}
          <div className="flex items-center gap-2">
            {/* Barre de recherche */}
            <div className="flex items-center gap-2 h-8 w-full sm:w-[300px] rounded-[9px] border border-[#E6E7EA] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] bg-transparent px-3 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]">
              <Search size={16} className="text-muted-foreground/80 shrink-0" aria-hidden="true" />
              <Input
                variant="ghost"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher des tâches..."
                aria-label="Filter tasks"
              />
              {Boolean(searchQuery) && (
                <button
                  className="text-muted-foreground/80 hover:text-foreground cursor-pointer shrink-0 transition-colors outline-none"
                  aria-label="Clear filter"
                  onClick={() => setSearchQuery("")}
                >
                  <CircleXIcon size={16} aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Bouton Filtres avec dropdown utilisateur */}
            <DropdownMenu onOpenChange={(open) => { if (open) fetchMembers(); }}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={selectedMemberId ? "primary" : "filter"}
                >
                  <Filter size={14} aria-hidden="true" />
                  Filtres
                  {selectedMemberId && (
                    <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                      1
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px]">
                {/* Effacer le filtre */}
                <DropdownMenuItem
                  onClick={() => setSelectedMemberId(null)}
                  className="cursor-pointer"
                >
                  Effacer le filtre
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Sous-menu Filtre par utilisateur */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="whitespace-nowrap">
                    <Users className="h-4 w-4 mr-2" />
                    Par utilisateurs
                    {selectedMemberId && (
                      <Badge variant="secondary" className="ml-auto">
                        1
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
                            onClick={() => setSelectedMemberId(selectedMemberId === member.id ? null : member.id)}
                            className="flex items-center px-2 py-1.5 cursor-pointer text-sm"
                          >
                            {/* Avatar */}
                            {member.image ? (
                              <img
                                src={member.image}
                                alt={member.name || member.email}
                                className="w-6 h-6 rounded-full mr-2 object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full mr-2 bg-primary/20 flex items-center justify-center text-xs font-medium">
                                {(member.name || member.email).charAt(0).toUpperCase()}
                              </div>
                            )}

                            {/* Nom et checkbox */}
                            <span className="flex-1">{member.name || member.email}</span>
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                selectedMemberId === member.id
                                  ? 'bg-primary border-primary'
                                  : 'border-muted-foreground/50'
                              }`}
                            >
                              {selectedMemberId === member.id && (
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
              Dossier à <span className="bg-[#5b50ff]/10 text-[#5b50ff] px-2.5 py-1 rounded-md text-sm font-semibold ml-1.5">{formatCurrency(projectTotalPrice)}</span>
            </span>
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
            onEditTask={openEditTaskModal}
            onAddTask={openAddTaskModal}
            members={board?.members || []}
            updateTask={updateTask}
            workspaceId={workspaceId}
          />
        </div>
      )}

      {/* Board Content - Zone scrollable pour les colonnes */}
      <div className="flex-1 overflow-hidden px-4 sm:px-6 mt-4">
        {isList && (
          <div className="h-full overflow-auto">
            <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
              <KanbanListView
                columns={localColumns}
                getTasksByColumn={getLocalTasksByColumn}
                filterTasks={filterTasks}
                onEditTask={openEditTaskModal}
                onDeleteTask={handleDeleteTask}
                onAddTask={openAddTaskModal}
                onEditColumn={openEditModal}
                onDeleteColumn={handleDeleteColumn}
                members={board?.members || []}
                selectedTaskIds={selectedTaskIds}
                setSelectedTaskIds={setSelectedTaskIds}
                moveTask={moveTask}
                updateTask={updateTask}
                workspaceId={workspaceId}
              />
            </DragDropContext>
          </div>
        )}

        {isBoard && (
          <div
            ref={scrollRef}
            className="h-full overflow-x-auto overflow-y-hidden pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div
              className="h-full w-max min-w-full origin-top-left flex flex-nowrap items-start"
              style={{
                zoom: zoomLevel,
                gap: '16px'
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
        onClose={closeEditTaskModal}
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