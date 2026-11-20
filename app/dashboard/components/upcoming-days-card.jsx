"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRight, CircleAlert } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";
import { useEvents } from "@/src/hooks/useEvents";
import { useCalendarLinkedItems } from "@/src/hooks/useCalendarLinkedItems";
import {
  formatLinkedAmount,
  readHiddenSources,
} from "@/src/utils/calendar-linked-items";
import { dayToDate } from "@/src/utils/recurrenceDays";
import { APPOINTMENT_COLOR } from "@/src/utils/booking";
import {
  buildUpcomingDays,
  upcomingDays,
  upcomingSummary,
} from "@/src/utils/upcoming-days";
import { normalizeColor } from "@/app/dashboard/calendar/components/utils";
import { LINKED_SOURCE_META } from "@/app/dashboard/calendar/components/linked-sources";

// Fiche d'une échéance chargée au premier clic seulement
const LinkedItemSheet = dynamic(
  () =>
    import("@/app/dashboard/calendar/components/linked-item-sheet").then(
      (m) => m.LinkedItemSheet,
    ),
  { ssr: false },
);

// Au-delà, « + N autres » ouvre le jour dans le calendrier
const MAX_ENTRIES_PER_DAY = 4;

const calendarDayUrl = (day) => `/dashboard/calendar?jour=${day}`;

function dayHeading(day, index) {
  const date = dayToDate(day);
  const weekday =
    index === 0
      ? "Aujourd'hui"
      : index === 1
        ? "Demain"
        : format(date, "EEEE", { locale: fr });
  return {
    weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    number: format(date, "d"),
    month: format(date, "MMM", { locale: fr }),
    isWeekend: date.getDay() === 0 || date.getDay() === 6,
  };
}

function linkedDetail(item, meta) {
  if (item.kind === "FISCAL") return item.reference || meta.noun;
  const amount = formatLinkedAmount(item.amount, item.currency || "EUR", {
    compact: true,
  });
  return [item.counterparty || meta.noun, amount].filter(Boolean).join(" · ");
}

function EntryButton({ entry, onOpen }) {
  const isLinked = entry.type === "linked";
  const meta = isLinked ? LINKED_SOURCE_META[entry.item.kind] : null;
  const Icon = meta?.icon;
  const isOverdue = isLinked && entry.item.state === "OVERDUE";
  const barStyle = isLinked
    ? undefined
    : {
        backgroundColor: entry.isAppointment
          ? APPOINTMENT_COLOR
          : normalizeColor(entry.event.color),
      };
  const detail = isLinked ? linkedDetail(entry.item, meta) : entry.detail;
  const label = [entry.title, isLinked ? meta?.noun : null, detail]
    .filter(Boolean)
    .join(", ");

  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      title={label}
      aria-label={label}
      className="hover:bg-accent focus-visible:ring-ring group flex w-full min-w-0 cursor-pointer items-stretch gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span
        aria-hidden="true"
        className={cn("w-[3px] shrink-0 rounded-full", meta?.accent)}
        style={barStyle}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          {Icon && (
            <Icon
              className={cn("size-3 shrink-0", meta.iconClass)}
              aria-hidden="true"
            />
          )}
          <span className="truncate text-xs font-medium">{entry.title}</span>
        </span>
        <span className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px] leading-tight">
          {isOverdue && (
            <CircleAlert
              className="size-3 shrink-0 text-red-600 dark:text-red-400"
              aria-hidden="true"
            />
          )}
          <span className="truncate tabular-nums">{detail}</span>
        </span>
      </span>
    </button>
  );
}

