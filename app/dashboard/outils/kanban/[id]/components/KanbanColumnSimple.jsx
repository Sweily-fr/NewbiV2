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
}) {
  return (
    <Draggable draggableId={`column-${column.id}`} index={columnIndex}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`bg-muted/30 rounded-xl p-2 sm:p-3 min-w-[240px] max-w-[240px] sm:min-w-[300px] sm:max-w-[300px] border border-border flex flex-col flex-shrink-0 transition-all duration-200 ${
            isCollapsed ? "max-w-[80px] min-w-[80px]" : ""
          } ${snapshot.isDragging ? "opacity-50 shadow-2xl" : ""}`}
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
            <Droppable droppableId={column.id} type="task">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 p-2 rounded-lg transition-colors ${
                    snapshot.isDraggingOver ? 'bg-accent/20 border-2 border-accent' : ''
                  }`}
                  style={{
                    minHeight: tasks.length === 0 ? '100px' : '80px'
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
                      <div className="text-center text-muted-foreground py-8 text-sm">
                        Aucune tâche
                      </div>
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
                    {/* Afficher le placeholder sauf si on drag depuis cette colonne vers une autre */}
                    {(snapshot.isDraggingOver || !snapshot.draggingFromThisWith) && provided.placeholder}
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
