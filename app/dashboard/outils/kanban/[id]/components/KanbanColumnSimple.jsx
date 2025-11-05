import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Edit, Trash2, MoreVertical, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
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
    <Draggable draggableId={`column-${column.id}`} index={columnIndex}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            ...provided.draggableProps.style,
            willChange: snapshot.isDragging ? 'auto' : 'auto',
            zIndex: snapshot.isDragging ? 1000 : 'auto',
            // Marges horizontales pour éviter que les colonnes se collent pendant le drag
            marginLeft: '8px',
            marginRight: '8px',
            // Garder la même taille pendant le drag
            ...(snapshot.isDragging ? { 
              width: isCollapsed ? '80px' : '300px',
              minWidth: isCollapsed ? '80px' : '300px',
              maxWidth: isCollapsed ? '80px' : '300px',
            } : {})
          }}
          className={`bg-muted/30 rounded-xl p-2 sm:p-3 min-w-[240px] max-w-[240px] sm:min-w-[300px] sm:max-w-[300px] border border-border flex flex-col flex-shrink-0 h-auto ${
            isCollapsed ? "max-w-[80px] min-w-[80px]" : ""
          } ${snapshot.isDragging ? "opacity-60 rotate-2" : ""}`}
        >
          {/* Header de la colonne - Draggable */}
          <div 
            {...provided.dragHandleProps}
            className="flex items-center justify-between mb-2 sm:mb-3 gap-2 cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Icône de drag */}
              <div className="text-muted-foreground hover:text-foreground transition-colors">
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Point de couleur et nom - toujours affichés */}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: column.color || "#94a3b8" }}
              />
              <h3 className="font-semibold text-sm sm:text-base truncate">
                {column.title}
              </h3>

              {/* Badge du nombre de tâches - toujours affiché */}
              <Badge
                variant="secondary"
                className="ml-auto flex-shrink-0 text-xs"
              >
                {tasks.length}
              </Badge>
            </div>

            <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              {/* Bouton collapse/expand */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
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
                  className={`p-2 rounded-lg transition-colors ${
                    snapshotDroppable.isDraggingOver ? 'bg-accent/20 border-2 border-accent' : ''
                  }`}
                  style={{
                    minHeight: '100px',
                    flex: '1 1 auto' // Permet à la colonne de grandir selon son contenu
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
                          className="text-center text-muted-foreground py-8 text-sm cursor-grab active:cursor-grabbing"
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
              className="w-full mt-2 sm:mt-3 justify-start text-muted-foreground hover:text-foreground"
              onClick={() => onAddTask(column.id)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une tâche
            </Button>
          )}
        </div>
      )}
    </Draggable>
  );
}