function DayColumn({ day, index, entries, loading, onOpen }) {
  const heading = dayHeading(day, index);
  const isToday = index === 0;
  const visible = entries.slice(0, MAX_ENTRIES_PER_DAY);
  const hiddenCount = entries.length - visible.length;

  return (
    <section
      aria-label={`${heading.weekday} ${heading.number} ${heading.month}`}
      className={cn(
        "flex min-w-0 gap-4 px-4 py-3 @3xl/days:flex-col @3xl/days:gap-2 @3xl/days:px-3",
        heading.isWeekend && "bg-muted/30",
      )}
    >
      <header className="flex w-20 shrink-0 flex-col @3xl/days:w-auto">
        <span
          className={cn(
            "text-[11px]",
            isToday ? "font-medium text-[#5a50ff]" : "text-muted-foreground",
          )}
        >
          {heading.weekday}
        </span>
        <span className="flex items-baseline gap-1">
          <span
            className={cn(
              "text-xl leading-tight font-medium tabular-nums",
              isToday && "text-[#5a50ff]",
            )}
          >
            {heading.number}
          </span>
          <span className="text-muted-foreground text-xs">{heading.month}</span>
        </span>
      </header>

      {/* En ligne (cadre étroit) : les éléments du jour sur deux colonnes
          dès qu'il y a la place */}
      <div className="grid min-w-0 flex-1 grid-cols-1 content-start gap-x-3 gap-y-0.5 @lg/days:grid-cols-2 @3xl/days:grid-cols-1">
        {loading ? (
          <>
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-4/5 rounded-md" />
          </>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground/80 py-1.5 text-xs @lg/days:col-span-2 @3xl/days:col-span-1 @3xl/days:px-1.5">
            Rien de prévu
          </p>
        ) : (
          <>
            {visible.map((entry) => (
              <EntryButton key={entry.key} entry={entry} onOpen={onOpen} />
            ))}
            {hiddenCount > 0 && (
              <Link
                href={calendarDayUrl(day)}
                className="text-muted-foreground hover:text-foreground px-1.5 py-1 text-[11px] transition-colors @lg/days:col-span-2 @3xl/days:col-span-1"
              >
                + {hiddenCount} autre{hiddenCount > 1 ? "s" : ""}
              </Link>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/** Affichage seul (données passées en props), testable sans API. */
export function UpcomingDaysView({ columns, loading, onOpen, className }) {
  const allEmpty =
    !loading && columns.every(({ entries }) => entries.length === 0);
  return (
    <Card className={cn("@container/days gap-0 py-0", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 py-3">
        <p className="text-muted-foreground text-xs" aria-live="polite">
          {loading ? "Chargement…" : upcomingSummary(columns)}
        </p>
        <Link
          href="/dashboard/calendar"
          className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1 text-xs transition-colors"
        >
          Ouvrir le calendrier
          <ArrowRight className="size-3" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {/* Cadre étroit et rien de prévu : une seule ligne plutôt que cinq
            « Rien de prévu » empilés */}
        {allEmpty && (
          <p className="text-muted-foreground border-t px-4 py-5 text-center text-sm @3xl/days:hidden">
            Rien de prévu sur les 5 prochains jours.
          </p>
        )}
        <div
          className={cn(
            "divide-border/70 grid-cols-1 divide-y border-t @3xl/days:grid-cols-5 @3xl/days:divide-x @3xl/days:divide-y-0",
            allEmpty ? "hidden @3xl/days:grid" : "grid",
          )}
        >
          {columns.map(({ day, entries }, index) => (
            <DayColumn
              key={day}
              day={day}
              index={index}
              entries={entries}
              loading={loading}
              onOpen={onOpen}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Accueil : ce que réservent les 5 prochains jours (événements, rendez-vous,
 * échéances de factures, devis, tâches, déclarations…). Un clic sur une
 * échéance ouvre sa fiche, sur un événement le jour dans le calendrier.
 */
export function UpcomingDaysCard({ className }) {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState(null);
  // Fiche montée au premier clic, gardée ensuite pour son animation
  const [sheetUsed, setSheetUsed] = useState(false);
  // Choix du menu Filtres du calendrier, lu après le premier rendu (le rendu
  // serveur ne connaît pas le stockage du navigateur)
  const [hiddenSources, setHiddenSources] = useState(null);
  useEffect(() => setHiddenSources(readHiddenSources()), []);

  // Jours calculés au montage : le cadre suit la date du jour à chaque visite
  const days = useMemo(() => upcomingDays(), []);
  const { events, loading: eventsLoading } = useEvents();
  const {
    items: linkedItems,
    loading: linkedLoading,
    unavailable: linkedUnavailable,
  } = useCalendarLinkedItems({ from: days[0], to: days[days.length - 1] });

  const loading =
    !hiddenSources || (eventsLoading && !events?.length) || linkedLoading;

  const columns = useMemo(
    () =>
      buildUpcomingDays({
        days,
        events: events || [],
        linkedItems,
        hiddenSources: hiddenSources || new Set(),
        linkedUnavailable,
      }),
    [days, events, linkedItems, hiddenSources, linkedUnavailable],
  );

  const openEntry = (entry) => {
    if (entry.type === "linked") {
      setSheetUsed(true);
      setSelectedItem(entry.item);
      return;
    }
    router.push(calendarDayUrl(entry.day));
  };

  return (
    <>
      <UpcomingDaysView
        columns={columns}
        loading={loading}
        onOpen={openEntry}
        className={className}
      />
      {sheetUsed && (
        <LinkedItemSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}
