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
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, differenceInDays, startOfDay, isWithinInterval, getWeek } from "date-fns";
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
  const [hoveredTaskId, setHoveredTaskId] = useState(null);
  const [resizingTask, setResizingTask] = useState(null); // { taskId, side: 'left' | 'right', startX, originalDates }
  const [tempTaskDates, setTempTaskDates] = useState({}); // Pour maintenir les dates temporaires pendant la mise à jour
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0, visible: false }); // Position du curseur pour le cercle
  const [isOverTask, setIsOverTask] = useState(false); // Pour masquer le cercle quand on survole une tâche
  const scrollContainerRef = useRef(null); // Timeline (droite)
  const leftColumnRef = useRef(null); // Colonne de gauche
  const headerTimelineRef = useRef(null); // Header de la timeline
  const timelineRef = useRef(null); // Ref pour la timeline pour tracker le curseur
  const justResizedRef = useRef(false); // Pour empêcher l'ouverture de la modal après redimensionnement

  // Récupérer toutes les tâches (avec et sans dates)
  const allTasks = useMemo(() => {
    const tasks = [];
    columns.forEach(column => {
      const columnTasks = getTasksByColumn(column.id);
      const filteredTasks = filterTasks ? filterTasks(columnTasks) : columnTasks;
      filteredTasks.forEach(task => {
        tasks.push({
          ...task,
          column
        });
      });
    });
    return tasks.sort((a, b) => {
      // Tâches avec LES DEUX dates en premier, puis celles avec une seule date, puis sans dates
      const hasBothDatesA = a.startDate && a.dueDate;
      const hasBothDatesB = b.startDate && b.dueDate;
      const hasOneDateA = (a.startDate || a.dueDate) && !hasBothDatesA;
      const hasOneDateB = (b.startDate || b.dueDate) && !hasBothDatesB;
      
      // Priorité 1 : Tâches avec les deux dates
      if (hasBothDatesA && !hasBothDatesB) return -1;
      if (!hasBothDatesA && hasBothDatesB) return 1;
      
      // Si les deux ont les deux dates, trier par date de début
      if (hasBothDatesA && hasBothDatesB) {
        const dateA = new Date(a.startDate);
        const dateB = new Date(b.startDate);
        return dateA - dateB;
      }
      
      // Priorité 2 : Tâches avec une seule date avant celles sans dates
      if (hasOneDateA && !hasOneDateB && !hasBothDatesB) return -1;
      if (!hasOneDateA && !hasBothDatesA && hasOneDateB) return 1;
      
      // Si les deux ont une seule date, trier par cette date
      if (hasOneDateA && hasOneDateB) {
        const dateA = a.startDate ? new Date(a.startDate) : new Date(a.dueDate);
        const dateB = b.startDate ? new Date(b.startDate) : new Date(b.dueDate);
        return dateA - dateB;
      }
      
      return 0;
    });
  }, [columns, getTasksByColumn, filterTasks]);

  // Filtrer uniquement les tâches avec BOTH dates (début ET fin) pour la timeline
  const allTasksWithDates = useMemo(() => {
    return allTasks.filter(task => task.startDate && task.dueDate);
  }, [allTasks]);

  // Récupérer tous les IDs de membres
  const allMemberIds = useMemo(() => {
    const ids = new Set();
    allTasks.forEach(task => {
      if (task.assignedMembers && Array.isArray(task.assignedMembers)) {
        task.assignedMembers.forEach(id => ids.add(id));
      }
    });
    return Array.from(ids);
  }, [allTasks]);

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

  // Grouper les jours par semaine pour l'affichage de l'en-tête
  const weekGroups = useMemo(() => {
    const groups = [];
    let currentGroup = null;

    daysToDisplay.forEach((day, index) => {
      const weekNum = getWeek(day, { weekStartsOn: 1 });
      const weekStart = startOfWeek(day, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(day, { weekStartsOn: 1 });

      if (!currentGroup || currentGroup.weekNum !== weekNum) {
        currentGroup = {
          weekNum,
          weekStart,
          weekEnd,
          startIndex: index,
          days: []
        };
        groups.push(currentGroup);
      }
      currentGroup.days.push(day);
    });

    return groups;
  }, [daysToDisplay]);

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
    // Utiliser les dates temporaires si disponibles, sinon les dates de la tâche
    const tempDates = tempTaskDates[task.id];
    let startDate = tempDates?.startDate 
      ? startOfDay(parseISO(tempDates.startDate))
      : (task.startDate ? startOfDay(parseISO(task.startDate)) : null);
    let endDate = tempDates?.dueDate
      ? startOfDay(parseISO(tempDates.dueDate))
      : (task.dueDate ? startOfDay(parseISO(task.dueDate)) : null);

    // Appliquer le delta de redimensionnement si cette tâche est en cours de redimensionnement
    if (resizingTask && resizingTask.taskId === task.id && resizingTask.currentDelta) {
      const originalStartDate = task.startDate ? startOfDay(parseISO(task.startDate)) : null;
      const originalEndDate = task.dueDate ? startOfDay(parseISO(task.dueDate)) : null;
      
      if (resizingTask.side === 'left' && originalStartDate) {
        startDate = addDays(originalStartDate, resizingTask.currentDelta);
      } else if (resizingTask.side === 'right' && originalEndDate) {
        endDate = addDays(originalEndDate, resizingTask.currentDelta);
      }
    }

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

  // Handlers pour le redimensionnement
  const handleResizeStart = (e, task, side) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingTask({
      taskId: task.id,
      task: task,
      side,
      startX: e.clientX,
      originalStartDate: task.startDate,
      originalDueDate: task.dueDate,
      hasMoved: false
    });
  };

  const handleResizeMove = (e) => {
    if (!resizingTask) return;
    
    const deltaX = e.clientX - resizingTask.startX;
    let daysDelta = Math.round(deltaX / dayWidth);
    
    // Valider que la date de début ne dépasse pas la date de fin
    if (resizingTask.side === 'left' && resizingTask.originalStartDate && resizingTask.originalDueDate) {
      const newStartDate = addDays(parseISO(resizingTask.originalStartDate), daysDelta);
      const dueDate = parseISO(resizingTask.originalDueDate);
      
      // Limiter le delta pour que startDate ne dépasse pas dueDate
      if (newStartDate > dueDate) {
        daysDelta = differenceInDays(dueDate, parseISO(resizingTask.originalStartDate));
      }
    }
    
    // Valider que la date de fin ne soit pas avant la date de début
    if (resizingTask.side === 'right' && resizingTask.originalDueDate && resizingTask.originalStartDate) {
      const newDueDate = addDays(parseISO(resizingTask.originalDueDate), daysDelta);
      const startDate = parseISO(resizingTask.originalStartDate);
      
      // Limiter le delta pour que dueDate ne soit pas avant startDate
      if (newDueDate < startDate) {
        daysDelta = differenceInDays(startDate, parseISO(resizingTask.originalDueDate));
      }
    }
    
    // Mettre à jour le state pour le feedback visuel
    setResizingTask(prev => ({
      ...prev,
      currentDelta: daysDelta,
      hasMoved: Math.abs(deltaX) > 5 // Considérer comme déplacé si > 5px
    }));
  };

  const handleResizeEnd = (e) => {
    if (!resizingTask) return;

    // Utiliser le currentDelta déjà calculé pour éviter le sursaut
    const daysDelta = resizingTask.currentDelta || 0;
    const hasMoved = resizingTask.hasMoved;

    if (daysDelta === 0 || !hasMoved) {
      setResizingTask(null);
      justResizedRef.current = false;
      return;
    }

    const task = resizingTask.task;
    let newStartDate = resizingTask.originalStartDate;
    let newDueDate = resizingTask.originalDueDate;

    if (resizingTask.side === 'left' && newStartDate) {
      const currentStart = parseISO(newStartDate);
      newStartDate = format(addDays(currentStart, daysDelta), 'yyyy-MM-dd');
    } else if (resizingTask.side === 'right' && newDueDate) {
      const currentDue = parseISO(newDueDate);
      newDueDate = format(addDays(currentDue, daysDelta), 'yyyy-MM-dd');
    }

    // Marquer qu'on vient de redimensionner pour empêcher l'ouverture de la modal
    justResizedRef.current = hasMoved;
    
    // Stocker les nouvelles dates temporairement pour maintenir la position visuelle
    setTempTaskDates(prev => ({
      ...prev,
      [task.id]: {
        startDate: newStartDate,
        dueDate: newDueDate
      }
    }));
    
    // Réinitialiser le state de redimensionnement immédiatement
    setResizingTask(null);

    // Mettre à jour la tâche après avoir réinitialisé le state
    if (updateTask) {
      updateTask({
        variables: {
          input: {
            id: task.id,
            startDate: newStartDate,
            dueDate: newDueDate
          },
          workspaceId
        }
      }).then(() => {
        // Nettoyer les dates temporaires après la mise à jour réussie
        setTempTaskDates(prev => {
          const newDates = { ...prev };
          delete newDates[task.id];
          return newDates;
        });
      }).catch(() => {
        // En cas d'erreur, nettoyer aussi les dates temporaires
        setTempTaskDates(prev => {
          const newDates = { ...prev };
          delete newDates[task.id];
          return newDates;
        });
      });
    }

    // Réinitialiser après un court délai
    setTimeout(() => {
      justResizedRef.current = false;
    }, 100);
  };

  // Ajouter les event listeners pour le redimensionnement
  useEffect(() => {
    if (resizingTask) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizingTask]);

  // Synchroniser le scroll horizontal entre le header et la timeline
  useEffect(() => {
    const headerTimeline = headerTimelineRef.current;
    const timeline = scrollContainerRef.current;

    if (!headerTimeline || !timeline) return;

    const handleHeaderScroll = () => {
      if (timeline) {
        timeline.scrollLeft = headerTimeline.scrollLeft;
      }
    };

    const handleTimelineScroll = () => {
      if (headerTimeline) {
        headerTimeline.scrollLeft = timeline.scrollLeft;
      }
    };

    headerTimeline.addEventListener('scroll', handleHeaderScroll);
    timeline.addEventListener('scroll', handleTimelineScroll);

    return () => {
      headerTimeline.removeEventListener('scroll', handleHeaderScroll);
      timeline.removeEventListener('scroll', handleTimelineScroll);
    };
  }, []);

  // Tracker le curseur sur la timeline
  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const handleMouseMove = (e) => {
      setCursorPosition({
        x: e.clientX,
        y: e.clientY,
        visible: true
      });
    };

    const handleMouseLeave = () => {
      setCursorPosition(prev => ({ ...prev, visible: false }));
    };

    const handleClick = (e) => {
      // Calculer la date en fonction de la position du clic
      const rect = timeline.getBoundingClientRect();
      const clickX = e.clientX - rect.left + timeline.scrollLeft;
      const dayIndex = Math.floor(clickX / dayWidth);
      
      if (dayIndex >= 0 && dayIndex < daysToDisplay.length) {
        const clickedDate = daysToDisplay[dayIndex];
        
        // Créer une nouvelle tâche avec la date de début
        onEditTask({
          id: null, // Nouvelle tâche
          title: '',
          startDate: clickedDate.toISOString(),
          dueDate: null,
          column: columns[0] // Première colonne par défaut
        });
      }
    };

    timeline.addEventListener('mousemove', handleMouseMove);
    timeline.addEventListener('mouseleave', handleMouseLeave);
    timeline.addEventListener('click', handleClick);

    return () => {
      timeline.removeEventListener('mousemove', handleMouseMove);
      timeline.removeEventListener('mouseleave', handleMouseLeave);
      timeline.removeEventListener('click', handleClick);
    };
  }, [daysToDisplay, dayWidth, columns, onEditTask]);


  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-12rem)] bg-background">
      {/* Header avec contrôles - Plus compact */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-6 py-2 gap-2 sm:gap-0 bg-background/95 backdrop-blur-sm sticky top-0 z-20">
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
      <div className="flex-1 overflow-hidden border border-border rounded-lg">
        {/* Headers fixes */}
        <div className="flex border-b border-border">
          {/* Header gauche - hauteur étendue pour couvrir l'espace vide */}
          <div className="w-32 sm:w-48 md:w-72 border-r border-border bg-background px-2 sm:px-3 md:px-4 flex items-start pt-2 flex-shrink-0" style={{ height: '74px' }}>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Tâches · {allTasks.length}
            </div>
          </div>
          
          {/* Header timeline - semaines et jours */}
          <div ref={headerTimelineRef} className="flex-1 overflow-x-auto bg-background" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div style={{ minWidth: `${daysToDisplay.length * dayWidth}px` }}>
              {/* Ligne des semaines */}
              <div className="flex border-b border-border">
                {weekGroups.map((week, weekIndex) => (
                  <div
                    key={weekIndex}
                    className="border-r border-border px-3 h-9 bg-background flex items-center justify-between"
                    style={{ width: `${week.days.length * dayWidth}px` }}
                  >
                    <div className="text-[10px] text-muted-foreground/80">
                      {format(week.weekStart, "MMM d", { locale: fr })} - {format(week.weekEnd, "d", { locale: fr })}
                    </div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      S{week.weekNum}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Ligne des jours */}
              <div className="flex">
                {daysToDisplay.map((day, index) => {
                  const isToday = isSameDay(day, new Date());
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={index}
                      className={cn(
                        "border-r border-border flex-shrink-0 px-2 h-9 flex items-center justify-center text-center transition-colors",
                        isToday && "bg-primary/5",
                        isWeekend && "bg-muted/30"
                      )}
                      style={{ width: `${dayWidth}px` }}
                    >
                      <div className={cn(
                        "text-sm font-normal",
                        isToday ? "text-primary" : "text-foreground"
                      )}>
                        {format(day, "d", { locale: fr })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Conteneur de scroll partagé - scroll vertical uniquement */}
        <div className="grid grid-cols-[128px_1fr] sm:grid-cols-[192px_1fr] md:grid-cols-[288px_1fr] h-[calc(100%-74px)] overflow-y-auto" ref={leftColumnRef}>
          {/* Colonne des tâches */}
          <div className="border-r border-border bg-muted/20" style={{ minHeight: `${Math.max(allTasks.length, 20) * 45}px` }}>
            {/* Liste des tâches */}
            <div className="divide-y divide-border">
              {allTasks.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune tâche</p>
                </div>
              ) : (
                allTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "h-[45px] cursor-pointer transition-all group overflow-x-auto scrollbar-hide",
                      hoveredTaskId === task.id ? "bg-primary/2" : "hover:bg-accent/5"
                    )}
                    onClick={() => onEditTask(task)}
                    onMouseEnter={() => setHoveredTaskId(task.id)}
                    onMouseLeave={() => setHoveredTaskId(null)}
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                  >
                    <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 h-full min-w-max">
                      <div
                        className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: task.column.color }}
                      />
                      <div className="text-[10px] sm:text-xs font-medium whitespace-nowrap group-hover:text-primary transition-colors truncate max-w-[80px] sm:max-w-none">
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

          {/* Timeline - scroll horizontal seulement */}
          <div className="bg-background overflow-x-auto" ref={scrollContainerRef}>
            <div className="relative cursor-pointer" style={{ minWidth: `${daysToDisplay.length * dayWidth}px`, minHeight: `${Math.max(allTasks.length, 20) * 45}px` }} ref={timelineRef}>

              {/* Grille de fond - Traits verticaux jusqu'en bas */}
              <div className="absolute inset-0 top-0 flex pointer-events-none" style={{ minHeight: `${Math.max(allTasks.length, 20) * 45}px` }}>
                {daysToDisplay.map((day, index) => {
                  const isToday = isSameDay(day, new Date());
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={index}
                      className={cn(
                        "border-r border-dashed border-border flex-shrink-0 h-full",
                        isWeekend && "bg-muted/10",
                        isToday && "bg-primary/5 border-primary/20"
                      )}
                      style={{ width: `${dayWidth}px` }}
                    />
                  );
                })}
              </div>

              {/* Cercle qui suit le curseur - masqué sur mobile/tablette */}
              {cursorPosition.visible && !isOverTask && (
                <div
                  className="fixed pointer-events-none hidden md:block"
                  style={{
                    left: `${cursorPosition.x}px`,
                    top: `${cursorPosition.y}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 9999
                  }}
                >
                  <div className="relative">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-dashed shadow-lg" 
                      style={{ 
                        borderColor: '#5b50ff',
                        backgroundColor: 'rgba(91, 80, 255, 0.15)'
                      }}
                    />
                    {/* Tooltip */}
                    <div 
                      className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap px-2 py-1 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: '#5b50ff' }}
                    >
                      Créer une nouvelle tâche
                    </div>
                  </div>
                </div>
              )}

              {/* Barres de tâches */}
              <div className="relative min-h-full">
                {/* Lignes de fond pour toutes les tâches avec hover */}
                <div className="absolute inset-0">
                  {allTasks.map((task) => (
                    <div 
                      key={`line-${task.id}`} 
                      className={cn(
                        "h-[45px] transition-colors",
                        hoveredTaskId === task.id && "bg-primary/2"
                      )}
                      onMouseEnter={() => setHoveredTaskId(task.id)}
                      onMouseLeave={() => setHoveredTaskId(null)}
                    />
                  ))}
                  {/* Lignes supplémentaires pour remplir l'espace */}
                  {Array.from({ length: Math.max(0, 20 - allTasks.length) }).map((_, index) => (
                    <div key={`empty-line-${index}`} className="h-[45px]" />
                  ))}
                </div>

                {/* Barres de tâches par-dessus */}
                <div className="relative pointer-events-none">
                  {allTasksWithDates.map((task) => {
                    const barStyle = getTaskBarStyle(task);
                    if (!barStyle || !barStyle.visible) return null;

                    return (
                      <div
                        key={task.id}
                        className="relative h-[45px]"
                      >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                              className={cn(
                                "absolute top-1/2 -translate-y-1/2 h-9 rounded-md cursor-pointer transition-all hover:shadow-md group border pointer-events-auto relative",
                                resizingTask && resizingTask.taskId === task.id && "shadow-lg ring-2 ring-primary/50"
                              )}
                              style={{
                                left: barStyle.left,
                                width: barStyle.width,
                                backgroundColor: `${task.column.color}20`,
                                borderColor: `${task.column.color}60`,
                              }}
                              onClick={(e) => {
                                // Ne pas ouvrir la modal si on vient de redimensionner
                                if (justResizedRef.current) {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  return;
                                }
                                onEditTask(task);
                              }}
                              onMouseEnter={() => {
                                setHoveredTaskId(task.id);
                                setIsOverTask(true);
                              }}
                              onMouseLeave={() => {
                                setHoveredTaskId(null);
                                setIsOverTask(false);
                              }}
                            >
                              {/* Poignée de redimensionnement gauche */}
                              {task.startDate && (
                                <div
                                  className="absolute top-1 bottom-1 w-1 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-full"
                                  style={{ backgroundColor: task.column.color, left: '-10px' }}
                                  onMouseDown={(e) => handleResizeStart(e, task, 'left')}
                                />
                              )}
                              
                              {/* Poignée de redimensionnement droite */}
                              {task.dueDate && (
                                <div
                                  className="absolute top-1 bottom-1 w-1 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-full"
                                  style={{ backgroundColor: task.column.color, right: '-10px' }}
                                  onMouseDown={(e) => handleResizeStart(e, task, 'right')}
                                />
                              )}

                              <div className="px-2 py-0.5 flex items-center gap-1.5 h-full overflow-hidden relative z-0">
                                {task.assignedMembers && task.assignedMembers.length > 0 && (
                                  <div className="flex -space-x-1 flex-shrink-0">
                                    {task.assignedMembers.slice(0, 1).map((memberId) => {
                                      const memberInfo = membersInfo.find(m => m.id === memberId);
                                      return (
                                        <UserAvatar
                                          key={memberId}
                                          src={memberInfo?.image}
                                          name={memberInfo?.name || memberId}
                                          size="xs"
                                          className="border border-background w-5 h-5"
                                        />
                                      );
                                    })}
                                    {task.assignedMembers.length > 1 && (
                                      <div className="w-5 h-5 rounded-full bg-muted border border-background flex items-center justify-center text-[8px] font-semibold text-muted-foreground">
                                        +{task.assignedMembers.length - 1}
                                      </div>
                                    )}
                                  </div>
                                )}
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
