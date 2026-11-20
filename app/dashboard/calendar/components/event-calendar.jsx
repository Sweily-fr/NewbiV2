"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import {
  addDays,
  differenceInCalendarDays,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarArrowUp,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Link2,
  MoreHorizontal,
  Palette,
  PlusIcon,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/src/components/ui/sonner";

import {
  addHoursToDate,
  AgendaDaysToShow,
  AgendaView,
  CalendarDndProvider,
  DayView,
  EventDialog,
  EventGap,
  EventHeight,
  MonthView,
  WeekCellsHeight,
  WeekView,
} from "./index";
import { CalendarConnectionsPanel } from "./calendar-connections-panel";
import { CalendarDayPanel } from "./calendar-day-panel";
import { CalendarFeedDialog } from "./calendar-feed-dialog";
import { CalendarFiltersButton } from "./calendar-filters";
import { DefaultStartHour } from "./constants";
import { CalendarOverdueButton } from "./calendar-overdue-button";
import { ColorLegend } from "./color-legend";
import { LinkedItemSheet } from "./linked-item-sheet";
import {
  AppointmentEventSheet,
  isAppointmentEvent,
} from "./appointment-event-sheet";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import {
  useCalendarConnections,
  useSyncAllCalendars,
} from "@/src/hooks/useCalendarConnections";
import { buildUpcomingDays } from "@/src/utils/upcoming-days";
import { useWorkspaceFeatures } from "@/src/hooks/useWorkspaceFeatures";
import {
  useCalendarLinkedItems,
  useCalendarOverdueItems,
} from "@/src/hooks/useCalendarLinkedItems";
import { dateToDay, dayToDate } from "@/src/utils/recurrenceDays";
import { shiftTaskDates } from "@/src/utils/kanban-calendar";
import { formatLocalDate } from "@/src/utils/dateFormatter";
import { useMarkInvoiceAsPaid } from "@/src/graphql/invoiceQueries";
import { useMarkAsPaid as useMarkPurchaseInvoiceAsPaid } from "@/src/hooks/usePurchaseInvoices";
import { SEND_INVOICE_REMINDER_NOW } from "@/src/graphql/invoiceReminderQueries";
import {
  GET_ORGANIZATION_MEMBERS,
  UPDATE_TASK,
} from "@/src/graphql/kanbanQueries";
import { useSession } from "@/src/lib/auth-client";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import {
  APPOINTMENTS_SOURCE,
  CALENDAR_WEEK_OPTIONS,
  DEFAULT_VIEW,
  EVENTS_SOURCE,
  hiddenSourcesForView,
  isPlainInvoiceDueEvent,
  linkedItemToEvent,
  linkedReminderDraft,
  periodNames,
  readHiddenSources,
  storeHiddenSources,
  summarizeLinkedItems,
  summaryRange,
  visibleRange,
} from "@/src/utils/calendar-linked-items";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

// « Tâches de » : « all » ou l'identifiant d'un membre
const TASK_ASSIGNEE_KEY = "newbi:calendar:task-assignee";
const NO_HIDDEN_SOURCES = new Set();
const NO_MEMBERS = [];
// Volet du jour à droite de la vue mois, à partir de cette largeur
// (calendrier et volet compris) ; plus large au-delà de DAY_PANEL_WIDE
const DAY_PANEL_MIN_WIDTH = 680;
const DAY_PANEL_WIDE = 1100;

const capitalize = (text) =>
  typeof text === "string"
    ? text.charAt(0).toUpperCase() + text.slice(1)
    : text;

