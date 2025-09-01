"use client";

import { use, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Loader2, Search, Trash2 } from "lucide-react";
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

// Hooks
import { useKanbanBoard } from "./hooks/useKanbanBoard";
import { useKanbanColumns } from "./hooks/useKanbanColumns";
import { useKanbanTasks } from "./hooks/useKanbanTasks";
import { useKanbanDnD } from "./hooks/useKanbanDnD";
import { useKanbanSearch } from "./hooks/useKanbanSearch";
import { useColumnCollapse } from "./hooks/useColumnCollapse";

// Components
import { KanbanColumn } from "./components/KanbanColumn";
import { TaskModal } from "./components/TaskModal";
import { ColumnModal } from "./components/ColumnModal";
import { DeleteConfirmation } from "./components/DeleteConfirmation";
import { TaskCard } from "./components/TaskCard";
import {
  GET_BOARD,
  CREATE_COLUMN,
  UPDATE_COLUMN,
  DELETE_COLUMN,
  CREATE_TASK,
  UPDATE_TASK,
  DELETE_TASK,
  MOVE_TASK,
} from "@/src/graphql/kanbanQueries";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function KanbanBoardPage({ params }) {
  const router = useRouter();
  const { id } = use(params);

  // Hooks
  const { board, loading, error, refetch, getTasksByColumn } =
    useKanbanBoard(id);

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

  const { activeTask, sensors, handleDragStart, handleDragEnd } = useKanbanDnD(
    moveTask,
    getTasksByColumn,
    id
  );

  const { searchQuery, setSearchQuery, filterTasks } = useKanbanSearch();

  const {
    isColumnCollapsed,
    toggleColumnCollapse,
    expandAll,
    collapsedColumnsCount,
  } = useColumnCollapse(id);

  // La gestion du chargement et des erreurs est gérée par les fichiers spéciaux Next.js
  // loading.jsx et error.jsx dans ce même dossier

  // Vérifier que les données sont chargées
  if (!board) {
    return null; // Le composant loading.jsx s'affichera
  }

  return (
    <div className="w-full max-w-[100vw] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Header */}
      <div className="mx-auto pt-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/outils/kanban")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button> */}
            <div>
              <h1 className="text-xl font-medium mb-2">{board.title}</h1>
              <p className="text-muted-foreground text-sm">
                {board.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {collapsedColumnsCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={expandAll}
                className="text-xs whitespace-nowrap"
              >
                Déplier toutes ({collapsedColumnsCount})
              </Button>
            )}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher des tâches (titre, description, tags, dates...)"
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="default"
              className="font-normal"
              onClick={openAddModal}
            >
              Ajouter une colonne
            </Button>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="w-full overflow-x-auto px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[]}
        >
          <div className="min-h-[600px] w-max min-w-full">
            {board.columns && board.columns.length > 0 ? (
              <>
                {/* Espace réservé pour maintenir la hauteur */}
                <div className="h-5 mb-4"></div>

                <div className="flex overflow-x-auto pb-4 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <div className="flex gap-6 flex-nowrap items-start">
                    {board.columns.map((column) => {
                      const columnTasks = filterTasks(
                        getTasksByColumn(column.id)
                      );
                      const isCollapsed = isColumnCollapsed(column.id);

                      return (
                        <KanbanColumn
                          key={column.id}
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
                      );
                    })}

                    {/* Add Column Button */}
                    <Card className="w-80 h-fit border-2 border-dashed border-border/50 hover:border-foreground/30 transition-colors shadow-none cursor-pointer">
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
              duration: 300,
              easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
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
          </DragOverlay>
        </DndContext>
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
