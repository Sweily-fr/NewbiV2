"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { ExternalLink } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import {
  EventDialog,
  EventItem,
  EventGap,
  EventHeight,
  getAllEventsForDay,
  sortEvents,
  addHoursToDate,
  DefaultStartHour,
} from "@/app/dashboard/calendar/components";
import { useEvents, useEventOperations } from "@/src/hooks/useEvents";
import { cn } from "@/src/lib/utils";

export function WeekCalendarCard({ className }) {
  const router = useRouter();
  const { events: dbEvents } = useEvents();
  const { createEvent, updateEvent, deleteEvent } = useEventOperations();

  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const localEvents = useMemo(() => {
    return (dbEvents || []).map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      start: new Date(event.start),
      end: new Date(event.end),
      allDay: event.allDay,
      color: event.color,
      location: event.location,
      type: event.type,
      invoiceId: event.invoiceId,
      invoice: event.invoice,
      source: event.source || "newbi",
      visibility: event.visibility || "workspace",
      isReadOnly: event.isReadOnly || false,
      externalEventId: event.externalEventId,
      externalCalendarLinks: event.externalCalendarLinks || [],
      emailReminder: event.emailReminder || null,
    }));
  }, [dbEvents]);

  const weekDays = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, []);

  const weekdayLabels = useMemo(() => {
    return weekDays.map((d) => format(d, "EEE", { locale: fr }));
  }, [weekDays]);

  const handleDayClick = (day) => {
    const startTime = new Date(day);
    startTime.setHours(DefaultStartHour, 0, 0, 0);
    setSelectedEvent({
      id: "",
      title: "",
      start: startTime,
      end: addHoursToDate(startTime, 1),
      allDay: false,
    });
    setIsEventDialogOpen(true);
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const handleEventSave = async (event) => {
    try {
      if (event.id) {
        await updateEvent({
          id: event.id,
          title: event.title,
          description: event.description,
          start: event.start.toISOString(),
          end: event.end.toISOString(),
          allDay: event.allDay,
          color: event.color,
          location: event.location,
          type: event.type || "MANUAL",
          emailReminder: event.emailReminder
            ? {
                enabled: event.emailReminder.enabled,
                anticipation: event.emailReminder.anticipation || null,
                echeance: event.emailReminder.echeance || null,
              }
            : undefined,
        });
        toast.success(`Évènement "${event.title}" modifié`);
      } else {
        await createEvent({
          title: event.title,
          description: event.description,
          start: event.start.toISOString(),
          end: event.end.toISOString(),
          allDay: event.allDay || false,
          color: event.color || "sky",
          location: event.location,
          type: "MANUAL",
          emailReminder: event.emailReminder?.enabled
            ? {
                enabled: true,
                anticipation: event.emailReminder.anticipation || null,
                echeance: event.emailReminder.echeance || null,
              }
            : undefined,
        });
        toast.success(`Évènement "${event.title}" ajouté`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement de l'évènement");
    } finally {
      setIsEventDialogOpen(false);
      setSelectedEvent(null);
    }
  };

  const handleEventDelete = async (eventId) => {
    try {
      const ev = localEvents.find((e) => e.id === eventId);
      await deleteEvent(eventId);
      if (ev) toast.success(`Évènement "${ev.title}" supprimé`);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsEventDialogOpen(false);
      setSelectedEvent(null);
    }
  };

  const weekRangeLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    if (start.getMonth() === end.getMonth()) {
      return `${format(start, "d", { locale: fr })} – ${format(end, "d MMMM yyyy", { locale: fr })}`;
    }
    return `${format(start, "d MMM", { locale: fr })} – ${format(end, "d MMM yyyy", { locale: fr })}`;
  }, [weekDays]);

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-base font-normal">
            Calendrier de la semaine
          </CardTitle>
          <p className="text-xs text-muted-foreground capitalize">
            {weekRangeLabel}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/dashboard/calendar")}
        >
          Voir le calendrier
          <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent
        className="flex-1 p-0"
        style={{
          "--event-height": `${EventHeight}px`,
          "--event-gap": `${EventGap}px`,
        }}
      >
        <div className="border-border/70 grid grid-cols-7 border-b border-t">
          {weekdayLabels.map((label, idx) => (
            <div
              key={`label-${idx}`}
              className="text-muted-foreground/70 py-2 text-center text-xs"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr">
          {weekDays.map((day) => {
            const dayEvents = getAllEventsForDay(localEvents, day);
            const sorted = sortEvents(dayEvents);
            const maxVisible = 3;
            const visible = sorted.slice(0, maxVisible);
            const hiddenCount = sorted.length - visible.length;

            return (
              <div
                key={day.toISOString()}
                role="button"
                tabIndex={0}
                onClick={() => handleDayClick(day)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleDayClick(day);
                  }
                }}
                className={cn(
                  "group relative flex flex-col items-stretch min-h-[110px] border-r border-border/70 last:border-r-0 p-1.5 text-left hover:bg-accent/30 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
                data-today={isToday(day) || undefined}
              >
                <div
                  className={cn(
                    "mb-1 inline-flex size-6 items-center justify-center rounded-full text-sm self-start",
                    isToday(day) && "bg-primary text-primary-foreground",
                  )}
                >
                  {format(day, "d")}
                </div>
                <div className="flex flex-col gap-[var(--event-gap)] overflow-hidden">
                  {visible.map((event) => {
                    const eventStart = new Date(event.start);
                    const eventEnd = new Date(event.end);
                    const isFirstDay = isSameDay(day, eventStart);
                    const isLastDay = isSameDay(day, eventEnd);
                    return (
                      <EventItem
                        key={event.id}
                        event={event}
                        view="month"
                        isFirstDay={isFirstDay}
                        isLastDay={isLastDay}
                        onClick={(e) => handleEventClick(event, e)}
                      >
                        <span className="truncate">{event.title}</span>
                      </EventItem>
                    );
                  })}
                  {hiddenCount > 0 && (
                    <span
                      className="text-[10px] text-muted-foreground px-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      +{hiddenCount} autre{hiddenCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

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
    </Card>
  );
}
