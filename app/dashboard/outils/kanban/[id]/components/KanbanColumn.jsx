import { useMemo } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from "./TaskCard";
import { TaskCardSkeleton } from "./TaskCardSkeleton";

/**
 * Composant pour une colonne avec ses tâches dans le tableau Kanban
 * Compatible avec dnd-kit
 */
export function KanbanColumn({
  column,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onEditColumn,
  onDeleteColumn,
  isCollapsed,
  onToggleCollapse,
  isLoading = false,
  dragHandleProps,
  isDragging,
}) {
  // CRITIQUE : Stabiliser les data pour éviter les re-rendus infinis
  const droppableData = useMemo(() => ({
    type: 'column',
    column: {
      id: column.id,
      name: column.name,
      // NE PAS inclure tasks ici pour éviter les changements de référence
    }
  }), [column.id, column.name]);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: droppableData,
  });

  return (
    <div
      className={`bg-muted/30 rounded-xl p-2 sm:p-3 min-w-[240px] max-w-[240px] sm:min-w-[300px] sm:max-w-[300px] border border-border flex flex-col flex-shrink-0 transition-all duration-200 ${
        isCollapsed ? "max-w-[80px] min-w-[80px]" : ""
      } ${isDragging ? "opacity-50" : ""}`}
    >
      {/* Header de la colonne - Draggable sur toute la zone */}
      <div 
        {...dragHandleProps}
        className="flex items-center justify-between mb-2 sm:mb-3 gap-2 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Icône de drag */}
          <div className="text-muted-foreground hover:text-foreground transition-colors">
            <GripVertical className="h-4 w-4" />
          </div>

          {!isCollapsed && (
            <>
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: column.color || "#94a3b8" }}
              />
              <h3 className="font-semibold text-sm sm:text-base truncate">
                {column.title}
              </h3>
              <Badge
                variant="secondary"
                className="ml-auto flex-shrink-0 text-xs"
              >
                {tasks.length}
              </Badge>
            </>
          )}
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Bouton collapse/expand */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8"
            onClick={onToggleCollapse}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>

          {!isCollapsed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEditColumn}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDeleteColumn}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Zone droppable pour les tâches */}
      {!isCollapsed && (
        <div
          ref={setNodeRef}
          className={`flex-1 overflow-y-auto space-y-2 sm:space-y-3 min-h-[100px] rounded-lg transition-colors ${
            isOver ? 'bg-accent/20' : ''
          }`}
        >
          {isLoading ? (
            // Afficher des skeletons pendant le chargement
            <>
              <TaskCardSkeleton />
              <TaskCardSkeleton />
              <TaskCardSkeleton />
            </>
          ) : tasks.length === 0 ? (
            // Message si aucune tâche
            <div className="text-center text-muted-foreground py-8 text-sm">
              Aucune tâche
            </div>
          ) : (
            // Liste des tâches draggables
            tasks.map((task) => (
              <SortableTaskItem
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))
          )}
        </div>
      )}

      {/* Bouton ajouter une tâche */}
      {!isCollapsed && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 sm:mt-3 justify-start text-muted-foreground hover:text-foreground"
          onClick={() => onAddTask(column.id)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une tâche
        </Button>
      )}
    </div>
  );
}

/**
 * Composant pour une tâche draggable avec dnd-kit
 */
function SortableTaskItem({ task, onEdit, onDelete }) {
  // CRITIQUE : Stabiliser les data pour éviter les re-rendus infinis
  const sortableData = useMemo(() => ({
    type: 'task',
    task: {
      id: task.id,
      title: task.title,
      columnId: task.columnId,
      position: task.position,
    },
  }), [task.id, task.title, task.columnId, task.position]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: sortableData,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        isDragging={isDragging}
      />
    </div>
  );
}
