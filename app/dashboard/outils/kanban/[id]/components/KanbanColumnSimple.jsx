import React from 'react';
import { Plus, Edit, Trash2, MoreVertical, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { TaskCard } from "./TaskCard";
import { TaskCardSkeleton } from "./TaskCardSkeleton";

// Styles pour le scrollbar personnalisé
const scrollbarStyles = `
  .kanban-column-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .kanban-column-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .kanban-column-scroll::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground) / 0.2);
    border-radius: 3px;
  }
  .kanban-column-scroll::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--muted-foreground) / 0.4);
  }
  .kanban-column-scroll {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--muted-foreground) / 0.2) transparent;
  }
`;

/**
 * Composant pour une colonne Kanban (custom DnD via data-attributes)
 */
export function KanbanColumnSimple({
  column,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onEditColumn,
  onDeleteColumn,
  isCollapsed,
  onToggleCollapse,
  isLoading,
  columnIndex,
  zoomLevel = 1,
}) {
  const baseOffset = 280;
  const maxHeight = `calc((100vh - ${baseOffset}px) / ${zoomLevel})`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div
        data-dnd-column={column.id}
        data-dnd-column-index={columnIndex}
        className={`rounded-xl p-1.5 sm:p-2 min-w-[240px] max-w-[240px] sm:min-w-[300px] sm:max-w-[300px] flex flex-col flex-shrink-0 ${
          isCollapsed ? "max-w-[80px] min-w-[80px]" : ""
        }`}
        style={{ backgroundColor: `${column.color || "#94a3b8"}08` }}
      >
        {/* Header de la colonne — drag handle for column reorder */}
        <div
          data-dnd-column-handle
          className={`flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing px-2 ${
            isCollapsed ? '' : 'mb-2 sm:mb-3'
          }`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="px-2 py-1 rounded-md flex-shrink-0 text-xs font-medium border flex items-center gap-1"
              style={{
                backgroundColor: `${column.color || "#94a3b8"}20`,
                borderColor: `${column.color || "#94a3b8"}20`,
                color: column.color || "#94a3b8"
              }}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: column.color || "#94a3b8" }}
              />
              <span className="truncate">{column.title}</span>
            </div>

            <span
              className="ml-auto flex-shrink-0 text-xs font-medium"
              style={{ color: column.color || "#94a3b8" }}
            >
              {tasks.length}
            </span>
          </div>

          <div className="flex items-center gap-0.5" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              style={{ color: column.color || "#94a3b8" }}
              onClick={(e) => { e.stopPropagation(); onAddTask(column.id); }}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              style={{ color: column.color || "#94a3b8" }}
              onClick={(e) => { e.stopPropagation(); onToggleCollapse(column.id); }}
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  style={{ color: column.color || "#94a3b8" }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditColumn(column)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDeleteColumn(column)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Zone drop pour les tâches */}
        {!isCollapsed && (
          <div
            data-dnd-drop-zone={column.id}
            className="kanban-column-scroll p-2 pb-4 rounded-lg transition-colors overflow-y-auto"
            style={{ minHeight: '50px', maxHeight }}
          >
            {isLoading ? (
              <div className="flex flex-col gap-2 sm:gap-3">
                <TaskCardSkeleton />
                <TaskCardSkeleton />
                <TaskCardSkeleton />
              </div>
            ) : (
              tasks.map((task, index) => (
                <div
                  key={task.id}
                  data-dnd-task={task.id}
                  data-dnd-column-id={column.id}
                  data-dnd-index={index}
                  className="cursor-grab active:cursor-grabbing mb-2 sm:mb-3 last:mb-0"
                >
                  <TaskCard
                    task={task}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    isDragging={false}
                  />
                </div>
              ))
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 justify-start transition-colors flex-shrink-0"
              style={{ color: column.color || "#94a3b8" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${column.color || "#94a3b8"}10`; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              onClick={() => onAddTask(column.id)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une tâche
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
