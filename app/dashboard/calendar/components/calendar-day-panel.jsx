"use client";

import { useRef } from "react";
import { format, isSameYear, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { PanelRightClose, PanelRightOpen, Plus, X } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { cn } from "@/src/lib/utils";
import { frenchHolidayName } from "@/src/utils/french-holidays";
import { dayToDate } from "@/src/utils/recurrenceDays";
import {
  DayEntryRow,
  EntryColorBar,
} from "@/app/dashboard/components/day-entry-row";

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Écran étroit (pas la place à côté de la grille) : le même volet, ouvert
 * par-dessus le calendrier depuis la barre d'outils. Ouvrir un élément ou
 * « Ajouter ce jour-là » ferme le tiroir avant d'ouvrir sa fenêtre (pas
 * deux fenêtres l'une sur l'autre) ; « Ensuite » change de jour sur place.
 */
export function CalendarDayDrawer({
  open,
  onOpenChange,
  onOpen,
  onCreate,
  ...panelProps
}) {
  // Fermé pour ouvrir une fenêtre : le focus va à la fenêtre, pas au bouton
  // de la barre d'outils
  const handOffRef = useRef(false);
  const handOff =
    (action) =>
    (...args) => {
      handOffRef.current = true;
      onOpenChange(false);
      action(...args);
    };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[300px] max-w-[85vw] gap-0 p-0 [&>button]:hidden"
        onOpenAutoFocus={(e) => {
          // Le tiroir lui-même, pas la croix (sa bulle s'ouvrirait)
          e.preventDefault();
          e.target?.focus?.();
        }}
        onCloseAutoFocus={(e) => {
          if (handOffRef.current) {
            e.preventDefault();
            handOffRef.current = false;
          }
        }}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Volet du jour</SheetTitle>
          <SheetDescription>
            Ce qui est prévu ce jour-là, puis les jours suivants
          </SheetDescription>
        </SheetHeader>
        <CalendarDayPanel
          {...panelProps}
          className="flex-1"
          onOpen={onOpen && handOff(onOpen)}
          onCreate={onCreate && handOff(onCreate)}
          onHide={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

/**
 * Barre d'outils de la vue mois : ferme ou rouvre le volet du jour, au même
 * endroit dans les deux cas (enfoncé tant que le volet est ouvert).
 */
export function DayPanelToggle({ hidden, onToggle }) {
  const label = hidden ? "Ouvrir le volet du jour" : "Fermer le volet du jour";
  const Icon = hidden ? PanelRightOpen : PanelRightClose;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={label}
          onClick={() => onToggle(!hidden)}
          className={cn(
            "size-8",
            !hidden && "bg-[rgba(0,0,0,0.06)] dark:bg-[#2a2a2a]",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

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
  onHide,
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
      <div className={cn("relative px-4 pt-4 pb-2", onHide && "pr-11")}>
        {/* Fermer le volet : la grille prend toute la largeur */}
        {onHide && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onHide}
                aria-label="Fermer le volet du jour"
                className="text-muted-foreground hover:text-foreground absolute top-3 right-2 size-7"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Fermer le volet du jour</TooltipContent>
          </Tooltip>
        )}
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
