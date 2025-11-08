import React, { useState, useMemo, useEffect, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight, Flag, Users, Clock, MoreHorizontal } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { cn } from "@/src/lib/utils";
import { useAssignedMembersInfo } from "@/src/hooks/useAssignedMembersInfo";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, differenceInDays, startOfDay, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Vue Gantt pour le Kanban
 */
export function KanbanGanttView({
  columns,
  getTasksByColumn,
  filterTasks,
  onEditTask,
  members = [],
  updateTask,
  workspaceId,
}) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [viewMode, setViewMode] = useState("week"); // week, month, quarter
  const scrollContainerRef = useRef(null);

  // Récupérer toutes les tâches avec dates
  const allTasksWithDates = useMemo(() => {
    const tasks = [];
    columns.forEach(column => {
      const columnTasks = getTasksByColumn(column.id);
      const filteredTasks = filterTasks ? filterTasks(columnTasks) : columnTasks;
      filteredTasks.forEach(task => {
        if (task.startDate || task.dueDate) {
          tasks.push({
            ...task,
            column
          });
        }
      });
    });
    return tasks.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate) : new Date(a.dueDate);
      const dateB = b.startDate ? new Date(b.startDate) : new Date(b.dueDate);
      return dateA - dateB;
    });
  }, [columns, getTasksByColumn, filterTasks]);

  // Récupérer tous les IDs de membres
  const allMemberIds = useMemo(() => {
    const ids = new Set();
    allTasksWithDates.forEach(task => {
      if (task.assignedMembers && Array.isArray(task.assignedMembers)) {
        task.assignedMembers.forEach(id => ids.add(id));
      }
    });
    return Array.from(ids);
  }, [allTasksWithDates]);

  const { members: membersInfo } = useAssignedMembersInfo(allMemberIds);

  // Générer les jours à afficher selon le mode
  const daysToDisplay = useMemo(() => {
    if (viewMode === "week") {
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
    } else if (viewMode === "month") {
      return eachDayOfInterval({ 
        start: currentWeekStart, 
        end: addDays(currentWeekStart, 29) 
      });
    } else {
      return eachDayOfInterval({ 
        start: currentWeekStart, 
        end: addDays(currentWeekStart, 89) 
      });
    }
  }, [currentWeekStart, viewMode]);

  // Navigation
  const goToPrevious = () => {
    if (viewMode === "week") {
      setCurrentWeekStart(prev => addDays(prev, -7));
    } else if (viewMode === "month") {
      setCurrentWeekStart(prev => addDays(prev, -30));
    } else {
      setCurrentWeekStart(prev => addDays(prev, -90));
    }
  };

  const goToNext = () => {
    if (viewMode === "week") {
      setCurrentWeekStart(prev => addDays(prev, 7));
    } else if (viewMode === "month") {
      setCurrentWeekStart(prev => addDays(prev, 30));
    } else {
      setCurrentWeekStart(prev => addDays(prev, 90));
    }
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  // Calculer la position et la largeur d'une barre de tâche
  const getTaskBarStyle = (task) => {
    const startDate = task.startDate ? startOfDay(parseISO(task.startDate)) : null;
    const endDate = task.dueDate ? startOfDay(parseISO(task.dueDate)) : null;

    if (!startDate && !endDate) return null;

    const firstDay = daysToDisplay[0];
    const lastDay = daysToDisplay[daysToDisplay.length - 1];

    // Utiliser startDate ou dueDate comme début
    const taskStart = startDate || endDate;
    const taskEnd = endDate || startDate;

    // Vérifier si la tâche est visible dans la période affichée
    const isVisible = isWithinInterval(taskStart, { start: firstDay, end: lastDay }) ||
                      isWithinInterval(taskEnd, { start: firstDay, end: lastDay }) ||
                      (taskStart < firstDay && taskEnd > lastDay);

    if (!isVisible) return null;

    // Calculer la position de départ (en jours depuis le premier jour affiché)
    const startOffset = Math.max(0, differenceInDays(taskStart, firstDay));
    
    // Calculer la durée (en jours)
    const duration = startDate && endDate 
      ? Math.max(1, differenceInDays(taskEnd, taskStart) + 1)
      : 1;

    // Ajuster si la tâche dépasse la période affichée
    const visibleDuration = Math.min(
      duration,
      daysToDisplay.length - startOffset
    );

    const dayWidth = viewMode === "week" ? 120 : viewMode === "month" ? 40 : 30;
    
    return {
      left: `${startOffset * dayWidth}px`,
      width: `${visibleDuration * dayWidth - 8}px`,
      visible: true
    };
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-400";
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "Urgent";
      case "medium":
        return "Moyen";
      case "low":
        return "Faible";
      default:
        return "Aucune";
    }
  };

  const formatDateRange = (task) => {
    const start = task.startDate ? format(parseISO(task.startDate), "d MMM", { locale: fr }) : null;
    const end = task.dueDate ? format(parseISO(task.dueDate), "d MMM", { locale: fr }) : null;
    
    if (start && end) {
      return `${start} - ${end}`;
    } else if (start) {
      return `Début: ${start}`;
    } else if (end) {
      return `Fin: ${end}`;
    }
    return "";
  };

  const dayWidth = viewMode === "week" ? 120 : viewMode === "month" ? 40 : 30;

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-background">
      {/* Header avec contrôles - Plus compact */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              className="h-7 w-7"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="h-7 px-3 text-xs"
            >
              Aujourd'hui
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="h-7 w-7"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm font-semibold text-foreground">
            {viewMode === "week" && format(currentWeekStart, "MMMM yyyy", { locale: fr })}
            {viewMode === "month" && format(currentWeekStart, "MMMM yyyy", { locale: fr })}
            {viewMode === "quarter" && `Q${Math.floor(currentWeekStart.getMonth() / 3) + 1} ${currentWeekStart.getFullYear()}`}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-28 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Gantt Chart - Pleine hauteur */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Colonne des tâches (fixe) - Plus étroite */}
          <div className="w-72 border-r border-border/50 bg-muted/20 flex-shrink-0 overflow-y-auto">
            {/* Header - Plus compact */}
            <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border/50 px-4 py-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Tâches · {allTasksWithDates.length}
              </div>
            </div>

            {/* Liste des tâches */}
            <div className="divide-y divide-border/50">
              {allTasksWithDates.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune tâche avec des dates</p>
                </div>
              ) : (
                allTasksWithDates.map((task) => (
                  <div
                    key={task.id}
                    className="px-3 py-2.5 hover:bg-accent/10 cursor-pointer transition-all group"
                    onClick={() => onEditTask(task)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: task.column.color }}
                      />
                      <div className="flex-1 min-w-0 text-xs font-medium truncate group-hover:text-primary transition-colors">
                        {task.title}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {task.priority && task.priority.toLowerCase() !== 'none' && (
                          <Flag className={cn(
                            "h-2.5 w-2.5",
                            task.priority.toLowerCase() === 'high' ? 'text-red-500 fill-red-500' :
                            task.priority.toLowerCase() === 'medium' ? 'text-yellow-500 fill-yellow-500' :
                            'text-green-500 fill-green-500'
                          )} />
                        )}
                        {task.assignedMembers && task.assignedMembers.length > 0 && (
                          <div className="flex -space-x-1">
                            {task.assignedMembers.slice(0, 2).map((memberId) => {
                              const memberInfo = membersInfo.find(m => m.id === memberId);
                              return (
                                <UserAvatar
                                  key={memberId}
                                  src={memberInfo?.image}
                                  name={memberInfo?.name || memberId}
                                  size="xs"
                                  className="border border-background w-4 h-4"
                                />
                              );
                            })}
                            {task.assignedMembers.length > 2 && (
                              <div className="w-4 h-4 rounded-full bg-muted border border-background flex items-center justify-center text-[8px] font-semibold text-muted-foreground">
                                +{task.assignedMembers.length - 2}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Timeline (scrollable) */}
          <div className="flex-1 overflow-x-auto overflow-y-auto bg-background" ref={scrollContainerRef}>
            <div className="relative" style={{ minWidth: `${daysToDisplay.length * dayWidth}px` }}>
              {/* Header des jours */}
              <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border/50 flex">
                {daysToDisplay.map((day, index) => {
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={index}
                      className={cn(
                        "border-r border-border/30 flex-shrink-0 px-2 py-2 text-center transition-colors",
                        isToday && "bg-primary/5"
                      )}
                      style={{ width: `${dayWidth}px` }}
                    >
                      <div className={cn(
                        "text-[10px] font-semibold uppercase tracking-wider",
                        isToday ? "text-primary" : "text-muted-foreground"
                      )}>
                        {viewMode === "week" ? format(day, "EEE", { locale: fr }) : format(day, "d", { locale: fr })}
                      </div>
                      <div className={cn(
                        "text-xs mt-0.5",
                        isToday ? "text-primary font-bold" : "text-muted-foreground"
                      )}>
                        {viewMode === "week" ? format(day, "d MMM", { locale: fr }) : format(day, "MMM", { locale: fr })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grille de fond - Traits verticaux jusqu'en bas */}
              <div className="absolute inset-0 top-[49px] flex pointer-events-none" style={{ minHeight: `${Math.max(allTasksWithDates.length, 20) * 45 + 49}px` }}>
                {daysToDisplay.map((day, index) => {
                  const isToday = isSameDay(day, new Date());
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={index}
                      className={cn(
                        "border-r border-border/30 flex-shrink-0 h-full",
                        isWeekend && "bg-muted/10",
                        isToday && "bg-primary/5 border-primary/20"
                      )}
                      style={{ width: `${dayWidth}px` }}
                    />
                  );
                })}
              </div>

              {/* Barres de tâches */}
              <div className="relative min-h-full">
                {/* Lignes de fond pour toutes les tâches */}
                <div className="absolute inset-0 divide-y divide-border/30">
                  {allTasksWithDates.map((task) => (
                    <div key={`line-${task.id}`} className="h-[45px]" />
                  ))}
                  {/* Lignes supplémentaires pour remplir l'espace */}
                  {Array.from({ length: Math.max(0, 20 - allTasksWithDates.length) }).map((_, index) => (
                    <div key={`empty-line-${index}`} className="h-[45px] border-t border-border/30" />
                  ))}
                </div>

                {/* Barres de tâches par-dessus */}
                <div className="relative">
                  {allTasksWithDates.map((task) => {
                    const barStyle = getTaskBarStyle(task);
                    if (!barStyle || !barStyle.visible) return null;

                    return (
                      <div
                        key={task.id}
                        className="relative h-[45px] hover:bg-accent/5 transition-colors"
                      >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                              className="absolute top-1/2 -translate-y-1/2 h-7 rounded-full cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] group border"
                              style={{
                                left: barStyle.left,
                                width: barStyle.width,
                                backgroundColor: `${task.column.color}20`,
                                borderColor: `${task.column.color}60`,
                              }}
                              onClick={() => onEditTask(task)}
                            >
                              <div className="px-3 py-1 flex items-center gap-1.5 h-full overflow-hidden">
                                <span 
                                  className="text-[11px] font-semibold truncate"
                                  style={{ color: task.column.color }}
                                >
                                  {task.title}
                                </span>
                                {task.priority && task.priority.toLowerCase() !== 'none' && (
                                  <Flag className={cn(
                                    "h-2.5 w-2.5 flex-shrink-0",
                                    task.priority.toLowerCase() === 'high' ? 'text-red-500 fill-red-500' :
                                    task.priority.toLowerCase() === 'medium' ? 'text-yellow-500 fill-yellow-500' :
                                    'text-green-500 fill-green-500'
                                  )} />
                                )}
                              </div>
                            </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-2">
                                <div className="font-semibold text-sm text-white">{task.title}</div>
                                <div className="text-xs text-white/70 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDateRange(task)}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-white/30 text-white"
                                  >
                                    {task.column.title}
                                  </Badge>
                                  {task.priority && task.priority.toLowerCase() !== 'none' && (
                                    <Badge variant="outline" className="text-xs border-white/30 text-white">
                                      {getPriorityLabel(task.priority)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
