import React, { useState, Fragment, useMemo, useCallback } from "react";
import { MoreHorizontal, Calendar, ChevronDown, ChevronRight, Plus, Flag, MessageSquare, Paperclip, MoreVertical, GripVertical, AlignLeft, Clock, Users } from "lucide-react";
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
import { Input } from "@/src/components/ui/input";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { useAssignedMembersInfo } from "@/src/hooks/useAssignedMembersInfo";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { Calendar as CalendarComponent } from "@/src/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MemberSelector } from "./MemberSelector";

/**
 * Composant pour sélectionner les membres assignés avec un bouton de mise à jour
 */
function MembersPopover({ task, membersInfo, members, updateTask, workspaceId, isTrigger }) {
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Réinitialiser les membres sélectionnés quand le popover s'ouvre
  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (open) {
      // Pré-sélectionner les membres actuels de la tâche
      setSelectedMembers(new Set(task.assignedMembers || []));
    }
  };

  const handleUpdateMembers = async () => {
    setIsUpdating(true);
    try {
      await updateTask({
        variables: {
          input: {
            id: task.id,
            assignedMembers: Array.from(selectedMembers)
          },
          workspaceId
        }
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des membres:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {isTrigger ? (
          <div 
            className="flex -space-x-2 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            {task.assignedMembers.slice(0, 3).map((memberId, idx) => {
              const memberInfo = membersInfo.find(m => m.id === memberId);
              return (
                <div key={memberId} className="relative group/avatar">
                  <UserAvatar
                    src={memberInfo?.image}
                    name={memberInfo?.name || memberId}
                    size="sm"
                    className="border border-background ring-1 ring-border/10 hover:ring-primary/50 transition-all"
                    style={{ zIndex: task.assignedMembers.length - idx }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newMembers = task.assignedMembers.filter(id => id !== memberId);
                      updateTask({
                        variables: {
                          input: {
                            id: task.id,
                            assignedMembers: newMembers
                          },
                          workspaceId
                        }
                      });
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                    title="Supprimer l'assignation"
                  >
                    <span className="text-white text-xs font-bold">×</span>
                  </button>
                </div>
              );
            })}
            {task.assignedMembers.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-muted/80 border border-background flex items-center justify-center text-[9px] font-semibold text-muted-foreground flex-shrink-0">
                +{task.assignedMembers.length - 3}
              </div>
            )}
          </div>
        ) : (
          <button
            className="cursor-pointer text-muted-foreground/70 hover:text-foreground transition-colors bg-transparent border-0 p-0"
            onClick={(e) => e.stopPropagation()}
            title="Ajouter des membres"
          >
            <Users className="h-4 w-4" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" side="top" align="start">
        <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
          {members.map((member) => (
            <button
              key={member.id}
              onClick={(e) => {
                e.stopPropagation();
                const newSelected = new Set(selectedMembers);
                if (newSelected.has(member.id)) {
                  newSelected.delete(member.id);
                } else {
                  newSelected.add(member.id);
                }
                setSelectedMembers(newSelected);
              }}
              className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors cursor-pointer ${
                selectedMembers.has(member.id) ? 'bg-accent' : ''
              }`}
            >
              <UserAvatar 
                src={member.image} 
                name={member.name} 
                size="sm"
              />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">{member.name}</div>
                <div className="text-xs text-muted-foreground">{member.email}</div>
              </div>
              <Checkbox
                checked={selectedMembers.has(member.id)}
                onCheckedChange={() => {
                  const newSelected = new Set(selectedMembers);
                  if (newSelected.has(member.id)) {
                    newSelected.delete(member.id);
                  } else {
                    newSelected.add(member.id);
                  }
                  setSelectedMembers(newSelected);
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0"
              />
            </button>
          ))}
        </div>

        <div className="p-2 border-t">
          <Button
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              handleUpdateMembers();
            }}
            disabled={isUpdating}
          >
            {isUpdating ? 'Mise à jour...' : 'Mettre à jour'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

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
            {/* Placeholder avec hauteur limitée */}
            <div style={{ maxHeight: '100px', overflow: 'hidden' }}>
              {provided.placeholder}
            </div>
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
            gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 80px',
            gap: '2rem'
          }}
          className={`grid px-2 py-1.5 items-center hover:bg-accent/5 cursor-grab active:cursor-grabbing group relative overflow-hidden border-b border-border/60 ${
            snapshot.isDragging ? 'opacity-90 shadow-2xl bg-background border border-primary/40 rounded-lg z-[9999]' : ''
          }`}
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
  onEditColumn,
  onDeleteColumn,
  members = [],
  selectedTaskIds,
  setSelectedTaskIds,
  moveTask,
  updateTask,
  workspaceId,
}) {
  const [collapsedColumns, setCollapsedColumns] = useState(new Set());
  const [priorityPopovers, setPriorityPopovers] = useState({});
  
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
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getPriorityBadge = (priority) => {
    if (!priority || priority.toLowerCase() === "none") return null;
    
    const isHigh = priority.toLowerCase() === "high";
    const isMedium = priority.toLowerCase() === "medium";
    const isLow = priority.toLowerCase() === "low";
    
    const label = isHigh ? "Urgent" : isMedium ? "Moyen" : "Faible";
    const flagColor = isHigh ? "text-red-500 fill-red-500" : isMedium ? "text-yellow-500 fill-yellow-500" : "text-green-500 fill-green-500";
    
    return (
      <Badge
        variant="outline"
        className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground"
      >
        <Flag className={`h-4 w-4 ${flagColor}`} />
        <span className="text-muted-foreground">{label}</span>
      </Badge>
    );
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
    <div className="space-y-4 bg-background pb-24 md:pb-12 lg:pb-16">
      {columns.map((column, columnIndex) => {
        const tasks = getFilteredTasksByColumn(column.id);
        const isCollapsed = collapsedColumns.has(column.id) || (tasks.length === 0 && !collapsedColumns.has(column.id));

        return (
          <div key={column.id} className="space-y-0">
            {/* En-tête de colonne pliable avec zone de drop si fermée */}
            {isCollapsed ? (
              <CollapsedColumnDropZone columnId={column.id} onOpen={openColumnOnDrag}>
                <div 
                  className="flex items-center gap-2 py-2 bg-muted/10 hover:bg-muted/20 cursor-pointer transition-colors group"
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
                      <span>{column.title}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 font-medium" style={{ color: column.color || "#94a3b8" }}>
                      {tasks.length}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onEditColumn?.(column);
                        }}>
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteColumn?.(column);
                          }}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddTask(column.id);
                      }}
                      className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground font-medium"
                    >
                      <Plus className="h-3 w-3" />
                      Ajouter une tâche
                    </Button>
                  </div>
                </div>
              </CollapsedColumnDropZone>
            ) : (
              <>
              {/* En-tête de section cliquable */}
              <div 
                className="flex items-center gap-3 py-2 bg-muted/5 hover:bg-muted/10 cursor-pointer transition-all group"
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
                    <span>{column.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 font-medium" style={{ color: column.color || "#94a3b8" }}>
                    {tasks.length}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onEditColumn?.(column);
                      }}>
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteColumn?.(column);
                        }}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddTask(column.id);
                    }}
                    className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground font-medium"
                  >
                    <Plus className="h-3 w-3" />
                    Ajouter une tâche
                  </Button>
                </div>
              </div>
              {/* Conteneur avec scroll pour le tableau */}
              <div className="w-full overflow-x-auto scrollbar-hide">
                <div className="w-max min-w-full">
                  {/* Header de section avec colonnes */}
                  <div className="grid px-2 py-2 text-xs font-normal text-muted-foreground/70 tracking-wide border-b border-border/60" style={{ gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 80px', gap: '2rem' }}>
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 opacity-0" />
                      <Checkbox
                        checked={tasks.length > 0 && tasks.every(t => selectedTaskIds.has(t.id)) ? true : tasks.length > 0 && tasks.some(t => selectedTaskIds.has(t.id)) ? "indeterminate" : false}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedTaskIds);
                          if (checked === true) {
                            tasks.forEach(t => newSelected.add(t.id));
                          } else {
                            tasks.forEach(t => newSelected.delete(t.id));
                          }
                          setSelectedTaskIds(newSelected);
                        }}
                        className="flex-shrink-0 h-4 w-4 border-muted-foreground/30 mr-4"
                        onClick={(e) => e.stopPropagation()}
                      />
                      Nom de la tâche
                    </div>
                    <div className="flex items-center">Assigné à</div>
                    <div className="flex items-center">Status</div>
                    <div className="flex items-center">Échéance</div>
                    <div className="flex items-center">Priorité</div>
                    <div className="flex items-center justify-center">Actions</div>
                  </div>

                  {/* Liste des tâches */}
                  <div>
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
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  {/* Drag handle toujours visible */}
                                  <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 cursor-grab" />
                                  {/* Checkbox toujours visible */}
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
                                    className="flex-shrink-0 h-4 w-4 border-muted-foreground/30 mr-4"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  {/* Rond de couleur du status */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        className="flex-shrink-0 w-3.5 h-3.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                                        style={{ 
                                          backgroundColor: column.color || "#94a3b8",
                                          border: `2px solid ${column.color || "#94a3b8"}60`,
                                          outline: `2px solid ${column.color || "#94a3b8"}30`,
                                          outlineOffset: '2px'
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        title="Changer le status"
                                      />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-40">
                                      {columns.map((col) => (
                                        <DropdownMenuItem
                                          key={col.id}
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            // Déplacer la tâche vers la colonne col.id
                                            try {
                                              await moveTask({
                                                variables: {
                                                  id: task.id,
                                                  columnId: col.id,
                                                  position: 0,
                                                  workspaceId
                                                }
                                              });
                                            } catch (error) {
                                              console.error('Erreur lors du déplacement de la tâche:', error);
                                            }
                                          }}
                                          className="flex items-center gap-2 cursor-pointer"
                                        >
                                          <div
                                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: col.color || "#94a3b8" }}
                                          />
                                          <span>{col.title}</span>
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  <div className="flex-1 w-0 flex items-center gap-1 min-w-0">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <p className="text-sm truncate font-normal text-foreground/90 group-hover:text-foreground">{task.title}</p>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-sm break-words">
                                        {task.title}
                                      </TooltipContent>
                                    </Tooltip>
                                    {task.description && (
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <button
                                            className="cursor-pointer text-muted-foreground/70 hover:text-foreground transition-colors flex-shrink-0 ml-4"
                                            onClick={(e) => e.stopPropagation()}
                                            title="Afficher la description"
                                          >
                                            <AlignLeft className="h-4 w-4" />
                                          </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80" side="top">
                                          <div className="space-y-2">
                                            <h4 className="font-medium text-sm">Description</h4>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                                              {task.description}
                                            </p>
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Assignée */}
                              <div className="flex items-center gap-0.5 min-w-0">
                                {task.assignedMembers && task.assignedMembers.length > 0 ? (
                                  <MembersPopover
                                    task={task}
                                    membersInfo={membersInfo}
                                    members={members}
                                    updateTask={updateTask}
                                    workspaceId={workspaceId}
                                    isTrigger={true}
                                  />
                                ) : (
                                  <MembersPopover
                                    task={task}
                                    membersInfo={membersInfo}
                                    members={members}
                                    updateTask={updateTask}
                                    workspaceId={workspaceId}
                                    isTrigger={false}
                                  />
                                )}
                              </div>

                              {/* Status */}
                              <div className="flex items-center gap-1 min-w-0">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button 
                                      className="px-2 py-1 rounded-md flex-shrink-0 text-xs font-medium border flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                                      style={{
                                        backgroundColor: `${column.color || "#94a3b8"}20`,
                                        borderColor: `${column.color || "#94a3b8"}20`,
                                        color: column.color || "#94a3b8"
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: column.color || "#94a3b8" }}
                                      />
                                      <span>{column.title}</span>
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-48 p-2" side="top" align="start">
                                    <div className="space-y-1">
                                      {columns.map((col) => (
                                        <button
                                          key={col.id}
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                              await moveTask({
                                                variables: {
                                                  id: task.id,
                                                  columnId: col.id,
                                                  position: 0,
                                                  workspaceId
                                                }
                                              });
                                            } catch (error) {
                                              console.error('Erreur lors du déplacement de la tâche:', error);
                                            }
                                          }}
                                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent text-sm cursor-pointer"
                                        >
                                          <div
                                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: col.color || "#94a3b8" }}
                                          />
                                          <span>{col.title}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>

                              {/* Date d'échéance */}
                              <div className="flex items-center gap-1.5 text-xs min-w-0">
                                {task.dueDate ? (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button 
                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer bg-transparent border-0 p-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <span className="truncate font-normal text-foreground/70">{formatDate(task.dueDate)}</span>
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" side="top" align="start">
                                      <div className="flex flex-col">
                                        <div className="border-b p-4">
                                          <CalendarComponent
                                            mode="single"
                                            selected={task.dueDate ? new Date(task.dueDate) : undefined}
                                            onSelect={async (date) => {
                                              if (date) {
                                                try {
                                                  const existingDate = new Date(task.dueDate);
                                                  date.setHours(existingDate.getHours(), existingDate.getMinutes(), 0, 0);
                                                  await updateTask({
                                                    variables: {
                                                      input: {
                                                        id: task.id,
                                                        dueDate: date.toISOString()
                                                      },
                                                      workspaceId
                                                    }
                                                  });
                                                } catch (error) {
                                                  console.error('Erreur lors de la mise à jour de la date:', error);
                                                }
                                              }
                                            }}
                                            initialFocus
                                            locale={fr}
                                            fromDate={new Date()}
                                            className="border-0"
                                          />
                                        </div>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                ) : (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button
                                        className="cursor-pointer text-muted-foreground/70 hover:text-foreground transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                        title="Ajouter une date d'échéance"
                                      >
                                        <Calendar className="h-4 w-4" />
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" side="top" align="start">
                                      <div className="flex flex-col">
                                        <div className="border-b p-4">
                                          <CalendarComponent
                                            mode="single"
                                            selected={undefined}
                                            onSelect={async (date) => {
                                              if (date) {
                                                try {
                                                  date.setHours(18, 0, 0, 0);
                                                  await updateTask({
                                                    variables: {
                                                      input: {
                                                        id: task.id,
                                                        dueDate: date.toISOString()
                                                      },
                                                      workspaceId
                                                    }
                                                  });
                                                } catch (error) {
                                                  console.error('Erreur lors de la mise à jour de la date:', error);
                                                }
                                              }
                                            }}
                                            initialFocus
                                            locale={fr}
                                            fromDate={new Date()}
                                            className="border-0"
                                          />
                                        </div>
                                        <div className="p-4 flex items-center gap-2">
                                          <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                              <Clock className="h-4 w-4 text-gray-500" />
                                            </div>
                                            <Input
                                              type="time"
                                              defaultValue="18:00"
                                              className="pl-10 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-ampm-field]:hidden"
                                              step="300"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>

                              {/* Priorité */}
                              <div className="flex items-center gap-1 min-w-0">
                                <Popover 
                                  open={priorityPopovers[task.id] || false} 
                                  onOpenChange={(open) => setPriorityPopovers(prev => ({ ...prev, [task.id]: open }))}
                                >
                                  <PopoverTrigger asChild>
                                    <button 
                                      className="bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {task.priority ? (
                                        getPriorityBadge(task.priority)
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground"
                                        >
                                          <Flag className="h-4 w-4 text-gray-400 fill-gray-400" />
                                          <span className="text-muted-foreground">-</span>
                                        </Badge>
                                      )}
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-48 p-2" side="top" align="start">
                                    <div className="space-y-1">
                                      {[
                                        { value: 'high', label: 'Urgent', color: 'text-red-500 fill-red-500' },
                                        { value: 'medium', label: 'Moyen', color: 'text-yellow-500 fill-yellow-500' },
                                        { value: 'low', label: 'Faible', color: 'text-green-500 fill-green-500' },
                                        { value: '', label: 'Aucune', color: 'text-gray-400 fill-gray-400' }
                                      ].map((priority) => (
                                        <button
                                          key={priority.value || 'none'}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateTask({
                                              variables: {
                                                input: {
                                                  id: task.id,
                                                  priority: priority.value
                                                },
                                                workspaceId
                                              }
                                            });
                                            setPriorityPopovers(prev => ({ ...prev, [task.id]: false }));
                                          }}
                                          className={`w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors cursor-pointer ${
                                            (priority.value === '' && !task.priority) || task.priority?.toLowerCase() === priority.value ? 'bg-accent' : ''
                                          }`}
                                        >
                                          <Flag className={`h-4 w-4 ${priority.color}`} />
                                          <span className="text-sm">{priority.label}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center justify-center gap-1">
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
                          {/* Placeholder avec hauteur limitée */}
                          <div style={{ maxHeight: '100px', overflow: 'hidden' }}>
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
              </div>
              
              {/* Bouton "Ajouter une tâche" en bas de la section - FIXE */}
              <div className="mt-1">
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
  );
}
