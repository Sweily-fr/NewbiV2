"use client";

import { format, isSameYear, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";
import { frenchHolidayName } from "@/src/utils/french-holidays";
import { dayToDate } from "@/src/utils/recurrenceDays";
import {
  DayEntryRow,
  EntryColorBar,
} from "@/app/dashboard/components/day-entry-row";

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Volet du jour choisi, à droite de la vue mois : les éléments du jour
 * (événements et échéances des autres pages) présentés comme l'agenda de
 * l'accueil, et « Ajouter ce jour-là » ; puis « Ensuite » : les jours
 * suivants qui ont quelque chose, une ligne chacun (un clic les affiche).
 * Affichage seul : les éléments viennent de buildUpcomingDays.
 */
export function CalendarDayPanel({
  date,
  entries = [],
  nextDays = [],
  loading = false,
  onOpen,
  onCreate,
  onSelectDay,
  className,
}) {
  const today = isToday(date);
  const holiday = frenchHolidayName(date);
  const fullDate = format(
    date,
    isSameYear(date, new Date()) ? "EEEE d MMMM" : "EEEE d MMMM yyyy",
    { locale: fr },
  );

  return (
    <aside
      aria-label={`Journée du ${fullDate}`}
      className={cn("flex min-h-0 flex-col", className)}
    >
      <div className="px-4 pt-4 pb-2">
        <h3
          className={cn(
            "text-sm font-medium",
            today ? "text-[#5a50ff]" : "text-foreground",
          )}
        >
          {today ? "Aujourd'hui" : capitalize(fullDate)}
        </h3>
        {today && <p className="text-muted-foreground text-xs">{fullDate}</p>}
        {holiday && (
          <p className="text-muted-foreground text-xs">
            Jour férié : {holiday}
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="space-y-2 px-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-4/5 rounded-lg" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground px-2 py-1 text-sm">
            Rien de prévu ce jour-là.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {entries.map((entry) => (
              <DayEntryRow
                key={entry.key}
                entry={entry}
                onOpen={onOpen}
                compact
              />
            ))}
          </ul>
        )}

        {onCreate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreate}
            className="text-muted-foreground hover:text-foreground mt-1 h-8 w-full justify-start gap-1.5 px-2 text-xs"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Ajouter ce jour-là
          </Button>
        )}

        {nextDays.length > 0 && (
          <section
            aria-label="Les jours suivants"
            className="border-border/70 mx-2 mt-3 border-t pt-3"
          >
            <h4 className="text-muted-foreground pb-1 text-xs">Ensuite</h4>
            <ul className="-mx-2">
              {nextDays.map(({ day, entries: dayEntries }) => {
                const [first] = dayEntries;
                const more = dayEntries.length - 1;
                return (
                  <li key={day}>
                    <button
                      type="button"
                      onClick={() => onSelectDay?.(day)}
                      className="hover:bg-accent focus-visible:ring-ring grid w-full cursor-pointer grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {capitalize(
                          format(dayToDate(day), "EEE d", { locale: fr }),
                        )}
                      </span>
                      <span className="flex min-w-0 items-center gap-1.5">
                        <EntryColorBar entry={first} className="size-1.5" />
                        {first.time && (
                          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                            {first.time}
                          </span>
                        )}
                        <span className="truncate text-[13px]">
                          {first.title}
                        </span>
                      </span>
                      {more > 0 ? (
                        <span className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-[11px] tabular-nums">
                          +{more}
                        </span>
                      ) : (
                        <span />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </aside>
  );
}
