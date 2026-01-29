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
  zoomLevel = 1,
}) {
  // Calculer le maxHeight en fonction du zoom
  // Quand on dézoom (scale < 1), le conteneur est réduit visuellement
  // Donc on doit augmenter le maxHeight pour compenser et utiliser tout l'espace
  // Formule: (100vh - header) / zoomLevel pour que le contenu scalé remplisse l'espace
  const baseOffset = 280; // Hauteur du header + toolbar
  const maxHeight = `calc((100vh - ${baseOffset}px) / ${zoomLevel})`;

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
            className={`rounded-xl p-1.5 sm:p-2 min-w-[240px] max-w-[240px] sm:min-w-[300px] sm:max-w-[300px] flex flex-col flex-shrink-0 ${
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

            <div className="flex items-center gap-0.5" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              {/* Bouton + pour ajouter une tâche rapidement */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                style={{ color: column.color || "#94a3b8" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTask(column.id);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
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

          {/* Zone droppable pour les tâches - Affichée seulement s'il y a des tâches, si on charge, ou si on drag au-dessus */}
          {!isCollapsed && (
            <Droppable droppableId={column.id} type="task">
              {(providedDroppable, snapshotDroppable) => (
                <div
                  ref={providedDroppable.innerRef}
                  {...providedDroppable.droppableProps}
                  className={`kanban-column-scroll p-2 pb-4 rounded-lg transition-colors overflow-y-auto ${
                    snapshotDroppable.isDraggingOver ? 'bg-accent/20 border-2 border-accent' : ''
                  }`}
                  style={{
                    minHeight: (isLoading || tasks.length > 0 || snapshotDroppable.isDraggingOver) ? '50px' : '0px',
                    maxHeight: maxHeight,
                  }}
                >
                  <div className="flex flex-col gap-2 sm:gap-3">
                    {isLoading ? (
                      <>
                        <TaskCardSkeleton />
                        <TaskCardSkeleton />
                        <TaskCardSkeleton />
                      </>
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

                    {/* Bouton ajouter une tâche - à l'intérieur de la zone scrollable */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 justify-start transition-colors flex-shrink-0"
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
                  </div>
                </div>
              )}
            </Droppable>
          )}
          </div>
        )}
      </Draggable>
    </>
  );
}
