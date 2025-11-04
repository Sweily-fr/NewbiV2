import React, { useState, Fragment, useMemo, useCallback } from "react";
import { MoreHorizontal, Calendar, ChevronDown, ChevronRight, Plus, Flag, MessageSquare, Paperclip, MoreVertical, GripVertical } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Badge } from "@/src/components/ui/badge";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { useAssignedMembersInfo } from "@/src/hooks/useAssignedMembersInfo";

/**
 * Zone de drop pour les colonnes vides
 */
function EmptyColumnDropZone({ columnId }) {
  return (
    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
      Aucune tâche
    </div>
  );
}

/**
 * Zone de drop sur l'en-tête d'une section fermée
 */
function CollapsedColumnDropZone({ columnId, onOpen, children }) {
  return (
    <Droppable droppableId={`collapsed-${columnId}`} type="task">
      {(provided, snapshot) => {
        // Ouvrir automatiquement quand on survole avec une tâche
        React.useEffect(() => {
          if (snapshot.isDraggingOver) {
            const timer = setTimeout(() => {
              onOpen(columnId);
            }, 500); // Délai de 500ms avant d'ouvrir
            return () => clearTimeout(timer);
          }
        }, [snapshot.isDraggingOver, columnId, onOpen]);

        return (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`transition-colors ${snapshot.isDraggingOver ? 'bg-primary/10' : ''}`}
          >
            {children}
            {provided.placeholder}
          </div>
        );
      }}
    </Droppable>
  );
}

/**
 * Composant pour une ligne de tâche draggable
 */
function DraggableTaskRow({ task, column, onEditTask, index, children }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            display: snapshot.isDragging ? provided.draggableProps.style?.display : undefined,
          }}
          className={`grid grid-cols-12 gap-4 px-2 py-1.5 items-center hover:bg-accent/5 cursor-grab active:cursor-grabbing group relative overflow-hidden ${
            snapshot.isDragging ? 'opacity-90 shadow-2xl bg-background border border-primary/40 rounded-lg z-[9999]' : ''
          } ${index > 0 ? 'border-t border-border/10' : ''}}`}
          onClick={(e) => {
            // Ne pas ouvrir la modal si on est en train de drag
            if (!snapshot.isDragging) {
              onEditTask(task);
            }
          }}
        >
          {children}
        </div>
      )}
    </Draggable>
  );
}

/**
 * Composant pour afficher le Kanban en vue Liste (comme ClickUp)
 */
