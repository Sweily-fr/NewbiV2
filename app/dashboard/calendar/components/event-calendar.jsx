"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck2 } from "lucide-react";
import {
  addDays,
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
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

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

  // Add keyboard shortcuts for view switching
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if user is typing in an input, textarea or contentEditable element
      // or if the event dialog is open
      if (
        isEventDialogOpen ||
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
  }, [isEventDialogOpen]);

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

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const handleEventCreate = (startTime) => {

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
  };

  const handleEventSave = (event) => {
    if (event.id) {
      onEventUpdate?.(event);
      // Show toast notification when an event is updated
      toast.success(`Événement "${event.title}" modifié — ${format(new Date(event.start), "d MMM yyyy", { locale: fr })}`);
    } else {
      onEventAdd?.(event);
      // Show toast notification when an event is added
      toast.success(`Événement "${event.title}" ajouté — ${format(new Date(event.start), "d MMM yyyy", { locale: fr })}`);
    }
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleEventDelete = (eventId) => {
    const deletedEvent = events.find((e) => e.id === eventId);
    onEventDelete?.(eventId);
    setIsEventDialogOpen(false);
    setSelectedEvent(null);

    // Show toast notification when an event is deleted
    if (deletedEvent) {
      toast.success(`Événement "${deletedEvent.title}" supprimé — ${format(new Date(deletedEvent.start), "d MMM yyyy", { locale: fr })}`);
    }
  };

  const handleEventUpdate = (updatedEvent) => {
    // Block drag-and-drop for read-only events
    if (updatedEvent.isReadOnly) {
      toast.info("Les événements externes ne peuvent pas être déplacés");
      return;
    }

    onEventUpdate?.(updatedEvent);

    // Show toast notification when an event is updated via drag and drop
    toast.success(`Événement "${updatedEvent.title}" déplacé — ${format(new Date(updatedEvent.start), "d MMM yyyy", { locale: fr })}`);
  };

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
      <CalendarDndProvider onEventUpdate={handleEventUpdate}>
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 p-2 sm:flex-nowrap sm:p-4",
            className
          )}
        >
          <div className="flex items-center gap-1 sm:gap-4">
            <Button
              variant="outline"
              className="max-[479px]:aspect-square max-[479px]:p-0! font-normal"
              onClick={handleToday}
            >
              <CalendarCheck2
                className="min-[480px]:hidden"
                size={16}
                aria-hidden="true"
              />
              <span className="max-[479px]:sr-only">Aujourd'hui</span>
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
            <CalendarSyncButton />
            <CalendarConnectionsPanel />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-1.5 max-[479px]:h-8 font-normal"
                >
                  <span>
                    <span className="min-[480px]:hidden" aria-hidden="true">
                      {view.charAt(0).toUpperCase()}
                    </span>
                    <span className="max-[479px]:sr-only">
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </span>
                  </span>
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
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          {view === "mois" && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onEventSelect={handleEventSelect}
              onEventCreate={handleEventCreate}
            />
          )}
          {view === "semaine" && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onEventSelect={handleEventSelect}
              onEventCreate={handleEventCreate}
            />
          )}
          {view === "jour" && (
            <DayView
              currentDate={currentDate}
              events={events}
              onEventSelect={handleEventSelect}
              onEventCreate={handleEventCreate}
            />
          )}
          {view === "agenda" && (
            <AgendaView
              currentDate={currentDate}
              events={events}
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
        />
      </CalendarDndProvider>
    </div>
  );
}
