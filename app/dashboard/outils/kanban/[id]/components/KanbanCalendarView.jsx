import React, {
  useState,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import {
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Flag,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { cn } from "@/src/lib/utils";
import { useAssignedMembersInfo } from "@/src/hooks/useAssignedMembersInfo";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  isSameDay,
  parseISO,
} from "date-fns";
import { fr } from "date-fns/locale";
import { TaskPresenceAvatars, TaskPresenceOverlay } from "./TaskViewers";
import {
  buildCalendarWeeks,
  compareCalendarItems,
  countHiddenByDay,
  dayKey,
  dayTaskDates,
  getTaskDayRange,
  layoutWeek,
  parseDayKey,
  resizeTaskDatesFromHandle,
  sameTaskDates,
  shiftDayByPeriods,
  shiftTaskDates,
} from "@/src/utils/kanban-calendar";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DEFAULT_COLOR = "#94a3b8";

// Hauteurs (px) : bandeau du numéro de jour, puis une ligne par tâche
const DAY_HEADER_H = 28;
const MONTH_LANE_H = 24;
const WEEK_LANE_H = 50;
// Hauteur minimale d'une semaine en mode mois (3 tâches visibles)
const MIN_MONTH_ROW_H = 112;
// Déplacement (px) au-delà duquel un appui devient un glisser-déposer
const DRAG_THRESHOLD = 5;
// Pendant un glisser-déposer, maintien sur une zone de la barre de période
// avant de changer de période (jauge affichée), puis cadence si on y reste
const NAV_DELAY = 700;
const NAV_REPEAT = 900;

// Cible sous le pointeur : zone de la barre de période, case vide d'un mois
// voisin, jour de la grille, ou volet « Sans date »
function getPointTarget(x, y) {
  for (const el of document.elementsFromPoint(x, y)) {
    if (el.dataset?.calendarNav) {
      return {
        key: `nav-${el.dataset.calendarNav}`,
        nav: el.dataset.calendarNav,
      };
    }
    // Attribut vide (data-calendar-outside="") : tester sa présence
    if (el.dataset?.calendarOutside !== undefined) {
      return { key: "outside", outside: true };
    }
    if (el.dataset?.calendarUnscheduled !== undefined) {
      return { key: "unscheduled", unscheduled: true };
    }
    if (el.dataset?.calendarDay) {
      return { key: el.dataset.calendarDay, dayKey: el.dataset.calendarDay };
    }
  }
  return null;
}

// Dates proposées pendant un glisser-déposer ; null = position d'origine
function getPreviewDates(drag, target) {
  if (!target) return null;
  if (target.unscheduled) {
    return drag.kind === "schedule" ? null : { startDate: null, dueDate: null };
  }
  const day = parseDayKey(target.dayKey);
  if (drag.kind === "schedule") return dayTaskDates(day);
  if (!drag.anchorKey) return null;
  const anchorDay = parseDayKey(drag.anchorKey);
  // Poignée : la borne se pose sur le jour visé (le bord suit le pointeur)
  if (drag.kind === "start" || drag.kind === "end") {
    return resizeTaskDatesFromHandle(drag.dates, drag.kind, anchorDay, day);
  }
  const delta = differenceInCalendarDays(day, anchorDay);
  return delta === 0 ? null : shiftTaskDates(drag.dates, delta);
}

const getPriorityFlagClass = (priority) => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "text-red-500 fill-red-500";
    case "medium":
      return "text-yellow-500 fill-yellow-500";
    case "low":
      return "text-green-500 fill-green-500";
    default:
      return null;
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

// « lun. 5 oct. 9:00 → jeu. 8 oct. 18:00 », une seule borne si l'autre manque
function formatTaskDates(dates) {
  const fmt = (value) =>
    format(parseISO(value), "EEE d MMM HH:mm", { locale: fr });
  if (dates.startDate && dates.dueDate) {
    return `${fmt(dates.startDate)} → ${fmt(dates.dueDate)}`;
  }
  if (dates.startDate) return `Début : ${fmt(dates.startDate)}`;
  if (dates.dueDate) return `Échéance : ${fmt(dates.dueDate)}`;
  return "Sans date";
}

function PriorityFlag({ priority, className }) {
  const flagClass = getPriorityFlagClass(priority);
  if (!flagClass) return null;
  return <Flag className={cn("flex-shrink-0", flagClass, className)} />;
}

/**
 * Infobulle d'une tâche (mêmes informations que les barres du Gantt)
 */
function CalendarTaskTooltip({ task, dates, resolveMember }) {
  const color = task.column?.color || DEFAULT_COLOR;
  const assigned = task.assignedMembers || [];
  return (
    <div className="space-y-2">
      <div className="font-normal text-sm">{task.title}</div>
      <div className="flex items-center gap-3">
        {assigned.length > 0 && (
          <div className="flex items-center gap-1">
            {assigned.map((member) => {
              const info = resolveMember(member);
              return (
                <UserAvatar
                  key={info.id}
                  src={info.image}
                  name={info.name}
                  size="sm"
                  className="border border-background"
                />
              );
            })}
          </div>
        )}
        <div className="text-xs opacity-70 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatTaskDates(dates)}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div
          className="px-2 py-1 rounded-md flex-shrink-0 text-xs font-medium border flex items-center gap-1"
          style={{
            backgroundColor: `${color}20`,
            borderColor: `${color}20`,
            color,
          }}
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span>{task.column?.title}</span>
        </div>
        {getPriorityFlagClass(task.priority) && (
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground"
          >
            <PriorityFlag priority={task.priority} className="h-4 w-4" />
            <span className="text-muted-foreground">
              {getPriorityLabel(task.priority)}
            </span>
          </Badge>
        )}
      </div>
    </div>
  );
}

/**
 * Vue Calendrier pour le Kanban : mois ou semaine, tâches posées sur leurs
 * jours (du début à l'échéance), glisser-déposer pour replanifier, bords
 * étirables, création au clic sur un jour et volet des tâches sans date.
 */
export function KanbanCalendarView({
  columns,
  getTasksByColumn,
  filterTasks,
  onEditTask,
  onAddTask,
  updateTask,
  workspaceId,
  boardTitle,
  // Rôle sans l'action « edit » : ni glisser-déposer ni redimensionnement
  readOnly = false,
  // Rôle sans l'action « create » : pas de création de tâche au clic
  canCreate = !readOnly,
  // Rôle sans l'action « export » : pas d'export PDF
  canExport = true,
}) {
  // Date de référence de la période affichée (mois ou semaine qui la contient)
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState("month"); // month, week
  const [showUnscheduled, setShowUnscheduled] = useState(false);
  const [openMoreKey, setOpenMoreKey] = useState(null); // Popover « +N » ouvert
  // Glisser-déposer en cours : { taskId, kind, dates (aperçu), overUnscheduled }
  const [drag, setDrag] = useState(null);
  // Dates envoyées au serveur, affichées en attendant sa réponse
  const [tempTaskDates, setTempTaskDates] = useState({});
  const [bodyHeight, setBodyHeight] = useState(0);
  const bodyRef = useRef(null);
  const dragRef = useRef(null); // État du glisser-déposer lu par les écouteurs
  const justDraggedRef = useRef(false); // Ignore le clic qui suit un dépôt

  const canDrag = !readOnly && !!updateTask;

  // Toutes les tâches filtrées (recherche + membres), avec leur colonne
  const allTasks = useMemo(() => {
    const tasks = [];
    columns.forEach((column, columnIndex) => {
      const columnTasks = getTasksByColumn(column.id);
      const filtered = filterTasks ? filterTasks(columnTasks) : columnTasks;
      filtered.forEach((task) => {
        tasks.push({ ...task, column, columnIndex });
      });
    });
    return tasks;
  }, [columns, getTasksByColumn, filterTasks]);

  // Dates affichées : aperçu du glisser-déposer, sinon envoi en cours, sinon
  // dates de la tâche
  const getDisplayDates = useCallback(
    (task) => {
      if (drag?.taskId === task.id && drag.dates) return drag.dates;
      return tempTaskDates[task.id] || task;
    },
    [drag, tempTaskDates],
  );

  const { scheduledItems, unscheduledTasks } = useMemo(() => {
    const scheduled = [];
    const unscheduled = [];
    allTasks.forEach((task) => {
      const dates = getDisplayDates(task);
      const range = getTaskDayRange(dates);
      if (range) {
        scheduled.push({
          id: task.id,
          task,
          dates,
          start: range.start,
          end: range.end,
          columnIndex: task.columnIndex,
          position: task.position,
        });
      } else {
        unscheduled.push(task);
      }
    });
    scheduled.sort(compareCalendarItems);
    return { scheduledItems: scheduled, unscheduledTasks: unscheduled };
  }, [allTasks, getDisplayDates]);

  // Infos des membres assignés (ids ; la page publique fournit des objets)
  const allMemberIds = useMemo(() => {
    const ids = new Set();
    allTasks.forEach((task) => {
      (task.assignedMembers || []).forEach((member) => {
        if (member && typeof member !== "object") ids.add(String(member));
      });
    });
    return Array.from(ids);
  }, [allTasks]);
  const { members: membersInfo } = useAssignedMembersInfo(allMemberIds);
  const membersById = useMemo(
    () => new Map(membersInfo.map((m) => [String(m.id), m])),
    [membersInfo],
  );
  const resolveMember = useCallback(
    (member) => {
      if (member && typeof member === "object") return member;
      return (
        membersById.get(String(member)) || { id: member, name: String(member) }
      );
    },
    [membersById],
  );

  const weeks = useMemo(
    () => buildCalendarWeeks(anchorDate, viewMode),
    [anchorDate, viewMode],
  );
  const weekLayouts = useMemo(
    () => weeks.map((week) => layoutWeek(week, scheduledItems)),
    [weeks, scheduledItems],
  );

  // Hauteur disponible : les semaines du mois se partagent l'écran
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => setBodyHeight(el.clientHeight);
    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, []);

  const isWeekMode = viewMode === "week";
  const laneHeight = isWeekMode ? WEEK_LANE_H : MONTH_LANE_H;
  const monthRowHeight = Math.max(
    MIN_MONTH_ROW_H,
    Math.floor((bodyHeight || 0) / weeks.length),
  );
  // Lignes de tâches qui tiennent dans une semaine du mode mois
  const monthLaneCapacity = Math.max(
    2,
    Math.floor((monthRowHeight - DAY_HEADER_H - 4) / MONTH_LANE_H),
  );

  // Navigation
  const goToPrevious = () => {
    setAnchorDate((prev) =>
      isWeekMode ? addDays(prev, -7) : addMonths(prev, -1),
    );
  };
  const goToNext = () => {
    setAnchorDate((prev) =>
      isWeekMode ? addDays(prev, 7) : addMonths(prev, 1),
    );
  };
  const goToToday = () => setAnchorDate(new Date());

  // Libellés de la période précédente / suivante (barre de période)
  const adjacentPeriodLabel = (dir) => {
    const sign = dir === "next" ? 1 : -1;
    if (isWeekMode) {
      return `semaine du ${format(addDays(weeks[0].start, 7 * sign), "d MMM", { locale: fr })}`;
    }
    const month = addMonths(anchorDate, sign);
    return format(
      month,
      month.getFullYear() === anchorDate.getFullYear() ? "MMMM" : "MMMM yyyy",
      { locale: fr },
    );
  };

  const periodLabel = isWeekMode
    ? `${format(weeks[0].start, "d MMM", { locale: fr })} - ${format(
        weeks[0].end,
        "d MMM yyyy",
        { locale: fr },
      )}`
    : format(anchorDate, "MMMM yyyy", { locale: fr });

  // Création d'une tâche sur un jour (première colonne, comme le Gantt)
  const createTaskOnDay = (day) => {
    if (!canCreate || !onAddTask || columns.length === 0) return;
    onAddTask(columns[0].id, dayTaskDates(day));
  };

  // Clic dans le vide d'un jour = nouvelle tâche (comme le Gantt), sauf s'il
  // sert à refermer la liste « +N » (encore ouverte, ou refermée à l'appui)
  const moreClosedAtRef = useRef(0);
  const handleDayClick = (e, day) => {
    if (justDraggedRef.current) return;
    if (e.target !== e.currentTarget) return; // clic sur un bouton du jour
    if (openMoreKey !== null) return;
    if (Date.now() - moreClosedAtRef.current < 300) return;
    createTaskOnDay(day);
  };

  const openTask = (task) => {
    if (justDraggedRef.current) return;
    onEditTask?.(task);
  };

  // Envoi des nouvelles dates ; affichées tout de suite, nettoyées à la
  // réponse (le cache Apollo prend le relais, l'erreur est signalée par la
  // mutation elle-même)
  const latestRef = useRef({});
  latestRef.current = { updateTask, workspaceId };
  const commitTaskDates = useCallback((task, dates) => {
    const { updateTask: mutate, workspaceId: wsId } = latestRef.current;
    if (!mutate) return;
    setTempTaskDates((prev) => ({ ...prev, [task.id]: dates }));
    const clearTemp = () => {
      setTempTaskDates((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
    };
    Promise.resolve(
      mutate({
        variables: {
          input: {
            id: task.id,
            startDate: dates.startDate,
            dueDate: dates.dueDate,
          },
          workspaceId: wsId,
        },
      }),
    )
      .catch(() => {})
      .finally(clearTemp);
  }, []);

  // --- Glisser-déposer (pointeur) ---

  // Changement de période pendant un glisser-déposer (pour étirer ou
  // déplacer une tâche au-delà de la période) : uniquement par les zones de
  // la barre de période, sous la grille. Le maintien sur une zone remplit
  // une jauge, puis change de période ; en restant dessus, on continue.
  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;
  const navRef = useRef({ dir: null, timer: null });
  const lastPointerRef = useRef(null);
  const bubbleRef = useRef(null); // Bulle de date qui suit le pointeur

  const setNavDirection = useCallback((dir) => {
    const state = navRef.current;
    if (state.dir === dir) return;
    clearTimeout(state.timer);
    state.dir = dir;
    state.timer = null;
    if (!dir) return;
    const step = () => {
      const sign = dir === "next" ? 1 : -1;
      const mode = viewModeRef.current;
      setAnchorDate((prev) => shiftDayByPeriods(prev, mode, sign));
      // La tâche suit la période : elle passe sur le même jour du mois (ou
      // de la semaine) affiché, et y reste si on lâche sur la barre
      const current = dragRef.current;
      if (current?.navBaseKey) {
        current.navOffset += sign;
        current.targetKey = dayKey(
          shiftDayByPeriods(
            parseDayKey(current.navBaseKey),
            mode,
            current.navOffset,
          ),
        );
        current.previewDates = getPreviewDates(current, {
          dayKey: current.targetKey,
        });
      }
      // Jauge relancée pour la période d'après
      setDrag((prev) =>
        prev
          ? {
              ...prev,
              dates: current ? current.previewDates : prev.dates,
              navTick: (prev.navTick || 0) + 1,
            }
          : prev,
      );
      state.timer = setTimeout(step, NAV_REPEAT);
    };
    state.timer = setTimeout(step, NAV_DELAY);
  }, []);

  // Bulle sous le curseur, à droite ; au-dessus / à gauche près des bords de
  // la fenêtre (barre de période en bas, volet à droite)
  const positionBubble = useCallback((x, y) => {
    const el = bubbleRef.current;
    if (!el) return;
    const left =
      x + 16 + el.offsetWidth > window.innerWidth
        ? x - 16 - el.offsetWidth
        : x + 16;
    const top =
      y + 18 + el.offsetHeight > window.innerHeight
        ? y - 12 - el.offsetHeight
        : y + 18;
    el.style.transform = `translate(${left}px, ${top}px)`;
  }, []);

  // Pointeur sorti de la grille (au-delà du dimanche, au-dessus des jours…) :
  // jour le plus proche, pour que l'aperçu reste collé au bord au lieu de
  // revenir à sa place d'origine
  const getClampedTarget = useCallback((x, y) => {
    const rect = bodyRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const target = getPointTarget(
      Math.min(Math.max(x, rect.left + 2), rect.right - 2),
      Math.min(Math.max(y, rect.top + 2), rect.bottom - 2),
    );
    return target?.dayKey || target?.outside ? target : null;
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current = null;
    lastPointerRef.current = null;
    setNavDirection(null);
    setDrag(null);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [setNavDirection]);

  // Recalcule l'aperçu pour la position du pointeur (aussi après un
  // changement de période, le pointeur n'ayant pas bougé)
  const updateDragTarget = useCallback(
    (x, y) => {
      const current = dragRef.current;
      if (!current?.active) return;
      lastPointerRef.current = { x, y };
      positionBubble(x, y);
      const target = getPointTarget(x, y) || getClampedTarget(x, y);
      const navDir = target?.nav ?? null;
      setNavDirection(navDir);
      const navChanged = current.navDir !== navDir;
      current.navDir = navDir;
      // Jour de départ des changements de période (voir setNavDirection)
      if (target?.dayKey) {
        current.navBaseKey = target.dayKey;
        current.navOffset = 0;
      }
      // Sur une zone de la barre ou une case vide : l'aperçu reste où il était
      // (la barre le décale ensuite d'une période à chaque changement)
      const targetKey =
        target?.nav || target?.outside
          ? current.targetKey
          : (target?.key ?? null);
      if (current.targetKey === targetKey && current.started && !navChanged) {
        return;
      }
      if (current.targetKey !== targetKey || !current.started) {
        current.previewDates = getPreviewDates(current, target);
      }
      current.started = true;
      current.targetKey = targetKey;
      setDrag((prev) => ({
        taskId: current.task.id,
        kind: current.kind,
        original: current.dates,
        dates: current.previewDates,
        overUnscheduled: !!target?.unscheduled,
        navDir,
        navTick: navChanged ? 0 : (prev?.navTick ?? 0),
      }));
    },
    [getClampedTarget, positionBubble, setNavDirection],
  );

  useEffect(() => {
    const pointer = lastPointerRef.current;
    if (!pointer || !dragRef.current?.active) return;
    const frame = requestAnimationFrame(() =>
      updateDragTarget(pointer.x, pointer.y),
    );
    return () => cancelAnimationFrame(frame);
  }, [anchorDate, updateDragTarget]);

  // Bulle affichée au premier rendu du glisser-déposer : la placer tout de
  // suite sous le pointeur (ensuite elle suit sans nouveau rendu)
  const isDragging = !!drag;
  useLayoutEffect(() => {
    const pointer = lastPointerRef.current;
    if (isDragging && pointer) positionBubble(pointer.x, pointer.y);
  }, [isDragging, positionBubble]);

  const handlePointerMove = useCallback(
    (e) => {
      const current = dragRef.current;
      if (!current) return;
      if (!current.active) {
        const distance = Math.hypot(
          e.clientX - current.startX,
          e.clientY - current.startY,
        );
        if (distance < DRAG_THRESHOLD) return;
        current.active = true;
        document.body.style.cursor =
          current.kind === "move" || current.kind === "schedule"
            ? "grabbing"
            : "ew-resize";
        document.body.style.userSelect = "none";
      }
      updateDragTarget(e.clientX, e.clientY);
    },
    [updateDragTarget],
  );

  const stopListening = useRef(() => {});

  const handlePointerUp = useCallback(
    (e) => {
      const current = dragRef.current;
      stopListening.current();
      if (!current) return;
      if (current.active) {
        // Le clic qui suit le relâchement ne doit ni ouvrir ni créer de tâche
        justDraggedRef.current = true;
        setTimeout(() => {
          justDraggedRef.current = false;
        }, 100);
        updateDragTarget(e.clientX, e.clientY);
        const finalDates = current.previewDates;
        if (finalDates && !sameTaskDates(finalDates, current.dates)) {
          commitTaskDates(current.task, finalDates);
        }
      }
      endDrag();
    },
    [commitTaskDates, endDrag, updateDragTarget],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key !== "Escape" || !dragRef.current) return;
      stopListening.current();
      endDrag();
    },
    [endDrag],
  );

  const handlePointerCancel = useCallback(() => {
    stopListening.current();
    endDrag();
  }, [endDrag]);

  stopListening.current = () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerCancel);
    window.removeEventListener("keydown", handleKeyDown);
  };

  // Nettoyage si la vue se démonte pendant un glisser-déposer
  useEffect(
    () => () => {
      stopListening.current();
      clearTimeout(navRef.current.timer);
    },
    [],
  );

  const startDrag = (e, task, kind) => {
    if (!canDrag || e.button !== 0) return;
    // Les poignées ne déclenchent pas le déplacement de la tâche
    if (kind === "start" || kind === "end") e.stopPropagation();
    stopListening.current();
    const anchorKey = getPointTarget(e.clientX, e.clientY)?.dayKey ?? null;
    dragRef.current = {
      task,
      kind,
      dates: {
        startDate: getDisplayDates(task).startDate || null,
        dueDate: getDisplayDates(task).dueDate || null,
      },
      anchorKey,
      navBaseKey: anchorKey,
      navOffset: 0,
      startX: e.clientX,
      startY: e.clientY,
      active: false,
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    window.addEventListener("keydown", handleKeyDown);
  };

  // --- Export PDF de la période affichée ---

  const handleExportPDF = async () => {
    try {
      const { exportCalendarPDF } =
        await import("@/src/utils/kanban-calendar-export");
      exportCalendarPDF({
        boardTitle,
        periodLabel,
        mode: viewMode,
        weeks,
        items: scheduledItems,
        resolveMemberName: (member) => resolveMember(member)?.name,
      });
    } catch (error) {
      console.error("Erreur lors de l'export PDF du calendrier:", error);
      toast.error("Impossible de générer le PDF");
    }
  };

  // --- Rendu ---

  const renderTaskChip = (segment) => {
    const { item, continuesBefore, continuesAfter } = segment;
    const { task, dates } = item;
    const color = task.column?.color || DEFAULT_COLOR;
    const isDragged = drag?.taskId === task.id;
    const firstMember = task.assignedMembers?.[0]
      ? resolveMember(task.assignedMembers[0])
      : null;
    const isMultiDay = !isSameDay(item.start, item.end);

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            data-calendar-task={task.id}
            onPointerDown={(e) => startDrag(e, task, "move")}
            onClick={(e) => {
              e.stopPropagation();
              openTask(task);
            }}
            className={cn(
              "group/chip pointer-events-auto relative flex h-full w-full overflow-hidden border text-left transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b50ff]/50",
              isWeekMode
                ? "flex-col justify-center gap-0.5 px-2"
                : "items-center gap-1 px-1.5",
              continuesBefore ? "rounded-l-none border-l-0" : "rounded-l-md",
              continuesAfter ? "rounded-r-none border-r-0" : "rounded-r-md",
              canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
              isDragged && "shadow-lg ring-2 ring-[#5b50ff]/50",
            )}
            style={{
              backgroundColor: `${color}1F`,
              borderColor: `${color}60`,
              touchAction: canDrag ? "none" : undefined,
            }}
          >
            <TaskPresenceOverlay
              taskId={task.id}
              className={cn(
                continuesBefore && "rounded-l-none",
                continuesAfter && "rounded-r-none",
              )}
            />
            <span className="flex w-full min-w-0 items-center gap-1">
              {continuesBefore ? (
                <ChevronLeft className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
              ) : (
                <span
                  className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}
              <span
                className={cn(
                  "truncate font-medium text-foreground",
                  isWeekMode ? "text-xs" : "text-[11px]",
                )}
              >
                {task.title}
              </span>
              <PriorityFlag priority={task.priority} className="h-2.5 w-2.5" />
              <span className="ml-auto flex flex-shrink-0 items-center gap-1">
                <TaskPresenceAvatars taskId={task.id} size="xxs" />
                {!isWeekMode && firstMember && (
                  <UserAvatar
                    src={firstMember.image}
                    name={firstMember.name}
                    size="xs"
                    className="border border-background w-4 h-4"
                  />
                )}
                {continuesAfter && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
              </span>
            </span>
            {isWeekMode && (
              <span className="flex w-full min-w-0 items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="truncate">{task.column?.title}</span>
                <span className="flex-shrink-0 tabular-nums">
                  {isMultiDay
                    ? `${format(item.start, "d MMM", { locale: fr })} → ${format(item.end, "d MMM", { locale: fr })}`
                    : [dates.startDate, dates.dueDate]
                        .filter(Boolean)
                        .map((value) => format(parseISO(value), "HH:mm"))
                        .join(" - ")}
                </span>
                {task.assignedMembers?.length > 0 && (
                  <span className="ml-auto flex flex-shrink-0 -space-x-1">
                    {task.assignedMembers.slice(0, 3).map((member) => {
                      const info = resolveMember(member);
                      return (
                        <UserAvatar
                          key={info.id}
                          src={info.image}
                          name={info.name}
                          size="xs"
                          className="border border-background w-4 h-4"
                        />
                      );
                    })}
                    {task.assignedMembers.length > 3 && (
                      <span className="w-4 h-4 rounded-full bg-muted border border-background flex items-center justify-center text-[8px] font-semibold text-muted-foreground">
                        +{task.assignedMembers.length - 3}
                      </span>
                    )}
                  </span>
                )}
              </span>
            )}

            {/* Poignées : étirer le début / l'échéance, y compris depuis un
                bord coupé en début ou fin de semaine */}
            {canDrag && (
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 z-[2] w-1.5 cursor-ew-resize opacity-0 transition-opacity group-hover/chip:opacity-100"
                style={{ backgroundColor: `${color}80` }}
                onPointerDown={(e) => startDrag(e, task, "start")}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {canDrag && (
              <span
                aria-hidden="true"
                className="absolute inset-y-0 right-0 z-[2] w-1.5 cursor-ew-resize opacity-0 transition-opacity group-hover/chip:opacity-100"
                style={{ backgroundColor: `${color}80` }}
                onPointerDown={(e) => startDrag(e, task, "end")}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <CalendarTaskTooltip
            task={task}
            dates={dates}
            resolveMember={resolveMember}
          />
        </TooltipContent>
      </Tooltip>
    );
  };

  // Ligne compacte (volet « Sans date », liste « +N autres »)
  const renderTaskRow = (task, { draggable = false } = {}) => {
    const color = task.column?.color || DEFAULT_COLOR;
    const firstMember = task.assignedMembers?.[0]
      ? resolveMember(task.assignedMembers[0])
      : null;
    return (
      <button
        key={task.id}
        type="button"
        onPointerDown={
          draggable ? (e) => startDrag(e, task, "schedule") : undefined
        }
        onClick={() => {
          setOpenMoreKey(null);
          openTask(task);
        }}
        className={cn(
          "relative flex w-full items-center gap-2 rounded-md border border-border/60 bg-background px-2 py-1.5 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b50ff]/50",
          draggable && canDrag
            ? "cursor-grab active:cursor-grabbing"
            : "cursor-pointer",
        )}
        style={{ touchAction: draggable && canDrag ? "none" : undefined }}
      >
        <TaskPresenceOverlay taskId={task.id} />
        <span
          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-foreground">
            {task.title}
          </span>
          <span className="block truncate text-[10px] text-muted-foreground">
            {task.column?.title}
          </span>
        </span>
        <PriorityFlag priority={task.priority} className="h-2.5 w-2.5" />
        {firstMember && (
          <UserAvatar
            src={firstMember.image}
            name={firstMember.name}
            size="xs"
            className="border border-background w-5 h-5 flex-shrink-0"
          />
        )}
      </button>
    );
  };

  const today = new Date();

  // Contenu de la bulle de glisser-déposer
  const dragBubble = useMemo(() => {
    if (!drag) return null;
    if (drag.overUnscheduled) {
      return {
        title:
          drag.kind === "schedule" ? "Reste sans date" : "Retirer les dates",
      };
    }
    const dates =
      drag.dates || (drag.kind === "schedule" ? null : drag.original);
    const range = dates ? getTaskDayRange(dates) : null;
    if (!range) return { title: "Déposez la tâche sur un jour" };
    const fmt = (day) => format(day, "EEE d MMM", { locale: fr });
    const days = differenceInCalendarDays(range.end, range.start) + 1;
    const duration = `${days} jour${days > 1 ? "s" : ""}`;
    if (drag.kind === "start") {
      return { title: `Début : ${fmt(range.start)}`, detail: duration };
    }
    if (drag.kind === "end") {
      return { title: `Échéance : ${fmt(range.end)}`, detail: duration };
    }
    const span =
      days > 1 ? `${fmt(range.start)} → ${fmt(range.end)}` : fmt(range.start);
    return drag.kind === "schedule"
      ? { title: `Planifier : ${span}` }
      : { title: span, detail: days > 1 ? duration : null };
  }, [drag]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full flex-col bg-background">
        {/* Header avec contrôles (mêmes contrôles que le Gantt) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-2 gap-2 sm:gap-0 bg-background">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevious}
                className="h-7 w-7"
                aria-label={
                  isWeekMode ? "Semaine précédente" : "Mois précédent"
                }
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
                aria-label={isWeekMode ? "Semaine suivante" : "Mois suivant"}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm font-semibold text-foreground">
              {periodLabel}
            </div>
          </div>

          <div className="flex items-center gap-2 mr-2">
            <Button
              variant={showUnscheduled ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs gap-1.5"
              onClick={() => setShowUnscheduled((prev) => !prev)}
              aria-pressed={showUnscheduled}
            >
              <CalendarOff className="h-3.5 w-3.5" />
              Sans date
              <span className="tabular-nums text-muted-foreground">
                {unscheduledTasks.length}
              </span>
            </Button>
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-28 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mois</SelectItem>
                <SelectItem value="week">Semaine</SelectItem>
              </SelectContent>
            </Select>
            {canExport && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-3 text-xs gap-1.5"
                onClick={handleExportPDF}
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exporter PDF</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-1 min-h-0 border-t border-border">
          <div className="relative flex flex-1 min-w-0 flex-col">
            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 border-b border-border flex-shrink-0">
              {(isWeekMode ? weeks[0].days : WEEKDAY_LABELS).map(
                (value, index) => {
                  const isToday = isWeekMode && isSameDay(value, today);
                  return (
                    <div
                      key={index}
                      className={cn(
                        "h-8 px-2 flex items-center border-r border-border last:border-r-0 text-[10px] font-semibold uppercase tracking-wider",
                        isToday ? "text-[#5b50ff]" : "text-muted-foreground",
                      )}
                    >
                      {isWeekMode
                        ? format(value, "EEE d", { locale: fr })
                        : value}
                    </div>
                  );
                },
              )}
            </div>

            {/* Semaines */}
            <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto">
              {weeks.map((week, weekIndex) => {
                const { segments, laneCount } = weekLayouts[weekIndex];
                // Mode semaine : toutes les tâches ; mode mois : autant que
                // la hauteur le permet, la dernière ligne devient « +N »
                const visibleLanes = isWeekMode
                  ? laneCount
                  : laneCount <= monthLaneCapacity
                    ? laneCount
                    : monthLaneCapacity - 1;
                const hiddenByDay = countHiddenByDay(segments, visibleLanes);
                const rowHeight = isWeekMode
                  ? Math.max(
                      bodyHeight || 0,
                      DAY_HEADER_H + laneCount * WEEK_LANE_H + 8,
                    )
                  : monthRowHeight;

                return (
                  <div
                    key={dayKey(week.start)}
                    className="relative border-b border-border last:border-b-0"
                    style={{ height: `${rowHeight}px` }}
                  >
                    {/* Fond : un cadre par jour (cible des clics et dépôts) */}
                    <div className="absolute inset-0 grid grid-cols-7">
                      {week.days.map((day, dayIndex) => {
                        const key = dayKey(day);
                        // Mode mois : jours des mois voisins = cases vides
                        // (pendant un glisser-déposer, l'aperçu y reste sur
                        // le dernier jour visé)
                        if (
                          day < week.visible.start ||
                          day > week.visible.end
                        ) {
                          return (
                            <div
                              key={key}
                              data-calendar-outside=""
                              className="border-r border-border bg-muted/30 last:border-r-0"
                            />
                          );
                        }
                        const isToday = isSameDay(day, today);
                        const isWeekend = dayIndex >= 5;
                        const hidden = hiddenByDay[dayIndex];
                        return (
                          <div
                            key={key}
                            data-calendar-day={key}
                            onClick={(e) => handleDayClick(e, day)}
                            className={cn(
                              "group/day relative border-r border-border last:border-r-0",
                              canCreate &&
                                columns.length > 0 &&
                                "cursor-pointer",
                              isWeekend && "bg-muted/20",
                              isToday && "bg-[#5b50ff]/5",
                            )}
                          >
                            <div className="pointer-events-none flex h-7 items-center justify-between px-1.5">
                              {/* Mode semaine : la date est dans l'en-tête */}
                              <span
                                className={cn(
                                  isWeekMode && "invisible",
                                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs tabular-nums",
                                  isToday
                                    ? "bg-[#5b50ff] font-semibold text-white"
                                    : "text-foreground",
                                )}
                              >
                                {!isWeekMode && day.getDate() === 1
                                  ? format(day, "d MMM", { locale: fr })
                                  : format(day, "d")}
                              </span>
                              {canCreate && columns.length > 0 && (
                                <button
                                  type="button"
                                  className="pointer-events-auto flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover/day:opacity-100 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    createTaskOnDay(day);
                                  }}
                                  title="Nouvelle tâche ce jour"
                                  aria-label={`Nouvelle tâche le ${format(day, "d MMMM", { locale: fr })}`}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Tâches masquées faute de place */}
                            {hidden > 0 && (
                              <Popover
                                open={openMoreKey === key}
                                onOpenChange={(open) => {
                                  if (!open)
                                    moreClosedAtRef.current = Date.now();
                                  setOpenMoreKey(open ? key : null);
                                }}
                              >
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="absolute left-1 right-1 rounded px-1.5 text-left text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
                                    style={{
                                      top: `${DAY_HEADER_H + visibleLanes * MONTH_LANE_H}px`,
                                      height: `${MONTH_LANE_H - 2}px`,
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    +{hidden} autre{hidden > 1 ? "s" : ""}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-72 p-2"
                                  align="start"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="mb-2 px-1 text-xs font-semibold text-foreground">
                                    {format(day, "EEEE d MMMM", { locale: fr })}
                                  </div>
                                  <div className="max-h-72 space-y-1 overflow-y-auto">
                                    {segments
                                      .filter(
                                        (segment) =>
                                          segment.startCol <= dayIndex &&
                                          segment.endCol >= dayIndex,
                                      )
                                      .map((segment) =>
                                        renderTaskRow(segment.item.task),
                                      )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Tâches par-dessus, une ligne chacune */}
                    <div
                      className="pointer-events-none absolute inset-x-0"
                      style={{ top: `${DAY_HEADER_H}px` }}
                    >
                      {segments
                        .filter((segment) => segment.lane < visibleLanes)
                        .map((segment) => (
                          <div
                            key={`${segment.item.id}-${weekIndex}`}
                            className="absolute px-0.5"
                            style={{
                              left: `calc(${segment.startCol} * 100% / 7)`,
                              width: `calc(${segment.endCol - segment.startCol + 1} * 100% / 7)`,
                              top: `${segment.lane * laneHeight}px`,
                              height: `${laneHeight - 2}px`,
                            }}
                          >
                            {renderTaskChip(segment)}
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Barre de période : navigation, et pendant un glisser-déposer,
                zones à maintenir pour passer à la période précédente /
                suivante */}
            <div className="grid flex-shrink-0 grid-cols-2 gap-2 border-t border-border p-2">
              {["prev", "next"].map((dir) => {
                const label = adjacentPeriodLabel(dir);
                const isHovered = drag?.navDir === dir;
                const Icon = dir === "next" ? ChevronRight : ChevronLeft;
                return (
                  <button
                    key={dir}
                    type="button"
                    data-calendar-nav={dir}
                    onClick={dir === "next" ? goToNext : goToPrevious}
                    className={cn(
                      "relative flex h-9 items-center gap-1.5 overflow-hidden rounded-md px-3 text-xs transition-colors cursor-pointer",
                      dir === "next" ? "justify-end" : "justify-start",
                      drag
                        ? cn(
                            "border border-dashed font-medium text-[#5b50ff]",
                            isHovered
                              ? "border-[#5b50ff] bg-[#5b50ff]/10"
                              : "border-[#5b50ff]/40 bg-[#5b50ff]/5",
                          )
                        : "border border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {/* Jauge de maintien avant le changement de période */}
                    {isHovered && (
                      <span
                        key={drag.navTick}
                        aria-hidden="true"
                        className={cn(
                          "pointer-events-none absolute inset-0 bg-[#5b50ff]/15",
                          dir === "next" ? "origin-left" : "origin-right",
                        )}
                        style={{
                          animation: `kanban-calendar-gauge ${drag.navTick ? NAV_REPEAT : NAV_DELAY}ms linear forwards`,
                        }}
                      />
                    )}
                    {dir === "prev" && <Icon className="relative h-4 w-4" />}
                    <span className="relative truncate">
                      {drag
                        ? dir === "next"
                          ? `Maintenez ici pour aller ${isWeekMode ? "à la" : "en"} ${label}`
                          : `Maintenez ici pour revenir ${isWeekMode ? "à la" : "en"} ${label}`
                        : label.charAt(0).toUpperCase() + label.slice(1)}
                    </span>
                    {dir === "next" && <Icon className="relative h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Volet des tâches sans date (cible de dépôt pour retirer les dates) */}
          {showUnscheduled && (
            <aside
              data-calendar-unscheduled=""
              className={cn(
                "flex w-64 flex-shrink-0 flex-col border-l border-border bg-muted/20 transition-colors",
                drag?.overUnscheduled &&
                  drag.kind !== "schedule" &&
                  "bg-[#5b50ff]/5 outline outline-2 -outline-offset-2 outline-dashed outline-[#5b50ff]/40",
              )}
            >
              <div className="px-3 pt-3 pb-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Sans date · {unscheduledTasks.length}
                </div>
                {canDrag && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Glissez une tâche sur un jour pour la planifier, ou
                    déposez-la ici pour retirer ses dates.
                  </p>
                )}
              </div>
              <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
                {unscheduledTasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Toutes les tâches ont une date
                  </div>
                ) : (
                  unscheduledTasks.map((task) =>
                    renderTaskRow(task, { draggable: true }),
                  )
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      <style>{`
        @keyframes kanban-calendar-gauge {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>

      {/* Bulle qui suit le pointeur : ce que le dépôt va enregistrer */}
      {dragBubble && (
        <div
          ref={bubbleRef}
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-[60] rounded-lg bg-[#1a1a1a] px-2.5 py-1.5 text-white shadow-lg dark:bg-white dark:text-[#1a1a1a]"
        >
          <div className="text-xs font-medium whitespace-nowrap">
            {dragBubble.title}
          </div>
          {dragBubble.detail && (
            <div className="text-[11px] whitespace-nowrap opacity-70">
              {dragBubble.detail}
            </div>
          )}
          <div className="mt-0.5 text-[10px] whitespace-nowrap opacity-50">
            Échap pour annuler
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}
