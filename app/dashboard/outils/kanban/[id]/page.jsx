"use client";

import { use, useState, useEffect } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, LoaderCircle, Search, Trash2 } from "lucide-react";
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
} from "@/src/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";

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
import { MemberFilterButton } from "./components/MemberFilterButton";
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
    moveTask,
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
        <div className="h-5 mb-4"></div>

        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <Droppable droppableId="all-columns" direction="horizontal" type="column">
            {(provided, snapshot) => (
              <div 
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex flex-nowrap items-start"
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

  const { viewMode, setViewMode, isBoard, isList } = useViewMode(id);

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
      <div className="px-4 sm:px-6 py-2 sticky left-0 bg-background z-10 border-b">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-base font-semibold">{board.title}</h1>
          {board.description && (
            <span className="text-muted-foreground text-xs">
              {board.description}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value)}
              className="bg-muted/50 rounded-md p-0.5"
            >
              <ToggleGroupItem
                value="board"
                aria-label="Vue tableau"
                className="data-[state=on]:bg-background data-[state=on]:shadow-sm gap-2 px-3 py-2 rounded-sm hidden md:flex"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="text-sm font-medium">Board</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="list"
                aria-label="Vue liste"
                className="data-[state=on]:bg-background data-[state=on]:shadow-sm gap-2 px-3 py-2 rounded-sm"
              >
                <List className="h-4 w-4 md:inline hidden" />
                <span className="text-sm font-medium">List</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher des tâches..."
                className="pl-8 w-56 border-muted-foreground/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

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
            
            {/* Bouton de filtre par utilisateur */}
            <MemberFilterButton
              members={members}
              selectedMemberId={selectedMemberId}
              onMemberChange={setSelectedMemberId}
              loading={membersLoading}
            />
            
            {collapsedColumnsCount > 0 && isBoard && (
              <Button
                variant="outline"
                onClick={expandAll}
                className="whitespace-nowrap hidden sm:flex"
              >
                Déplier toutes ({collapsedColumnsCount})
              </Button>
            )}
            {isBoard && (
              <Button
                variant="default"
                className="font-medium whitespace-nowrap"
                onClick={openAddModal}
              >
                Ajouter une colonne
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="w-full px-4 sm:px-6">
        {isList && (
          <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
            <KanbanListView
              columns={localColumns}
              getTasksByColumn={getLocalTasksByColumn}
              filterTasks={filterTasks}
              onEditTask={openEditTaskModal}
              onDeleteTask={handleDeleteTask}
              onAddTask={openAddTaskModal}
              members={board?.members || []}
              selectedTaskIds={selectedTaskIds}
              setSelectedTaskIds={setSelectedTaskIds}
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