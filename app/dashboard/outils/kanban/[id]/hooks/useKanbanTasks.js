import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "@/src/utils/debouncedToast";
import { useMutation, useLazyQuery, gql } from "@apollo/client";
import {
  CREATE_TASK,
  UPDATE_TASK,
  DELETE_TASK,
  MOVE_TASK,
  ADD_COMMENT,
  GET_BOARD,
  GET_TASK_DETAILS,
  START_TIMER,
} from "@/src/graphql/kanbanQueries";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { computeAutoSaveSignature } from "./taskFormSignature";
import { perfMark } from "@/src/utils/kanbanPerf";

const UPLOAD_TASK_IMAGE = gql`
  mutation UploadTaskImage(
    $taskId: ID!
    $file: Upload!
    $imageType: String
    $workspaceId: ID
  ) {
    uploadTaskImage(
      taskId: $taskId
      file: $file
      imageType: $imageType
      workspaceId: $workspaceId
    ) {
      success
      image {
        id
        key
        url
        fileName
        fileSize
        contentType
        uploadedBy
        uploadedAt
      }
      message
    }
  }
`;

export const useKanbanTasks = (boardId, board) => {
  const { workspaceId } = useWorkspace();
  const initialTaskForm = {
    title: "",
    description: "",
    status: "TODO",
    priority: "",
    startDate: "",
    dueDate: "",
    tags: [],
    checklist: [],
    assignedMembers: [],
    images: [], // Images de la tâche
    newTag: "",
    newChecklistItem: "",
    pendingComments: [], // Commentaires en attente de création
    pendingFiles: [], // Fichiers en attente d'upload (mode création)
    timeTracking: null, // Données du timer
  };

  const [taskForm, setTaskForm] = useState(initialTaskForm);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedColumnId, setSelectedColumnId] = useState(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);

  // Ref pour éviter les mises à jour en boucle
  const lastUpdateRef = useRef(null);

  // Ref pour l'état initial du formulaire (utilisé par l'auto-save dans TaskModal)
  const initialFormRef = useRef(null);

  // Lazy query pour charger les détails d'une tâche (comments, activity, timeTracking.entries)
  // Chargé uniquement quand on ouvre le modal de détail
  const [fetchTaskDetails, { loading: taskDetailsLoading }] = useLazyQuery(
    GET_TASK_DETAILS,
    {
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
      notifyOnNetworkStatusChange: false,
      onCompleted: (data) => {
        perfMark("fetchTaskDetails onCompleted", {
          comments: data?.task?.comments?.length ?? 0,
          activity: data?.task?.activity?.length ?? 0,
        });
        if (data?.task) {
          setTaskForm((prev) => {
            const updated = {
              ...prev,
              comments: Array.isArray(data.task.comments)
                ? data.task.comments
                : [],
              activity: Array.isArray(data.task.activity)
                ? data.task.activity
                : [],
              // Merger les entries du timeTracking si elles existent
              timeTracking: prev.timeTracking
                ? {
                    ...prev.timeTracking,
                    entries: data.task.timeTracking?.entries || [],
                  }
                : data.task.timeTracking,
            };
            // Mettre à jour initialFormRef pour éviter que l'auto-save ne se déclenche
            // à cause des comments/activity rechargés
            initialFormRef.current = computeAutoSaveSignature(updated);
            return updated;
          });
        }
      },
    },
  );

  // Extraire uniquement la tâche en cours d'édition du board (évite de dépendre de board?.tasks entier)
  const editingTaskFromBoard = useMemo(() => {
    if (!isEditTaskOpen || !editingTask?.id || !board?.tasks) return null;
    return board.tasks.find((t) => t.id === editingTask.id) || null;
  }, [board?.tasks, editingTask?.id, isEditTaskOpen]);

  // Ref pour savoir si c'est l'utilisateur local qui a déclenché la dernière mutation
  const localMutationRef = useRef(false);

  // Synchroniser les données temps réel quand la tâche est mise à jour via subscription
  // Quand updatedAt change, synchroniser taskForm avec les données du board ET refetch les détails
  useEffect(() => {
    if (!editingTaskFromBoard) return;

    const updateKey = `${editingTaskFromBoard.id}-${editingTaskFromBoard.updatedAt}`;
    if (lastUpdateRef.current === updateKey) return;

    // Premier rendu après ouverture du modal : ne pas refetch (déjà fait dans openEditTaskModal)
    if (!lastUpdateRef.current) {
      lastUpdateRef.current = updateKey;
      return;
    }

    lastUpdateRef.current = updateKey;

    // Si c'est une mutation locale, on ne synchronise pas le form (l'utilisateur a déjà les bonnes données)
    if (localMutationRef.current) {
      localMutationRef.current = false;
    } else {
      // Mise à jour d'un autre utilisateur → synchroniser taskForm avec les données du board
      // pour éviter que l'auto-save n'écrase les changements avec des données périmées
      setTaskForm((prev) => {
        const synced = {
          ...prev,
          title: editingTaskFromBoard.title ?? prev.title,
          description: editingTaskFromBoard.description ?? prev.description,
          status: editingTaskFromBoard.status ?? prev.status,
          priority: editingTaskFromBoard.priority
            ? editingTaskFromBoard.priority.toLowerCase()
            : prev.priority,
          startDate: editingTaskFromBoard.startDate ?? prev.startDate,
          dueDate: editingTaskFromBoard.dueDate ?? prev.dueDate,
          columnId: editingTaskFromBoard.columnId ?? prev.columnId,
          tags: Array.isArray(editingTaskFromBoard.tags)
            ? editingTaskFromBoard.tags
            : prev.tags,
          checklist: Array.isArray(editingTaskFromBoard.checklist)
            ? editingTaskFromBoard.checklist.map((item, index) => ({
                id: item?.id || `checklist-item-${index}-${Date.now()}`,
                text: item?.text || "",
                completed: Boolean(item?.completed),
              }))
            : prev.checklist,
          assignedMembers: Array.isArray(editingTaskFromBoard.assignedMembers)
            ? editingTaskFromBoard.assignedMembers
            : prev.assignedMembers,
          images: Array.isArray(editingTaskFromBoard.images)
            ? editingTaskFromBoard.images
            : prev.images,
          timeTracking: editingTaskFromBoard.timeTracking ?? prev.timeTracking,
          updatedAt: editingTaskFromBoard.updatedAt ?? prev.updatedAt,
        };
        // Mettre à jour initialFormRef pour éviter que l'auto-save ne se déclenche
        initialFormRef.current = computeAutoSaveSignature(synced);
        return synced;
      });
    }

    // Refetch les détails (comments, activity, timeTracking.entries) depuis le serveur
    fetchTaskDetails({
      variables: { id: editingTaskFromBoard.id, workspaceId },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    editingTaskFromBoard?.id,
    editingTaskFromBoard?.updatedAt,
    fetchTaskDetails,
    workspaceId,
  ]);

  // Ref pour savoir si le timer local tournait lors de la création
  const timerWasRunningRef = useRef(false);

  // Task mutations
  const [addComment] = useMutation(ADD_COMMENT);
  const [uploadTaskImageMutation] = useMutation(UPLOAD_TASK_IMAGE);
  const [startTimerMutation] = useMutation(START_TIMER);

  const [createTask, { loading: createTaskLoading }] = useMutation(
    CREATE_TASK,
    {
      update(cache, { data }) {
        if (!data?.createTask) return;
        const newTask = data.createTask;
        try {
          const cacheData = cache.readQuery({
            query: GET_BOARD,
            variables: { id: boardId, workspaceId },
          });
          if (cacheData?.board) {
            // Vérifier que la tâche n'existe pas déjà dans le cache
            const taskExists = (cacheData.board.tasks || []).some(
              (t) => t.id === newTask.id,
            );
            if (!taskExists) {
              // Incrémenter la position des tâches existantes dans la même colonne
              const updatedTasks = (cacheData.board.tasks || []).map((t) => {
                if (
                  t.columnId === newTask.columnId &&
                  t.position !== undefined &&
                  t.position >= (newTask.position ?? 0)
                ) {
                  return { ...t, position: t.position + 1 };
                }
                return t;
              });
              cache.writeQuery({
                query: GET_BOARD,
                variables: { id: boardId, workspaceId },
                data: {
                  board: {
                    ...cacheData.board,
                    tasks: [newTask, ...updatedTasks],
                  },
                },
              });
            }
          }
        } catch (error) {
          console.error("❌ [CreateTask] Erreur mise à jour cache:", error);
        }
      },
      onCompleted: async (data) => {
        // Si des commentaires sont en attente, les créer maintenant
        if (
          taskForm.pendingComments &&
          taskForm.pendingComments.length > 0 &&
          data?.createTask?.id
        ) {
          try {
            for (const comment of taskForm.pendingComments) {
              await addComment({
                variables: {
                  taskId: data.createTask.id,
                  input: { content: comment.content },
                  workspaceId,
                },
              });
            }
          } catch (error) {
            console.error("Erreur lors de l'ajout des commentaires:", error);
            toast.error(
              "Tâche créée mais erreur lors de l'ajout des commentaires",
            );
          }
        }

        // Upload des fichiers en attente
        if (taskForm.pendingFiles?.length > 0 && data?.createTask?.id) {
          try {
            for (const file of taskForm.pendingFiles) {
              await uploadTaskImageMutation({
                variables: {
                  taskId: data.createTask.id,
                  file,
                  imageType: "description",
                  workspaceId,
                },
              });
            }
          } catch (error) {
            console.error("Erreur upload fichiers:", error);
            toast.error(
              "Tâche créée mais erreur lors de l'upload des fichiers",
            );
          }
        }

        // Si le timer local tournait, lancer le timer serveur sur la tâche créée
        if (timerWasRunningRef.current && data?.createTask?.id) {
          try {
            await startTimerMutation({
              variables: { taskId: data.createTask.id, workspaceId },
            });
          } catch (error) {
            console.error("Erreur démarrage timer:", error);
          }
          timerWasRunningRef.current = false;
        }

        setTaskForm(initialTaskForm);
        setSelectedColumnId(null);
        setIsAddTaskOpen(false);
      },
      onError: () => {
        toast.error("Erreur lors de la création de la tâche");
      },
    },
  );

  const [updateTask, { loading: updateTaskLoading }] = useMutation(
    UPDATE_TASK,
    {
      onCompleted: () => {
        // Auto-save : ne pas fermer le dialog ni réinitialiser le formulaire
        // La subscription temps réel met à jour les données
      },
      onError: () => {
        toast.error("Erreur lors de la modification de la tâche");
      },
    },
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
    },
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
      (color) => !usedColors.has(color.bg),
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
        (tag) => tag.name.toLowerCase() === newTagName.toLowerCase(),
      )
    ) {
      toast.error("Ce tag existe déjà dans cette tâche");
      return;
    }

    // Get all tags from the board if available
    const boardTags = board ? getAllBoardTags(board) : [];

    // Check if tag exists in the board with different casing
    const existingTag = boardTags.find(
      (tag) => tag.name.toLowerCase() === newTagName.toLowerCase(),
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
            completed: false,
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
          (t.bg !== tag.bg || t.text !== tag.text || t.border !== tag.border),
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
      // Sauvegarder si le timer local tourne pour le relancer côté serveur après création
      timerWasRunningRef.current = !!taskForm.timeTracking?.isRunning;

      // Envoyer seulement les userId (tableau simple d'IDs), filtrer les nulls
      const assignedMembers = Array.isArray(taskForm.assignedMembers)
        ? taskForm.assignedMembers
            .map((member) =>
              typeof member === "string" ? member : member?.userId,
            )
            .filter(Boolean)
        : [];

      await createTask({
        variables: {
          input: {
            title: taskForm.title,
            description: taskForm.description,
            priority:
              taskForm.priority.toLowerCase() === "none"
                ? ""
                : taskForm.priority.toLowerCase(),
            startDate: taskForm.startDate || null,
            dueDate: taskForm.dueDate || null,
            columnId: taskForm.columnId,
            boardId,
            position: 0,
            tags: cleanTags(taskForm.tags),
            checklist: taskForm.checklist.map((item) => ({
              id: item.id || undefined,
              text: item.text,
              completed: item.completed || false,
            })),
            assignedMembers: assignedMembers,
            ...(taskForm.timeTracking &&
            (taskForm.timeTracking.totalSeconds > 0 ||
              taskForm.timeTracking.hourlyRate ||
              taskForm.timeTracking.isRunning)
              ? (() => {
                  // Calculer le temps total final, incluant le temps en cours si le timer tourne
                  let finalTotalSeconds =
                    taskForm.timeTracking.totalSeconds || 0;
                  if (
                    taskForm.timeTracking.isRunning &&
                    taskForm.timeTracking.currentStartTime
                  ) {
                    const elapsed = Math.floor(
                      (Date.now() - taskForm.timeTracking.currentStartTime) /
                        1000,
                    );
                    finalTotalSeconds += elapsed;
                  }
                  return {
                    timeTracking: {
                      totalSeconds: finalTotalSeconds,
                      hourlyRate: taskForm.timeTracking.hourlyRate || null,
                      roundingOption:
                        taskForm.timeTracking.roundingOption || "none",
                    },
                  };
                })()
              : {}),
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
      // NOTE: `assignedMembers` est volontairement EXCLU du payload d'auto-save.
      // Les assignations/désassignations sont gérées exclusivement par
      // `handleMemberToggle` dans TaskModal via une mutation dédiée. Inclure ici
      // `assignedMembers` provoquait une race condition : l'auto-save pouvait
      // renvoyer un état stale et écraser une assignation récente, ce qui
      // déclenchait l'envoi d'un email d'assignation à la mauvaise personne
      // (le diff côté serveur étant fait contre un oldTask périmé).
      const input = {
        id: editingTask.id,
        title: taskForm.title,
        description: taskForm.description,
        priority:
          taskForm.priority.toLowerCase() === "none"
            ? ""
            : taskForm.priority.toLowerCase(),
        startDate: taskForm.startDate || null,
        dueDate: taskForm.dueDate || null,
        columnId: taskForm.columnId,
        tags: cleanTags(taskForm.tags),
        checklist: taskForm.checklist.map((item) => ({
          id: item.id || undefined,
          text: item.text,
          completed: item.completed || false,
        })),
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
  const openAddTaskModal = (columnId, options = {}) => {
    setSelectedColumnId(columnId);
    setTaskForm({
      ...initialTaskForm,
      status: "TODO",
      priority: "",
      columnId: columnId, // Initialiser columnId avec la colonne sélectionnée
      startDate: options.startDate || "",
      dueDate: options.dueDate || "",
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
    perfMark("useKanbanTasks.openEditTaskModal start");

    // Reset le ref de suivi pour éviter un refetch immédiat
    lastUpdateRef.current = null;

    setEditingTask(task);
    setIsEditTaskOpen(true);

    // Déterminer si c'est une création ou une édition
    const taskId = task?.id || task?._id;
    const isCreating = !taskId || taskId === null;

    // Ne pas inclure le champ id si c'est une création
    const formData = {
      ...initialTaskForm,
      title: task?.title || "",
      description: task?.description || "",
      status: task?.status || "TODO",
      priority: task?.priority ? task.priority.toLowerCase() : "",
      startDate: task?.startDate || "",
      dueDate: task?.dueDate || "",
      columnId: task?.columnId || task?.column?.id || "",
      tags: Array.isArray(task?.tags) ? task.tags : [],
      checklist: Array.isArray(task?.checklist)
        ? task.checklist.map((item, index) => ({
            id: item?.id || `checklist-item-${index}-${Date.now()}`,
            text: item?.text || "",
            completed: Boolean(item?.completed),
          }))
        : [],
      assignedMembers: Array.isArray(task?.assignedMembers)
        ? task.assignedMembers
        : [],
      comments: [], // Chargés à la demande via GET_TASK_DETAILS
      activity: [], // Chargés à la demande via GET_TASK_DETAILS
      images: Array.isArray(task?.images) ? task.images : [],
      timeTracking: task?.timeTracking || null,
      userId: task?.userId,
      createdAt: task?.createdAt,
      updatedAt: task?.updatedAt,
      pendingComments: [],
    };

    // Ajouter l'id seulement si c'est une édition
    if (!isCreating) {
      formData.id = taskId;
    }

    setTaskForm(formData);
    perfMark("useKanbanTasks.openEditTaskModal end (state setters queued)");

    // Charger les détails (comments, activity, timeTracking.entries) en arrière-plan
    if (!isCreating && taskId) {
      perfMark("fetchTaskDetails call");
      fetchTaskDetails({
        variables: { id: taskId, workspaceId },
      });
    }
  };

  // Gestion des commentaires en attente (pour la création de tâche)
  const addPendingComment = (content) => {
    if (!content.trim()) return;

    setTaskForm((prev) => ({
      ...prev,
      pendingComments: [
        ...prev.pendingComments,
        {
          id: `pending-${Date.now()}-${Math.random()}`,
          content: content.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  };

  const removePendingComment = (commentId) => {
    setTaskForm((prev) => ({
      ...prev,
      pendingComments: prev.pendingComments.filter((c) => c.id !== commentId),
    }));
  };

  const updatePendingComment = (commentId, newContent) => {
    setTaskForm((prev) => ({
      ...prev,
      pendingComments: prev.pendingComments.map((c) =>
        c.id === commentId ? { ...c, content: newContent } : c,
      ),
    }));
  };

  return {
    // State
    taskForm,
    editingTask,
    selectedColumnId,
    isAddTaskOpen,
    isEditTaskOpen,
    loading: createTaskLoading || updateTaskLoading || deleteTaskLoading,
    taskDetailsLoading,

    // Refs
    initialFormRef,
    localMutationRef,

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
    addPendingComment,
    removePendingComment,
    updatePendingComment,
    moveTask,
    updateTask,
    createTask,
  };
};
