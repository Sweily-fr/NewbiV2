"use client";

import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
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
  sortEvents,
  useEventVisibility,
} from "./index";
import { DefaultStartHour } from "./constants";
import { cn } from "@/src/lib/utils";
import { frenchHolidayName } from "@/src/utils/french-holidays";
import { CALENDAR_WEEK_OPTIONS } from "@/src/utils/calendar-linked-items";
import { dateToDay } from "@/src/utils/recurrenceDays";
import {
  fitWeek,
  layoutWeekBars,
  spansSeveralDays,
} from "@/src/utils/calendar-month-layout";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";

// Haut du premier élément d'une case, sous son numéro (py-1 + numéro de
// 28 px) : corrigé par la mesure de la case de référence
const DEFAULT_CONTENT_TOP = 32;

/**
 * @param {Date} currentDate
 * @param {Array} events
 * @param {Function} onEventSelect
 * @param {Function} onEventCreate
 * @param {Date|null} selectedDay - jour affiché dans le volet du jour
 * @param {Function} onDaySelect - avec le volet : le jour cliqué devient
 *   celui du volet. Un clic sur une case ouvre toujours la fenêtre d'un
 *   nouvel événement ce jour-là.
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
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7));
    return result;
  }, [days]);

  // Case mesurée (hauteur, haut du contenu) : le 1er du mois
  const monthFirstDay = dateToDay(startOfMonth(currentDate));

  // Par semaine : les barres des événements sur plusieurs jours (couloirs)
  // et, pour chaque jour, ses autres éléments (un seul jour) et tout ce
  // qu'il contient (liste de « + N »). Calculé une fois par mois affiché ou
  // liste d'événements, pas à chaque rendu (survol, glisser-déposer).
  const weekData = useMemo(
    () =>
      weeks.map((week) => ({
        layout: layoutWeekBars(week, events),
        singles: week.map((day) =>
          sortEvents(
            getEventsForDay(events, day).filter(
              (event) => !spansSeveralDays(event),
            ),
          ),
        ),
        allEvents: week.map((day) => getAllEventsForDay(events, day)),
      })),
    [weeks, events],
  );

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
  const { contentRef, contentHeight } = useEventVisibility({
    eventHeight: EventHeight,
    eventGap: EventGap,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Position des barres : haut du contenu de la case de référence dans sa
  // semaine
  const [contentTop, setContentTop] = useState(DEFAULT_CONTENT_TOP);
  useLayoutEffect(() => {
    const top = contentRef.current?.offsetTop;
    if (typeof top === "number" && top > 0) setContentTop(top);
  }, [contentRef, isMounted, contentHeight]);

  // Lignes d'éléments qui tiennent dans une case
  const capacity = contentHeight
    ? Math.floor(contentHeight / (EventHeight + EventGap))
    : Infinity;

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
          déborde affiche « + N » (useEventVisibility) */}
      <div className="grid min-h-0 flex-1 auto-rows-fr">
        {weeks.map((week, weekIndex) => {
          const { layout, singles, allEvents } = weekData[weekIndex];
          const { barLanes, cells } = fitWeek({
            layout,
            singlesByColumn: singles,
            capacity,
          });

          return (
            <div
              key={`week-${weekIndex}`}
              className="relative grid min-h-0 grid-cols-7 [&:last-child>*]:border-b-0"
            >
              {week.map((day, dayIndex) => {
                const cell = cells[dayIndex];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected =
                  Boolean(onDaySelect && selectedDay) &&
                  isSameDay(day, selectedDay);
                const dayLabel = `${format(day, "EEEE d MMMM", { locale: fr })}${
                  isToday(day) ? ", aujourd'hui" : ""
                }`;
                const cellId = `month-cell-${day.toISOString()}`;
                const isReferenceCell = dateToDay(day) === monthFirstDay;
                const dayEvents = allEvents[dayIndex];

                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      "group @container/cell border-border/70 min-h-0 overflow-hidden border-r border-b transition-colors last:border-r-0",
                      // Jour J en violet clair, jours des mois voisins en
                      // gris (numéro et contenu pâlis), jours du mois en
                      // blanc ; le jour choisi (volet) a un contour, pour ne
                      // pas se confondre avec le jour J
                      isToday(day)
                        ? "bg-[#5a50ff]/[0.08]"
                        : !isCurrentMonth && "bg-muted/80",
                      isSelected &&
                        !isToday(day) &&
                        "ring-2 ring-[#5a50ff]/35 ring-inset",
                    )}
                    data-today={isToday(day) || undefined}
                    data-outside-cell={!isCurrentMonth || undefined}
                    data-selected={isSelected || undefined}
                  >
                    {/* Un clic sur le jour : fenêtre d'un nouvel événement ce
                        jour-là (et le jour passe dans le volet) */}
                    <DroppableCell
                      id={cellId}
                      date={day}
                      onClick={() => {
                        onDaySelect?.(day);
                        createOn(day);
                      }}
                    >
                      {/* Jour férié : son nom, discret, à côté du numéro */}
                      <div className="flex min-w-0 items-center gap-1.5">
                        {/* Numéro : même action, au clavier aussi */}
                        <button
                          type="button"
                          aria-label={`Nouvel événement le ${dayLabel}`}
                          className="hover:bg-muted focus-visible:ring-ring group-data-outside-cell:text-muted-foreground group-data-today:bg-[#5a50ff] group-data-today:font-medium group-data-today:text-white group-data-today:hover:bg-[#5a50ff]/90 mt-1 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                        >
                          {format(day, "d")}
                        </button>
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
                        className="min-h-0 flex-1 group-data-outside-cell:opacity-60"
                      >
                        {isMounted && (
                          <>
                            {/* Place des barres (dessinées sur la semaine) */}
                            {cell.laneSlots.map((_, lane) => (
                              <div
                                key={`lane-${lane}`}
                                aria-hidden="true"
                                className="mt-[var(--event-gap)] h-[var(--event-height)]"
                              />
                            ))}
                            {cell.singles.map((event) => (
                              <div key={event.id}>
                                <DraggableEvent
                                  event={event}
                                  view="month"
                                  onClick={(e) => {
                                    handleEventClick(event, e);
                                    onDaySelect?.(day);
                                  }}
                                  isFirstDay
                                  isLastDay
                                />
                              </div>
                            ))}

                            {cell.hiddenCount > 0 && onDaySelect && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDaySelect(day);
                                }}
                                aria-label={`${cell.hiddenCount} de plus le ${dayLabel}`}
                                className="focus-visible:border-ring focus-visible:ring-ring/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 mt-[var(--event-gap)] flex h-[var(--event-height)] w-full items-center overflow-hidden rounded px-1 text-left text-[10px] transition outline-none select-none focus-visible:ring-[3px] sm:px-2 sm:text-xs"
                              >
                                <span className="truncate">
                                  + {cell.hiddenCount}
                                  <span className="sr-only"> de plus</span>
                                </span>
                              </button>
                            )}
                            {cell.hiddenCount > 0 && !onDaySelect && (
                              <Popover modal>
                                <PopoverTrigger asChild>
                                  <button
                                    className="focus-visible:border-ring focus-visible:ring-ring/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 mt-[var(--event-gap)] flex h-[var(--event-height)] w-full items-center overflow-hidden px-1 text-left text-[10px] transition outline-none select-none focus-visible:ring-[3px] sm:px-2 sm:text-xs"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span>
                                      + {cell.hiddenCount}{" "}
                                      <span className="max-sm:sr-only">
                                        de plus
                                      </span>
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
                                      {sortEvents(dayEvents).map((event) => (
                                        <EventItem
                                          key={event.id}
                                          onClick={(e) =>
                                            handleEventClick(event, e)
                                          }
                                          event={event}
                                          view="month"
                                          isFirstDay={isSameDay(
                                            day,
                                            new Date(event.start),
                                          )}
                                          isLastDay={isSameDay(
                                            day,
                                            new Date(event.end),
                                          )}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </>
                        )}
                      </div>
                    </DroppableCell>
                  </div>
                );
              })}

              {/* Barres d'un seul tenant par-dessus les cases de la semaine :
                  bouts arrondis là où l'événement commence et finit, à ras
                  du bord quand il continue sur la semaine voisine */}
              {isMounted &&
                layout.bars
                  .filter((bar) => bar.lane < barLanes)
                  .map((bar) => {
                    const { event } = bar;
                    const startDay = week[bar.from];
                    const open = (e) => {
                      handleEventClick(event, e);
                      onDaySelect?.(startDay);
                    };
                    return (
                      <div
                        key={`bar-${event.id}`}
                        className={cn(
                          "absolute z-10",
                          bar.startsHere && "pl-0.5 sm:pl-1",
                          bar.endsHere && "pr-0.5 sm:pr-1",
                        )}
                        style={{
                          left: `calc(${bar.from} * 100% / 7)`,
                          width: `calc(${bar.to - bar.from + 1} * 100% / 7)`,
                          top: contentTop + bar.lane * (EventHeight + EventGap),
                        }}
                      >
                        {bar.startsHere ? (
                          <DraggableEvent
                            event={event}
                            view="month"
                            onClick={open}
                            isFirstDay
                            isLastDay={bar.endsHere}
                          />
                        ) : (
                          // Suite d'une semaine précédente : titre rappelé
                          <EventItem
                            event={event}
                            view="month"
                            onClick={open}
                            isFirstDay={false}
                            isLastDay={bar.endsHere}
                          >
                            <span className="truncate">{event.title}</span>
                          </EventItem>
                        )}
                      </div>
                    );
                  })}
            </div>
          );
        })}
      </div>
    </div>
  );
});
