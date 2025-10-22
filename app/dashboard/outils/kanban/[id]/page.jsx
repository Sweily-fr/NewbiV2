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
import { useKanbanDnD } from "./hooks/useKanbanDnD";
import { useKanbanSearch } from "./hooks/useKanbanSearch";
import { useColumnCollapse } from "./hooks/useColumnCollapse";
import { useDragToScroll } from "./hooks/useDragToScroll";
import { useViewMode } from "./hooks/useViewMode";
// import { useKanbanRealtimeSync } from "./hooks/useKanbanRealtimeSync"; // SUPPRIMÉ : doublon de useKanbanBoard
import { useOrganizationChange } from "@/src/hooks/useOrganizationChange";
import { useWorkspace } from "@/src/hooks/useWorkspace";

// Components
import { KanbanColumn } from "./components/KanbanColumn";
import { SortableColumn } from "./components/SortableColumn";
import { TaskModal } from "./components/TaskModal";
import { ColumnModal } from "./components/ColumnModal";
import { DeleteConfirmation } from "./components/DeleteConfirmation";
import { TaskCard } from "./components/TaskCard";
import { KanbanListView } from "./components/KanbanListView";
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
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation } from "@apollo/client";

export default function KanbanBoardPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  // Hooks
  const { board, loading, error, refetch, getTasksByColumn, workspaceId } =
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
  const [reorderColumnsMutation] = useMutation(REORDER_COLUMNS, {
    refetchQueries: ["GetBoard"],
    awaitRefetchQueries: false, // Ne pas attendre le refetch pour ne pas bloquer l'UI
  });

  // État local pour les colonnes (pour la réorganisation en temps réel)
  const [localColumns, setLocalColumns] = React.useState(board?.columns || []);

  // SUPPRIMÉ : useKanbanRealtimeSync (doublon de useKanbanBoard qui gère déjà les subscriptions)
  // Les subscriptions sont gérées dans useKanbanBoard avec TASK_UPDATED_SUBSCRIPTION et COLUMN_UPDATED_SUBSCRIPTION

  const { activeTask, activeColumn, sensors, handleDragStart, handleDragOver, handleDragEnd } =
    useKanbanDnD(
      moveTask,
      getTasksByColumn,
      id,
      workspaceId,
      localColumns,
      reorderColumnsMutation,
      setLocalColumns,
      null // markAsUpdating n'est plus nécessaire
    );

  // Mettre à jour les colonnes locales quand board.columns change
  // Uniquement au chargement initial ou si de nouvelles colonnes sont ajoutées/supprimées
  React.useEffect(() => {
    if (board?.columns && board.columns.length > 0) {
      const currentIds = localColumns.map(c => c.id).sort().join(',');
      const newIds = board.columns.map(c => c.id).sort().join(',');
      
      // Ne mettre à jour que si le nombre de colonnes a changé (ajout/suppression)
      if (currentIds !== newIds) {
        console.log('🔄 Mise à jour des colonnes (ajout/suppression détecté)');
        setLocalColumns(board.columns);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board?.columns?.length, board?.columns?.map(c => c.id).join(',')]);

  const { searchQuery, setSearchQuery, filterTasks } = useKanbanSearch();

  const {
    isColumnCollapsed,
    toggleColumnCollapse,
    expandAll,
    collapsedColumnsCount,
  } = useColumnCollapse(id);

  // Hook pour le mode d'affichage (Board/List)
  const { viewMode, setViewMode, isBoard, isList } = useViewMode(id);

  // Hook pour le scroll horizontal par glissement (uniquement en mode Board et quand board est chargé)
  const scrollRef = useDragToScroll({ 
    enabled: isBoard && !!board, 
    scrollSpeed: 1.5 
  });

  // Détecter les changements d'organisation et rediriger IMMÉDIATEMENT
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

  // Rediriger si le board n'existe pas (erreur GraphQL)
  useEffect(() => {
    if (error && workspaceId && !isRedirecting) {
      // Redirection silencieuse - c'est normal lors d'un changement d'organisation
      setIsRedirecting(true);
      router.push("/dashboard/outils/kanban");
    }
  }, [error, workspaceId, router, id, isRedirecting]);

  // Attendre que le workspace soit chargé avant de vérifier l'existence du board
  if (workspaceLoading) {
    return null; // Afficher le loading pendant que le workspace se charge
  }

  // Si un changement d'organisation est en cours, ne rien afficher (redirection en cours)
  if (hasChangedOrganization) {
    return null;
  }

  // Si on est en train de rediriger ou si le board n'existe pas, ne rien afficher
  if (isRedirecting || !board) {
    return null; // Redirection silencieuse en cours
  }

  return (
    <div 
      ref={scrollRef}
      key={`kanban-board-${id}-${isBoard ? 'board' : 'list'}`}
      className="w-full max-w-[100vw] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      {/* Header */}
      <div className="px-4 sm:px-6 py-2 sticky left-0 bg-background z-10 border-b">
        {/* Ligne 1 : Titre et description */}
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-base font-semibold">{board.title}</h1>
          {board.description && (
            <span className="text-muted-foreground text-xs">
              {board.description}
            </span>
          )}
        </div>
        
        {/* Ligne 2 : View toggle + Search + Actions */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: View Mode Toggle avec labels */}
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
                <List className="h-4 w-4" />
                <span className="text-sm font-medium">List</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          {/* Right: Search + Actions */}
          <div className="flex items-center gap-2">
            {/* Search bar */}
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
            
            {/* Action buttons */}
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
        {/* Vue Liste avec DnD */}
        {isList && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <KanbanListView
              columns={localColumns}
              getTasksByColumn={getTasksByColumn}
              onEditTask={openEditTaskModal}
              onDeleteTask={handleDeleteTask}
              onAddTask={openAddTaskModal}
              members={board?.members || []}
            />
            <DragOverlay>
              {activeTask ? (
                <div className="bg-background border shadow-lg rounded-lg p-3 opacity-90">
                  <div className="text-sm font-medium">{activeTask.title}</div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Vue Board */}
        {isBoard && (
        <DndContext
          sensors={sensors}
          collisionDetection={(args) => {
            // Pour les colonnes, utiliser pointerWithin pour une meilleure détection
            if (args.active.data.current?.type === 'column') {
              return pointerWithin(args);
            }
            // Pour les tâches, utiliser closestCenter
            return closestCenter(args);
          }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="min-h-[600px] w-max min-w-full">
            {localColumns && localColumns.length > 0 ? (
              <>
                {/* Espace réservé pour maintenir la hauteur */}
                <div className="h-5 mb-4"></div>

                <div className="flex overflow-x-auto pb-4 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <SortableContext
                    items={localColumns.map((col) => col.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    <div className="flex gap-4 sm:gap-6 flex-nowrap items-start">
                      {localColumns.map((column) => {
                        const columnTasks = filterTasks(
                          getTasksByColumn(column.id)
                        );
                        const isCollapsed = isColumnCollapsed(column.id);

                        return (
                          <SortableColumn key={column.id} column={column}>
                            <KanbanColumn
                              column={column}
                              tasks={columnTasks}
                              onAddTask={openAddTaskModal}
                              onEditTask={openEditTaskModal}
                              onDeleteTask={handleDeleteTask}
                              onEditColumn={openEditModal}
                              onDeleteColumn={(column) =>
                                handleDeleteColumn(column)
                              }
                              isCollapsed={isCollapsed}
                              onToggleCollapse={() =>
                                toggleColumnCollapse(column.id)
                              }
                            />
                          </SortableColumn>
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
                    </div>
                  </SortableContext>
                </div>
              </>
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

          <DragOverlay
            adjustScale={false}
            dropAnimation={{
              duration: 250,
              easing: "cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          >
            {activeTask ? (
              <div className="transform rotate-3 scale-105 shadow-2xl">
                <TaskCard
                  task={activeTask}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              </div>
            ) : null}
            {activeColumn ? (
              <div className="rotate-6 scale-105">
                {/* Fond noir semi-transparent comme Trello */}
                <div className="relative">
                  <div className="absolute inset-0 bg-black/40 rounded-xl" />
                  <div className="relative bg-muted/95 rounded-xl p-3 min-w-[280px] max-w-[280px] sm:min-w-[300px] sm:max-w-[300px] border-2 border-primary shadow-2xl">
                    {/* Header de la colonne */}
                    <div className="flex items-center gap-2 py-2 mb-3">
                      <div
                        className="w-[2px] h-4"
                        style={{ backgroundColor: activeColumn.color }}
                      />
                      <h3 className="font-medium text-foreground">
                        {activeColumn.title}
                      </h3>
                      <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 font-medium text-xs border-transparent bg-secondary text-secondary-foreground">
                        {getTasksByColumn(activeColumn.id).length}
                      </span>
                    </div>
                    
                    {/* Aperçu des tâches */}
                    <div className="space-y-2 max-h-[400px] overflow-hidden">
                      {getTasksByColumn(activeColumn.id).slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className="bg-card rounded-lg p-2 border border-border shadow-sm"
                        >
                          <p className="text-sm text-foreground line-clamp-2">
                            {task.title}
                          </p>
                        </div>
                      ))}
                      {getTasksByColumn(activeColumn.id).length > 3 && (
                        <div className="text-xs text-muted-foreground text-center py-1">
                          +{getTasksByColumn(activeColumn.id).length - 3} autres tâches
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        )}
      </div>

      {/* Column Modals */}
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

      {/* Task Modals */}
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

      {/* Boîte de dialogue de confirmation de suppression de colonne */}
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
