import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { flushSync } from "react-dom";
import {
  LoaderCircle,
  X,
  CalendarIcon,
  Clock,
  FileText,
  MessageSquare,
  Flag,
  Users,
  UserPlus,
  Columns,
  Tag,
  Paperclip,
  Play,
  Square,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from "@/src/components/ui/dropdown-menu";
import { Badge } from "@/src/components/ui/badge";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Checklist } from "@/src/components/Checklist";
import { TaskActivity } from "./TaskActivity";
import { TimerControls } from "./TimerControls";
import { LocalTimerControls } from "./LocalTimerControls";
import { TaskImageUpload } from "./TaskImageUpload";
import { useTaskImageUpload } from "../hooks/useTaskImageUpload";
import { useAssignedMembersInfo } from "@/src/hooks/useAssignedMembersInfo";
import { cn } from "@/src/lib/utils";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";

// Sub-components extracted for maintainability
import { PendingCommentsView } from "./task-modal/PendingCommentsView";
import { DescriptionEditor } from "./task-modal/DescriptionEditor";
import { TaskModalHeader } from "./task-modal/TaskModalHeader";

/**
 * Modal pour créer ou modifier une tâche
 */
export function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  isEditing = false,
  taskForm,
  setTaskForm,
  board,
  workspaceId,
  addTag,
  removeTag,
  addChecklistItem,
  toggleChecklistItem,
  removeChecklistItem,
  addPendingComment,
  removePendingComment,
  updatePendingComment,
  openEditTaskModal,
  updateTask,
  initialFormRef: externalInitialFormRef,
  localMutationRef,
}) {
  const { isReadOnly, isOwner } = useSubscriptionAccess();
  const readOnlyTooltip = isReadOnly
    ? isOwner
      ? "Mode lecture seule · Renouvelez votre abonnement"
      : "Mode lecture seule · Contactez l'administrateur"
    : undefined;

  // Navigation prev/next entre tâches
  const { prevTask, nextTask, currentIndex, totalTasks } = useMemo(() => {
    if (!board?.tasks || !taskForm?.id)
      return {
        prevTask: null,
        nextTask: null,
        currentIndex: -1,
        totalTasks: 0,
      };
    const tasks = board.tasks;
    const idx = tasks.findIndex((t) => t.id === taskForm.id);
    return {
      prevTask: idx > 0 ? tasks[idx - 1] : null,
      nextTask: idx < tasks.length - 1 ? tasks[idx + 1] : null,
      currentIndex: idx,
      totalTasks: tasks.length,
    };
  }, [board?.tasks, taskForm?.id]);

  // flushPendingSaveRef : filled later (after autoSaveRef/triggerAutoSaveRef are declared)
  // pour pouvoir flusher depuis goToPrev/goToNext qui sont mémorisés tôt.
  const flushPendingSaveRef = useRef(null);

  const goToPrev = useCallback(() => {
    if (prevTask && openEditTaskModal) {
      flushPendingSaveRef.current?.();
      openEditTaskModal(prevTask);
    }
  }, [prevTask, openEditTaskModal]);
  const goToNext = useCallback(() => {
    if (nextTask && openEditTaskModal) {
      flushPendingSaveRef.current?.();
      openEditTaskModal(nextTask);
    }
  }, [nextTask, openEditTaskModal]);

  // Raccourcis clavier pour navigation
  useEffect(() => {
    if (!isOpen || !isEditing) return;
    const handleKey = (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      )
        return;
      if (e.altKey && e.key === "ArrowUp") {
        e.preventDefault();
        goToPrev();
      }
      if (e.altKey && e.key === "ArrowDown") {
        e.preventDefault();
        goToNext();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, isEditing, goToPrev, goToNext]);
  // Optimisation: handlers mémorisés pour éviter les re-renders
  const handleTitleChange = useCallback(
    (e) => {
      setTaskForm((prev) => ({ ...prev, title: e.target.value }));
    },
    [setTaskForm],
  );

  const handleNewTagChange = useCallback(
    (e) => {
      setTaskForm((prev) => ({ ...prev, newTag: e.target.value }));
    },
    [setTaskForm],
  );

  const handleChecklistChange = useCallback(
    (updatedItems) => {
      setTaskForm((prev) => ({ ...prev, checklist: updatedItems }));
    },
    [setTaskForm],
  );

  // Hook pour l'upload d'images (uniquement en mode édition avec un taskId)
  const taskId = taskForm.id || taskForm._id;
  const boardId = board?.id;
  const {
    isUploading: isUploadingImage,
    uploadProgress,
    uploadImage,
    deleteImage,
    handleDrop: handleImageDrop,
  } = useTaskImageUpload(taskId, workspaceId, boardId);

  // Handler pour l'upload de fichiers dans la description (mode édition)
  const handleDescriptionImageUpload = useCallback(
    async (files) => {
      if (!taskId) return;

      const uploadedImages = [];
      for (const file of files) {
        const result = await uploadImage(file, "description");
        if (result) {
          uploadedImages.push(result);
        }
      }

      // Mettre à jour le formulaire avec les nouvelles images
      // On déduplique par id car la subscription temps réel peut avoir déjà
      // synchronisé taskForm.images depuis le cache Apollo avant qu'on arrive ici
      if (uploadedImages.length > 0) {
        setTaskForm((prev) => {
          const existingIds = new Set(
            (prev.images || []).map((img) => img.id).filter(Boolean),
          );
          const newImages = uploadedImages.filter(
            (img) => !existingIds.has(img.id),
          );
          if (newImages.length === 0) return prev;
          return {
            ...prev,
            images: [...(prev.images || []), ...newImages],
          };
        });
      }
    },
    [taskId, uploadImage, setTaskForm],
  );

  // Handlers pour le mode local (création de tâche - fichiers en attente)
  const handleAddPendingFiles = useCallback(
    (files) => {
      setTaskForm((prev) => ({
        ...prev,
        pendingFiles: [...(prev.pendingFiles || []), ...files],
      }));
    },
    [setTaskForm],
  );

  const handleRemovePendingFile = useCallback(
    (index) => {
      setTaskForm((prev) => ({
        ...prev,
        pendingFiles: (prev.pendingFiles || []).filter((_, i) => i !== index),
      }));
    },
    [setTaskForm],
  );

  // Handler pour supprimer une image
  const handleDeleteImage = useCallback(
    async (imageId) => {
      const success = await deleteImage(imageId);
      if (success) {
        setTaskForm((prev) => ({
          ...prev,
          images: (prev.images || []).filter((img) => img.id !== imageId),
        }));
      }
    },
    [deleteImage, setTaskForm],
  );

  const handleTimeChange = useCallback(
    (e) => {
      const time = e.target.value;
      if (!time) return;

      setTaskForm((prev) => {
        if (!prev.dueDate) return prev;

        const [hours, minutes] = time.split(":").map(Number);
        const newDate = new Date(prev.dueDate);
        newDate.setHours(hours, minutes, 0, 0);
        return { ...prev, dueDate: newDate.toISOString() };
      });
    },
    [setTaskForm],
  );

  const handleDateChange = useCallback(
    (date) => {
      if (!date) {
        setTaskForm((prev) => ({ ...prev, dueDate: "" }));
        return;
      }

      setTaskForm((prev) => {
        // Si une date est déjà définie, on conserve l'heure existante
        if (prev.dueDate) {
          const existingDate = new Date(prev.dueDate);
          date.setHours(
            existingDate.getHours(),
            existingDate.getMinutes(),
            0,
            0,
          );
        } else {
          // Par défaut, on met 18h00 comme heure
          date.setHours(18, 0, 0, 0);
        }

        const isoDate = date.toISOString();

        return { ...prev, dueDate: isoDate };
      });
    },
    [setTaskForm],
  );

  // Mémoriser les props pour TaskActivity (ne change que si comments/activity changent)
  const taskActivityData = useMemo(
    () => ({
      id: taskForm.id || taskForm._id,
      comments: taskForm.comments || [],
      activity: taskForm.activity || [],
      userId: taskForm.userId,
    }),
    [
      taskForm.id,
      taskForm._id,
      taskForm.comments,
      taskForm.activity,
      taskForm.userId,
    ],
  );

  // Convert priority to uppercase for the Select component
  const getDisplayPriority = (priority) => {
    if (!priority) return "NONE";
    return priority.toUpperCase();
  };

  // Convert priority to lowercase for submission
  const getSubmitPriority = (priority) => {
    if (!priority) return "";
    return priority.toLowerCase();
  };

  const handleSubmit = () => {
    if (!taskForm.title.trim()) {
      return;
    }

    // Convert priority to lowercase before submission
    const formData = {
      ...taskForm,
      priority: getSubmitPriority(taskForm.priority),
    };

    // Call the parent's onSubmit with the updated form data
    onSubmit(formData);
  };

  // Auto-save en mode édition — sauvegarde uniquement quand aucun champ texte n'est focus
  const autoSaveRef = useRef(null);
  // Utiliser le ref partagé du hook si disponible, sinon fallback local (mode création)
  const localInitialFormRef = useRef(null);
  const initialFormRef = externalInitialFormRef || localInitialFormRef;
  const textInputFocusedRef = useRef(false);

  // Ref sur la dernière valeur connue de assignedMembers pour éviter les
  // closures stale dans handleMemberToggle lors de clics rapides (React
  // ne flush pas le state entre deux clics consécutifs).
  const assignedMembersRef = useRef(taskForm?.assignedMembers || []);
  useEffect(() => {
    assignedMembersRef.current = taskForm?.assignedMembers || [];
  }, [taskForm?.assignedMembers]);

  // Capturer l'état initial à l'ouverture
  useEffect(() => {
    if (isOpen && isEditing) {
      initialFormRef.current = JSON.stringify(taskForm);
    }
  }, [isOpen, isEditing]);

  // Fonction de sauvegarde réutilisable
  const triggerAutoSave = useCallback(() => {
    if (!isOpen || !isEditing || !taskForm?.title?.trim()) return;
    const current = JSON.stringify(taskForm);
    if (current === initialFormRef.current) return;
    // Marquer que c'est une mutation locale pour éviter que le hook
    // ne re-synchronise le form avec les données du board
    if (localMutationRef) localMutationRef.current = true;
    const formData = {
      ...taskForm,
      priority: getSubmitPriority(taskForm.priority),
    };
    onSubmit(formData);
    initialFormRef.current = current;
  }, [isOpen, isEditing, taskForm, onSubmit, localMutationRef]);

  // Ref qui pointe toujours vers la dernière version de triggerAutoSave.
  // Assigné pendant le render (pas dans un effect) pour garantir que le flush
  // utilise le taskForm le plus récent, même si le flush est appelé avant
  // que les effects de ce render n'aient commité.
  const triggerAutoSaveRef = useRef(triggerAutoSave);
  triggerAutoSaveRef.current = triggerAutoSave;

  // Ref sur le DescriptionEditor pour forcer la propagation de son contenu
  // vers taskForm.description avant un flush (ex: Escape sans blur préalable).
  const descriptionEditorRef = useRef(null);

  // Flush immédiat : force-commit l'éditeur de description, annule un timer en
  // attente, puis sauvegarde avec l'état le plus à jour.
  const flushAutoSave = useCallback(() => {
    if (descriptionEditorRef.current?.commit) {
      // flushSync force React à appliquer le setTaskForm du commit()
      // avant que triggerAutoSave ne lise taskForm via sa closure.
      flushSync(() => {
        descriptionEditorRef.current.commit();
      });
    }
    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
      autoSaveRef.current = null;
    }
    triggerAutoSaveRef.current?.();
  }, []);
  // Exposer flushAutoSave à goToPrev/goToNext via un ref.
  flushPendingSaveRef.current = flushAutoSave;

  // Auto-save quand taskForm change.
  // - Champ texte focus : debounce 400ms (sauvegarde quand l'utilisateur arrête de taper)
  // - Autres champs : sauvegarde immédiate
  useEffect(() => {
    if (!isOpen || !isEditing || !taskForm?.title?.trim()) return;

    const current = JSON.stringify(taskForm);
    if (current === initialFormRef.current) return;

    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);

    if (textInputFocusedRef.current) {
      autoSaveRef.current = setTimeout(() => {
        triggerAutoSave();
      }, 400);
    } else {
      triggerAutoSave();
    }

    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [isOpen, isEditing, taskForm, triggerAutoSave]);

  // Filet de sécurité : si le modal se ferme / démonte avec une sauvegarde en attente, la flusher.
  useEffect(() => {
    if (!isOpen || !isEditing) return;
    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
        autoSaveRef.current = null;
        triggerAutoSaveRef.current?.();
      }
    };
  }, [isOpen, isEditing]);

  // Handlers pour tracker le focus des champs texte
  const handleTextInputFocus = useCallback(() => {
    textInputFocusedRef.current = true;
  }, []);

  const handleTextInputBlur = useCallback(() => {
    textInputFocusedRef.current = false;
    // Flush immédiat au blur si une sauvegarde est en attente
    flushAutoSave();
  }, [flushAutoSave]);

  // Fermeture du modal : flusher avant de notifier le parent.
  const handleClose = useCallback(() => {
    flushAutoSave();
    onClose?.();
  }, [flushAutoSave, onClose]);

  // Toggle membre : mise à jour partielle pour éviter d'envoyer tous les champs.
  //
  // IMPORTANT : on lit `current` depuis un ref (et non depuis `taskForm` via
  // closure) pour gérer correctement les clics rapides. Sans ce ref, deux
  // clics successifs avant un re-render React utilisent la même closure
  // stale et envoient des mutations incohérentes au serveur, ce qui provoque
  // l'envoi d'emails d'assignation aux mauvais destinataires (le diff
  // `oldTask` vs `updates.assignedMembers` côté backend est faussé).
  //
  // On ne déclenche PLUS `triggerAutoSave()` ici : l'auto-save n'envoie plus
  // `assignedMembers` (cf. useKanbanTasks.handleUpdateTask), donc il n'y a
  // plus de risque d'écraser l'état des membres.
  const handleMemberToggle = useCallback(
    (memberId) => {
      const current = assignedMembersRef.current || [];
      const newMembers = current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId];

      // Mettre à jour le ref IMMÉDIATEMENT pour que le prochain clic (même
      // avant re-render) voit la nouvelle valeur.
      assignedMembersRef.current = newMembers;

      setTaskForm((prev) => ({ ...prev, assignedMembers: newMembers }));

      // En mode édition, envoyer uniquement assignedMembers au serveur
      if (isEditing && updateTask && taskForm.id) {
        // Marquer comme mutation locale pour éviter que le hook
        // ne re-synchronise le form avec les données du board
        if (localMutationRef) localMutationRef.current = true;

        updateTask({
          variables: {
            input: { id: taskForm.id, assignedMembers: newMembers },
            workspaceId,
          },
        });
      }
    },
    [
      setTaskForm,
      isEditing,
      updateTask,
      workspaceId,
      taskForm.id,
      localMutationRef,
    ],
  );

  // Gestion de la date d'échéance
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [priorityPopoverOpen, setPriorityPopoverOpen] = useState(false);
  const [membersPopoverOpen, setMembersPopoverOpen] = useState(false);
  const [showDescription, setShowDescription] = useState(
    !!taskForm.description,
  );
  const [tagsInputFocused, setTagsInputFocused] = useState(false);

  // Synchroniser showDescription quand la description change (ex: chargement async)
  useEffect(() => {
    if (taskForm.description) {
      setShowDescription(true);
    }
  }, [taskForm.description]);

  // Récupérer les infos des membres assignés
  const { members: membersInfo } = useAssignedMembersInfo(
    taskForm.assignedMembers || [],
  );

  // Générer une couleur pour un tag basée sur son nom
  const getTagColor = (tagName) => {
    const colors = [
      { bg: "#3b82f620", border: "#3b82f640", text: "#3b82f6" }, // blue
      { bg: "#10b98120", border: "#10b98140", text: "#10b981" }, // green
      { bg: "#f59e0b20", border: "#f59e0b40", text: "#f59e0b" }, // amber
      { bg: "#ef444420", border: "#ef444440", text: "#ef4444" }, // red
      { bg: "#8b5cf620", border: "#8b5cf640", text: "#8b5cf6" }, // violet
      { bg: "#ec489920", border: "#ec489940", text: "#ec4899" }, // pink
      { bg: "#06b6d420", border: "#06b6d440", text: "#06b6d4" }, // cyan
      { bg: "#f97316 20", border: "#f9731640", text: "#f97316" }, // orange
    ];

    // Utiliser le hash du nom pour choisir une couleur de façon consistante
    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
      hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return "Choisir une date";
    const date = new Date(dateString);
    return format(date, "PPP", { locale: fr });
  };

  // Formater l'heure pour l'affichage
  const formatTimeDisplay = (dateString) => {
    if (!dateString) return "18:00";
    const date = new Date(dateString);
    return date.toTimeString().slice(0, 5);
  };

  // Formater pour l'input time (HH:MM)
  const formatTimeInput = (dateString) => {
    if (!dateString) return "18:00";
    const date = new Date(dateString);
    return date.toTimeString().slice(0, 5);
  };

  // Formater la date de création
  const formatCreatedDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return format(date, "d MMMM yyyy 'à' HH:mm", { locale: fr });
  };

  // Trouver le créateur de la tâche
  const getCreatorInfo = () => {
    if (!taskForm.userId || !board?.members) {
      return { name: "Inconnu", image: null };
    }

    const creator = board.members.find(
      (m) => String(m.id) === String(taskForm.userId),
    );

    return creator
      ? { name: creator.name, image: creator.image }
      : { name: "Inconnu", image: null };
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="!max-w-[calc(100vw-2rem)] !w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] p-0 bg-card text-card-foreground overflow-hidden flex flex-col"
      >
        {/* Version Desktop : 2 colonnes */}
        <div className="hidden lg:flex flex-col h-full">
          <TaskModalHeader
            isEditing={isEditing}
            board={board}
            taskForm={taskForm}
            prevTask={prevTask}
            nextTask={nextTask}
            currentIndex={currentIndex}
            totalTasks={totalTasks}
            goToPrev={goToPrev}
            goToNext={goToNext}
          />

          <div className="flex flex-1 min-h-0">
            {/* Partie gauche : Formulaire */}
            <div className="flex-1 flex flex-col border-r">
              {isEditing ? (
                <DialogHeader className="sr-only">
                  <DialogTitle>Modifier la tâche</DialogTitle>
                </DialogHeader>
              ) : (
                <DialogHeader className="px-6 py-4 border-b border-border relative flex-shrink-0">
                  <DialogTitle className="text-lg font-semibold">
                    Créer une nouvelle tâche
                  </DialogTitle>
                </DialogHeader>
              )}

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 h-0 min-h-0">
                {/* Titre — gros, hover gris, focus border */}
                <input
                  value={taskForm.title}
                  onChange={handleTitleChange}
                  onFocus={(e) => {
                    e.target.setSelectionRange(0, 0);
                    handleTextInputFocus();
                  }}
                  onBlur={handleTextInputBlur}
                  className="w-full text-2xl font-semibold text-foreground bg-transparent outline-none caret-[#5A50FF] px-2 py-1 -mx-2 rounded-md border border-transparent hover:bg-muted/40 focus:bg-transparent focus:border-border/60 transition-all placeholder:text-muted-foreground/30"
                  placeholder="Titre de la tâche"
                />

                {/* Grille 2 colonnes : Status à Tags */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-0">
                  {/* Colonne 1 */}
                  <div className="space-y-0">
                    {/* Status */}
                    <div className="flex items-center gap-4 py-2.5">
                      <Label
                        className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2"
                        style={{ color: "#8D8D8D" }}
                      >
                        <Columns className="h-4 w-4" />
                        Status
                      </Label>
                      <div className="flex-1">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="px-2 py-1 rounded-md flex-shrink-0 text-xs font-medium border flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                              style={{
                                backgroundColor: `${board?.columns?.find((c) => c.id === taskForm.columnId)?.color || "#94a3b8"}20`,
                                borderColor: `${board?.columns?.find((c) => c.id === taskForm.columnId)?.color || "#94a3b8"}20`,
                                color:
                                  board?.columns?.find(
                                    (c) => c.id === taskForm.columnId,
                                  )?.color || "#94a3b8",
                              }}
                            >
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor:
                                    board?.columns?.find(
                                      (c) => c.id === taskForm.columnId,
                                    )?.color || "#94a3b8",
                                }}
                              />
                              <span>
                                {board?.columns?.find(
                                  (c) => c.id === taskForm.columnId,
                                )?.title || "Sélectionner un status"}
                              </span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            onCloseAutoFocus={(e) => e.preventDefault()}
                          >
                            {board?.columns?.map((column) => (
                              <DropdownMenuItem
                                key={column.id}
                                onClick={() =>
                                  setTaskForm({
                                    ...taskForm,
                                    columnId: column.id,
                                  })
                                }
                                className={cn(
                                  "flex items-center gap-2 cursor-pointer",
                                  taskForm.columnId === column.id &&
                                    "bg-accent",
                                )}
                              >
                                <div
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: column.color }}
                                />
                                <span>{column.title}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Date de début */}
                    <div className="flex items-center gap-4 py-2.5">
                      <Label
                        className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2"
                        style={{ color: "#8D8D8D" }}
                      >
                        <CalendarIcon className="h-4 w-4" />
                        Dates
                      </Label>
                      <div className="flex-1">
                        <Popover modal={false}>
                          <PopoverTrigger asChild>
                            <div
                              className={cn(
                                "text-sm cursor-pointer px-3 py-1 rounded-md hover:bg-muted/60 transition-colors inline-block",
                                !taskForm.startDate && "text-muted-foreground",
                              )}
                            >
                              {taskForm.startDate ? (
                                <span>
                                  {formatDate(taskForm.startDate)} à{" "}
                                  {formatTimeDisplay(taskForm.startDate)}
                                </span>
                              ) : (
                                <span>Choisir une date</span>
                              )}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0"
                            side="bottom"
                            align="start"
                          >
                            <div className="flex flex-col">
                              <div className="border-b p-4">
                                <Calendar
                                  mode="single"
                                  selected={
                                    taskForm.startDate
                                      ? new Date(taskForm.startDate)
                                      : undefined
                                  }
                                  onSelect={(date) => {
                                    if (date) {
                                      const [hours, minutes] =
                                        taskForm.startDate
                                          ? [
                                              new Date(
                                                taskForm.startDate,
                                              ).getHours(),
                                              new Date(
                                                taskForm.startDate,
                                              ).getMinutes(),
                                            ]
                                          : [9, 0];
                                      date.setHours(hours, minutes, 0, 0);
                                      setTaskForm({
                                        ...taskForm,
                                        startDate: date.toISOString(),
                                      });
                                    }
                                  }}
                                  initialFocus
                                  locale={fr}
                                  fromDate={new Date()}
                                  className="border-0"
                                />
                              </div>
                              <div className="p-4 flex items-center gap-2">
                                <div className="relative flex-1">
                                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                  </div>
                                  <Input
                                    type="time"
                                    value={
                                      taskForm.startDate
                                        ? formatTimeInput(taskForm.startDate)
                                        : "09:00"
                                    }
                                    onChange={(e) => {
                                      const time = e.target.value;
                                      if (!time || !taskForm.startDate) return;
                                      const [hours, minutes] = time
                                        .split(":")
                                        .map(Number);
                                      const newDate = new Date(
                                        taskForm.startDate,
                                      );
                                      newDate.setHours(hours, minutes, 0, 0);
                                      setTaskForm({
                                        ...taskForm,
                                        startDate: newDate.toISOString(),
                                      });
                                    }}
                                    className="pl-10 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-ampm-field]:hidden"
                                    step="300"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setTaskForm({ ...taskForm, startDate: "" })
                                  }
                                  disabled={!taskForm.startDate}
                                >
                                  Effacer
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  {/* Colonne 2 */}
                  <div className="space-y-0">
                    {/* Priorité */}
                    <div className="flex items-center gap-4 py-2.5">
                      <Label
                        className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2"
                        style={{ color: "#8D8D8D" }}
                      >
                        <Flag className="h-4 w-4" />
                        Priorité
                      </Label>
                      <div className="flex-1">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <button className="bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity">
                              {taskForm.priority &&
                              taskForm.priority.toLowerCase() !== "none" ? (
                                <Badge
                                  variant="outline"
                                  className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground"
                                >
                                  <Flag
                                    className={`h-4 w-4 ${
                                      taskForm.priority.toLowerCase() === "high"
                                        ? "text-red-500 fill-red-500"
                                        : taskForm.priority.toLowerCase() ===
                                            "medium"
                                          ? "text-yellow-500 fill-yellow-500"
                                          : "text-green-500 fill-green-500"
                                    }`}
                                  />
                                  <span className="text-muted-foreground">
                                    {taskForm.priority.toLowerCase() === "high"
                                      ? "Urgent"
                                      : taskForm.priority.toLowerCase() ===
                                          "medium"
                                        ? "Moyen"
                                        : "Faible"}
                                  </span>
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground"
                                >
                                  <Flag className="h-4 w-4 text-gray-400 fill-gray-400" />
                                  <span className="text-muted-foreground">
                                    -
                                  </span>
                                </Badge>
                              )}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            onCloseAutoFocus={(e) => e.preventDefault()}
                          >
                            {[
                              {
                                value: "HIGH",
                                label: "Urgent",
                                color: "text-red-500 fill-red-500",
                              },
                              {
                                value: "MEDIUM",
                                label: "Moyen",
                                color: "text-yellow-500 fill-yellow-500",
                              },
                              {
                                value: "LOW",
                                label: "Faible",
                                color: "text-green-500 fill-green-500",
                              },
                              {
                                value: "NONE",
                                label: "Aucune",
                                color: "text-gray-400 fill-gray-400",
                              },
                            ].map((priority) => (
                              <DropdownMenuItem
                                key={priority.value}
                                onClick={() =>
                                  setTaskForm({
                                    ...taskForm,
                                    priority: priority.value,
                                  })
                                }
                                className={cn(
                                  "flex items-center gap-2 cursor-pointer",
                                  taskForm.priority?.toUpperCase() ===
                                    priority.value && "bg-accent",
                                )}
                              >
                                <Flag className={`h-4 w-4 ${priority.color}`} />
                                <span>{priority.label}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Date de fin */}
                    <div className="flex items-center gap-4 py-2.5">
                      <Label
                        className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2"
                        style={{ color: "#8D8D8D" }}
                      >
                        <Clock className="h-4 w-4" />
                        Date de fin
                      </Label>
                      <div className="flex-1">
                        <Popover modal={false}>
                          <PopoverTrigger asChild>
                            <div
                              className={cn(
                                "text-sm cursor-pointer px-3 py-1 rounded-md hover:bg-muted/60 transition-colors inline-block",
                                !taskForm.dueDate && "text-muted-foreground",
                              )}
                            >
                              {taskForm.dueDate ? (
                                <span>
                                  {formatDate(taskForm.dueDate)} à{" "}
                                  {formatTimeDisplay(taskForm.dueDate)}
                                </span>
                              ) : (
                                <span>Choisir une date</span>
                              )}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0"
                            side="bottom"
                            align="start"
                          >
                            <div className="flex flex-col">
                              <div className="border-b p-4">
                                <Calendar
                                  mode="single"
                                  selected={
                                    taskForm.dueDate
                                      ? new Date(taskForm.dueDate)
                                      : undefined
                                  }
                                  onSelect={(date) => {
                                    if (date) {
                                      const [hours, minutes] = taskForm.dueDate
                                        ? [
                                            new Date(
                                              taskForm.dueDate,
                                            ).getHours(),
                                            new Date(
                                              taskForm.dueDate,
                                            ).getMinutes(),
                                          ]
                                        : [18, 0];
                                      date.setHours(hours, minutes, 0, 0);
                                      setTaskForm({
                                        ...taskForm,
                                        dueDate: date.toISOString(),
                                      });
                                    }
                                  }}
                                  initialFocus
                                  locale={fr}
                                  fromDate={new Date()}
                                  className="border-0"
                                />
                              </div>
                              <div className="p-4 flex items-center gap-2">
                                <div className="relative flex-1">
                                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                  </div>
                                  <Input
                                    type="time"
                                    value={
                                      taskForm.dueDate
                                        ? formatTimeInput(taskForm.dueDate)
                                        : "18:00"
                                    }
                                    onChange={(e) => {
                                      const time = e.target.value;
                                      if (!time || !taskForm.dueDate) return;
                                      const [hours, minutes] = time
                                        .split(":")
                                        .map(Number);
                                      const newDate = new Date(
                                        taskForm.dueDate,
                                      );
                                      newDate.setHours(hours, minutes, 0, 0);
                                      setTaskForm({
                                        ...taskForm,
                                        dueDate: newDate.toISOString(),
                                      });
                                    }}
                                    className="pl-10 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-ampm-field]:hidden"
                                    step="300"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setTaskForm({ ...taskForm, dueDate: "" })
                                  }
                                  disabled={!taskForm.dueDate}
                                >
                                  Effacer
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags + Membres — intégrés dans la grille */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-0">
                  {/* Tags */}
                  <div className="flex items-center gap-4 py-2.5">
                    <Label
                      className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2"
                      style={{ color: "#8D8D8D" }}
                    >
                      <Tag className="h-4 w-4" />
                      Tags
                    </Label>
                    <div className="flex-1">
                      <Popover modal={false}>
                        <PopoverTrigger asChild>
                          <div className="cursor-pointer">
                            {taskForm.tags?.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {taskForm.tags.map((tag, i) => {
                                  const color = getTagColor(tag.name);
                                  return (
                                    <span
                                      key={i}
                                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium"
                                      style={{
                                        backgroundColor: color.bg,
                                        color: color.text,
                                        border: `1px solid ${color.border}`,
                                      }}
                                    >
                                      {tag.name}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span
                                className="text-sm px-3 py-1 rounded-md hover:bg-muted/60 transition-colors"
                                style={{ color: "#8D8D8D" }}
                              >
                                Vide
                              </span>
                            )}
                          </div>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-56 p-0"
                          side="bottom"
                          align="start"
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          {/* Tags actuels */}
                          {taskForm.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 px-3 pt-2.5 pb-1">
                              {taskForm.tags.map((tag, i) => {
                                const color = getTagColor(tag.name);
                                return (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
                                    style={{
                                      backgroundColor: color.bg,
                                      color: color.text,
                                      border: `1px solid ${color.border}`,
                                    }}
                                  >
                                    {tag.name}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newTags = taskForm.tags.filter(
                                          (_, idx) => idx !== i,
                                        );
                                        setTaskForm({
                                          ...taskForm,
                                          tags: newTags,
                                        });
                                      }}
                                      className="hover:opacity-70 cursor-pointer"
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          <div className="px-3 pt-2 pb-1.5 border-b border-border/40">
                            <input
                              placeholder="Rechercher ou créer..."
                              className="w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/40 p-0"
                              autoFocus
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  e.currentTarget.value.trim()
                                ) {
                                  e.preventDefault();
                                  const newTag = e.currentTarget.value.trim();
                                  if (
                                    !taskForm.tags?.find(
                                      (t) =>
                                        t.name.toLowerCase() ===
                                        newTag.toLowerCase(),
                                    )
                                  ) {
                                    setTaskForm({
                                      ...taskForm,
                                      tags: [
                                        ...(taskForm.tags || []),
                                        { name: newTag, className: "" },
                                      ],
                                    });
                                  }
                                  e.currentTarget.value = "";
                                }
                              }}
                            />
                          </div>
                          <div className="p-1.5 max-h-[200px] overflow-y-auto">
                            <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider px-1.5 pb-1">
                              Appuyer Entrée pour créer
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Membres */}
                  <div className="flex items-center gap-4 py-2.5">
                    <Label
                      className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2"
                      style={{ color: "#8D8D8D" }}
                    >
                      <Users className="h-4 w-4" />
                      Membres
                    </Label>
                    <div className="flex-1">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <div className="cursor-pointer">
                            {taskForm.assignedMembers?.length > 0 ? (
                              <div className="flex -space-x-1.5">
                                {taskForm.assignedMembers
                                  .slice(0, 4)
                                  .map((memberId, idx) => {
                                    const info = membersInfo.find(
                                      (m) => m.id === memberId,
                                    );
                                    return (
                                      <UserAvatar
                                        key={memberId}
                                        src={info?.image}
                                        name={info?.name || memberId}
                                        size="xs"
                                        className="h-6 w-6 ring-1 ring-background"
                                        style={{
                                          zIndex:
                                            taskForm.assignedMembers.length -
                                            idx,
                                        }}
                                      />
                                    );
                                  })}
                                {taskForm.assignedMembers.length > 4 && (
                                  <div className="h-6 w-6 rounded-full bg-muted border border-background flex items-center justify-center text-[8px] font-medium text-muted-foreground">
                                    +{taskForm.assignedMembers.length - 4}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span
                                className="text-sm px-3 py-1 rounded-md hover:bg-muted/60 transition-colors"
                                style={{ color: "#8D8D8D" }}
                              >
                                Vide
                              </span>
                            )}
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="w-60 p-0"
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          <div className="px-2 pt-2 pb-0.5">
                            <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                              Membres
                            </span>
                          </div>
                          <div className="p-1.5 pt-0.5 space-y-0.5 max-h-[280px] overflow-y-auto">
                            {board?.members?.map((member) => {
                              const isSelected = (
                                taskForm.assignedMembers || []
                              ).includes(member.id);
                              return (
                                <button
                                  key={member.id}
                                  onClick={() => handleMemberToggle(member.id)}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
                                >
                                  <div
                                    className={`rounded-full flex-shrink-0 ${isSelected ? "ring-[1.5px] ring-[#5A50FF] ring-offset-1 ring-offset-background" : ""}`}
                                  >
                                    <UserAvatar
                                      src={member.image}
                                      name={member.name}
                                      size="xs"
                                      className="h-5 w-5"
                                    />
                                  </div>
                                  <span className="flex-1 text-left text-xs font-medium truncate">
                                    {member.name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Gestion du temps */}
                  <div className="flex items-center gap-4 py-2.5">
                    <Label
                      className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2"
                      style={{ color: "#8D8D8D" }}
                    >
                      <Clock className="h-4 w-4" />
                      Temps
                    </Label>
                    <div className="flex-1">
                      <Popover modal={false}>
                        <PopoverTrigger asChild>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md hover:bg-muted/60 transition-colors cursor-pointer">
                            {taskForm.timeTracking?.isRunning ? (
                              <>
                                <Square className="h-3 w-3 fill-red-500 text-red-500" />
                                <span className="text-sm text-red-500 font-medium">
                                  En cours...
                                </span>
                              </>
                            ) : taskForm.timeTracking?.totalSeconds > 0 ? (
                              <span className="text-sm text-foreground/70">
                                {`${Math.floor(taskForm.timeTracking.totalSeconds / 3600)}h ${Math.floor((taskForm.timeTracking.totalSeconds % 3600) / 60)}m`}
                              </span>
                            ) : (
                              <>
                                <Play
                                  className="h-3 w-3"
                                  style={{ color: "#8D8D8D" }}
                                />
                                <span
                                  className="text-sm"
                                  style={{ color: "#8D8D8D" }}
                                >
                                  Start
                                </span>
                              </>
                            )}
                          </div>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-80 p-0"
                          side="bottom"
                          align="start"
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          {isEditing && (taskForm.id || taskForm._id) ? (
                            <TimerControls
                              taskId={taskForm.id || taskForm._id}
                              timeTracking={taskForm.timeTracking}
                              onTimerUpdate={(newTimeTracking) => {
                                setTaskForm((prev) => ({
                                  ...prev,
                                  timeTracking: newTimeTracking,
                                }));
                              }}
                              inline
                            />
                          ) : (
                            <LocalTimerControls
                              timeTracking={taskForm.timeTracking}
                              onTimeTrackingChange={(newTimeTracking) => {
                                setTaskForm((prev) => ({
                                  ...prev,
                                  timeTracking: newTimeTracking,
                                }));
                              }}
                              inline
                            />
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Description — sous la grille des propriétés */}
                <div className="space-y-1 border-t border-border/30 pt-4">
                  {!showDescription && !taskForm.description ? (
                    <button
                      type="button"
                      onClick={() => setShowDescription(true)}
                      className="text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors bg-transparent border-0 p-0 cursor-pointer"
                    >
                      Ajouter une description...
                    </button>
                  ) : (
                    <DescriptionEditor
                      ref={descriptionEditorRef}
                      value={taskForm.description}
                      onChange={(html) =>
                        setTaskForm((prev) => ({ ...prev, description: html }))
                      }
                      onFocus={handleTextInputFocus}
                      onBlur={handleTextInputBlur}
                      placeholder="Ajouter une description..."
                    />
                  )}
                </div>

                {/* Checklist */}
                <div className="space-y-3 mt-6">
                  <Checklist
                    items={taskForm.checklist}
                    onChange={handleChecklistChange}
                  />
                </div>

                {/* Pièces jointes */}
                <div className="space-y-2 mt-6">
                  <Label className="text-sm font-normal flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    Pièces jointes
                  </Label>
                  {isEditing && taskId ? (
                    <TaskImageUpload
                      images={taskForm.images || []}
                      onUpload={handleDescriptionImageUpload}
                      onDelete={handleDeleteImage}
                      isUploading={isUploadingImage}
                      uploadProgress={uploadProgress}
                      maxImages={10}
                      placeholder="Glissez des fichiers ici ou cliquez pour sélectionner"
                    />
                  ) : (
                    <TaskImageUpload
                      localMode
                      pendingFiles={taskForm.pendingFiles || []}
                      onAddFiles={handleAddPendingFiles}
                      onRemoveFile={handleRemovePendingFile}
                      maxImages={10}
                      placeholder="Glissez des fichiers ici ou cliquez pour sélectionner"
                    />
                  )}
                </div>
              </div>

              {/* Footer fixe — uniquement en mode création */}
              {!isEditing && (
                <div className="border-t border-border bg-card px-6 py-3 flex-shrink-0">
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="px-6 border-input"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={
                        isReadOnly || isLoading || !taskForm.title.trim()
                      }
                      title={readOnlyTooltip}
                      className="px-6 text-white hover:opacity-90"
                      style={{ backgroundColor: "#5b50FF" }}
                    >
                      {isLoading ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Création...
                        </>
                      ) : (
                        "Créer la tâche"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Partie droite : Activité et commentaires */}
            <div className="w-[420px] flex flex-col">
              <div className="px-5 py-2.5 border-b border-border bg-background">
                <h3 className="text-sm font-medium">Activité</h3>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden px-2 bg-muted/40">
                {isEditing && (taskForm.id || taskForm._id) ? (
                  <TaskActivity
                    task={taskActivityData}
                    workspaceId={workspaceId}
                    currentUser={board?.members?.find(
                      (m) => m.userId === taskActivityData.userId,
                    )}
                    boardMembers={board?.members || []}
                    columns={board?.columns || []}
                    onTaskUpdate={setTaskForm}
                  />
                ) : (
                  <PendingCommentsView
                    pendingComments={taskForm.pendingComments || []}
                    addPendingComment={addPendingComment}
                    removePendingComment={removePendingComment}
                    updatePendingComment={updatePendingComment}
                    currentUser={board?.members?.[0]}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Version Mobile/Tablette : Onglets */}
        <div className="flex lg:hidden flex-col h-full">
          <DialogHeader className="px-4 py-3 border-b border-border flex-shrink-0">
            <DialogTitle className="text-base font-semibold">
              {isEditing ? "Modifier la tâche" : "Créer une nouvelle tâche"}
            </DialogTitle>
          </DialogHeader>

          <Tabs
            defaultValue="details"
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="w-full rounded-none border-b bg-muted/20 h-12 flex-shrink-0">
              <TabsTrigger
                value="details"
                className="flex-1 data-[state=active]:bg-background"
              >
                <FileText className="h-4 w-4 mr-2" />
                Détails
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="flex-1 data-[state=active]:bg-background"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Activité
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="details"
              className="flex-1 flex flex-col overflow-hidden m-0 data-[state=active]:flex"
            >
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Contenu du formulaire (même que desktop) */}
                {/* Titre */}
                <div className="space-y-2">
                  <Label
                    htmlFor="task-title-mobile"
                    className="text-sm font-normal"
                  >
                    Titre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="task-title-mobile"
                    value={taskForm.title}
                    onChange={handleTitleChange}
                    onFocus={(e) => {
                      e.target.setSelectionRange(0, 0);
                      handleTextInputFocus();
                    }}
                    onBlur={handleTextInputBlur}
                    className="w-full bg-background text-foreground border-input focus:border-primary"
                    placeholder="Titre de la tâche"
                  />
                </div>

                {/* Description - Collapse comme sur desktop */}
                <div className="space-y-2">
                  {!showDescription ? (
                    <button
                      type="button"
                      onClick={() => setShowDescription(true)}
                      className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity bg-transparent border-0 p-0 cursor-pointer"
                      style={{ color: "#5b50FF" }}
                    >
                      + Ajouter une description
                    </button>
                  ) : (
                    <>
                      <Label className="text-sm font-normal">Description</Label>
                      <DescriptionEditor
                        ref={descriptionEditorRef}
                        value={taskForm.description}
                        onChange={(html) =>
                          setTaskForm((prev) => ({
                            ...prev,
                            description: html,
                          }))
                        }
                        onFocus={handleTextInputFocus}
                        onBlur={handleTextInputBlur}
                        placeholder="Ajouter une description..."
                      />
                    </>
                  )}
                </div>

                {/* Status et Priorité - Une seule colonne */}
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center gap-4 py-2.5">
                    <Label
                      className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2"
                      style={{ color: "#8D8D8D" }}
                    >
                      <Columns className="h-4 w-4" />
                      Status
                    </Label>
                    <div className="flex-1">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="px-2 py-1 rounded-md flex-shrink-0 text-xs font-medium border flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                            style={{
                              backgroundColor: `${board?.columns?.find((c) => c.id === taskForm.columnId)?.color || "#94a3b8"}20`,
                              borderColor: `${board?.columns?.find((c) => c.id === taskForm.columnId)?.color || "#94a3b8"}20`,
                              color:
                                board?.columns?.find(
                                  (c) => c.id === taskForm.columnId,
                                )?.color || "#94a3b8",
                            }}
                          >
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  board?.columns?.find(
                                    (c) => c.id === taskForm.columnId,
                                  )?.color || "#94a3b8",
                              }}
                            />
                            <span className="truncate">
                              {board?.columns?.find(
                                (c) => c.id === taskForm.columnId,
                              )?.title || "Status"}
                            </span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          {board?.columns?.map((column) => (
                            <DropdownMenuItem
                              key={column.id}
                              onClick={() =>
                                setTaskForm({
                                  ...taskForm,
                                  columnId: column.id,
                                })
                              }
                              className={cn(
                                "flex items-center gap-2 cursor-pointer",
                                taskForm.columnId === column.id && "bg-accent",
                              )}
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: column.color }}
                              />
                              <span>{column.title}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Priorité */}
                  <div className="flex items-center gap-4 py-2.5">
                    <Label
                      className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2"
                      style={{ color: "#8D8D8D" }}
                    >
                      <Flag className="h-4 w-4" />
                      Priorité
                    </Label>
                    <div className="flex-1">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <button className="bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity">
                            {taskForm.priority &&
                            taskForm.priority.toLowerCase() !== "none" ? (
                              <Badge
                                variant="outline"
                                className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground"
                              >
                                <Flag
                                  className={`h-4 w-4 ${
                                    taskForm.priority.toLowerCase() === "high"
                                      ? "text-red-500 fill-red-500"
                                      : taskForm.priority.toLowerCase() ===
                                          "medium"
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-green-500 fill-green-500"
                                  }`}
                                />
                                <span className="text-muted-foreground">
                                  {taskForm.priority.toLowerCase() === "high"
                                    ? "Urgent"
                                    : taskForm.priority.toLowerCase() ===
                                        "medium"
                                      ? "Moyen"
                                      : "Faible"}
                                </span>
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground"
                              >
                                <Flag className="h-4 w-4 text-gray-400 fill-gray-400" />
                                <span className="text-muted-foreground">-</span>
                              </Badge>
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          {[
                            {
                              value: "HIGH",
                              label: "Urgent",
                              color: "text-red-500 fill-red-500",
                            },
                            {
                              value: "MEDIUM",
                              label: "Moyen",
                              color: "text-yellow-500 fill-yellow-500",
                            },
                            {
                              value: "LOW",
                              label: "Faible",
                              color: "text-green-500 fill-green-500",
                            },
                            {
                              value: "NONE",
                              label: "Aucune",
                              color: "text-gray-400 fill-gray-400",
                            },
                          ].map((priority) => (
                            <DropdownMenuItem
                              key={priority.value}
                              onClick={() =>
                                setTaskForm({
                                  ...taskForm,
                                  priority: priority.value,
                                })
                              }
                              className={cn(
                                "flex items-center gap-2 cursor-pointer",
                                taskForm.priority?.toUpperCase() ===
                                  priority.value && "bg-accent",
                              )}
                            >
                              <Flag className={`h-4 w-4 ${priority.color}`} />
                              <span>{priority.label}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Date de début */}
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    Date de début
                  </Label>
                  <div className="flex-1">
                    <Popover modal={false}>
                      <PopoverTrigger asChild>
                        <div
                          className={cn(
                            "text-sm cursor-pointer px-3 py-1 rounded-md hover:bg-muted/60 transition-colors inline-block",
                            !taskForm.startDate && "text-muted-foreground",
                          )}
                        >
                          {taskForm.startDate ? (
                            <span>
                              {formatDate(taskForm.startDate)} à{" "}
                              {formatTimeDisplay(taskForm.startDate)}
                            </span>
                          ) : (
                            <span>Choisir une date</span>
                          )}
                        </div>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        side="bottom"
                        align="start"
                      >
                        <div className="flex flex-col">
                          <div className="border-b p-4">
                            <Calendar
                              mode="single"
                              selected={
                                taskForm.startDate
                                  ? new Date(taskForm.startDate)
                                  : undefined
                              }
                              onSelect={(date) => {
                                if (date) {
                                  const [hours, minutes] = taskForm.startDate
                                    ? [
                                        new Date(taskForm.startDate).getHours(),
                                        new Date(
                                          taskForm.startDate,
                                        ).getMinutes(),
                                      ]
                                    : [9, 0];
                                  date.setHours(hours, minutes, 0, 0);
                                  setTaskForm({
                                    ...taskForm,
                                    startDate: date.toISOString(),
                                  });
                                }
                              }}
                              initialFocus
                              locale={fr}
                              fromDate={new Date()}
                              className="border-0"
                            />
                          </div>
                          <div className="p-4 flex items-center gap-2">
                            <div className="relative flex-1">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Clock className="h-4 w-4 text-gray-500" />
                              </div>
                              <Input
                                type="time"
                                value={
                                  taskForm.startDate
                                    ? formatTimeInput(taskForm.startDate)
                                    : "09:00"
                                }
                                onChange={(e) => {
                                  const time = e.target.value;
                                  if (!time || !taskForm.startDate) return;
                                  const [hours, minutes] = time
                                    .split(":")
                                    .map(Number);
                                  const newDate = new Date(taskForm.startDate);
                                  newDate.setHours(hours, minutes, 0, 0);
                                  setTaskForm({
                                    ...taskForm,
                                    startDate: newDate.toISOString(),
                                  });
                                }}
                                className="pl-10 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-ampm-field]:hidden"
                                step="300"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setTaskForm({ ...taskForm, startDate: "" })
                              }
                              disabled={!taskForm.startDate}
                            >
                              Effacer
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Date de fin */}
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-normal w-32 flex-shrink-0 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Date de fin
                  </Label>
                  <div className="flex-1">
                    <Popover modal={false}>
                      <PopoverTrigger asChild>
                        <div
                          className={cn(
                            "text-sm cursor-pointer px-3 py-1 rounded-md hover:bg-muted/60 transition-colors inline-block",
                            !taskForm.dueDate && "text-muted-foreground",
                          )}
                        >
                          {taskForm.dueDate ? (
                            <span>
                              {formatDate(taskForm.dueDate)} à{" "}
                              {formatTimeDisplay(taskForm.dueDate)}
                            </span>
                          ) : (
                            <span>Choisir une date</span>
                          )}
                        </div>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        side="bottom"
                        align="start"
                      >
                        <div className="flex flex-col">
                          <div className="border-b p-4">
                            <Calendar
                              mode="single"
                              selected={
                                taskForm.dueDate
                                  ? new Date(taskForm.dueDate)
                                  : undefined
                              }
                              onSelect={(date) => {
                                if (date) {
                                  const [hours, minutes] = taskForm.dueDate
                                    ? [
                                        new Date(taskForm.dueDate).getHours(),
                                        new Date(taskForm.dueDate).getMinutes(),
                                      ]
                                    : [18, 0];
                                  date.setHours(hours, minutes, 0, 0);
                                  setTaskForm({
                                    ...taskForm,
                                    dueDate: date.toISOString(),
                                  });
                                }
                              }}
                              initialFocus
                              locale={fr}
                              fromDate={new Date()}
                              className="border-0"
                            />
                          </div>
                          <div className="p-4 flex items-center gap-2">
                            <div className="relative flex-1">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Clock className="h-4 w-4 text-gray-500" />
                              </div>
                              <Input
                                type="time"
                                value={
                                  taskForm.dueDate
                                    ? formatTimeInput(taskForm.dueDate)
                                    : "18:00"
                                }
                                onChange={(e) => {
                                  const time = e.target.value;
                                  if (!time || !taskForm.dueDate) return;
                                  const [hours, minutes] = time
                                    .split(":")
                                    .map(Number);
                                  const newDate = new Date(taskForm.dueDate);
                                  newDate.setHours(hours, minutes, 0, 0);
                                  setTaskForm({
                                    ...taskForm,
                                    dueDate: newDate.toISOString(),
                                  });
                                }}
                                className="pl-10 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-ampm-field]:hidden"
                                step="300"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setTaskForm({ ...taskForm, dueDate: "" })
                              }
                              disabled={!taskForm.dueDate}
                            >
                              Effacer
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Tags et Membres - Une seule colonne */}
                <div className="space-y-4">
                  {/* Tags */}
                  <div className="space-y-2">
                    <Label className="text-sm font-normal flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      Tags
                    </Label>
                    <div className="relative">
                      {taskForm.tags.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setTaskForm({ ...taskForm, tags: [] })}
                          className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                          title="Supprimer tous les tags"
                        >
                          <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                      <div
                        className="min-h-10 rounded-md border border-input px-3 py-2 text-sm ring-offset-background transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text"
                        onClick={() => {
                          if (!tagsInputFocused) {
                            setTagsInputFocused(true);
                          }
                        }}
                      >
                        {taskForm.tags.length > 0 || tagsInputFocused ? (
                          <div className="flex flex-wrap gap-2 items-center min-h-full">
                            {taskForm.tags.map((tag, index) => {
                              const color = getTagColor(tag.name);
                              return (
                                <div
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border"
                                  style={{
                                    backgroundColor: color.bg,
                                    borderColor: color.border,
                                    color: color.text,
                                  }}
                                >
                                  {tag.name}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newTags = taskForm.tags.filter(
                                        (_, i) => i !== index,
                                      );
                                      setTaskForm({
                                        ...taskForm,
                                        tags: newTags,
                                      });
                                    }}
                                    className="ml-1.5 rounded-full outline-none hover:opacity-70 transition-opacity"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              );
                            })}
                            {tagsInputFocused && (
                              <Input
                                autoFocus
                                placeholder={
                                  taskForm.tags.length === 0
                                    ? "Ajouter des tags..."
                                    : ""
                                }
                                className="flex-1 min-w-[120px] border-0 shadow-none focus-visible:ring-0 px-0 h-6"
                                onFocus={() => setTagsInputFocused(true)}
                                onBlur={() => setTagsInputFocused(false)}
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    e.currentTarget.value.trim()
                                  ) {
                                    e.preventDefault();
                                    const newTag = e.currentTarget.value.trim();
                                    if (
                                      !taskForm.tags.find(
                                        (t) => t.name === newTag,
                                      )
                                    ) {
                                      setTaskForm({
                                        ...taskForm,
                                        tags: [
                                          ...taskForm.tags,
                                          { name: newTag },
                                        ],
                                      });
                                    }
                                    e.currentTarget.value = "";
                                  }
                                }}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Ajouter des tags...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Membres assignés */}
                  <div className="space-y-2">
                    <Label className="text-sm font-normal flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Membres
                    </Label>
                    <div>
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          {taskForm.assignedMembers &&
                          taskForm.assignedMembers.length > 0 ? (
                            <div className="flex -space-x-2 cursor-pointer">
                              {taskForm.assignedMembers
                                .slice(0, 3)
                                .map((memberId, idx) => {
                                  const memberInfo = membersInfo.find(
                                    (m) => m.id === memberId,
                                  );
                                  return (
                                    <div
                                      key={memberId}
                                      className="relative group/avatar"
                                    >
                                      <UserAvatar
                                        src={memberInfo?.image}
                                        name={memberInfo?.name || memberId}
                                        size="sm"
                                        className="border border-background ring-1 ring-border/10 hover:ring-primary/50 transition-all"
                                        style={{
                                          zIndex:
                                            taskForm.assignedMembers.length -
                                            idx,
                                        }}
                                      />
                                    </div>
                                  );
                                })}
                              {taskForm.assignedMembers.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-muted/80 border border-background flex items-center justify-center text-[9px] font-semibold text-muted-foreground flex-shrink-0">
                                  +{taskForm.assignedMembers.length - 3}
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="w-7 h-7 rounded-full border border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/10 flex items-center justify-center cursor-pointer transition-colors bg-transparent p-0"
                              title="Ajouter des membres"
                            >
                              <UserPlus className="h-4 w-4 text-muted-foreground" />
                            </button>
                          )}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="w-72 max-h-[400px] overflow-y-auto"
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          {board?.members?.map((member) => (
                            <DropdownMenuCheckboxItem
                              key={member.id}
                              checked={(
                                taskForm.assignedMembers || []
                              ).includes(member.id)}
                              onCheckedChange={() =>
                                handleMemberToggle(member.id)
                              }
                              className="flex items-center gap-3 cursor-pointer"
                            >
                              <UserAvatar
                                src={member.image}
                                name={member.name}
                                size="sm"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium">
                                  {member.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {member.email}
                                </div>
                              </div>
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Timer et facturation */}
                {isEditing && (taskForm.id || taskForm._id) ? (
                  <div className="mt-6">
                    <TimerControls
                      taskId={taskForm.id || taskForm._id}
                      timeTracking={taskForm.timeTracking}
                      onTimerUpdate={(newTimeTracking) => {
                        setTaskForm((prev) => ({
                          ...prev,
                          timeTracking: newTimeTracking,
                        }));
                      }}
                    />
                  </div>
                ) : (
                  !isEditing && (
                    <div className="mt-6">
                      <LocalTimerControls
                        timeTracking={taskForm.timeTracking}
                        onTimeTrackingChange={(newTimeTracking) => {
                          setTaskForm((prev) => ({
                            ...prev,
                            timeTracking: newTimeTracking,
                          }));
                        }}
                      />
                    </div>
                  )
                )}

                {/* Checklist */}
                <div className="space-y-3 mt-6">
                  <Checklist
                    items={taskForm.checklist}
                    onChange={handleChecklistChange}
                  />
                </div>

                {/* Pièces jointes */}
                <div className="space-y-2 mt-6">
                  <Label className="text-sm font-normal flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    Pièces jointes
                  </Label>
                  {isEditing && (taskForm.id || taskForm._id) ? (
                    <TaskImageUpload
                      images={taskForm.images || []}
                      onUpload={handleDescriptionImageUpload}
                      onDelete={handleDeleteImage}
                      isUploading={isUploadingImage}
                      uploadProgress={uploadProgress}
                      maxImages={10}
                      placeholder="Glissez des fichiers ici ou cliquez pour sélectionner"
                    />
                  ) : (
                    <TaskImageUpload
                      localMode
                      pendingFiles={taskForm.pendingFiles || []}
                      onAddFiles={handleAddPendingFiles}
                      onRemoveFile={handleRemovePendingFile}
                      maxImages={10}
                      placeholder="Glissez des fichiers ici ou cliquez pour sélectionner"
                    />
                  )}
                </div>
              </div>

              {/* Footer fixe mobile — uniquement en mode création */}
              {!isEditing && (
                <div className="border-t border-border bg-card px-4 py-3 flex-shrink-0">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      disabled={isLoading}
                      className="flex-1 border-input"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={
                        isReadOnly || isLoading || !taskForm.title.trim()
                      }
                      title={readOnlyTooltip}
                      className="flex-1 text-white hover:opacity-90"
                      style={{ backgroundColor: "#5b50FF" }}
                    >
                      {isLoading ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Création...
                        </>
                      ) : (
                        "Créer la tâche"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Onglet Activité (mobile) */}
            <TabsContent
              value="activity"
              className="flex-1 flex flex-col overflow-hidden m-0 data-[state=active]:flex bg-muted/40"
            >
              <div className="flex-1 min-h-0 overflow-hidden">
                {isEditing && (taskForm.id || taskForm._id) ? (
                  <TaskActivity
                    task={taskActivityData}
                    workspaceId={workspaceId}
                    currentUser={board?.members?.find(
                      (m) => m.userId === taskActivityData.userId,
                    )}
                    boardMembers={board?.members || []}
                    columns={board?.columns || []}
                    onTaskUpdate={setTaskForm}
                  />
                ) : (
                  <PendingCommentsView
                    pendingComments={taskForm.pendingComments || []}
                    addPendingComment={addPendingComment}
                    removePendingComment={removePendingComment}
                    updatePendingComment={updatePendingComment}
                    currentUser={board?.members?.[0]}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
