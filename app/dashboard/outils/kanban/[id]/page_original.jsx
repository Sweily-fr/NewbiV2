"use client";

import { useState, use, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Settings,
  Loader2,
  Edit,
  Trash2,
  GripVertical,
  Calendar,
  User,
  Tag,
  CheckSquare,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
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
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Progress } from "@/src/components/ui/progress";
import {
  useKanbanBoard,
  useKanbanColumns,
  useKanbanTasks,
  useKanbanDragDrop,
  useKanbanColumnForm,
  useKanbanTaskForm,
} from "../hooks";
import { useColumnCollapse } from "@/src/hooks/useColumnCollapse";
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

  // Utilisation des hooks pour gérer les différentes fonctionnalités
  const { board, loading, error } = useKanbanBoard(id);

  const {
    // États des modals de colonnes
    isAddColumnOpen,
    setIsAddColumnOpen,
    isEditColumnOpen,
    setIsEditColumnOpen,
    isDeleteColumnOpen,
    setIsDeleteColumnOpen,
    selectedColumn,
    // Actions sur les colonnes
    creatingColumn,
    updatingColumn,
    deletingColumn,
    handleCreateColumn,
    handleUpdateColumn,
    handleDeleteColumn,
    handleEditColumnClick,
    handleDeleteColumnClick,
  } = useKanbanColumns(id);

  const {
    // États des modals de tâches
    isAddTaskOpen,
    setIsAddTaskOpen,
    isEditTaskOpen,
    setIsEditTaskOpen,
    isDeleteTaskOpen,
    setIsDeleteTaskOpen,
    selectedTask,
    // Actions sur les tâches
    creatingTask,
    updatingTask,
    deletingTask,
    handleCreateTask,
    handleUpdateTask,
    handleDeleteTask,
    handleEditTaskClick,
    handleDeleteTaskClick,
    handleAddTaskClick,
  } = useKanbanTasks(id);

  const {
    // Drag & Drop
    activeId,
    sensors,
    handleDragStart,
    handleDragEnd,
    movingTask,
  } = useKanbanDragDrop(id);

  // Formulaires
  const columnForm = useKanbanColumnForm();
  const taskForm = useKanbanTaskForm();

  // Configuration des sensors pour le drag & drop
  const sensorsState = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data, loading: dataLoading, error: dataError, refetch } = useQuery(GET_BOARD, {
    variables: { id },
    errorPolicy: "all",
  });

  // Mutations GraphQL pour les colonnes
  const [createColumn, { loading: createLoading }] = useMutation(
    CREATE_COLUMN,
    {
      refetchQueries: [{ query: GET_BOARD, variables: { id } }],
      onCompleted: () => {
        toast.success("Colonne créée avec succès");
        setIsAddColumnOpenState(false);
        columnForm.reset();
      },
      onError: (error) => {
        toast.error("Erreur lors de la création de la colonne");
      },
    }
  );

  const [updateColumn, { loading: updateLoading }] = useMutation(
    UPDATE_COLUMN,
    {
      refetchQueries: [{ query: GET_BOARD, variables: { id } }],
      onCompleted: () => {
        toast.success("Colonne modifiée avec succès");
        setIsEditColumnOpenState(false);
        setEditingColumn(null);
        columnForm.reset();
      },
      onError: (error) => {
        toast.error("Erreur lors de la modification de la colonne");
      },
    }
  );

  const [deleteColumn, { loading: deleteLoading }] = useMutation(
    DELETE_COLUMN,
    {
      refetchQueries: [{ query: GET_BOARD, variables: { id } }],
      onCompleted: () => {
        toast.success("Colonne supprimée avec succès");
      },
      onError: (error) => {
        toast.error("Erreur lors de la suppression de la colonne");
      },
    }
  );

  // Mutations GraphQL pour les tâches
  const [createTask, { loading: createTaskLoading }] = useMutation(
    CREATE_TASK,
    {
      refetchQueries: [{ query: GET_BOARD, variables: { id } }],
      onCompleted: () => {
        toast.success("Tâche créée avec succès");
        setIsAddTaskOpenState(false);
        setTaskFormState(initialTaskForm);
        setSelectedColumnId(null);
      },
      onError: (error) => {
        toast.error("Erreur lors de la création de la tâche");
      },
    }
  );

  const [updateTask, { loading: updateTaskLoading }] = useMutation(
    UPDATE_TASK,
    {
      refetchQueries: [{ query: GET_BOARD, variables: { id } }],
      onCompleted: () => {
        toast.success("Tâche modifiée avec succès");
        setIsEditTaskOpenState(false);
        setEditingTask(null);
        setTaskFormState(initialTaskForm);
      },
      onError: (error) => {
        toast.error("Erreur lors de la modification de la tâche");
      },
    }
  );

  const [deleteTask, { loading: deleteTaskLoading }] = useMutation(
    DELETE_TASK,
    {
      refetchQueries: [{ query: GET_BOARD, variables: { id } }],
      onCompleted: () => {
        toast.success("Tâche supprimée avec succès");
      },
      onError: (error) => {
        toast.error("Erreur lors de la suppression de la tâche");
      },
    }
  );

  const [moveTask] = useMutation(MOVE_TASK, {
    onCompleted: () => {
      toast.success("Tâche déplacée avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors du déplacement de la tâche");
    },
  });

  const board = data?.board;

  // Organiser les tâches par colonne
  const getTasksByColumn = (columnId) => {
    if (!board?.tasks) return [];
    return board.tasks
      .filter((task) => task.columnId === columnId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  };

  // Fonction pour filtrer les tâches selon la recherche
  const filterTasks = (tasks = []) => {
    if (!searchQuery?.trim()) return tasks;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return tasks;

    return tasks.filter((task) => {
      if (!task) return false;

      // Vérifier le titre et la description
      if (
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      ) {
        return true;
      }

      // Vérifier les tags
      if (
        Array.isArray(task.tags) &&
        task.tags.some(
          (tag) =>
            tag?.name?.toLowerCase().includes(query) ||
            tag?.color?.toLowerCase().includes(query)
        )
      ) {
        return true;
      }

      // Vérifier la checklist
      if (
        Array.isArray(task.checklist) &&
        task.checklist.some((item) => item?.text?.toLowerCase().includes(query))
      ) {
        return true;
      }

      // Vérifier la date d'échéance
      try {
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          if (!isNaN(dueDate.getTime())) {
            const dateFormats = [
              dueDate.toLocaleDateString("fr-FR"), // 03/07/2025
              dueDate.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }), // 3 juillet 2025
              dueDate.toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }), // July 3, 2025
              dueDate.toISOString().split("T")[0], // 2025-07-03
            ];

            if (
              dateFormats.some((format) =>
                format?.toLowerCase().includes(query)
              )
            ) {
              return true;
            }
          }
        }
      } catch (e) {
        console.error("Erreur lors du traitement de la date:", e);
      }

      return false;
    });
  };

  // Fonctions de gestion des colonnes
  const handleCreateColumn = async () => {
    if (!columnForm.title.trim()) {
      toast.error("Le titre de la colonne est requis");
      return;
    }

    try {
      await createColumn({
        variables: {
          input: {
            title: columnForm.title,
            color: columnForm.color,
            boardId: id,
            order: board?.columns?.length || 0,
          },
        },
      });
    } catch (error) {
      console.error("Error creating column:", error);
    }
  };

  const handleUpdateColumn = async () => {
    if (!columnForm.title.trim()) {
      toast.error("Le titre de la colonne est requis");
      return;
    }

    try {
      await updateColumn({
        variables: {
          input: {
            id: editingColumn.id,
            title: columnForm.title,
            color: columnForm.color,
          },
        },
      });
    } catch (error) {
      console.error("Error updating column:", error);
    }
  };

  const handleDeleteColumn = (column) => {
    // Si column est un objet, on le stocke tel quel, sinon on crée un objet avec l'ID
    const columnToStore = typeof column === 'object' ? column : { id: column };
    setColumnToDelete(columnToStore);
    setIsDeleteColumnDialogOpen(true);
  };

  const confirmDeleteColumn = async () => {
    if (!columnToDelete) return;

    try {
      // S'assurer que l'ID est correctement formaté comme une chaîne
      const columnId = columnToDelete.id.toString();
      await deleteColumn({ 
        variables: { 
          id: columnId
        } 
      });
      setIsDeleteColumnDialogOpen(false);
      setColumnToDelete(null);
    } catch (error) {
      console.error("Error deleting column:", error);
      toast.error("Erreur lors de la suppression de la colonne");
    }
  };

  const openEditModal = (column) => {
    setEditingColumn(column);
    setColumnForm({ title: column.title, color: column.color });
    setIsEditColumnOpen(true);
  };

  const openAddModal = () => {
    setColumnForm({ title: "", color: "#3b82f6" });
    setIsAddColumnOpen(true);
  };

  // Fonctions de gestion des tâches
  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      toast.error("Le titre de la tâche est requis");
      return;
    }

    try {
      const columnTasks = getTasksByColumn(selectedColumnId);
      await createTask({
        variables: {
          input: {
            title: taskForm.title,
            description: taskForm.description,
            status: taskForm.status,
            priority: taskForm.priority
              ? taskForm.priority.toLowerCase()
              : "medium",
            dueDate: taskForm.dueDate || null,
            columnId: selectedColumnId,
            boardId: id,
            position: columnTasks.length,
            tags: taskForm.tags.map((tag) => ({
              name: tag.name,
              className: tag.className || "",
              bg: tag.bg || "",
              text: tag.text || "",
              border: tag.border || "",
            })),
            checklist: taskForm.checklist.map((item) => ({
              text: item.text,
              completed: item.completed || false,
            })),
          },
        },
      });
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Erreur lors de la création de la tâche");
    }
  };

  const handleUpdateTask = async () => {
    if (!taskForm.title.trim()) {
      toast.error("Le titre de la tâche est requis");
      return;
    }

    try {
      await updateTask({
        variables: {
          input: {
            id: editingTask.id,
            title: taskForm.title,
            description: taskForm.description,
            status: taskForm.status,
            priority: taskForm.priority
              ? taskForm.priority.toLowerCase()
              : "medium",
            dueDate: taskForm.dueDate || null,
            columnId: taskForm.columnId, // Ajout du columnId
            tags: taskForm.tags.map((tag) => ({
              name: tag.name,
              className: tag.className || "",
              bg: tag.bg || "",
              text: tag.text || "",
              border: tag.border || "",
            })),
            checklist: taskForm.checklist.map((item) => ({
              id: item.id || undefined,
              text: item.text,
              completed: item.completed || false,
            })),
          },
        },
        // Mise à jour optimiste du cache pour un rendu instantané
        optimisticResponse: {
          updateTask: {
            __typename: "Task",
            id: editingTask.id,
            title: taskForm.title,
            description: taskForm.description,
            status: taskForm.status,
            priority: taskForm.priority
              ? taskForm.priority.toLowerCase()
              : "medium",
            dueDate: taskForm.dueDate || null,
            columnId: taskForm.columnId,
            tags: taskForm.tags,
            checklist: taskForm.checklist,
            position: editingTask.position || 0,
          },
        },
        update: (cache, { data }) => {
          // Mise à jour du cache Apollo pour refléter le changement de colonne
          const existingData = cache.readQuery({
            query: GET_BOARD,
            variables: { id },
          });

          if (existingData && data?.updateTask) {
            const updatedTasks = existingData.board.tasks.map((task) =>
              task.id === data.updateTask.id ? data.updateTask : task
            );

            cache.writeQuery({
              query: GET_BOARD,
              variables: { id },
              data: {
                ...existingData,
                board: {
                  ...existingData.board,
                  tasks: updatedTasks,
                },
              },
            });
          }
        },
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Erreur lors de la mise à jour de la tâche");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask({ variables: { id: taskId } });
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const openAddTaskModal = (columnId) => {
    setSelectedColumnId(columnId);
    setTaskForm({
      ...initialTaskForm, // Use all default values
      status: "TODO",
      priority: "medium", // Changed to lowercase to match backend expectations
    });
    setIsAddTaskOpen(true);
  };

  const openEditTaskModal = (task) => {
    if (!task) return;

    setEditingTask(task);
    setTaskForm({
      ...initialTaskForm, // Start with all default values
      title: task?.title || "",
      description: task?.description || "",
      status: task?.status || "TODO",
      priority: task?.priority ? task.priority.toLowerCase() : "medium", // Ensure lowercase priority
      dueDate: task?.dueDate ? task.dueDate.split("T")[0] : "",
      columnId: task?.columnId || "", // Ajout du columnId
      tags: Array.isArray(task?.tags) ? task.tags : [],
      checklist: Array.isArray(task?.checklist)
        ? task.checklist.map((item) => ({
            id: item?.id,
            text: item?.text || "",
            completed: Boolean(item?.completed),
          }))
        : [],
    });
    setIsEditTaskOpen(true);
  };

  // Gestion des tags
  const addTag = () => {
    if (
      taskForm.newTag.trim() &&
      !taskForm.tags.some((tag) => tag.name === taskForm.newTag)
    ) {
      const newTag = {
        name: taskForm.newTag.trim(),
        className: "",
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-300",
      };
      setTaskForm({
        ...taskForm,
        tags: [...taskForm.tags, newTag],
        newTag: "",
      });
    }
  };

  const removeTag = (tagName) => {
    setTaskForm({
      ...taskForm,
      tags: taskForm.tags.filter((tag) => tag.name !== tagName),
    });
  };

  // Gestion de la checklist
  const addChecklistItem = () => {
    if (taskForm.newChecklistItem.trim()) {
      setTaskForm({
        ...taskForm,
        checklist: [
          ...taskForm.checklist,
          { text: taskForm.newChecklistItem.trim(), completed: false },
        ],
        newChecklistItem: "",
      });
    }
  };

  const toggleChecklistItem = (index) => {
    const updatedChecklist = [...taskForm.checklist];
    updatedChecklist[index] = {
      ...updatedChecklist[index],
      completed: !updatedChecklist[index].completed,
    };
    setTaskForm({
      ...taskForm,
      checklist: updatedChecklist,
    });
  };

  const removeChecklistItem = (index) => {
    const updatedChecklist = [...taskForm.checklist];
    updatedChecklist.splice(index, 1);
    setTaskForm({
      ...taskForm,
      checklist: updatedChecklist,
    });
  };

  // Fonctions de drag & drop
  const handleDragStart = (event) => {
    const { active } = event;
    const task = board?.tasks?.find((t) => t.id === active.id);
    setActiveTask(task);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = board?.tasks?.find((t) => t.id === active.id);
    if (!activeTask) return;

    let newColumnId = activeTask.columnId;
    let newPosition = activeTask.position || 0;

    // Déterminer où on a droppé
    if (over.data?.current?.type === "column") {
      // Droppé sur une colonne
      newColumnId = over.id;
      const targetColumnTasks = getTasksByColumn(over.id);
      newPosition = targetColumnTasks.length;
    } else if (over.data?.current?.type === "task") {
      // Droppé sur une autre tâche
      const targetTask = over.data.current.task;
      newColumnId = targetTask.columnId;
      const targetColumnTasks = getTasksByColumn(targetTask.columnId);
      const targetIndex = targetColumnTasks.findIndex(
        (t) => t.id === targetTask.id
      );

      // Si on déplace dans la même colonne, ajuster la position
      if (newColumnId === activeTask.columnId) {
        const activeIndex = targetColumnTasks.findIndex(
          (t) => t.id === activeTask.id
        );
        if (activeIndex < targetIndex) {
          newPosition = targetIndex;
        } else {
          newPosition = targetIndex;
        }
      } else {
        newPosition = targetIndex;
      }
    }

    // Si la position ou la colonne a changé, faire la mutation avec mise à jour optimiste
    if (
      newColumnId !== activeTask.columnId ||
      newPosition !== (activeTask.position || 0)
    ) {
      try {
        await moveTask({
          variables: {
            id: activeTask.id,
            columnId: newColumnId,
            position: newPosition,
          },
          optimisticResponse: {
            moveTask: {
              __typename: "Task",
              id: activeTask.id,
              columnId: newColumnId,
              position: newPosition,
            },
          },
          update: (cache, { data }) => {
            // Mise à jour du cache Apollo pour un rendu instantané
            const existingData = cache.readQuery({
              query: GET_BOARD,
              variables: { id },
            });

            if (existingData && data?.moveTask) {
              const updatedTasks = existingData.board.tasks.map((task) =>
                task.id === data.moveTask.id
                  ? {
                      ...task,
                      columnId: data.moveTask.columnId,
                      position: data.moveTask.position,
                    }
                  : task
              );

              cache.writeQuery({
                query: GET_BOARD,
                variables: { id },
                data: {
                  ...existingData,
                  board: {
                    ...existingData.board,
                    tasks: updatedTasks,
                  },
                },
              });
            }
          },
        });
      } catch (error) {
        console.error("Error moving task:", error);
        toast.error("Erreur lors du déplacement de la tâche");
        // En cas d'erreur, refetch pour restaurer l'état correct
        refetch();
      }
    }
  };

  if (!board) {
    return null;
  }

  return (
    <div className="w-full max-w-[100vw] px-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Header */}
      <div className="mx-auto pt-4">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/outils/kanban")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{board.title}</h1>
            <p className="text-muted-foreground">{board.description}</p>
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
          <Button size="sm" variant="default" onClick={openAddModal}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une colonne
          </Button>
        </div>
      </div>
      </div>

      {/* Board Content */}
      <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                        onDeleteColumn={(column) => handleDeleteColumn(column)}
                        isCollapsed={isCollapsed}
                        onToggleCollapse={() => toggleColumnCollapse(column.id)}
                      />
                    );
                  })}

                  {/* Add Column Button */}
                  <Card className="w-80 h-fit border-2 border-dashed border-border/50 hover:border-foreground/30 transition-colors">
                    <CardContent className="p-3">
                      <Button
                        variant="ghost"
                        className="w-full h-16 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground"
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
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)"
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
        onClose={() => setIsAddTaskOpen(false)}
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
        onClose={() => setIsEditTaskOpen(false)}
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
