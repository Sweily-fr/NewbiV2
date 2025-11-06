import { useState } from "react";
import { toast } from "@/src/utils/debouncedToast";
import { useMutation } from "@apollo/client";
import {
  CREATE_TASK,
  UPDATE_TASK,
  DELETE_TASK,
  MOVE_TASK,
} from "@/src/graphql/kanbanQueries";
import { useWorkspace } from "@/src/hooks/useWorkspace";

export const useKanbanTasks = (boardId, board) => {
  const { workspaceId } = useWorkspace();
  const initialTaskForm = {
    title: "",
    description: "",
    status: "TODO",
    priority: "medium",
    dueDate: "",
    tags: [],
    checklist: [],
    assignedMembers: [],
    newTag: "",
    newChecklistItem: "",
  };

  const [taskForm, setTaskForm] = useState(initialTaskForm);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedColumnId, setSelectedColumnId] = useState(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);

  // Task mutations
  const [createTask, { loading: createTaskLoading }] = useMutation(
    CREATE_TASK,
    {
      onCompleted: () => {
        // Plus de toast ici - la subscription temps réel s'en charge
        setTaskForm(initialTaskForm);
        setSelectedColumnId(null);
        setIsAddTaskOpen(false); // Close the add task modal after successful creation
        // Plus besoin de refetch() - la subscription s'en charge
      },
      onError: () => {
        toast.error("Erreur lors de la création de la tâche");
      },
    }
  );

  const [updateTask, { loading: updateTaskLoading }] = useMutation(
    UPDATE_TASK,
    {
      onCompleted: () => {
        // Plus de toast ici - la subscription temps réel s'en charge
        setTaskForm(initialTaskForm);
        setEditingTask(null);
        setIsEditTaskOpen(false); // Close the edit modal after successful update
        // Plus besoin de refetch() - la subscription s'en charge
      },
      onError: () => {
        toast.error("Erreur lors de la modification de la tâche");
      },
    }
  );

  const [deleteTask, { loading: deleteTaskLoading }] = useMutation(
    DELETE_TASK,
    {
      onCompleted: () => {
        // Plus de toast ici - la subscription temps réel s'en charge
        // Plus besoin de refetch() - la subscription s'en charge
      },
      onError: () => {
        toast.error("Erreur lors de la suppression de la tâche");
      },
    }
  );

  const [moveTask] = useMutation(MOVE_TASK, {
    onCompleted: () => {
      // Plus de toast ici - la subscription temps réel s'en charge
      // Plus besoin de refetch() - la subscription s'en charge
    },
    onError: () => {
      toast.error("Erreur lors du déplacement de la tâche");
    },
  });

  // Task form handlers
  const handleTaskFormChange = (field, value) => {
    setTaskForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Tag color palette with Tailwind classes
  const tagColorPalette = [
    { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
    { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
    { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
    {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-300",
    },
    {
      bg: "bg-purple-100",
      text: "text-purple-800",
      border: "border-purple-300",
    },
    { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-300" },
    {
      bg: "bg-indigo-100",
      text: "text-indigo-800",
      border: "border-indigo-300",
    },
    {
      bg: "bg-orange-100",
      text: "text-orange-800",
      border: "border-orange-300",
    },
    { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-300" },
    { bg: "bg-cyan-100", text: "text-cyan-800", border: "border-cyan-300" },
  ];

  // Get all existing tags from the board
  const getAllBoardTags = (boardData) => {
    if (!boardData?.tasks) return [];
    return boardData.tasks.flatMap((task) => task.tags || []);
  };

  // Find next available color for a new tag
  const getNextAvailableColor = (existingTags) => {
    const usedColors = new Set(existingTags.map((tag) => tag.bg));
    const availableColor = tagColorPalette.find(
      (color) => !usedColors.has(color.bg)
    );
    return (
      availableColor || {
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-300",
      }
    );
  };

  // Tag handlers
  const addTag = () => {
    const newTagName = taskForm.newTag.trim();
    if (!newTagName) return;

    // Check if tag already exists in the current task
    if (
      taskForm.tags.some(
        (tag) => tag.name.toLowerCase() === newTagName.toLowerCase()
      )
    ) {
      toast.error("Ce tag existe déjà dans cette tâche");
      return;
    }

    // Get all tags from the board if available
    const boardTags = board ? getAllBoardTags(board) : [];

    // Check if tag exists in the board with different casing
    const existingTag = boardTags.find(
      (tag) => tag.name.toLowerCase() === newTagName.toLowerCase()
    );

    if (existingTag) {
      // If tag exists with different casing, use the existing tag's properties
      setTaskForm((prev) => ({
        ...prev,
        tags: [...prev.tags, { ...existingTag }],
        newTag: "",
      }));
      return;
    }

    // If it's a new tag, find the next available color
    const newColor = getNextAvailableColor(boardTags);

    const newTag = {
      name: newTagName,
      className: "",
      bg: newColor.bg,
      text: newColor.text,
      border: newColor.border,
    };

    setTaskForm((prev) => ({
      ...prev,
      tags: [...prev.tags, newTag],
      newTag: "",
    }));
  };

  const removeTag = (tagName) => {
    setTaskForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag.name !== tagName),
    }));
  };

  // Checklist handlers
  const addChecklistItem = () => {
    if (taskForm.newChecklistItem.trim()) {
      setTaskForm((prev) => ({
        ...prev,
        checklist: [
          ...prev.checklist,
          { 
            id: `temp-${Date.now()}-${Math.random()}`, // ID temporaire unique
            text: taskForm.newChecklistItem.trim(), 
            completed: false 
          },
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
    setTaskForm((prev) => ({
      ...prev,
      checklist: updatedChecklist,
    }));
  };

  const removeChecklistItem = (index) => {
    const updatedChecklist = [...taskForm.checklist];
    updatedChecklist.splice(index, 1);
    setTaskForm((prev) => ({
      ...prev,
      checklist: updatedChecklist,
    }));
  };

  // Task CRUD operations
  // Helper to clean tag objects by removing __typename
  const cleanTags = (tags) => {
    return tags.map((tag) => ({
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

    // Validate tags before submission
    const allBoardTags = board ? getAllBoardTags(board) : [];
    const tagNames = new Set();

    for (const tag of taskForm.tags) {
      const normalizedTagName = tag.name.toLowerCase();

      // Check for duplicate tags in the current task
      if (tagNames.has(normalizedTagName)) {
        toast.error(`Le tag "${tag.name}" est en double dans cette tâche`);
        return;
      }
      tagNames.add(normalizedTagName);

      // Check if tag exists in the board with different casing
      const existingTag = allBoardTags.find(
        (t) =>
          t.name.toLowerCase() === normalizedTagName &&
          (t.bg !== tag.bg || t.text !== tag.text || t.border !== tag.border)
      );

      if (existingTag) {
        // Update the tag to use the existing tag's properties
        tag.bg = existingTag.bg;
        tag.text = existingTag.text;
        tag.border = existingTag.border;
      }
    }

    if (!taskForm.columnId) {
      toast.error("Veuillez sélectionner une colonne pour cette tâche");
      return;
    }

    try {
      // Envoyer seulement les userId (tableau simple d'IDs), filtrer les nulls
      const assignedMembers = Array.isArray(taskForm.assignedMembers) 
        ? taskForm.assignedMembers
            .map(member => typeof member === 'string' ? member : member?.userId)
            .filter(Boolean)
        : [];
      
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
            // Ne pas envoyer position - le backend la calculera automatiquement
            tags: cleanTags(taskForm.tags),
            checklist: taskForm.checklist.map((item) => ({
              id: item.id || undefined,
              text: item.text,
              completed: item.completed || false,
            })),
            assignedMembers: assignedMembers,
          },
          workspaceId,
        },
      });
    } catch {
      toast.error("Une erreur est survenue lors de la création de la tâche");
    }
  };

  const handleUpdateTask = async () => {
    if (!taskForm.title.trim()) {
      toast.error("Le titre de la tâche est requis");
      return;
    }

    try {
      // Envoyer seulement les userId (tableau simple d'IDs), filtrer les nulls
      const assignedMembers = Array.isArray(taskForm.assignedMembers) 
        ? taskForm.assignedMembers
            .map(member => typeof member === 'string' ? member : member?.userId)
            .filter(Boolean)
        : [];
      
      const input = {
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
        assignedMembers: assignedMembers,
      };
      
      await updateTask({
        variables: {
          input,
          workspaceId,
        },
      });
    } catch (error) {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask({ variables: { id: taskId, workspaceId } });
    } catch {
      // Erreur silencieuse
    }
  };

  // Task modal handlers
  const openAddTaskModal = (columnId) => {
    setSelectedColumnId(columnId);
    setTaskForm({
      ...initialTaskForm,
      status: "TODO",
      priority: "medium",
      columnId: columnId, // Initialiser columnId avec la colonne sélectionnée
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
      id: task?.id || task?._id,
      title: task?.title || "",
      description: task?.description || "",
      status: task?.status || "TODO",
      priority: task?.priority ? task.priority.toLowerCase() : "medium",
      dueDate: task?.dueDate || "", // Garder l'heure complète au format ISO
      columnId: task?.columnId || "",
      tags: Array.isArray(task?.tags) ? task.tags : [],
      checklist: Array.isArray(task?.checklist)
        ? task.checklist.map((item, index) => ({
            id: item?.id || `checklist-item-${index}-${Date.now()}`,
            text: item?.text || "",
            completed: Boolean(item?.completed),
          }))
        : [],
      assignedMembers: Array.isArray(task?.assignedMembers) ? task.assignedMembers : [],
      comments: Array.isArray(task?.comments) ? task.comments : [],
      activity: Array.isArray(task?.activity) ? task.activity : [],
      userId: task?.userId,
      createdAt: task?.createdAt,
      updatedAt: task?.updatedAt,
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
