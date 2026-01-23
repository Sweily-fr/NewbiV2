"use client";

import { use, useState, useEffect } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, LoaderCircle, Search, Trash2, AlignLeft, Filter, Users } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";

// UI Components
import { Button } from "@/src/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/src/components/ui/button-group";
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
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import { useMutation } from "@apollo/client";

export default function KanbanBoardPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  // Hooks
  const { board, loading, error, refetch, getTasksByColumn, workspaceId, markReorderAction } =
    useKanbanBoard(id, isRedirecting);
  const { loading: workspaceLoading } = useWorkspace();

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

  // État local pour les colonnes
  const [localColumns, setLocalColumns] = React.useState(board?.columns || []);
  
  // Ref pour tracker le dernier drag
  const lastDragTimeRef = React.useRef(0);
  
  // State pour tracker si on drag une colonne
  const [isDraggingColumn, setIsDraggingColumn] = React.useState(false);
  
  // État pour les tâches sélectionnées
  const [selectedTaskIds, setSelectedTaskIds] = React.useState(new Set());

  // État pour le popover de description du tableau
  const [showBoardDescriptionPopover, setShowBoardDescriptionPopover] = React.useState(false);

  // Hook pour le filtrage par membre (AVANT useKanbanDnDSimple pour éviter l'erreur de hoisting)
  const {
    selectedMemberId,
    setSelectedMemberId,
    members,
    loading: membersLoading,
    filterTasksByMember,
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
  
  // Wrapper pour handleDragEnd : gérer le polling
  const handleDragEnd = React.useCallback(async (result) => {
    // Marquer le temps du drag
    lastDragTimeRef.current = Date.now();
    
    // Arrêter le drag des colonnes
    if (result.type === 'column') {
      setIsDraggingColumn(false);
    }
    
    try {
      await dndHandleDragEnd(result);
    } catch (error) {
      console.error('❌ Erreur mutation:', error);
    }
    // Plus de polling - les subscriptions WebSocket temps réel suffisent
  }, [dndHandleDragEnd]);

  // Détecter le début du drag des colonnes
  const handleDragStart = React.useCallback((result) => {
    if (result.type === 'column') {
      setIsDraggingColumn(true);
    }
    // Plus de polling - les subscriptions WebSocket temps réel suffisent
  }, []);

  // Helper pour récupérer les tâches d'une colonne
  const getLocalTasksByColumn = React.useCallback((columnId) => {
    const column = localColumns.find(col => col.id === columnId);
    return column?.tasks || [];
  }, [localColumns]);

  // Mettre à jour localColumns quand board change
  React.useEffect(() => {
    if (board?.columns && board?.tasks) {
      // Ne pas mettre à jour si un drag vient de se produire (< 2 secondes)
      const timeSinceLastDrag = Date.now() - lastDragTimeRef.current;
      if (timeSinceLastDrag < 2000) {
        console.log('⏸️ Mise à jour ignorée (drag récent)', timeSinceLastDrag + 'ms');
        return;
      }
      
      const columnsWithTasks = board.columns.map(column => ({
        ...column,
        tasks: (board.tasks || [])
          .filter(task => task.columnId === column.id)
          .sort((a, b) => (a.position || 0) - (b.position || 0))
      }));
      
      setLocalColumns(columnsWithTasks);
    }
  }, [board?.id, board?.columns, board?.tasks]);

  const { searchQuery, setSearchQuery, filterTasks: filterTasksBySearch } = useKanbanSearch();

  // Fonction de filtrage combinée (recherche + membre)
  const filterTasks = React.useCallback((tasks) => {
    let filtered = filterTasksBySearch(tasks);
    filtered = filterTasksByMember(filtered);
    return filtered;
  }, [filterTasksBySearch, filterTasksByMember]);

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

  // Rendu des colonnes avec @hello-pangea/dnd
  const columnsContent = React.useMemo(() => {
    if (!localColumns || localColumns.length === 0) {
      return null;
    }

    return (
      <>
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <Droppable droppableId="all-columns" direction="horizontal" type="column">
            {(provided, snapshot) => (
              <div 
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex flex-nowrap items-start gap-4"
              >
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
                      isDraggingAnyColumn={isDraggingColumn}
                    />
                  );
                })}
                {provided.placeholder}

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
              </div>
            )}
          </Droppable>
        </div>
      </>
    );
  }, [localColumns, filterTasks, getLocalTasksByColumn, isColumnCollapsed, handleColumnAddTask, handleColumnEditTask, handleColumnDeleteTask, handleColumnEditColumn, handleColumnDeleteColumn, handleColumnToggleCollapse, loading, openAddModal]);

  const { viewMode, setViewMode, isBoard, isList, isGantt } = useViewMode(id);

  // Hook pour le drag-to-scroll horizontal
  const scrollRef = useDragToScroll({ enabled: isBoard, scrollSpeed: 1.5 });

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

  if (workspaceLoading) {
    return null;
  }

  if (hasChangedOrganization) {
    return null;
  }

  if (isRedirecting || !board) {
    return null;
  }

  return (
    <div 
      ref={scrollRef}
      key={`kanban-board-${id}-${isBoard ? 'board' : 'list'}`}
      className="w-full max-w-[100vw] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ pointerEvents: isBoard ? 'auto' : 'auto' }}
    >
      {/* Header */}
      <div className="sticky left-0 bg-background z-10">
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
        
        <div className="flex items-center justify-between gap-3 py-3 border-b px-4 sm:px-6">
          <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto items-center">
            <TabsList className="h-auto rounded-none bg-transparent p-0">
              <TabsTrigger
                value="board"
                className="data-[state=active]:after:bg-primary cursor-pointer relative rounded-none py-2 px-3 md:px-4 after:absolute after:inset-x-0 after:-bottom-3 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-normal text-xs md:text-sm gap-2 hidden md:inline-flex hover:bg-[#5b50ff]/10 hover:text-[#5b50ff] rounded-md transition-colors"
              >
                <LayoutGrid className="h-4 w-4" />
                <span>Board</span>
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="data-[state=active]:after:bg-primary cursor-pointer relative rounded-none py-2 px-3 md:px-4 after:absolute after:inset-x-0 after:-bottom-3 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-normal text-xs md:text-sm gap-2 hover:bg-[#5b50ff]/10 hover:text-[#5b50ff] rounded-md transition-colors"
              >
                <List className="h-4 w-4 md:inline hidden" />
                <span>List</span>
              </TabsTrigger>
              <TabsTrigger
                value="gantt"
                className="data-[state=active]:after:bg-primary cursor-pointer relative rounded-none py-2 px-3 md:px-4 after:absolute after:inset-x-0 after:-bottom-3 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-normal text-xs md:text-sm gap-2 hidden md:inline-flex hover:bg-[#5b50ff]/10 hover:text-[#5b50ff] rounded-md transition-colors"
              >
                <GanttChart className="h-4 w-4" />
                <span>Gantt</span>
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
            
            {/* Bouton de partage */}
            <ShareBoardDialog 
              boardId={id} 
              boardTitle={board.title} 
              workspaceId={workspaceId} 
            />
            
            <ButtonGroup>
              <Button
                onClick={openAddModal}
                className="cursor-pointer font-normal bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                {isBoard ? "Ajouter une colonne" : "Nouveau status"}
              </Button>
              <ButtonGroupSeparator />
              <Button
                onClick={openAddModal}
                size="icon"
                className="cursor-pointer bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </ButtonGroup>
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

          {/* ButtonGroup: Recherche + Filtres */}
          <ButtonGroup>
            {/* Barre de recherche */}
            <div className="relative flex-1">
              <Input
                placeholder="Rechercher des tâches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-[150px] lg:w-[250px] ps-9 rounded-r-none"
              />
              <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                <Search size={16} aria-hidden="true" />
              </div>
            </div>

            {/* Bouton Filtres avec dropdown utilisateur */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 gap-2 font-normal rounded-l-none"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filtres</span>
                  {selectedMemberId && (
                    <Badge variant="secondary" className="ml-1">
                      1
                    </Badge>
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
          </ButtonGroup>
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

          {/* ButtonGroup: Recherche + Filtres */}
          <ButtonGroup>
            {/* Barre de recherche */}
            <div className="relative flex-1">
              <Input
                placeholder="Rechercher des tâches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-[150px] lg:w-[250px] ps-9 rounded-r-none"
              />
              <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                <Search size={16} aria-hidden="true" />
              </div>
            </div>

            {/* Bouton Filtres avec dropdown utilisateur */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 gap-2 font-normal rounded-l-none"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filtres</span>
                  {selectedMemberId && (
                    <Badge variant="secondary" className="ml-1">
                      1
                    </Badge>
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
          </ButtonGroup>
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

      {/* Board Content avec padding pour liste et board */}
      <div className="w-full px-4 sm:px-6 mt-4">
        {isList && (
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
        )}

        {isBoard && (
          <>
            {loading ? (
              <div className="flex overflow-x-auto pb-4 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="flex gap-4 sm:gap-6 flex-nowrap items-start">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-muted/30 rounded-xl p-2 sm:p-3 min-w-[240px] max-w-[240px] sm:min-w-[300px] sm:max-w-[300px] border border-border flex-shrink-0">
                      <div className="h-8 bg-muted rounded mb-3"></div>
                      <div className="space-y-2">
                        <div className="h-[148px] bg-muted rounded"></div>
                        <div className="h-[148px] bg-muted rounded"></div>
                        <div className="h-[148px] bg-muted rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                <div className="min-h-[600px] w-max min-w-full">
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
              </DragDropContext>
            )}
          </>
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
    </div>
  );
}