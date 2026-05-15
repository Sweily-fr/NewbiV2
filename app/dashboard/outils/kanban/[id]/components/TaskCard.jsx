import { useState, useMemo, useRef, useCallback, memo } from "react";
import {
  Calendar,
  MoreHorizontal,
  Edit,
  Pencil,
  Trash2,
  Flag,
  CheckCircle,
  AlignLeft,
  Paperclip,
  ZoomIn,
  Tag,
  X,
  CornerDownLeft,
  Search,
  Check,
  Users,
} from "lucide-react";
import { TimerDisplay } from "./TimerDisplay";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
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
import { Dialog, DialogContent } from "@/src/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Calendar as CalendarComponent } from "@/src/components/ui/calendar";
import { Input } from "@/src/components/ui/input";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatDateRelative } from "../../../../../../src/utils/kanbanHelpers";
import { AvatarGroup, UserAvatar } from "@/src/components/ui/user-avatar";
import { useAssignedMembersInfo } from "@/src/hooks/useAssignedMembersInfo";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";

function DescriptionPopover({ description }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className="text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <AlignLeft className="h-3 w-3" />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-3"
        side="right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          <h4 className="font-medium text-sm">Description</h4>
          {/<[a-z][\s\S]*>/i.test(description) ? (
            <div
              className="text-sm text-muted-foreground break-words line-clamp-8 [&_b]:font-bold [&_i]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words line-clamp-8">
              {description}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const TAG_COLORS = [
  { bg: "#EDE9FE", text: "#6D28D9", border: "#DDD6FE" },
  { bg: "#DBEAFE", text: "#1D4ED8", border: "#BFDBFE" },
  { bg: "#DCFCE7", text: "#15803D", border: "#BBF7D0" },
  { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" },
  { bg: "#FEE2E2", text: "#B91C1C", border: "#FECACA" },
  { bg: "#FCE7F3", text: "#BE185D", border: "#FBCFE8" },
  { bg: "#E0E7FF", text: "#4338CA", border: "#C7D2FE" },
  { bg: "#F3F4F6", text: "#374151", border: "#E5E7EB" },
];

function CardTagPopover({
  task,
  updateTask,
  workspaceId,
  allBoardTags = [],
  isOpen,
  onOpenChange,
}) {
  const [search, setSearch] = useState("");
  const taskTags = task.tags || [];

  const existingTags = useMemo(() => {
    const seen = new Set();
    return allBoardTags.filter((t) => {
      const key = t.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [allBoardTags]);

  const filteredTags = existingTags.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) &&
      !taskTags.some((tt) => tt.name.toLowerCase() === t.name.toLowerCase()),
  );

  const canCreate =
    search.trim() &&
    !existingTags.some(
      (t) => t.name.toLowerCase() === search.trim().toLowerCase(),
    ) &&
    !taskTags.some((t) => t.name.toLowerCase() === search.trim().toLowerCase());

  const getNextColor = () => {
    const usedBgs = new Set(existingTags.map((t) => t.bg));
    return TAG_COLORS.find((c) => !usedBgs.has(c.bg)) || TAG_COLORS[0];
  };

  const addTagToTask = (tag) => {
    const newTags = [
      ...taskTags,
      {
        name: tag.name,
        className: "",
        bg: tag.bg,
        text: tag.text,
        border: tag.border,
      },
    ];
    updateTask({
      variables: {
        input: {
          id: task.id,
          tags: newTags.map((t) => ({
            name: t.name,
            className: t.className || "",
            bg: t.bg,
            text: t.text,
            border: t.border,
          })),
        },
        workspaceId,
      },
    });
  };

  const removeTagFromTask = (tagName) => {
    const newTags = taskTags.filter(
      (t) => t.name.toLowerCase() !== tagName.toLowerCase(),
    );
    updateTask({
      variables: {
        input: {
          id: task.id,
          tags: newTags.map((t) => ({
            name: t.name,
            className: t.className || "",
            bg: t.bg,
            text: t.text,
            border: t.border,
          })),
        },
        workspaceId,
      },
    });
  };

  const createAndAdd = () => {
    const color = getNextColor();
    addTagToTask({ name: search.trim(), ...color });
    setSearch("");
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (open) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Tag className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-0"
        side="bottom"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        {taskTags.length > 0 && (
          <div className="flex flex-wrap gap-1 px-3 pt-2.5 pb-1">
            {taskTags.map((tag) => (
              <span
                key={tag.name}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={{
                  backgroundColor: tag.bg,
                  color: tag.text,
                  border: `1px solid ${tag.border}`,
                }}
              >
                {tag.name}
                <button
                  onClick={() => removeTagFromTask(tag.name)}
                  className="hover:opacity-70 cursor-pointer"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="px-3 pt-2 pb-1.5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canCreate) {
                e.preventDefault();
                createAndAdd();
              }
            }}
            placeholder="Rechercher ou créer..."
            className="w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/40 p-0"
            autoFocus
          />
        </div>
        <div className="border-t border-border/40" />
        <div className="p-1.5 max-h-[200px] overflow-y-auto">
          {filteredTags.length > 0 && (
            <div className="px-1.5 pb-1">
              <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                Sélectionner
              </span>
            </div>
          )}
          {filteredTags.map((tag) => (
            <button
              key={tag.name}
              onClick={() => {
                addTagToTask(tag);
                setSearch("");
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
            >
              <span
                className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={{
                  backgroundColor: tag.bg,
                  color: tag.text,
                  border: `1px solid ${tag.border}`,
                }}
              >
                {tag.name}
              </span>
            </button>
          ))}
          {canCreate && (
            <button
              onClick={createAndAdd}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
            >
              <span className="text-xs text-muted-foreground">Créer</span>
              <span
                className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={{
                  backgroundColor: getNextColor().bg,
                  color: getNextColor().text,
                  border: `1px solid ${getNextColor().border}`,
                }}
              >
                {search.trim()}
              </span>
              <kbd className="ml-auto inline-flex items-center justify-center size-4 rounded bg-muted text-[9px] text-muted-foreground">
                <CornerDownLeft className="size-2.5" />
              </kbd>
            </button>
          )}
          {filteredTags.length === 0 && !canCreate && (
            <p className="text-xs text-muted-foreground/50 text-center py-3">
              Aucun tag disponible
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Composant TaskCard optimisé avec React.memo
 * Évite les re-renders inutiles pendant le drag
 */
const PRIORITIES = [
  {
    value: "high",
    label: "Urgent",
    color: "text-red-500",
    fill: "fill-red-500",
  },
  {
    value: "medium",
    label: "Moyen",
    color: "text-yellow-500",
    fill: "fill-yellow-500",
  },
  {
    value: "low",
    label: "Faible",
    color: "text-green-500",
    fill: "fill-green-500",
  },
  {
    value: "",
    label: "Aucune",
    color: "text-[#8D8D8D]",
    fill: "fill-gray-400",
  },
];

const TaskCard = memo(
  function TaskCard({
    task,
    onEdit,
    onDelete,
    index,
    isDragging,
    updateTask,
    workspaceId,
    allBoardTags = [],
    members = [],
  }) {
    const { isReadOnly, isOwner } = useSubscriptionAccess();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editValue, setEditValue] = useState(task.title);
    const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
    const titleInputRef = useRef(null);
    const interactionLockRef = useRef(false);

    // Récupérer les infos des membres assignés
    const { members: assignedMembersInfo } = useAssignedMembersInfo(
      task.assignedMembers || [],
    );

    const handleDeleteClick = (e) => {
      e.stopPropagation();
      setShowDeleteDialog(true);
    };

    const confirmDelete = (e) => {
      e?.stopPropagation();
      onDelete(task.id);
      setShowDeleteDialog(false);
    };

    const cancelDelete = (e) => {
      e?.stopPropagation();
      setShowDeleteDialog(false);
    };

    const startEditingTitle = (e) => {
      e.stopPropagation();
      if (isEditingTitle) {
        setIsEditingTitle(false);
        setEditValue(task.title);
        return;
      }
      setEditValue(task.title);
      setIsEditingTitle(true);
      setTimeout(() => titleInputRef.current?.focus(), 0);
    };

    const lockInteraction = useCallback(() => {
      interactionLockRef.current = true;
      setTimeout(() => {
        interactionLockRef.current = false;
      }, 200);
    }, []);

    const saveTitle = useCallback(() => {
      const trimmed = editValue.trim();
      if (trimmed && trimmed !== task.title && updateTask) {
        updateTask({
          variables: { input: { id: task.id, title: trimmed }, workspaceId },
        });
      } else {
        setEditValue(task.title);
      }
      setIsEditingTitle(false);
      lockInteraction();
    }, [
      editValue,
      task.title,
      task.id,
      updateTask,
      workspaceId,
      lockInteraction,
    ]);

    const handleTagPopoverChange = useCallback(
      (open) => {
        setTagPopoverOpen(open);
        if (!open) lockInteraction();
      },
      [lockInteraction],
    );

    // Gestion du clic - bloque l'ouverture de la modale si un popover/edit vient de se fermer
    const handleClick = (e) => {
      if (interactionLockRef.current) return;
      if (isEditingTitle || tagPopoverOpen) return;

      const interactiveElements = [
        "BUTTON",
        "A",
        "INPUT",
        "SELECT",
        "TEXTAREA",
      ];
      const clickedElement = e.target.closest(interactiveElements.join(","));

      if (!clickedElement) {
        onEdit(task);
      }
    };

    // Calcul de la progression - memoized
    const checklistProgress = useMemo(() => {
      if (
        !task.checklist ||
        !Array.isArray(task.checklist) ||
        task.checklist.length === 0
      ) {
        return { completed: 0, total: 0, percentage: 0 };
      }

      const completed = task.checklist.filter((item) => item.completed).length;
      const total = task.checklist.length;
      const percentage = Math.round((completed / total) * 100) || 0;

      return { completed, total, percentage };
    }, [task.checklist]);

    return (
      <>
        <div
          onClick={handleClick}
          className={`relative group/card bg-card text-card-foreground rounded-xl border border-border shadow-xs hover:shadow-sm cursor-pointer flex flex-col transition-all overflow-clip ${
            isDragging ? "opacity-50" : "opacity-100"
          }`}
        >
          {/* Image de couverture - première image épinglée */}
          {task.images && task.images.length > 0 && (
            <div
              className="relative w-full h-32 overflow-hidden group/cover cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowImagePreview(true);
              }}
            >
              <img
                src={task.images[0].url}
                alt={task.images[0].fileName || "Image de la tâche"}
                className="w-full h-full object-cover select-none"
                loading="lazy"
                draggable="false"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/cover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover/cover:opacity-100 transition-opacity drop-shadow-md" />
              </div>
            </div>
          )}

          {/* Contenu avec padding */}
          <div className="px-3 py-2 sm:px-4 sm:py-2.5 flex flex-col flex-1">
            {/* Bloc d'actions flottant au hover */}
            <div
              className={`absolute top-1.5 right-1.5 transition-opacity z-10 flex items-center gap-0.5 bg-white dark:bg-card rounded-md shadow-xs border border-border p-0.5 ${tagPopoverOpen || isEditingTitle ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                disabled={isReadOnly}
                onClick={isReadOnly ? undefined : startEditingTitle}
                title={isEditingTitle ? "Annuler" : "Modifier le titre"}
              >
                {isEditingTitle ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  <Pencil className="h-3.5 w-3.5" />
                )}
              </Button>
              {updateTask && !isReadOnly && (
                <CardTagPopover
                  task={task}
                  updateTask={updateTask}
                  workspaceId={workspaceId}
                  allBoardTags={allBoardTags}
                  isOpen={tagPopoverOpen}
                  onOpenChange={handleTagPopoverChange}
                />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                    }}
                    disabled={isReadOnly}
                    className="cursor-pointer"
                  >
                    <Edit className="mr-2 h-3.5 w-3.5" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteClick(e);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                    }}
                    disabled={isReadOnly}
                    className="text-red-600 cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-3 w-3 text-red-600" />
                    Supprimer
                  </DropdownMenuItem>
                  {isReadOnly && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        {isOwner
                          ? "Mode lecture seule · Renouvelez votre abonnement"
                          : "Mode lecture seule · Contactez l'administrateur"}
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Titre */}
            {isEditingTitle ? (
              <div onClick={(e) => e.stopPropagation()}>
                <input
                  ref={titleInputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveTitle();
                    }
                    if (e.key === "Escape") {
                      setEditValue(task.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  onBlur={saveTitle}
                  className="w-full text-sm font-medium text-[#5A50FF] bg-transparent border-none outline-none caret-[#5A50FF] p-0 m-0"
                />
              </div>
            ) : (
              <h4 className="font-medium text-sm text-foreground truncate">
                {task.title}
              </h4>
            )}

            {/* Pied de carte - Organisé sur 2 lignes */}
            <div className="mt-auto pt-2 sm:pt-3 space-y-1.5">
              {/* Ligne 1: Icônes (description, checklist) */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {/* Icône description */}
                {task.description && (
                  <DescriptionPopover description={task.description} />
                )}

                {/* Pièces jointes */}
                {task.images && task.images.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-0.5">
                        <Paperclip className="h-3.5 w-3.5" />
                        <span>{task.images.length}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {task.images.length} pièce
                      {task.images.length > 1 ? "s" : ""} jointe
                      {task.images.length > 1 ? "s" : ""}
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Checklist */}
                {checklistProgress.total > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-0.5">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>
                          {checklistProgress.completed}/
                          {checklistProgress.total}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      Checklist: {checklistProgress.completed}/
                      {checklistProgress.total}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Ligne 2: Timer + Avatar + Date d'échéance + Priorité */}
              <div
                className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Timer Display */}
                <TimerDisplay timeTracking={task.timeTracking} />

                {/* Avatars avec popover assignation */}
                {updateTask && !isReadOnly ? (
                  <Popover
                    onOpenChange={(open) => {
                      if (!open) lockInteraction();
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        className="cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {assignedMembersInfo &&
                        assignedMembersInfo.length > 0 ? (
                          <AvatarGroup
                            users={assignedMembersInfo}
                            max={2}
                            size="xs"
                          />
                        ) : (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-sm border border-input bg-background text-muted-foreground hover:text-foreground">
                            <Users className="h-3 w-3 text-[#8D8D8D]" />
                          </span>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-60 p-0"
                      align="start"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-2 pb-0.5 pt-2">
                        <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                          Assigné
                        </span>
                      </div>
                      <div className="p-1.5 pt-0.5 space-y-0.5 max-h-[280px] overflow-y-auto">
                        {members.map((member) => {
                          const memberId = member.userId || member.id;
                          const memberName =
                            member.name || member.user?.name || memberId;
                          const memberImage =
                            member.image || member.user?.image;
                          const isSelected = (
                            task.assignedMembers || []
                          ).includes(memberId);
                          return (
                            <button
                              key={memberId}
                              onClick={(e) => {
                                e.stopPropagation();
                                const current = task.assignedMembers || [];
                                const newMembers = isSelected
                                  ? current.filter((id) => id !== memberId)
                                  : [...current, memberId];
                                updateTask({
                                  variables: {
                                    input: {
                                      id: task.id,
                                      assignedMembers: newMembers,
                                    },
                                    workspaceId,
                                  },
                                });
                              }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
                            >
                              <div
                                className={`rounded-full flex-shrink-0 ${isSelected ? "ring-[1.5px] ring-[#5A50FF] ring-offset-1 ring-offset-background" : ""}`}
                              >
                                <UserAvatar
                                  src={memberImage}
                                  name={memberName}
                                  size="xs"
                                  className="h-5 w-5"
                                />
                              </div>
                              <span className="flex-1 text-left text-xs font-medium truncate">
                                {memberName}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  assignedMembersInfo &&
                  assignedMembersInfo.length > 0 && (
                    <AvatarGroup
                      users={assignedMembersInfo}
                      max={2}
                      size="xs"
                    />
                  )
                )}

                {/* Date avec popover calendrier */}
                {updateTask && !isReadOnly ? (
                  <Popover
                    onOpenChange={(open) => {
                      if (!open) lockInteraction();
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        className="cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {task.dueDate ? (
                          (() => {
                            try {
                              const date = new Date(task.dueDate);
                              if (isNaN(date.getTime())) return null;
                              return (
                                <Badge
                                  variant="outline"
                                  className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground"
                                >
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {date.toLocaleDateString("fr-FR", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </span>
                                </Badge>
                              );
                            } catch {
                              return null;
                            }
                          })()
                        ) : (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-sm border border-input bg-background text-muted-foreground hover:text-foreground">
                            <Calendar className="h-3 w-3 text-[#8D8D8D]" />
                          </span>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0"
                      align="start"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CalendarComponent
                        mode="single"
                        selected={
                          task.dueDate ? new Date(task.dueDate) : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            date.setHours(18, 0, 0, 0);
                          }
                          updateTask({
                            variables: {
                              input: {
                                id: task.id,
                                dueDate: date ? date.toISOString() : null,
                              },
                              workspaceId,
                            },
                          });
                        }}
                        locale={fr}
                        fromDate={new Date()}
                        className="border-0 p-2 text-xs [--cell-size:--spacing(8)]"
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  task.dueDate &&
                  (() => {
                    try {
                      const date = new Date(task.dueDate);
                      if (isNaN(date.getTime())) return null;
                      return (
                        <Badge
                          variant="outline"
                          className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground"
                        >
                          <Calendar className="h-4 w-4" />
                          <span>
                            {date.toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </Badge>
                      );
                    } catch {
                      return null;
                    }
                  })()
                )}

                {/* Priorité avec popover */}
                {updateTask && !isReadOnly ? (
                  <Popover
                    onOpenChange={(open) => {
                      if (!open) lockInteraction();
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        className="cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {task.priority && task.priority !== "none" ? (
                          <Badge
                            variant="outline"
                            className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground"
                          >
                            <Flag
                              className={`h-4 w-4 ${
                                task.priority.toLowerCase() === "high"
                                  ? "text-red-500 fill-red-500"
                                  : task.priority.toLowerCase() === "medium"
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-green-500 fill-green-500"
                              }`}
                            />
                            <span>
                              {task.priority.toLowerCase() === "high"
                                ? "Urgent"
                                : task.priority.toLowerCase() === "medium"
                                  ? "Moyen"
                                  : "Faible"}
                            </span>
                          </Badge>
                        ) : (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-sm border border-input bg-background text-muted-foreground hover:text-foreground">
                            <Flag className="h-3 w-3 text-[#8D8D8D]" />
                          </span>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-52 p-0"
                      align="start"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-2 pt-2 pb-0.5">
                        <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                          Priorité
                        </span>
                      </div>
                      <div className="p-1.5 pt-0.5 space-y-0.5">
                        {PRIORITIES.map((p) => {
                          const isActive =
                            (p.value === "" &&
                              (!task.priority || task.priority === "none")) ||
                            task.priority?.toLowerCase() === p.value;
                          return (
                            <button
                              key={p.value || "none"}
                              onClick={() =>
                                updateTask({
                                  variables: {
                                    input: { id: task.id, priority: p.value },
                                    workspaceId,
                                  },
                                })
                              }
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors cursor-pointer ${isActive ? "bg-muted/60" : ""}`}
                            >
                              <Flag
                                className={`h-3.5 w-3.5 ${p.color} ${p.fill}`}
                              />
                              <span className="flex-1 text-left text-xs font-normal">
                                {p.label}
                              </span>
                              {isActive && (
                                <Check className="w-3.5 h-3.5 text-[#5A50FF]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  task.priority &&
                  task.priority !== "none" && (
                    <Badge
                      variant="outline"
                      className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground"
                    >
                      <Flag
                        className={`h-4 w-4 ${
                          task.priority.toLowerCase() === "high"
                            ? "text-red-500 fill-red-500"
                            : task.priority.toLowerCase() === "medium"
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-green-500 fill-green-500"
                        }`}
                      />
                      <span>
                        {task.priority.toLowerCase() === "high"
                          ? "Urgent"
                          : task.priority.toLowerCase() === "medium"
                            ? "Moyen"
                            : "Faible"}
                      </span>
                    </Badge>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dialog de prévisualisation d'image */}
        <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
          <DialogContent
            className="max-w-[90vw] max-h-[90vh] p-2 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {task.images && task.images.length > 0 && (
              <img
                src={task.images[0].url}
                alt={task.images[0].fileName || "Image de la tâche"}
                className="w-full h-full max-h-[85vh] object-contain rounded-md"
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer la tâche ?</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer la tâche "{task.title}" ?
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDelete}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  },
  (prevProps, nextProps) => {
    // Comparaison personnalisée pour éviter les re-renders inutiles
    // Note: On ne compare PAS timeTracking pour permettre la mise à jour en temps réel du timer
    return (
      prevProps.task.id === nextProps.task.id &&
      prevProps.task.title === nextProps.task.title &&
      prevProps.task.description === nextProps.task.description &&
      prevProps.task.position === nextProps.task.position &&
      prevProps.task.columnId === nextProps.task.columnId &&
      prevProps.task.priority === nextProps.task.priority &&
      prevProps.task.dueDate === nextProps.task.dueDate &&
      prevProps.task.updatedAt === nextProps.task.updatedAt &&
      prevProps.isDragging === nextProps.isDragging &&
      JSON.stringify(prevProps.task.tags) ===
        JSON.stringify(nextProps.task.tags) &&
      JSON.stringify(prevProps.task.checklist) ===
        JSON.stringify(nextProps.task.checklist) &&
      JSON.stringify(prevProps.task.assignedMembers) ===
        JSON.stringify(nextProps.task.assignedMembers) &&
      JSON.stringify(prevProps.task.images) ===
        JSON.stringify(nextProps.task.images)
    );
  },
);

export { TaskCard };
