"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApolloClient, useMutation } from "@apollo/client";
import {
  addDays,
  differenceInCalendarDays,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  isSameMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
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
import { CalendarSyncButton } from "./calendar-sync-button";
import { CalendarSourcesBar } from "./calendar-sources-bar";
import {
  CalendarTreasuryStrip,
  TreasuryDayBadge,
} from "./calendar-treasury-strip";
import { ColorLegend } from "./color-legend";
import { LinkedItemSheet } from "./linked-item-sheet";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import {
  useCalendarLinkedItems,
  useCalendarTreasury,
} from "@/src/hooks/useCalendarLinkedItems";
import { dateToDay, dayToDate } from "@/src/utils/recurrenceDays";
import { shiftTaskDates } from "@/src/utils/kanban-calendar";
import { formatLocalDate } from "@/src/utils/dateFormatter";
import { useMarkInvoiceAsPaid } from "@/src/graphql/invoiceQueries";
import { useMarkAsPaid as useMarkPurchaseInvoiceAsPaid } from "@/src/hooks/usePurchaseInvoices";
import { SEND_INVOICE_REMINDER_NOW } from "@/src/graphql/invoiceReminderQueries";
import { UPDATE_TASK } from "@/src/graphql/kanbanQueries";
import { useSession } from "@/src/lib/auth-client";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import {
  EVENTS_SOURCE,
  isPlainInvoiceDueEvent,
  linkedItemToEvent,
  linkedReminderDraft,
  periodNames,
  summarizeLinkedItems,
  summaryRange,
  treasuryByDay,
  visibleRange,
} from "@/src/utils/calendar-linked-items";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

// Sources masquées par l'utilisateur, gardées dans ce navigateur
const HIDDEN_SOURCES_KEY = "newbi:calendar:hidden-sources";
// « Mes tâches seulement », gardé dans ce navigateur
const MY_TASKS_KEY = "newbi:calendar:my-tasks";
const NO_HIDDEN_SOURCES = new Set();

function readHiddenSources() {
  try {
    const stored = JSON.parse(localStorage.getItem(HIDDEN_SOURCES_KEY));
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set();
  }
}

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
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  // Échéance d'une autre page ouverte dans sa fiche
  const [selectedLinkedItem, setSelectedLinkedItem] = useState(null);
  const [hiddenSources, setHiddenSources] = useState(() => new Set());
  const [myTasksOnly, setMyTasksOnly] = useState(false);

  // Droits du rôle sur le calendrier (tout autorisé tant que la grille
  // n'est pas chargée, l'API refuse de toute façon)
  const { canDo, isReady: permissionsReady } = useMyPermissions();
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

  // Lu après le premier rendu : le rendu serveur ne connaît pas le stockage
  useEffect(() => {
    setHiddenSources(readHiddenSources());
    try {
      setMyTasksOnly(localStorage.getItem(MY_TASKS_KEY) === "1");
    } catch {
      // Stockage indisponible : toutes les tâches
    }
  }, []);

  const toggleMyTasks = useCallback(() => {
    setMyTasksOnly((previous) => {
      try {
        localStorage.setItem(MY_TASKS_KEY, previous ? "0" : "1");
      } catch {
        // Stockage indisponible (navigation privée) : choix non retenu
      }
      return !previous;
    });
  }, []);

  const toggleSource = useCallback((key) => {
    setHiddenSources((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(HIDDEN_SOURCES_KEY, JSON.stringify([...next]));
      } catch {
        // Stockage indisponible (navigation privée) : choix non retenu
      }
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
  } = useCalendarLinkedItems(range);
  // Solde prévu jour par jour (null sans accès à Prévision ou Analytiques)
  const { treasury } = useCalendarTreasury(range);
  const treasuryDays = useMemo(() => treasuryByDay(treasury), [treasury]);
  const renderTreasuryBadge = useCallback(
    (day) => {
      const key = dateToDay(day);
      const treasuryDay = treasuryDays.get(key);
      return treasuryDay ? (
        <TreasuryDayBadge day={key} balance={treasuryDay.balance} />
      ) : null;
    },
    [treasuryDays],
  );

  // « Mes tâches » : seulement les tâches dont on est membre assigné
  const visibleLinkedItems = useMemo(
    () =>
      myTasksOnly && currentUserId
        ? linkedItems.filter(
            (item) =>
              item.kind !== "TASK" ||
              (item.assignedMembersInfo || []).some(
                (member) => member.userId === currentUserId,
              ),
          )
        : linkedItems,
    [linkedItems, myTasksOnly, currentUserId],
  );

  // Sans barre des sources (aucune autre page visible), rien n'est masqué :
  // un choix d'avant ne doit pas cacher les événements sans moyen de revenir
  const activeHiddenSources =
    linkedLoading || linkedKinds.length > 0 ? hiddenSources : NO_HIDDEN_SOURCES;

  const displayedEvents = useMemo(() => {
    const ownEvents = activeHiddenSources.has(EVENTS_SOURCE)
      ? []
      : linkedUnavailable
        ? events
        : // Copies des échéances de factures : remplacées par l'échéance
          // relue dans la facture (statut à jour)
          events.filter((event) => !isPlainInvoiceDueEvent(event));
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
  const periodEventsCount = useMemo(
    () =>
      events.filter(
        (event) =>
          (linkedUnavailable || !isPlainInvoiceDueEvent(event)) &&
          dateToDay(new Date(event.start)) <= period.to &&
          dateToDay(new Date(event.end)) >= period.from,
      ).length,
    [events, linkedUnavailable, period],
  );

  // Add keyboard shortcuts for view switching
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if user is typing in an input, textarea or contentEditable element
      // or if the event dialog is open
      if (
        isEventDialogOpen ||
        selectedLinkedItem ||
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
  }, [isEventDialogOpen, selectedLinkedItem]);

  const handlePrevious = () => {
    if (view === "mois") {
      setCurrentDate(subMonths(currentDate, 1));
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
      setCurrentDate(addMonths(currentDate, 1));
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
  const { workspaceId } = useWorkspace();
  const { markAsPaid: markInvoicePaid } = useMarkInvoiceAsPaid();
  const { markAsPaid: markPurchasePaid } = useMarkPurchaseInvoiceAsPaid();
  const [sendReminderNow] = useMutation(SEND_INVOICE_REMINDER_NOW);
  const [updateTaskMutation] = useMutation(UPDATE_TASK);

  // Mise à jour immédiate d'une échéance dans le cache (la grille, les
  // totaux et la fiche suivent), puis relecture des échéances et du solde
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
        include: ["GetCalendarLinkedItems", "GetCalendarTreasury"],
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
        toast.info("Les événements externes ne peuvent pas être déplacés");
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
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
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
      className="flex flex-col rounded-b-lg has-data-[slot=month-view]:flex-1"
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
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 p-2 sm:flex-nowrap sm:p-4",
            className,
          )}
        >
          <div className="flex items-center gap-1 sm:gap-4">
            <Button
              variant="outline"
              className="font-normal"
              onClick={handleToday}
            >
              Aujourd'hui
            </Button>
            <div className="flex items-center sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                aria-label="Previous"
              >
                <ChevronLeftIcon size={16} aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                aria-label="Next"
              >
                <ChevronRightIcon size={16} aria-hidden="true" />
              </Button>
            </div>
            <h2 className="text-sm font-medium sm:text-lg md:text-xl">
              {viewTitle}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Synchronisation et connexions : action « edit » */}
            {canEditEvents && <CalendarSyncButton />}
            <CalendarConnectionsPanel canManage={canEditEvents} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1.5 font-normal">
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
            {canCreateEvents && (
              <Button
                className="font-normal"
                onClick={() => {
                  setSelectedEvent(null); // Ensure we're creating a new event
                  setIsEventDialogOpen(true);
                }}
              >
                <PlusIcon className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Nouvel événement</span>
              </Button>
            )}
          </div>
        </div>

        <CalendarSourcesBar
          kinds={linkedKinds}
          hiddenSources={hiddenSources}
          onToggle={toggleSource}
          summary={linkedSummary}
          eventsCount={periodEventsCount}
          period={period}
          loading={linkedLoading}
          showBalance={!treasury}
          myTasksOnly={myTasksOnly}
          onToggleMyTasks={currentUserId ? toggleMyTasks : undefined}
        />

        <CalendarTreasuryStrip treasury={treasury} period={period} />

        <ColorLegend canEdit={canEditEvents} />

        <div className="flex flex-1 flex-col">
          {view === "mois" && (
            <MonthView
              currentDate={currentDate}
              events={displayedEvents}
              onEventSelect={handleEventSelect}
              onEventCreate={handleEventCreate}
              renderDayBadge={
                treasury?.hasBankAccounts ? renderTreasuryBadge : undefined
              }
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
      </CalendarDndProvider>
    </div>
  );
}