export function EventCalendar({
  events = [],
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  className,
  initialView = "mois",
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState(initialView);
  // Jour du volet de la vue mois (aujourd'hui à l'arrivée)
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  // Fenêtres ouvertes depuis le menu « … »
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);
  // Un élément du menu ouvre une fenêtre : le focus ne revient pas au bouton
  const openingFromMenuRef = useRef(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  // Échéance d'une autre page ouverte dans sa fiche
  const [selectedLinkedItem, setSelectedLinkedItem] = useState(null);
  // Rendez-vous pris en ligne ouvert dans sa fiche (lecture seule)
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [hiddenSources, setHiddenSources] = useState(() =>
    hiddenSourcesForView(DEFAULT_VIEW),
  );
  const [taskAssignee, setTaskAssignee] = useState("all");

  // Droits du rôle sur le calendrier (tout autorisé tant que la grille
  // n'est pas chargée, l'API refuse de toute façon)
  const { canDo, isReady: permissionsReady } = useMyPermissions();
  // Prise de rendez-vous en accès anticipé (ligne des filtres)
  const { isEnabled: isFeatureEnabled } = useWorkspaceFeatures();
  const canCreateEvents = !permissionsReady || canDo("calendar", "create");
  // Modifier, glisser-déposer, étiquettes et synchronisation = « edit »
  const canEditEvents = !permissionsReady || canDo("calendar", "edit");
  const canDeleteEvents = !permissionsReady || canDo("calendar", "delete");
  // Échéances des autres pages : chaque action suit le droit de sa page
  const canEditTasks = !permissionsReady || canDo("kanban", "edit");
  const canMarkInvoicePaid = !permissionsReady || canDo("invoices", "markPaid");
  const canMarkPurchasePaid =
    !permissionsReady || canDo("purchaseInvoices", "markPaid");
  const canSendInvoices = !permissionsReady || canDo("invoices", "send");

  const { data: sessionData } = useSession();
  const currentUserId = sessionData?.user?.id;
  const { connections: calendarConnections } = useCalendarConnections();
  const { syncAll, loading: syncing } = useSyncAllCalendars();

  // Lu après le premier rendu : le rendu serveur ne connaît pas le stockage
  useEffect(() => {
    setHiddenSources(readHiddenSources());
    try {
      setTaskAssignee(localStorage.getItem(TASK_ASSIGNEE_KEY) || "all");
    } catch {
      // Stockage indisponible : les tâches de tout le monde
    }
  }, []);

  const changeTaskAssignee = useCallback((assignee) => {
    setTaskAssignee(assignee);
    try {
      localStorage.setItem(TASK_ASSIGNEE_KEY, assignee);
    } catch {
      // Stockage indisponible (navigation privée) : choix non retenu
    }
  }, []);

  const selectView = useCallback((viewKey) => {
    const hidden = hiddenSourcesForView(viewKey);
    setHiddenSources(hidden);
    storeHiddenSources(hidden);
  }, []);

  const toggleSource = useCallback((key) => {
    setHiddenSources((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      storeHiddenSources(next);
      return next;
    });
  }, []);

  // Échéances des autres pages sur les jours affichés
  const range = useMemo(
    () => visibleRange(view, currentDate, AgendaDaysToShow),
    [view, currentDate],
  );
  const {
    items: linkedItems,
    kinds: linkedKinds,
    loading: linkedLoading,
    unavailable: linkedUnavailable,
    fiscalSetup: linkedFiscalSetup,
  } = useCalendarLinkedItems(range);

  // Lien d'une notification ou de l'accueil : ?jour=AAAA-MM-JJ ouvre ce jour,
  // &echeance=<id> ouvre en plus la fiche de l'échéance dès qu'elle est
  // chargée. Chaque lien n'est appliqué qu'une fois.
  const searchParams = useSearchParams();
  const requestedDay = searchParams?.get("jour") || null;
  const requestedItemId = searchParams?.get("echeance") || null;
  const appliedLinkRef = useRef(null);
  const openedItemRef = useRef(null);
  useEffect(() => {
    if (!requestedDay || !/^\d{4}-\d{2}-\d{2}$/.test(requestedDay)) return;
    const linkKey = `${requestedDay}|${requestedItemId || ""}`;
    if (appliedLinkRef.current === linkKey) return;
    const date = dayToDate(requestedDay);
    if (Number.isNaN(date.getTime())) return;
    appliedLinkRef.current = linkKey;
    openedItemRef.current = null;
    setCurrentDate(date);
    setSelectedDay(date);
  }, [requestedDay, requestedItemId]);
  useEffect(() => {
    if (!requestedItemId || openedItemRef.current === requestedItemId) return;
    const item = linkedItems.find(
      (candidate) => candidate.id === requestedItemId,
    );
    if (!item) return;
    openedItemRef.current = requestedItemId;
    setSelectedLinkedItem(item);
  }, [requestedItemId, linkedItems]);

  const { workspaceId } = useWorkspace();
  const { data: membersData } = useQuery(GET_ORGANIZATION_MEMBERS, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-first",
  });
  const members = membersData?.organizationMembers || NO_MEMBERS;
  // Membre retiré de l'espace depuis le choix : toutes les tâches
  const activeTaskAssignee =
    taskAssignee !== "all" &&
    members.some((member) => member.id === taskAssignee)
      ? taskAssignee
      : "all";

  // Tout ce qui est en retard, quelle que soit la date
  const { items: overdueItems, truncated: overdueTruncated } =
    useCalendarOverdueItems();

  // « Tâches de » : seulement les tâches assignées à ce membre
  const visibleLinkedItems = useMemo(
    () =>
      activeTaskAssignee !== "all"
        ? linkedItems.filter(
            (item) =>
              item.kind !== "TASK" ||
              (item.assignedMembersInfo || []).some(
                (member) => member.userId === activeTaskAssignee,
              ),
          )
        : linkedItems,
    [linkedItems, activeTaskAssignee],
  );

  // Sans barre des sources (aucune autre page visible), rien n'est masqué :
  // un choix d'avant ne doit pas cacher les événements sans moyen de revenir
  const activeHiddenSources =
    linkedLoading || linkedKinds.length > 0 ? hiddenSources : NO_HIDDEN_SOURCES;

  const displayedEvents = useMemo(() => {
    const ownEvents = events.filter((event) =>
      // Rendez-vous pris en ligne et autres événements : deux sources
      isAppointmentEvent(event)
        ? !activeHiddenSources.has(APPOINTMENTS_SOURCE)
        : !activeHiddenSources.has(EVENTS_SOURCE) &&
          // Copies des échéances de factures : remplacées par l'échéance
          // relue dans la facture (statut à jour)
          (linkedUnavailable || !isPlainInvoiceDueEvent(event)),
    );
    const linkedEvents = visibleLinkedItems
      .filter((item) => !activeHiddenSources.has(item.kind))
      .map((item) => ({
        ...linkedItemToEvent(item),
        // Seules les tâches se déplacent (leur échéance change), avec le
        // droit de modifier les projets
        linkedDraggable: item.kind === "TASK" && canEditTasks,
      }));
    return linkedEvents.length ? [...ownEvents, ...linkedEvents] : ownEvents;
  }, [
    events,
    visibleLinkedItems,
    linkedUnavailable,
    activeHiddenSources,
    canEditTasks,
  ]);

  // Totaux de la barre des sources (le mois en vue mois)
  const period = useMemo(() => {
    const bounds = summaryRange(view, currentDate, AgendaDaysToShow);
    return { ...bounds, ...periodNames(view, currentDate, AgendaDaysToShow) };
  }, [view, currentDate]);
  const linkedSummary = useMemo(
    () => summarizeLinkedItems(visibleLinkedItems, period),
    [visibleLinkedItems, period],
  );
  const periodEventCounts = useMemo(() => {
    const counts = { events: 0, appointments: 0 };
    for (const event of events) {
      if (!linkedUnavailable && isPlainInvoiceDueEvent(event)) continue;
      if (
        dateToDay(new Date(event.start)) > period.to ||
        dateToDay(new Date(event.end)) < period.from
      ) {
        continue;
      }
      if (isAppointmentEvent(event)) counts.appointments += 1;
      else counts.events += 1;
    }
    return counts;
  }, [events, linkedUnavailable, period]);

  // Add keyboard shortcuts for view switching
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if user is typing in an input, textarea or contentEditable element
      // or if the event dialog is open
      if (
        isEventDialogOpen ||
        selectedLinkedItem ||
        selectedAppointment ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "m":
          setView("mois");
          break;
        case "w":
          setView("semaine");
          break;
        case "d":
          setView("jour");
          break;
        case "a":
          setView("agenda");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEventDialogOpen, selectedLinkedItem, selectedAppointment]);

  // Autre mois : le volet montre aujourd'hui (mois en cours) ou le 1er
  const showMonth = (date) => {
    const today = new Date();
    setCurrentDate(date);
    setSelectedDay(isSameMonth(date, today) ? today : startOfMonth(date));
  };

  const handlePrevious = () => {
    if (view === "mois") {
      showMonth(subMonths(currentDate, 1));
    } else if (view === "semaine") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (view === "jour") {
      setCurrentDate(addDays(currentDate, -1));
    } else if (view === "agenda") {
      // For agenda view, go back 30 days (a full month)
      setCurrentDate(addDays(currentDate, -AgendaDaysToShow));
    }
  };

  const handleNext = () => {
    if (view === "mois") {
      showMonth(addMonths(currentDate, 1));
    } else if (view === "semaine") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (view === "jour") {
      setCurrentDate(addDays(currentDate, 1));
    } else if (view === "agenda") {
      // For agenda view, go forward 30 days (a full month)
      setCurrentDate(addDays(currentDate, AgendaDaysToShow));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(new Date());
  };

  // Handlers stables (useCallback) : passés en props aux vues mémoïsées
  // (MonthView/WeekView/DayView/AgendaView). Sans ça, chaque changement d'état
  // de EventCalendar (ouverture du panneau, sélection…) recréait ces fonctions
  // et forçait un re-render complet de la grille (recalcul des positions +
  // remontage des ~672 cellules de drop) → latence visible.
  const handleEventSelect = useCallback((event) => {
    if (event.linked) {
      setSelectedLinkedItem(event.linked);
      return;
    }
    if (isAppointmentEvent(event)) {
      setSelectedAppointment(event);
      return;
    }
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  }, []);

  const handleEventCreate = useCallback(
    (startTime) => {
      if (!canCreateEvents) return;
      // Snap to 15-minute intervals
      const minutes = startTime.getMinutes();
      const remainder = minutes % 15;
      if (remainder !== 0) {
        if (remainder < 7.5) {
          // Round down to nearest 15 min
          startTime.setMinutes(minutes - remainder);
        } else {
          // Round up to nearest 15 min
          startTime.setMinutes(minutes + (15 - remainder));
        }
        startTime.setSeconds(0);
        startTime.setMilliseconds(0);
      }

      const newEvent = {
        id: "",
        title: "",
        start: startTime,
        end: addHoursToDate(startTime, 1),
        allDay: false,
      };
      setSelectedEvent(newEvent);
      setIsEventDialogOpen(true);
    },
    [canCreateEvents],
  );

  // --- Volet du jour (vue mois, écran assez large) ---
  const viewsRef = useRef(null);
  const [viewsWidth, setViewsWidth] = useState(0);
  useEffect(() => {
    const node = viewsRef.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) =>
      setViewsWidth(entry.contentRect.width),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const showDayPanel = view === "mois" && viewsWidth >= DAY_PANEL_MIN_WIDTH;

  // Jour du volet : celui choisi s'il est dans la grille affichée, sinon
  // aujourd'hui (mois en cours) ou le 1er du mois
  const panelDay = useMemo(() => {
    const grid = visibleRange("mois", currentDate);
    const key = dateToDay(selectedDay);
    if (key >= grid.from && key <= grid.to) return selectedDay;
    const today = new Date();
    return isSameMonth(currentDate, today) ? today : startOfMonth(currentDate);
  }, [selectedDay, currentDate]);
  const panelDayKey = dateToDay(panelDay);

  // Mêmes éléments que la case du jour (sources, « Tâches de », réglés
  // compris), présentés comme l'agenda de l'accueil
  const dayPanelEntries = useMemo(() => {
    if (!showDayPanel) return [];
    return buildUpcomingDays({
      days: [panelDayKey],
      events,
      linkedItems: visibleLinkedItems,
      hiddenSources: activeHiddenSources,
      linkedUnavailable,
      includeDone: true,
    })[0].entries;
  }, [
    showDayPanel,
    panelDayKey,
    events,
    visibleLinkedItems,
    activeHiddenSources,
    linkedUnavailable,
  ]);

  const openDayEntry = useCallback(
    (entry) => {
      if (entry.type === "linked") setSelectedLinkedItem(entry.item);
      else handleEventSelect(entry.event);
    },
    [handleEventSelect],
  );

  const createOnPanelDay = useCallback(() => {
    const start = new Date(panelDay);
    start.setHours(DefaultStartHour, 0, 0, 0);
    handleEventCreate(start);
  }, [panelDay, handleEventCreate]);

  const handleEventSave = useCallback(
    (event) => {
      if (event.id) {
        onEventUpdate?.(event);
        // Show toast notification when an event is updated
        toast.success(
          `Événement "${event.title}" modifié — ${format(new Date(event.start), "d MMM yyyy", { locale: fr })}`,
        );
      } else {
        onEventAdd?.(event);
        // Show toast notification when an event is added
        toast.success(
          `Événement "${event.title}" ajouté — ${format(new Date(event.start), "d MMM yyyy", { locale: fr })}`,
        );
      }
      setIsEventDialogOpen(false);
      setSelectedEvent(null);
    },
    [onEventAdd, onEventUpdate],
  );

  const handleEventDelete = useCallback(
    (eventId) => {
      const deletedEvent = events.find((e) => e.id === eventId);
      onEventDelete?.(eventId);
      setIsEventDialogOpen(false);
      setSelectedEvent(null);

      // Show toast notification when an event is deleted
      if (deletedEvent) {
        toast.success(
          `Événement "${deletedEvent.title}" supprimé — ${format(new Date(deletedEvent.start), "d MMM yyyy", { locale: fr })}`,
        );
      }
    },
    [events, onEventDelete],
  );

  // --- Échéances des autres pages : actions ---
  const apolloClient = useApolloClient();
  const { markAsPaid: markInvoicePaid } = useMarkInvoiceAsPaid();
  const { markAsPaid: markPurchasePaid } = useMarkPurchaseInvoiceAsPaid();
  const [sendReminderNow] = useMutation(SEND_INVOICE_REMINDER_NOW);
  const [updateTaskMutation] = useMutation(UPDATE_TASK);

  // Mise à jour immédiate d'une échéance dans le cache (la grille, les
  // totaux et la fiche suivent), puis relecture des échéances
  const patchLinkedItem = useCallback(
    (item, fields) => {
      const cacheId = apolloClient.cache.identify({
        __typename: "CalendarLinkedItem",
        id: item.id,
      });
      if (cacheId) {
        apolloClient.cache.modify({
          id: cacheId,
          fields: Object.fromEntries(
            Object.entries(fields).map(([key, value]) => [key, () => value]),
          ),
        });
      }
      setSelectedLinkedItem((current) =>
        current?.id === item.id ? { ...current, ...fields } : current,
      );
    },
    [apolloClient],
  );
  const refreshLinked = useCallback(
    () =>
      apolloClient.refetchQueries({
        include: ["GetCalendarLinkedItems", "GetCalendarOverdueItems"],
      }),
    [apolloClient],
  );

  const handleMarkPaid = useCallback(
    async (item) => {
      if (item.kind === "INVOICE" || item.kind === "REMINDER") {
        try {
          await markInvoicePaid(item.entityId, formatLocalDate());
          toast.success("Facture marquée comme payée");
        } catch {
          toast.error("Erreur lors du marquage comme payée");
          return;
        }
        if (item.kind === "INVOICE") {
          patchLinkedItem(item, { state: "DONE", documentStatus: "COMPLETED" });
        } else {
          // Facture payée : ses relances à venir n'auront pas lieu
          setSelectedLinkedItem(null);
        }
      } else {
        // Le hook des achats affiche lui-même le message
        const marked = await markPurchasePaid(
          item.entityId,
          new Date().toISOString(),
        ).catch(() => null);
        if (!marked) return;
        patchLinkedItem(item, { state: "DONE", documentStatus: "PAID" });
      }
      refreshLinked();
    },
    [markInvoicePaid, markPurchasePaid, patchLinkedItem, refreshLinked],
  );

  const handleSendReminder = useCallback(
    async (item) => {
      try {
        const { data } = await sendReminderNow({
          variables: { invoiceId: item.entityId, workspaceId },
        });
        const result = data?.sendInvoiceReminderNow;
        if (result?.success) {
          toast.success(result.message);
          refreshLinked();
        } else {
          toast.error(result?.message || "L'envoi du rappel a échoué.");
        }
      } catch (error) {
        toast.error(error.message || "L'envoi du rappel a échoué.");
      }
    },
    [sendReminderNow, workspaceId, refreshLinked],
  );

  // « Me rappeler » : nouvel événement pré-rempli, la veille de l'échéance
  // à 9 h si elle est à venir, sinon demain à 9 h
  const handleRemindMe = useCallback((item) => {
    const draft = linkedReminderDraft(item);
    const tomorrow = addDays(new Date(), 1);
    const dayBefore = addDays(dayToDate(item.day), -1);
    const start = new Date(dayBefore > tomorrow ? dayBefore : tomorrow);
    start.setHours(9, 0, 0, 0);
    setSelectedLinkedItem(null);
    setSelectedEvent({
      id: "",
      title: draft.title,
      description: draft.description,
      start,
      end: addHoursToDate(start, 1),
      allDay: false,
    });
    setIsEventDialogOpen(true);
  }, []);

  const sheetActions = useMemo(
    () => ({
      canMarkPaid: (item) =>
        item.kind === "PURCHASE_INVOICE"
          ? canMarkPurchasePaid
          : canMarkInvoicePaid,
      onMarkPaid: handleMarkPaid,
      canSendReminder: () => canSendInvoices,
      onSendReminder: handleSendReminder,
      canRemindMe: canCreateEvents,
      onRemindMe: handleRemindMe,
    }),
    [
      canMarkInvoicePaid,
      canMarkPurchasePaid,
      canSendInvoices,
      canCreateEvents,
      handleMarkPaid,
      handleSendReminder,
      handleRemindMe,
    ],
  );

  // Tâche lâchée sur un autre jour : début et échéance décalés d'autant,
  // heures gardées (comme la vue Calendrier des projets)
  const moveLinkedTask = useCallback(
    async (item, newStart) => {
      const delta = differenceInCalendarDays(newStart, dayToDate(item.day));
      if (!delta) return;
      const previous = {
        day: item.day,
        startDate: item.startDate,
        dueDate: item.dueDate,
        state: item.state,
      };
      const dates = shiftTaskDates(
        { startDate: item.startDate, dueDate: item.dueDate },
        delta,
      );
      const day = dateToDay(newStart);
      const today = dateToDay(new Date());
      patchLinkedItem(item, {
        ...dates,
        day,
        state:
          item.state === "DONE" ? "DONE" : day < today ? "OVERDUE" : "UPCOMING",
      });
      try {
        await updateTaskMutation({
          variables: { input: { id: item.entityId, ...dates }, workspaceId },
        });
        toast.success(
          `Tâche « ${item.title} » déplacée au ${format(newStart, "EEEE d MMMM", { locale: fr })}`,
        );
        refreshLinked();
      } catch (error) {
        patchLinkedItem(item, previous);
        toast.error(error.message || "La tâche n'a pas pu être déplacée");
      }
    },
    [patchLinkedItem, updateTaskMutation, workspaceId, refreshLinked],
  );

  const handleEventUpdate = useCallback(
    (updatedEvent) => {
      // Échéances des autres pages : seules les tâches se déplacent
      if (updatedEvent.linked) {
        if (updatedEvent.linkedDraggable) {
          moveLinkedTask(updatedEvent.linked, new Date(updatedEvent.start));
        }
        return;
      }
      // Block drag-and-drop for read-only events
      if (updatedEvent.isReadOnly) {
        toast.info(
          isAppointmentEvent(updatedEvent)
            ? "Gérez ce rendez-vous depuis Communication > Prise de rendez-vous."
            : "Les événements externes ne peuvent pas être déplacés",
        );
        return;
      }
      if (!canEditEvents) {
        toast.info("Votre rôle ne permet pas de modifier les événements");
        return;
      }

      onEventUpdate?.(updatedEvent);

      // Show toast notification when an event is updated via drag and drop
      toast.success(
        `Événement "${updatedEvent.title}" déplacé — ${format(new Date(updatedEvent.start), "d MMM yyyy", { locale: fr })}`,
      );
    },
    [onEventUpdate, canEditEvents, moveLinkedTask],
  );

  const viewTitle = useMemo(() => {
    if (view === "mois") {
      return format(currentDate, "MMMM yyyy", { locale: fr });
    } else if (view === "semaine") {
      const start = startOfWeek(currentDate, CALENDAR_WEEK_OPTIONS);
      const end = endOfWeek(currentDate, CALENDAR_WEEK_OPTIONS);
      if (isSameMonth(start, end)) {
        return format(start, "MMMM yyyy", { locale: fr });
      } else {
        return `${format(start, "MMM", { locale: fr })} - ${format(end, "MMM yyyy", { locale: fr })}`;
      }
    } else if (view === "jour") {
      return (
        <>
          <span className="min-[480px]:hidden" aria-hidden="true">
            {format(currentDate, "d MMM yyyy", { locale: fr })}
          </span>
          <span className="max-[479px]:hidden min-md:hidden" aria-hidden="true">
            {format(currentDate, "d MMMM yyyy", { locale: fr })}
          </span>
          <span className="max-md:hidden">
            {format(currentDate, "EEEE d MMMM yyyy", { locale: fr })}
          </span>
        </>
      );
    } else if (view === "agenda") {
      // Show the month range for agenda view
      const start = currentDate;
      const end = addDays(currentDate, AgendaDaysToShow - 1);

      if (isSameMonth(start, end)) {
        return format(start, "MMMM yyyy", { locale: fr });
      } else {
        return `${format(start, "MMM", { locale: fr })} - ${format(end, "MMM yyyy", { locale: fr })}`;
      }
    } else {
      return format(currentDate, "MMMM yyyy", { locale: fr });
    }
  }, [currentDate, view]);

  return (
    <div
      className="flex h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] min-h-0 flex-col overflow-hidden rounded-b-lg"
      style={{
        "--event-height": `${EventHeight}px`,
        "--event-gap": `${EventGap}px`,
        "--week-cells-height": `${WeekCellsHeight}px`,
      }}
    >
      {/* Glisser-déposer désactivé sans l'action « edit » */}
      <CalendarDndProvider
        onEventUpdate={handleEventUpdate}
        disabled={!canEditEvents}
      >
        {/* Barre d'outils : navigation à gauche ; filtres, vue, options et
            création à droite (une ligne, qui passe à la ligne sur petit
            écran plutôt que déborder) */}
        <div
          className={cn(
            "border-border/70 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-2 py-2 sm:px-4 sm:py-2.5 xl:flex-nowrap",
            className,
          )}
        >
          <div className="flex min-w-0 items-center gap-1 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-8 font-normal"
              onClick={handleToday}
            >
              Aujourd&apos;hui
            </Button>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={handlePrevious}
                aria-label="Précédent"
              >
                <ChevronLeftIcon size={16} aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={handleNext}
                aria-label="Suivant"
              >
                <ChevronRightIcon size={16} aria-hidden="true" />
              </Button>
            </div>
            <h2 className="truncate text-base font-semibold sm:text-lg">
              {capitalize(viewTitle)}
            </h2>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <CalendarOverdueButton
              items={overdueItems}
              truncated={overdueTruncated}
              onSelect={setSelectedLinkedItem}
            />
            <CalendarFiltersButton
              kinds={linkedKinds}
              hiddenSources={hiddenSources}
              onToggle={toggleSource}
              onSelectView={selectView}
              summary={linkedSummary}
              eventsCount={periodEventCounts.events}
              appointmentsCount={periodEventCounts.appointments}
              showAppointments={isFeatureEnabled("appointments")}
              period={period}
              loading={linkedLoading}
              fiscalSetup={linkedFiscalSetup}
              members={members}
              currentUserId={currentUserId}
              taskAssignee={activeTaskAssignee}
              onTaskAssigneeChange={changeTaskAssignee}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 font-normal"
                >
                  <span>{view.charAt(0).toUpperCase() + view.slice(1)}</span>
                  <ChevronDownIcon
                    className="-me-1 opacity-60"
                    size={16}
                    aria-hidden="true"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-32">
                <DropdownMenuItem onClick={() => setView("mois")}>
                  Mois <DropdownMenuShortcut>M</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("semaine")}>
                  Semaine <DropdownMenuShortcut>W</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("jour")}>
                  Jour <DropdownMenuShortcut>D</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("agenda")}>
                  Agenda <DropdownMenuShortcut>A</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Options : étiquettes, calendriers connectés, synchronisation,
                abonnement depuis un autre agenda */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  aria-label="Plus d'options"
                >
                  <MoreHorizontal className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64"
                onCloseAutoFocus={(e) => {
                  if (openingFromMenuRef.current) {
                    e.preventDefault();
                    openingFromMenuRef.current = false;
                  }
                }}
              >
                <DropdownMenuItem
                  onSelect={() => {
                    openingFromMenuRef.current = true;
                    setLabelsOpen(true);
                  }}
                >
                  <Palette className="size-4" aria-hidden="true" />
                  Étiquettes de couleur
                </DropdownMenuItem>
                {(canEditEvents || calendarConnections.length > 0) && (
                  <DropdownMenuItem
                    onSelect={() => {
                      openingFromMenuRef.current = true;
                      setConnectionsOpen(true);
                    }}
                  >
                    <Link2 className="size-4" aria-hidden="true" />
                    Calendriers connectés
                    {calendarConnections.length > 0 && (
                      <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                        {calendarConnections.length}
                      </span>
                    )}
                  </DropdownMenuItem>
                )}
                {/* Synchronisation : action « edit » */}
                {canEditEvents && (
                  <DropdownMenuItem disabled={syncing} onSelect={syncAll}>
                    <RefreshCw
                      className={cn("size-4", syncing && "animate-spin")}
                      aria-hidden="true"
                    />
                    Synchroniser maintenant
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {/* Lien d'abonnement (Google, Apple, Outlook) et récap du lundi */}
                <DropdownMenuItem
                  onSelect={() => {
                    openingFromMenuRef.current = true;
                    setFeedOpen(true);
                  }}
                >
                  <CalendarArrowUp className="size-4" aria-hidden="true" />
                  Recevoir le calendrier ailleurs
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {canCreateEvents && (
              <Button
                size="sm"
                className="h-8 bg-[#5a50ff] font-normal hover:bg-[#5a50ff]/90"
                onClick={() => {
                  setSelectedEvent(null); // Ensure we're creating a new event
                  setIsEventDialogOpen(true);
                }}
              >
                <PlusIcon className="h-4 w-4 md:mr-1" aria-hidden="true" />
                <span className="max-md:sr-only">Nouvel événement</span>
              </Button>
            )}
          </div>
        </div>

        {/* Fenêtres du menu « … » (sans bouton à elles) */}
        <ColorLegend
          canEdit={canEditEvents}
          showTrigger={false}
          open={labelsOpen}
          onOpenChange={setLabelsOpen}
        />
        <CalendarConnectionsPanel
          canManage={canEditEvents}
          showTrigger={false}
          open={connectionsOpen}
          onOpenChange={setConnectionsOpen}
        />
        <CalendarFeedDialog
          showTrigger={false}
          open={feedOpen}
          onOpenChange={setFeedOpen}
        />

        {/* Les vues prennent la hauteur restante : la grille du mois se
            partage la place, semaine, jour et agenda défilent à l'intérieur.
            Vue mois sur grand écran : volet du jour choisi à droite */}
        <div ref={viewsRef} className="flex min-h-0 flex-1">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {view === "mois" && (
              <MonthView
                currentDate={currentDate}
                events={displayedEvents}
                onEventSelect={handleEventSelect}
                onEventCreate={handleEventCreate}
                selectedDay={showDayPanel ? panelDay : null}
                onDaySelect={showDayPanel ? setSelectedDay : undefined}
              />
            )}
            {view === "semaine" && (
              <WeekView
                currentDate={currentDate}
                events={displayedEvents}
                onEventSelect={handleEventSelect}
                onEventCreate={handleEventCreate}
              />
            )}
            {view === "jour" && (
              <DayView
                currentDate={currentDate}
                events={displayedEvents}
                onEventSelect={handleEventSelect}
                onEventCreate={handleEventCreate}
              />
            )}
            {view === "agenda" && (
              <AgendaView
                currentDate={currentDate}
                events={displayedEvents}
                onEventSelect={handleEventSelect}
              />
            )}
          </div>
          {showDayPanel && (
            <CalendarDayPanel
              className={cn(
                "border-border/70 shrink-0 border-l",
                viewsWidth >= DAY_PANEL_WIDE ? "w-[300px]" : "w-[248px]",
              )}
              date={panelDay}
              entries={dayPanelEntries}
              loading={linkedLoading && dayPanelEntries.length === 0}
              onOpen={openDayEntry}
              onCreate={canCreateEvents ? createOnPanelDay : undefined}
            />
          )}
        </div>

        <EventDialog
          event={selectedEvent}
          isOpen={isEventDialogOpen}
          onClose={() => {
            setIsEventDialogOpen(false);
            setSelectedEvent(null);
          }}
          onSave={handleEventSave}
          onDelete={handleEventDelete}
          canEdit={selectedEvent?.id ? canEditEvents : canCreateEvents}
          canDelete={canDeleteEvents}
          canEditLabels={canEditEvents}
        />

        <LinkedItemSheet
          item={selectedLinkedItem}
          onClose={() => setSelectedLinkedItem(null)}
          actions={sheetActions}
        />

        <AppointmentEventSheet
          event={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      </CalendarDndProvider>
    </div>
  );
}
