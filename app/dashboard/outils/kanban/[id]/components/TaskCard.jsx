import { useState, useMemo, useRef } from "react";
import {
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  GripVertical,
  Flag,
  CheckSquare,
  Tag,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  getPriorityColor,
  getPriorityIcon,
  formatDateRelative,
} from "../../../../../../src/utils/kanbanHelpers";
import { AvatarGroup } from "@/src/components/ui/user-avatar";

/**
 * Composant pour une tâche draggable dans le tableau Kanban
 */
export function TaskCard({ task, onEdit, onDelete }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  // Gestion du clic - Utiliser onClick au lieu de onPointerUp pour ne pas bloquer le drag
  const handleClick = (e) => {
    // Ignorer si c'est un clic sur un élément interactif
    const interactiveElements = ["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA"];
    const clickedElement = e.target.closest(interactiveElements.join(","));
    
    if (!clickedElement) {
      onEdit(task);
    }
  };

  // Calcul de la progression de la checklist
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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isSortableDragging ? "none" : transition,
    opacity: isSortableDragging ? 0.8 : 1,
    zIndex: isSortableDragging ? 1000 : "auto",
    position: "relative",
    touchAction: "none", // Désactive le défilement tactile pendant le drag
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleClick}
        className={`bg-card text-card-foreground rounded-lg border border-border p-2 sm:p-3 mb-2 sm:mb-3 shadow-xs hover:shadow-sm transition-all duration-200 ease-out hover:bg-accent/10 will-change-transform min-h-[148px] flex flex-col ${isSortableDragging ? "opacity-50" : ""} cursor-grab active:cursor-grabbing`}
      >
        {/* En-tête de la carte */}
        <div className="flex items-start justify-between mb-1.5 sm:mb-2">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
            <div
              className="text-muted-foreground/70 hover:text-foreground p-1 -ml-1 rounded hover:bg-accent flex-shrink-0 touch-none"
              title="Faire glisser pour déplacer"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <h4 
                  className="font-medium text-sm text-foreground truncate"
                >
                  {task.title}
                </h4>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                {task.title}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-1">
            {task.priority && task.priority !== "none" && (
              <Flag
                className={`h-3.5 w-3.5 ${
                  task.priority.toLowerCase() === "high"
                    ? "text-red-500 fill-red-500"
                    : task.priority.toLowerCase() === "medium"
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-green-500 fill-green-500"
                }`}
              />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground/70 hover:text-foreground hover:bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(task);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  }}
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
                  className="text-red-600 cursor-pointer"
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground mb-1.5 sm:mb-2 line-clamp-3 break-words whitespace-pre-wrap">
            {task.description}
          </p>
        )}

        {/* Checklist */}
        {checklistProgress.total > 0 && (
          <div className="flex items-center gap-1 mb-1.5 sm:mb-2">
            <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {checklistProgress.completed}/{checklistProgress.total}
            </span>
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
            {task.tags.map((tag, index) => {
              // Extraire le nom du tag, qu'il s'agisse d'un objet ou d'une chaîne
              const tagName =
                typeof tag === "object" ? tag.name || tag.title || "Tag" : tag;
              return (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs font-normal text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-full px-2 py-0.5"
                >
                  {tagName}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Pied de carte */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 sm:pt-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {task.dueDate && (() => {
              try {
                const date = new Date(task.dueDate);
                if (isNaN(date.getTime())) return null;
                return (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {date.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                );
              } catch (error) {
                console.error("Erreur de formatage de date:", error);
                return null;
              }
            })()}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {task.assignedMembers && task.assignedMembers.length > 0 && (
              <AvatarGroup 
                users={task.assignedMembers} 
                max={2} 
                size="xs"
              />
            )}
            
            {task.updatedAt && (
              <span className="text-gray-400">
                {formatDateRelative(new Date(task.updatedAt))}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Boîte de dialogue de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la tâche ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la tâche "{task.title}" ? Cette
              action est irréversible.
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
}
