import React, { useState, Fragment } from "react";
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
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

/**
 * Zone de drop pour les colonnes vides
 */
function EmptyColumnDropZone({ columnId }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `empty-${columnId}`,
    data: {
      type: 'column',
      columnId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`px-4 py-8 text-center text-sm transition-colors ${
        isOver ? 'bg-primary/10 border-2 border-dashed border-primary' : 'text-muted-foreground'
      }`}
    >
      {isOver ? 'Déposer ici' : 'Aucune tâche'}
    </div>
  );
}

/**
 * Zone de drop sur l'en-tête d'une section fermée
 */
function CollapsedColumnDropZone({ columnId, onOpen, children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `collapsed-${columnId}`,
    data: {
      type: 'column',
      columnId,
    },
  });

  // Ouvrir automatiquement quand on survole avec une tâche
  React.useEffect(() => {
    if (isOver) {
      const timer = setTimeout(() => {
        onOpen(columnId);
      }, 500); // Délai de 500ms avant d'ouvrir
      return () => clearTimeout(timer);
    }
  }, [isOver, columnId, onOpen]);

  return (
    <div
      ref={setNodeRef}
      className={`transition-colors ${isOver ? 'bg-primary/10' : ''}`}
    >
      {children}
    </div>
  );
}

/**
 * Composant pour une ligne de tâche draggable
 */
function SortableTaskRow({ task, column, onEditTask, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
      columnId: column.id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="grid grid-cols-12 gap-3 px-3 py-2 hover:bg-muted/20 transition-colors cursor-grab active:cursor-grabbing group relative"
      onClick={(e) => {
        // Ne pas ouvrir la modal si on est en train de drag
        if (!isDragging) {
          onEditTask(task);
        }
      }}
    >
      {children}
    </div>
  );
}

/**
 * Composant pour afficher le Kanban en vue Liste (comme ClickUp)
 */
export function KanbanListView({
  columns,
  getTasksByColumn,
  onEditTask,
  onDeleteTask,
  onAddTask,
  members = [],
}) {
  const [collapsedColumns, setCollapsedColumns] = useState(new Set());
  
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
    const tasks = getTasksByColumn(columnId);
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
    <div className="w-full overflow-x-auto">
      <div className="min-w-[900px] space-y-0 bg-background">
        {/* En-tête du tableau global */}
        <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/20 border-b sticky top-0 z-10">
          <div className="col-span-4 flex items-center">Nom</div>
          <div className="col-span-2 flex items-center">Assigné</div>
          <div className="col-span-2 flex items-center">Date d'échéance</div>
          <div className="col-span-1 flex items-center">Priorité</div>
          <div className="col-span-2 flex items-center">Statut</div>
          <div className="col-span-1 flex items-center justify-center">Commentaires</div>
        </div>

      {columns.map((column, columnIndex) => {
        const tasks = getTasksByColumn(column.id);
        const isCollapsed = collapsedColumns.has(column.id) || (tasks.length === 0 && !collapsedColumns.has(column.id));

        return (
          <div key={column.id} className={columnIndex !== 0 ? "mt-4" : ""}>
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
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: column.color || "#94a3b8" }}
                    />
                    <span className="text-sm font-medium uppercase tracking-wide" style={{ color: column.color }}>
                      {column.title}
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {tasks.length}
                    </span>
                  </div>
                </div>
              </CollapsedColumnDropZone>
            ) : (
              <div 
                className="flex items-center gap-2 px-3 py-2 bg-muted/10 hover:bg-muted/20 cursor-pointer transition-colors group"
                onClick={() => toggleColumn(column.id)}
              >
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: column.color || "#94a3b8" }}
                />
                <span className="text-sm font-medium uppercase tracking-wide" style={{ color: column.color }}>
                  {column.title}
                </span>
                <span className="text-xs text-muted-foreground font-normal">
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
                className="h-7 ml-auto text-xs gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter une tâche
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            )}

            {/* Liste des tâches */}
            {!isCollapsed && (
              <>
                <SortableContext
                  items={tasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {tasks.length === 0 ? (
                    <EmptyColumnDropZone columnId={column.id} />
                  ) : (
                    tasks.map((task, taskIndex) => (
                      <React.Fragment key={task.id}>
                        {taskIndex > 0 && <div className="border-t border-border" />}
                        <SortableTaskRow task={task} column={column} onEditTask={onEditTask}>
                      {/* Nom avec checkbox et icône */}
                      <div className="col-span-4 flex items-center gap-2 min-w-0">
                        {/* Checkbox visible uniquement au hover, à gauche du point */}
                        <Checkbox
                          className="flex-shrink-0 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div 
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: column.color }}
                        />
                        <span className="text-sm truncate flex-1 font-normal">{task.title}</span>
                        {task.description && (
                          <MessageSquare className="w-3 h-3 text-muted-foreground/60 flex-shrink-0" />
                        )}
                        {task.attachments?.length > 0 && (
                          <Paperclip className="w-3 h-3 text-muted-foreground/60 flex-shrink-0" />
                        )}
                      </div>

                      {/* Assignée */}
                      <div className="col-span-2 flex items-center gap-0.5 min-w-0">
                        {task.assignedMembers && task.assignedMembers.length > 0 ? (
                          <div className="flex -space-x-1.5">
                            {task.assignedMembers.slice(0, 3).map((member, idx) => (
                              <UserAvatar
                                key={member.userId || member.email}
                                src={member.image}
                                name={member.name || member.email}
                                size="sm"
                                className="border-2 border-background"
                                style={{ zIndex: task.assignedMembers.length - idx }}
                              />
                            ))}
                            {task.assignedMembers.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium flex-shrink-0">
                                +{task.assignedMembers.length - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full border border-dashed border-muted-foreground/30 flex-shrink-0" />
                        )}
                      </div>

                      {/* Date d'échéance */}
                      <div className="col-span-2 flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                        {task.dueDate ? (
                          <>
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{formatDate(task.dueDate)}</span>
                          </>
                        ) : (
                          <div className="w-5 h-5 rounded border border-dashed border-muted-foreground/20 flex-shrink-0" />
                        )}
                      </div>

                      {/* Priorité */}
                      <div className="col-span-1 flex items-center gap-1 min-w-0">
                        {task.priority ? (
                          <>
                            {getPriorityIcon(task.priority)}
                          </>
                        ) : (
                          <div className="w-5 h-5 rounded border border-dashed border-muted-foreground/20 flex-shrink-0" />
                        )}
                      </div>

                      {/* Statut */}
                      <div className="col-span-2 flex items-center min-w-0">
                        <Badge
                          variant="outline"
                          className="text-[11px] font-medium px-2 py-0.5 truncate uppercase tracking-wide"
                          style={{
                            backgroundColor: `${column.color}10`,
                            borderColor: `${column.color}40`,
                            color: column.color,
                          }}
                        >
                          {column.title}
                        </Badge>
                      </div>

                      {/* Comments */}
                      <div className="col-span-1 flex items-center justify-center">
                        <MessageSquare className="w-3 h-3 text-muted-foreground/40" />
                      </div>
                    </SortableTaskRow>
                    </React.Fragment>
                  )))}
                </SortableContext>
                  
                  {/* Bouton "Ajouter une tâche" en bas de la section */}
                  <div className="border-t border-border">
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
