import { useState } from 'react';
import { toast } from 'sonner';
import { useMutation } from '@apollo/client';
import { GET_BOARD, CREATE_TASK, UPDATE_TASK, DELETE_TASK, MOVE_TASK } from '@/src/graphql/kanbanQueries';

export const useKanbanTasks = (boardId) => {
  const initialTaskForm = {
    title: "",
    description: "",
    status: "TODO",
    priority: "medium",
    dueDate: "",
    tags: [],
    checklist: [],
    newTag: "",
    newChecklistItem: "",
  };

  const [taskForm, setTaskForm] = useState(initialTaskForm);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedColumnId, setSelectedColumnId] = useState(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);

  // Task mutations
  const [createTask, { loading: createTaskLoading }] = useMutation(CREATE_TASK, {
    refetchQueries: [{ query: GET_BOARD, variables: { id: boardId } }],
    onCompleted: () => {
      toast.success("Tâche créée avec succès");
      setTaskForm(initialTaskForm);
      setSelectedColumnId(null);
      setIsAddTaskOpen(false); // Close the add task modal after successful creation
    },
    onError: () => {
      toast.error("Erreur lors de la création de la tâche");
    },
  });

  const [updateTask, { loading: updateTaskLoading }] = useMutation(UPDATE_TASK, {
    refetchQueries: [{ query: GET_BOARD, variables: { id: boardId } }],
    onCompleted: () => {
      toast.success("Tâche modifiée avec succès");
      setTaskForm(initialTaskForm);
      setEditingTask(null);
      setIsEditTaskOpen(false); // Close the edit modal after successful update
    },
    onError: () => {
      toast.error("Erreur lors de la modification de la tâche");
    },
  });

  const [deleteTask, { loading: deleteTaskLoading }] = useMutation(DELETE_TASK, {
    refetchQueries: [{ query: GET_BOARD, variables: { id: boardId } }],
    onCompleted: () => {
      toast.success("Tâche supprimée avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de la tâche");
    },
  });

  const [moveTask] = useMutation(MOVE_TASK, {
    onCompleted: () => {
      toast.success("Tâche déplacée avec succès");
    },
    onError: () => {
      toast.error("Erreur lors du déplacement de la tâche");
    },
  });

  // Task form handlers
  const handleTaskFormChange = (field, value) => {
    setTaskForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Tag handlers
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
      setTaskForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag],
        newTag: "",
      }));
    }
  };

  const removeTag = (tagName) => {
    setTaskForm(prev => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag.name !== tagName),
    }));
  };

  // Checklist handlers
  const addChecklistItem = () => {
    if (taskForm.newChecklistItem.trim()) {
      setTaskForm(prev => ({
        ...prev,
        checklist: [
          ...prev.checklist,
          { text: taskForm.newChecklistItem.trim(), completed: false },
        ],
        newChecklistItem: "",
      }));
    }
  };

  const toggleChecklistItem = (index) => {
    const updatedChecklist = [...taskForm.checklist];
    updatedChecklist[index] = {
      ...updatedChecklist[index],
      completed: !updatedChecklist[index].completed,
    };
    setTaskForm(prev => ({
      ...prev,
      checklist: updatedChecklist,
    }));
  };

  const removeChecklistItem = (index) => {
    const updatedChecklist = [...taskForm.checklist];
    updatedChecklist.splice(index, 1);
    setTaskForm(prev => ({
      ...prev,
      checklist: updatedChecklist,
    }));
  };

  // Task CRUD operations
  // Helper to clean tag objects by removing __typename
  const cleanTags = (tags) => {
    return tags.map(({ __typename, ...tag }) => ({
      name: tag.name,
      className: tag.className || "",
      bg: tag.bg || "",
      text: tag.text || "",
      border: tag.border || "",
    }));
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      toast.error("Le titre de la tâche est requis");
      return;
    }

    if (!taskForm.columnId) {
      toast.error("Veuillez sélectionner une colonne pour cette tâche");
      return;
    }

    try {
      await createTask({
        variables: {
          input: {
            title: taskForm.title,
            description: taskForm.description,
            status: taskForm.status,
            priority: taskForm.priority.toLowerCase(),
            dueDate: taskForm.dueDate || null,
            columnId: taskForm.columnId,
            boardId,
            position: 0, // Will be updated by the backend
            tags: cleanTags(taskForm.tags),
            checklist: taskForm.checklist.map((item) => ({
              text: item.text,
              completed: item.completed || false,
            })),
          },
        },
      });
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Une erreur est survenue lors de la création de la tâche");
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
            priority: taskForm.priority.toLowerCase(),
            dueDate: taskForm.dueDate || null,
            columnId: taskForm.columnId,
            tags: cleanTags(taskForm.tags),
            checklist: taskForm.checklist.map((item) => ({
              id: item.id || undefined,
              text: item.text,
              completed: item.completed || false,
            })),
          },
        },
      });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask({ variables: { id: taskId } });
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Task modal handlers
  const openAddTaskModal = (columnId) => {
    setSelectedColumnId(columnId);
    setTaskForm({
      ...initialTaskForm,
      status: "TODO",
      priority: "medium",
    });
    setIsAddTaskOpen(true);
  };
  
  const closeAddTaskModal = () => {
    setIsAddTaskOpen(false);
    setTaskForm(initialTaskForm);
    setEditingTask(null);
  };
  
  const closeEditTaskModal = () => {
    setIsEditTaskOpen(false);
    setEditingTask(null);
    setTaskForm(initialTaskForm);
  };

  const openEditTaskModal = (task) => {
    if (!task) return;

    setEditingTask(task);
    setIsEditTaskOpen(true);
    setTaskForm({
      ...initialTaskForm,
      title: task?.title || "",
      description: task?.description || "",
      status: task?.status || "TODO",
      priority: task?.priority ? task.priority.toLowerCase() : "medium",
      dueDate: task?.dueDate ? task.dueDate.split("T")[0] : "",
      columnId: task?.columnId || "",
      tags: Array.isArray(task?.tags) ? task.tags : [],
      checklist: Array.isArray(task?.checklist)
        ? task.checklist.map((item) => ({
            id: item?.id,
            text: item?.text || "",
            completed: Boolean(item?.completed),
          }))
        : [],
    });
  };

  return {
    // State
    taskForm,
    editingTask,
    selectedColumnId,
    isAddTaskOpen,
    isEditTaskOpen,
    loading: createTaskLoading || updateTaskLoading || deleteTaskLoading,
    
    // Setters
    setTaskForm,
    setEditingTask,
    setSelectedColumnId,
    setIsAddTaskOpen,
    setIsEditTaskOpen,
    
    // Handlers
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
  };
};
