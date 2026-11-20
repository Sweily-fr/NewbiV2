"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";

import {
  DraggableEvent,
  DroppableCell,
  EventGap,
  EventHeight,
  EventItem,
  getAllEventsForDay,
  getEventsForDay,
  getSpanningEventsForDay,
  sortEvents,
  useEventVisibility,
} from "./index";
import { DefaultStartHour } from "./constants";
import { frenchHolidayName } from "@/src/utils/french-holidays";
import { CALENDAR_WEEK_OPTIONS } from "@/src/utils/calendar-linked-items";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";

// MonthView props converted to JSDoc
/**
 * @param {Date} currentDate
 * @param {Array} events
 * @param {Function} onEventSelect
 * @param {Function} onEventCreate
 * @param {Date|null} selectedDay - jour affiché dans le volet du jour
 * @param {Function} onDaySelect - avec le volet : un clic sur une case
 *   choisit le jour, un double clic crée un événement ; sans volet, un clic
 *   crée un événement
 */

export const MonthView = React.memo(function MonthView({
  currentDate,
  events,
  onEventSelect,
  onEventCreate,
  selectedDay = null,
  onDaySelect,
}) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, CALENDAR_WEEK_OPTIONS);
    const calendarEnd = endOfWeek(monthEnd, CALENDAR_WEEK_OPTIONS);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const weekdays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(startOfWeek(new Date(), CALENDAR_WEEK_OPTIONS), i);
      return format(date, "EEE", { locale: fr });
    });
  }, []);

  const weeks = useMemo(() => {
    const result = [];
    let week = [];

    for (let i = 0; i < days.length; i++) {
      week.push(days[i]);
      if (week.length === 7 || i === days.length - 1) {
        result.push(week);
        week = [];
      }
    }

    return result;
  }, [days]);

  // Événements de chaque case calculés une fois par changement de mois ou
  // d'événements, et non à chaque rendu (survol, glisser-déposer) : trois
  // filtres de toute la liste par case, soit ~126 parcours par rendu.
  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const day of days) {
      if (!day) continue;
      const dayEvents = getEventsForDay(events, day);
      const spanningEvents = getSpanningEventsForDay(events, day);
      map.set(day.toISOString(), {
        allDayEvents: [...spanningEvents, ...dayEvents],
        allEvents: getAllEventsForDay(events, day),
      });
    }
    return map;
  }, [days, events]);

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    onEventSelect(event);
  };

  // Nouvel événement ce jour-là, à l'heure par défaut
  const createOn = (day) => {
    const startTime = new Date(day);
    startTime.setHours(DefaultStartHour, 0, 0);
    onEventCreate(startTime);
  };

  const [isMounted, setIsMounted] = useState(false);
  const { contentRef, getVisibleEventCount } = useEventVisibility({
    eventHeight: EventHeight,
    eventGap: EventGap,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div data-slot="month-view" className="contents">
      <div className="border-border/70 grid grid-cols-7 border-b">
        {weekdays.map((day) => (
          <div
            key={day}
            className="text-muted-foreground/80 px-1.5 py-2 text-xs sm:px-2.5"
          >
            {day}
          </div>
        ))}
      </div>
      {/* Pleine hauteur : les semaines se partagent la place, une case qui
          déborde affiche « + N de plus » (useEventVisibility) */}
      <div className="grid min-h-0 flex-1 auto-rows-fr">
        {weeks.map((week, weekIndex) => (
          <div
            key={`week-${weekIndex}`}
            className="grid min-h-0 grid-cols-7 [&:last-child>*]:border-b-0"
          >
            {week.map((day, dayIndex) => {
              if (!day) return null; // Skip if day is undefined

              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected =
                Boolean(onDaySelect && selectedDay) &&
                isSameDay(day, selectedDay);
              const dayLabel = `${format(day, "EEEE d MMMM", { locale: fr })}${
                isToday(day) ? ", aujourd'hui" : ""
              }`;
              const cellId = `month-cell-${day.toISOString()}`;
              const { allDayEvents, allEvents } = eventsByDay.get(
                day.toISOString(),
              );

              const isReferenceCell = weekIndex === 0 && dayIndex === 0;
              const visibleCount = isMounted
                ? getVisibleEventCount(allDayEvents.length)
                : undefined;
              const hasMore =
                visibleCount !== undefined &&
                allDayEvents.length > visibleCount;
              const remainingCount = hasMore
                ? allDayEvents.length - visibleCount
                : 0;

              return (
                <div
                  key={day.toString()}
                  className="group @container/cell border-border/70 data-outside-cell:bg-muted/25 data-outside-cell:text-muted-foreground/70 data-selected:bg-muted/60 min-h-0 overflow-hidden border-r border-b transition-colors last:border-r-0"
                  data-today={isToday(day) || undefined}
                  data-outside-cell={!isCurrentMonth || undefined}
                  data-selected={isSelected || undefined}
                >
                  <DroppableCell
                    id={cellId}
                    date={day}
                    onClick={
                      onDaySelect ? () => onDaySelect(day) : () => createOn(day)
                    }
                    onDoubleClick={
                      onDaySelect ? () => createOn(day) : undefined
                    }
                  >
                    {/* Jour férié : son nom, discret, à côté du numéro */}
                    <div className="flex min-w-0 items-center gap-1.5">
                      {onDaySelect ? (
                        // Numéro cliquable : choisir le jour au clavier
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDaySelect(day);
                          }}
                          aria-label={`Voir le ${dayLabel}`}
                          aria-pressed={isSelected}
                          className="hover:bg-muted focus-visible:ring-ring group-data-today:bg-[#5a50ff] group-data-today:text-white group-data-today:hover:bg-[#5a50ff]/90 mt-1 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                        >
                          {format(day, "d")}
                        </button>
                      ) : (
                        <div className="group-data-today:bg-[#5a50ff] group-data-today:text-white mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-sm">
                          {format(day, "d")}
                        </div>
                      )}
                      {frenchHolidayName(day) && (
                        <span
                          className="text-muted-foreground mt-1 truncate text-[10px] sm:text-xs"
                          title={`Jour férié : ${frenchHolidayName(day)}`}
                        >
                          {frenchHolidayName(day)}
                        </span>
                      )}
                    </div>
                    <div
                      ref={isReferenceCell ? contentRef : null}
                      className="min-h-0 flex-1"
                    >
                      {sortEvents(allDayEvents).map((event, index) => {
                        const eventStart = new Date(event.start);
                        const eventEnd = new Date(event.end);
                        const isFirstDay = isSameDay(day, eventStart);
                        const isLastDay = isSameDay(day, eventEnd);

                        const isHidden =
                          isMounted && visibleCount && index >= visibleCount;

                        if (!visibleCount) return null;

                        if (!isFirstDay) {
                          return (
                            <div
                              key={`spanning-${event.id}-${day.toISOString().slice(0, 10)}`}
                              className="aria-hidden:hidden"
                              aria-hidden={isHidden ? "true" : undefined}
                            >
                              <EventItem
                                onClick={(e) => {
                                  handleEventClick(event, e);
                                  onDaySelect?.(day);
                                }}
                                event={event}
                                view="month"
                                isFirstDay={isFirstDay}
                                isLastDay={isLastDay}
                              >
                                <div className="invisible" aria-hidden={true}>
                                  {!event.allDay && (
                                    <span>
                                      {format(
                                        new Date(event.start),
                                        "h:mm",
                                      )}{" "}
                                    </span>
                                  )}
                                  {event.title}
                                </div>
                              </EventItem>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={event.id}
                            className="aria-hidden:hidden"
                            aria-hidden={isHidden ? "true" : undefined}
                          >
                            <DraggableEvent
                              event={event}
                              view="month"
                              onClick={(e) => {
                                handleEventClick(event, e);
                                onDaySelect?.(day);
                              }}
                              isFirstDay={isFirstDay}
                              isLastDay={isLastDay}
                            />
                          </div>
                        );
                      })}

                      {hasMore && onDaySelect && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDaySelect(day);
                          }}
                          aria-label={`${remainingCount} de plus le ${dayLabel}`}
                          className="focus-visible:border-ring focus-visible:ring-ring/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 mt-[var(--event-gap)] flex h-[var(--event-height)] w-full items-center overflow-hidden rounded px-1 text-left text-[10px] transition outline-none select-none focus-visible:ring-[3px] sm:px-2 sm:text-xs"
                        >
                          <span className="truncate">
                            + {remainingCount}
                            <span className="sr-only"> de plus</span>
                          </span>
                        </button>
                      )}
                      {hasMore && !onDaySelect && (
                        <Popover modal>
                          <PopoverTrigger asChild>
                            <button
                              className="focus-visible:border-ring focus-visible:ring-ring/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 mt-[var(--event-gap)] flex h-[var(--event-height)] w-full items-center overflow-hidden px-1 text-left text-[10px] transition outline-none select-none focus-visible:ring-[3px] sm:px-2 sm:text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>
                                + {remainingCount}{" "}
                                <span className="max-sm:sr-only">de plus</span>
                              </span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="center"
                            className="max-w-52 p-3"
                            style={{
                              "--event-height": `${EventHeight}px`,
                            }}
                          >
                            <div className="space-y-2">
                              <div className="text-sm font-medium">
                                {format(day, "EEE d", { locale: fr })}
                              </div>
                              <div className="space-y-1">
                                {sortEvents(allEvents).map((event) => {
                                  const eventStart = new Date(event.start);
                                  const eventEnd = new Date(event.end);
                                  const isFirstDay = isSameDay(day, eventStart);
                                  const isLastDay = isSameDay(day, eventEnd);

                                  return (
                                    <EventItem
                                      key={event.id}
                                      onClick={(e) =>
                                        handleEventClick(event, e)
                                      }
                                      event={event}
                                      view="month"
                                      isFirstDay={isFirstDay}
                                      isLastDay={isLastDay}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </DroppableCell>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});
