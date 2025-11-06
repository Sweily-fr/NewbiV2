import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Edit, Trash2, MoreVertical, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
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
 * Composant pour une colonne Kanban avec @hello-pangea/dnd
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
  isDraggingAnyColumn,
}) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <Draggable draggableId={`column-${column.id}`} index={columnIndex}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={{
              ...provided.draggableProps.style,
              willChange: snapshot.isDragging ? 'auto' : 'auto',
              zIndex: snapshot.isDragging ? 1000 : 'auto',
              backgroundColor: `${column.color || "#94a3b8"}08`,
              // Garder la même taille pendant le drag
              ...(snapshot.isDragging ? { 
                width: isCollapsed ? '80px' : '300px',
                minWidth: isCollapsed ? '80px' : '300px',
                maxWidth: isCollapsed ? '80px' : '300px',
              } : {})
            }}
            className={`rounded-xl p-1.5 sm:p-2 min-w-[240px] max-w-[240px] sm:min-w-[300px] sm:max-w-[300px] flex flex-col flex-shrink-0 h-auto ${
              isCollapsed ? "max-w-[80px] min-w-[80px]" : ""
            } ${snapshot.isDragging ? "opacity-60 rotate-2" : ""}`}
          >
          {/* Header de la colonne - Draggable */}
          <div 
            {...provided.dragHandleProps}
            className={`flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing px-2 ${
              isCollapsed ? '' : 'mb-2 sm:mb-3'
            }`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Badge de couleur avec titre */}
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

              {/* Nombre de tâches - toujours affiché */}
              <span 
                className="ml-auto flex-shrink-0 text-xs font-medium"
                style={{ color: column.color || "#94a3b8" }}
              >
                {tasks.length}
              </span>
            </div>

            <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              {/* Bouton collapse/expand */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                style={{ color: column.color || "#94a3b8" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse(column.id);
                }}
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
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
                  <DropdownMenuItem
                    onClick={() => onDeleteColumn(column)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Zone droppable pour les tâches */}
          {!isCollapsed && (
            <Droppable droppableId={column.id} type="task">
              {(providedDroppable, snapshotDroppable) => (
                <div
                  ref={providedDroppable.innerRef}
                  {...providedDroppable.droppableProps}
                  className={`kanban-column-scroll p-2 rounded-lg transition-colors overflow-y-auto ${
                    snapshotDroppable.isDraggingOver ? 'bg-accent/20 border-2 border-accent' : ''
                  }`}
                  style={{
                    minHeight: '100px',
                    maxHeight: 'calc(100vh - 320px)', // Hauteur max basée sur la hauteur de l'écran (augmenté à 320px)
                    overflowY: 'auto' // Scroll vertical
                  }}
                >
                  <div className="space-y-2 sm:space-y-3">
                    {isLoading ? (
                      <>
                        <TaskCardSkeleton />
                        <TaskCardSkeleton />
                        <TaskCardSkeleton />
                      </>
                    ) : tasks.length === 0 ? (
                      // Ne pas afficher "Aucune tâche" si on drag au-dessus
                      !snapshotDroppable.isDraggingOver && (
                        <div 
                          {...provided.dragHandleProps}
                          className="text-center py-8 text-sm cursor-grab active:cursor-grabbing"
                          style={{ color: column.color || "#94a3b8" }}
                        >
                          Aucune tâche
                        </div>
                      )
                    ) : (
                      tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                              }}
                            >
                              <TaskCard
                                task={task}
                                onEdit={onEditTask}
                                onDelete={onDeleteTask}
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {/* Placeholder - prend exactement la hauteur de la tâche draggée */}
                    <div 
                      {...provided.dragHandleProps}
                      className="cursor-grab active:cursor-grabbing"
                      style={{ 
                        display: snapshotDroppable.isDraggingOver ? 'block' : 'none'
                      }}
                    >
                      {providedDroppable.placeholder}
                    </div>
                  </div>
                </div>
              )}
            </Droppable>
          )}

          {/* Bouton ajouter une tâche */}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 sm:mt-3 justify-start transition-colors"
              style={{ 
                color: column.color || "#94a3b8"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${column.color || "#94a3b8"}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={() => onAddTask(column.id)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une tâche
            </Button>
          )}
          </div>
        )}
      </Draggable>
    </>
  );
}
