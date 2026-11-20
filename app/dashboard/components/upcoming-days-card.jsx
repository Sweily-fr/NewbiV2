"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRight, CircleAlert } from "lucide-react";

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
import { buildUpcomingDays, upcomingDays } from "@/src/utils/upcoming-days";
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

// Étiquettes affichées pour le jour choisi ; au-delà, « +N » ouvre le jour
// dans le calendrier
const MAX_CHIPS = 5;
// Pastilles sous un jour : 3 au plus, puis « +N »
const MAX_DOTS = 3;

const calendarDayUrl = (day) => `/dashboard/calendar?jour=${day}`;

function dayLabels(day, index) {
  const date = dayToDate(day);
  const long = format(date, "EEEE d MMMM", { locale: fr });
  return {
    short: format(date, "EEE", { locale: fr }).replace(".", ""),
    number: format(date, "d"),
    // « Aujourd'hui, vendredi 20 novembre »
    full:
      index === 0
        ? `Aujourd'hui, ${long}`
        : index === 1
          ? `Demain, ${long}`
          : long,
  };
}

// Couleur d'un élément : celle de sa source ou de son événement
function entryColor(entry) {
  if (entry.type === "linked") {
    return { className: LINKED_SOURCE_META[entry.item.kind]?.dot };
  }
  return {
    style: {
      backgroundColor: entry.isAppointment
        ? APPOINTMENT_COLOR
        : normalizeColor(entry.event.color),
    },
  };
}

function entryAmount(entry) {
  if (entry.type !== "linked" || entry.item.kind === "FISCAL") return null;
  return formatLinkedAmount(entry.item.amount, entry.item.currency || "EUR", {
    compact: true,
  });
}

function EntryChip({ entry, onOpen }) {
  const color = entryColor(entry);
  const amount = entryAmount(entry);
  const isOverdue = entry.type === "linked" && entry.item.state === "OVERDUE";
  const meta =
    entry.type === "linked" ? LINKED_SOURCE_META[entry.item.kind] : null;
  const label = [
    entry.time,
    entry.title,
    meta?.noun,
    entry.type === "linked" ? entry.item.counterparty : entry.detail,
    amount,
    isOverdue && "en retard",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      title={label}
      aria-label={label}
      className="border-border/70 hover:bg-accent focus-visible:ring-ring inline-flex max-w-full min-w-0 cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 shrink-0 rounded-full", color.className)}
        style={color.style}
      />
      {entry.time && (
        <span className="text-muted-foreground shrink-0 tabular-nums">
          {entry.time}
        </span>
      )}
      <span className="max-w-[14rem] truncate font-medium">{entry.title}</span>
      {amount && (
        <span className="text-muted-foreground shrink-0 tabular-nums">
          {amount}
        </span>
      )}
      {isOverdue && (
        <CircleAlert
          className="size-3 shrink-0 text-red-600 dark:text-red-400"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

/** Affichage seul (données passées en props), testable sans API. */
export function UpcomingDaysView({ columns, loading, onOpen, className }) {
  // Jour choisi : aujourd'hui par défaut
  const [selectedDay, setSelectedDay] = useState(null);
  const activeIndex = Math.max(
    0,
    columns.findIndex((column) => column.day === selectedDay),
  );
  const active = columns[activeIndex];
  const panelId = "upcoming-days-panel";
  const visible = active ? active.entries.slice(0, MAX_CHIPS) : [];
  const hiddenCount = active ? active.entries.length - visible.length : 0;

  return (
    <section
      aria-label="Les 5 prochains jours"
      className={cn("@container/days", className)}
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div
          role="tablist"
          aria-label="Les 5 prochains jours"
          className="order-1 flex shrink-0 gap-1"
        >
          {columns.map(({ day, entries }, index) => {
            const labels = dayLabels(day, index);
            const selected = index === activeIndex;
            const isToday = index === 0;
            const extra = entries.length - MAX_DOTS;
            return (
              <button
                key={day}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={panelId}
                aria-label={`${labels.full}, ${
                  loading
                    ? "chargement"
                    : entries.length
                      ? `${entries.length} élément${entries.length > 1 ? "s" : ""}`
                      : "rien de prévu"
                }`}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "focus-visible:ring-ring flex w-12 cursor-pointer flex-col items-center gap-1 rounded-xl py-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  selected ? "bg-muted" : "hover:bg-accent/60",
                )}
              >
                <span
                  className={cn(
                    "text-[11px] leading-none capitalize",
                    isToday
                      ? "font-medium text-[#5a50ff]"
                      : "text-muted-foreground",
                  )}
                >
                  {labels.short}
                </span>
                <span
                  className={cn(
                    "text-base leading-none font-medium tabular-nums",
                    isToday && "text-[#5a50ff]",
                  )}
                >
                  {labels.number}
                </span>
                <span
                  className="flex h-1.5 items-center gap-0.5"
                  aria-hidden="true"
                >
                  {!loading &&
                    entries.slice(0, MAX_DOTS).map((entry) => {
                      const color = entryColor(entry);
                      return (
                        <span
                          key={entry.key}
                          className={cn("size-1 rounded-full", color.className)}
                          style={color.style}
                        />
                      );
                    })}
                  {!loading && extra > 0 && (
                    <span className="text-muted-foreground text-[8px] leading-none">
                      +{extra}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <Link
          href="/dashboard/calendar"
          className="text-muted-foreground hover:text-foreground order-2 ml-auto inline-flex shrink-0 items-center gap-1 text-xs transition-colors @2xl/days:order-4"
        >
          Calendrier
          <ArrowRight className="size-3" aria-hidden="true" />
        </Link>

        {/* Éléments du jour choisi : sous les jours en cadre étroit, à côté
            en cadre large */}
        <div
          id={panelId}
          role="tabpanel"
          aria-label={
            active ? dayLabels(active.day, activeIndex).full : undefined
          }
          className="order-3 flex min-w-0 basis-full flex-wrap items-center gap-1.5 @2xl/days:basis-0 @2xl/days:flex-1 @2xl/days:border-l @2xl/days:pl-5"
        >
          {loading ? (
            <>
              <Skeleton className="h-7 w-40 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
            </>
          ) : !active || active.entries.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              {activeIndex === 0
                ? "Rien de prévu aujourd'hui."
                : "Rien de prévu ce jour-là."}
            </p>
          ) : (
            <>
              {visible.map((entry) => (
                <EntryChip key={entry.key} entry={entry} onOpen={onOpen} />
              ))}
              {hiddenCount > 0 && (
                <Link
                  href={calendarDayUrl(active.day)}
                  className="text-muted-foreground hover:text-foreground px-1.5 text-xs transition-colors"
                >
                  +{hiddenCount}
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </section>
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