export function KanbanListView({
  columns,
  getTasksByColumn,
  filterTasks,
  onEditTask,
  onDeleteTask,
  onAddTask,
  members = [],
  selectedTaskIds,
  setSelectedTaskIds,
}) {
  const [collapsedColumns, setCollapsedColumns] = useState(new Set());
  
  // Fonction wrapper pour récupérer les tâches filtrées
  const getFilteredTasksByColumn = useCallback((columnId) => {
    const tasks = getTasksByColumn(columnId);
    return filterTasks ? filterTasks(tasks) : tasks;
  }, [getTasksByColumn, filterTasks]);
  
  // Récupérer tous les IDs de membres de toutes les tâches
  const allMemberIds = useMemo(() => {
    const ids = new Set();
    columns.forEach(column => {
      const tasks = getFilteredTasksByColumn(column.id);
      tasks.forEach(task => {
        if (task.assignedMembers && Array.isArray(task.assignedMembers)) {
          task.assignedMembers.forEach(id => ids.add(id));
        }
      });
    });
    return Array.from(ids);
  }, [columns, getFilteredTasksByColumn]);

  // Récupérer les infos complètes de tous les membres
  const { members: membersInfo } = useAssignedMembersInfo(allMemberIds);
  
  // Fonction pour récupérer un membre par son ID
  const getMemberById = (memberId) => {
    return members.find(m => m.userId === memberId || m.id === memberId);
  };

  const toggleColumn = (columnId) => {
    setCollapsedColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  // Ouvrir automatiquement une section quand on drag dessus
  const openColumnOnDrag = (columnId) => {
    setCollapsedColumns(prev => {
      const next = new Set(prev);
      next.delete(columnId);
      return next;
    });
  };

  // Fonction pour vérifier si une section doit être fermée par défaut
  const isColumnCollapsedByDefault = (columnId) => {
    const tasks = getFilteredTasksByColumn(columnId);
    return tasks.length === 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  const getPriorityIcon = (priority) => {
    const className = "h-3.5 w-3.5";
    switch (priority?.toLowerCase()) {
      case "high":
        return <Flag className={`${className} text-red-500 fill-red-500`} />;
      case "medium":
        return <Flag className={`${className} text-yellow-500 fill-yellow-500`} />;
      case "low":
        return <Flag className={`${className} text-green-500 fill-green-500`} />;
      default:
        return null;
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "High";
      case "medium":
        return "Medium";
      case "low":
        return "Low";
      default:
        return "";
    }
  };

  return (
    <div className="w-max min-w-full">
      <div className="space-y-4 bg-background">
      {columns.map((column, columnIndex) => {
        const tasks = getFilteredTasksByColumn(column.id);
        const isCollapsed = collapsedColumns.has(column.id) || (tasks.length === 0 && !collapsedColumns.has(column.id));

        return (
          <div key={column.id} className="space-y-0">
            {/* En-tête de colonne pliable avec zone de drop si fermée */}
            {isCollapsed ? (
              <CollapsedColumnDropZone columnId={column.id} onOpen={openColumnOnDrag}>
                <div 
                  className="flex items-center gap-2 px-3 py-2 bg-muted/10 hover:bg-muted/20 cursor-pointer transition-colors group"
                  onClick={() => toggleColumn(column.id)}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: column.color || "#94a3b8" }}
                    />
                    <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: column.color }}>
                      {column.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 font-medium bg-muted/40 px-1.5 py-0.5 rounded-full">
                      {tasks.length}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all hover:bg-muted/50 rounded"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Ouvrir modal d'édition de colonne
                      }}>
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Supprimer la colonne
                        }}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CollapsedColumnDropZone>
            ) : (
              <>
              {/* En-tête de section cliquable */}
              <div 
                className="flex items-center gap-3 px-3 py-2 bg-muted/5 hover:bg-muted/10 cursor-pointer transition-all group border-b border-border/20"
                onClick={() => toggleColumn(column.id)}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-muted/50 rounded transition-colors"
                >
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Button>
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: column.color || "#94a3b8" }}
                  />
                  <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: column.color }}>
                    {column.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 font-medium bg-muted/40 px-1.5 py-0.5 rounded-full">
                    {tasks.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddTask(column.id);
                  }}
                  className="h-6 px-2 text-[10px] gap-1 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10 hover:text-primary font-medium"
                >
                  <Plus className="h-3 w-3" />
                  Nouvelle tâche
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all hover:bg-muted/50 rounded"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Ouvrir modal d'édition de colonne
                    }}>
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Supprimer la colonne
                      }}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {/* Header de section avec colonnes */}
              <div className="grid grid-cols-12 gap-4 px-3 py-2 text-[10px] font-semibold text-muted-foreground/70 tracking-wide border-b border-border/20">
                <div className="col-span-4 flex items-center gap-2">
                  <GripVertical className="h-3 w-3 opacity-0" />
                  Nom de la tâche
                </div>
                <div className="col-span-3 flex items-center">Description</div>
                <div className="col-span-1 flex items-center">Assigné à</div>
                <div className="col-span-2 flex items-center">Échéance</div>
                <div className="col-span-1 flex items-center">Priorité</div>
                <div className="col-span-1 flex items-center justify-center">Actions</div>
              </div>
              </>
            )}

            {/* Liste des tâches */}
            {!isCollapsed && (
              <>
                <Droppable droppableId={column.id} type="task">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`transition-all duration-200 ${snapshot.isDraggingOver ? 'bg-accent/10' : ''}`}
                      style={{
                        minHeight: tasks.length === 0 ? '80px' : 'auto'
                      }}
                    >
                      {tasks.length === 0 ? (
                        <EmptyColumnDropZone columnId={column.id} />
                      ) : (
                        tasks.map((task, taskIndex) => (
                          <DraggableTaskRow 
                            key={task.id} 
                            task={task} 
                            column={column} 
                            onEditTask={onEditTask} 
                            index={taskIndex}
                          >
                              {/* Nom avec drag handle et checkbox */}
                              <div className="col-span-4 min-w-0">
                                <div className="flex items-center gap-2">
                                  {/* Drag handle visible au hover */}
                                  <GripVertical className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-grab" />
                                  {/* Checkbox visible au hover ou si sélectionné */}
                                  <Checkbox
                                    checked={selectedTaskIds.has(task.id)}
                                    onCheckedChange={(checked) => {
                                      const newSelected = new Set(selectedTaskIds);
                                      // Gérer les trois états : true, false, "indeterminate"
                                      if (checked === true) {
                                        newSelected.add(task.id);
                                      } else if (checked === false) {
                                        newSelected.delete(task.id);
                                      }
                                      setSelectedTaskIds(newSelected);
                                    }}
                                    className={`flex-shrink-0 h-4 w-4 transition-opacity border-muted-foreground/30 ${
                                      selectedTaskIds.has(task.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex-1 w-0">
                                    <p className="text-[12px] truncate font-medium text-foreground/90 group-hover:text-foreground">{task.title}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Description */}
                              <div className="col-span-3 min-w-0">
                                <div className="flex items-center gap-1">
                                  <div className="flex-1 w-0">
                                    {task.description ? (
                                      <p className="text-[11px] text-muted-foreground/80 truncate">{task.description}</p>
                                    ) : (
                                      <p className="text-[11px] text-muted-foreground/30 italic">Aucune description</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Assignée */}
                              <div className="col-span-1 flex items-center gap-0.5 min-w-0">
                                {task.assignedMembers && task.assignedMembers.length > 0 ? (
                                  <div className="flex -space-x-2">
                                    {task.assignedMembers.slice(0, 3).map((memberId, idx) => {
                                      const memberInfo = membersInfo.find(m => m.id === memberId);
                                      return (
                                        <UserAvatar
                                          key={memberId}
                                          src={memberInfo?.image}
                                          name={memberInfo?.name || memberId}
                                          size="sm"
                                          className="border border-background ring-1 ring-border/10 hover:ring-primary/50 transition-all"
                                          style={{ zIndex: task.assignedMembers.length - idx }}
                                        />
                                      );
                                    })}
                                    {task.assignedMembers.length > 3 && (
                                      <div className="w-6 h-6 rounded-full bg-muted/80 border border-background flex items-center justify-center text-[9px] font-semibold text-muted-foreground flex-shrink-0">
                                        +{task.assignedMembers.length - 3}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full border border-dashed border-muted-foreground/15 flex-shrink-0 opacity-30 group-hover:opacity-50 transition-opacity" />
                                )}
                              </div>

                              {/* Date d'échéance */}
                              <div className="col-span-2 flex items-center gap-1.5 text-[11px] min-w-0">
                                {task.dueDate ? (
                                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <Calendar className="w-3 h-3 text-muted-foreground/60 flex-shrink-0" />
                                    <span className="truncate font-medium text-foreground/70">{formatDate(task.dueDate)}</span>
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded border border-dashed border-muted-foreground/10 flex-shrink-0 opacity-20 group-hover:opacity-40 transition-opacity" />
                                )}
                              </div>

                              {/* Priorité */}
                              <div className="col-span-1 flex items-center gap-1 min-w-0">
                                {task.priority ? (
                                  <div className="flex items-center gap-1.5">
                                    {getPriorityIcon(task.priority)}
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded border-2 border-dashed border-muted-foreground/15 flex-shrink-0 opacity-30 group-hover:opacity-50 transition-opacity" />
                                )}
                              </div>

                              {/* Actions */}
                              <div className="col-span-1 flex items-center justify-center gap-1">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 opacity-100 group-hover:opacity-100 transition-opacity hover:bg-muted/50"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      onEditTask(task);
                                    }}>
                                      Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteTask(task.id);
                                      }}
                                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                    >
                                      Supprimer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </DraggableTaskRow>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                  
                  {/* Bouton "Ajouter une tâche" en bas de la section */}
                  <div className="border-t border-border mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAddTask(column.id)}
                      className="w-full justify-start px-3 py-2 h-auto text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-none"
                    >
                      <Plus className="h-3.5 w-3.5 mr-2" />
                      Ajouter une tâche
                    </Button>
                  </div>
              </>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
