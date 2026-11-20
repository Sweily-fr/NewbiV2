"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRight, CircleAlert, ExternalLink, Plus } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";
import { useEvents, useEventOperations } from "@/src/hooks/useEvents";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { useCalendarLinkedItems } from "@/src/hooks/useCalendarLinkedItems";
import {
  formatLinkedAmount,
  linkedItemFilingSite,
  readHiddenSources,
} from "@/src/utils/calendar-linked-items";
import { declarationFilingSite } from "@/src/utils/declaration-events";
import { dayToDate } from "@/src/utils/recurrenceDays";
import { APPOINTMENT_COLOR } from "@/src/utils/booking";
import { buildUpcomingDays, upcomingDays } from "@/src/utils/upcoming-days";
import { normalizeColor } from "@/app/dashboard/calendar/components/utils";
import { LINKED_SOURCE_META } from "@/app/dashboard/calendar/components/linked-sources";

// Fiches chargées au premier clic seulement
const LinkedItemSheet = dynamic(
  () =>
    import("@/app/dashboard/calendar/components/linked-item-sheet").then(
      (m) => m.LinkedItemSheet,
    ),
  { ssr: false },
);
const EventDialog = dynamic(
  () =>
    import("@/app/dashboard/calendar/components/event-dialog").then(
      (m) => m.EventDialog,
    ),
  { ssr: false },
);

// Lignes d'aujourd'hui avant « + N autres »
const MAX_TODAY_ROWS = 6;

const calendarDayUrl = (day) => `/dashboard/calendar?jour=${day}`;
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// « 30 min », « 1 h », « 1 h 30 »
export function formatDuration(start, end) {
  const minutes = Math.round((new Date(end) - new Date(start)) / 60000);
  if (!(minutes > 0) || minutes >= 24 * 60) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${String(rest).padStart(2, "0")}` : `${hours} h`;
}

// Couleur d'un élément : celle de sa source ou de son événement
function entryColor(entry) {
  if (entry.type === "linked") {
    return { className: LINKED_SOURCE_META[entry.item.kind]?.accent };
  }
  return {
    style: {
      backgroundColor: entry.isAppointment
        ? APPOINTMENT_COLOR
        : normalizeColor(entry.event.color),
    },
  };
}

// Site où déposer une déclaration (événement Newbi ou échéance fiscale)
function entryFilingSite(entry) {
  if (entry.type === "linked") return linkedItemFilingSite(entry.item);
  return declarationFilingSite(entry.event.declarationKind);
}

function entrySubtitle(entry) {
  if (entry.type === "linked") {
    const meta = LINKED_SOURCE_META[entry.item.kind];
    if (entry.item.kind === "FISCAL") {
      return [entry.item.reference, entry.item.counterparty]
        .filter(Boolean)
        .join(" · ");
    }
    const amount = formatLinkedAmount(
      entry.item.amount,
      entry.item.currency || "EUR",
      { compact: true },
    );
    return [meta?.noun, entry.item.counterparty, amount]
      .filter(Boolean)
      .join(" · ");
  }
  const { event } = entry;
  const filingSite = entryFilingSite(entry);
  if (filingSite) {
    return `À déposer sur ${filingSite.site}`;
  }
  if (!entry.time) return event.location || "Toute la journée";
  return [event.location, formatDuration(event.start, event.end)]
    .filter(Boolean)
    .join(" · ");
}

function ColorBar({ entry, className }) {
  const color = entryColor(entry);
  return (
    <span
      aria-hidden="true"
      className={cn("shrink-0 rounded-full", className, color.className)}
      style={color.style}
    />
  );
}

// Ligne de la journée : heure, couleur, titre et détail ; lien de dépôt
// pour une déclaration
function TodayRow({ entry, onOpen }) {
  const filingSite = entryFilingSite(entry);
  const subtitle = entrySubtitle(entry);
  const isOverdue = entry.type === "linked" && entry.item.state === "OVERDUE";
  const meta =
    entry.type === "linked" ? LINKED_SOURCE_META[entry.item.kind] : null;
  const Icon = meta?.icon;

  return (
    <li className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onOpen(entry)}
        className="hover:bg-accent focus-visible:ring-ring grid min-w-0 flex-1 cursor-pointer grid-cols-[2.75rem_3px_minmax(0,1fr)] items-center gap-x-2.5 rounded-lg px-2 py-1.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="text-muted-foreground text-xs tabular-nums">
          {entry.time ? (
            entry.time
          ) : Icon ? (
            <Icon
              className={cn("size-3.5", meta.iconClass)}
              aria-hidden="true"
            />
          ) : (
            "Journée"
          )}
        </span>
        <ColorBar entry={entry} className="h-8 w-[3px]" />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-medium">
              {entry.title}
            </span>
            {isOverdue && (
              <CircleAlert
                className="size-3.5 shrink-0 text-red-600 dark:text-red-400"
                aria-label="En retard"
              />
            )}
          </span>
          {subtitle && (
            <span className="text-muted-foreground block truncate text-xs">
              {subtitle}
            </span>
          )}
        </span>
      </button>
      {filingSite && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-7 shrink-0 gap-1 px-2 text-xs"
        >
          <a href={filingSite.url} target="_blank" rel="noopener noreferrer">
            Déclarer
            <ExternalLink className="size-3" aria-hidden="true" />
            <span className="sr-only">
              : {filingSite.label} (nouvel onglet)
            </span>
          </a>
        </Button>
      )}
    </li>
  );
}

/**
 * Affichage seul (données passées en props), testable sans API :
 * aujourd'hui en détail, puis les 6 jours suivants, une ligne chacun.
 */
export function UpcomingDaysView({
  columns,
  loading,
  onOpen,
  onCreate,
  className,
}) {
  const [today, ...nextDays] = columns;
  const todayDate = today ? dayToDate(today.day) : new Date();
  const visibleToday = today ? today.entries.slice(0, MAX_TODAY_ROWS) : [];
  const hiddenToday = today ? today.entries.length - visibleToday.length : 0;

  return (
    <section
      aria-label="Cette semaine"
      className={cn(
        "@container/days bg-card border-border/60 rounded-xl border",
        className,
      )}
    >
      <div className="grid grid-cols-1 @2xl/days:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Aujourd'hui */}
        <div className="border-border/60 p-4 @2xl/days:border-r">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-baseline gap-2">
              <h2 className="text-sm font-medium text-[#5a50ff]">
                Aujourd&apos;hui
              </h2>
              <span className="text-muted-foreground truncate text-xs">
                {format(todayDate, "EEEE d MMMM", { locale: fr })}
              </span>
            </div>
            {onCreate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCreate}
                className="text-muted-foreground h-7 shrink-0 gap-1 px-2 text-xs"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Nouvel événement
              </Button>
            )}
          </div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-4/5 rounded-lg" />
            </div>
          ) : visibleToday.length === 0 ? (
            <p className="text-muted-foreground px-2 py-2 text-sm">
              Rien de prévu aujourd&apos;hui.
            </p>
          ) : (
            <ul className="-mx-2 space-y-0.5">
              {visibleToday.map((entry) => (
                <TodayRow key={entry.key} entry={entry} onOpen={onOpen} />
              ))}
              {hiddenToday > 0 && (
                <li>
                  <Link
                    href={calendarDayUrl(today.day)}
                    className="text-muted-foreground hover:text-foreground block px-2 py-1 text-xs transition-colors"
                  >
                    + {hiddenToday} autre{hiddenToday > 1 ? "s" : ""}
                  </Link>
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Les 6 jours suivants */}
        <div className="border-border/60 border-t p-4 @2xl/days:border-t-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Les 6 prochains jours</h2>
            <Link
              href="/dashboard/calendar"
              className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1 text-xs transition-colors"
            >
              Calendrier
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </div>
          <ul className="divide-border/60 divide-y">
            {nextDays.map(({ day, entries }) => {
              const date = dayToDate(day);
              const [first] = entries;
              const more = entries.length - 1;
              const label = capitalize(
                format(date, "EEEE d MMMM", { locale: fr }),
              );
              return (
                <li key={day}>
                  <Link
                    href={calendarDayUrl(day)}
                    aria-label={`${label}, ${
                      entries.length
                        ? `${entries.length} élément${entries.length > 1 ? "s" : ""}`
                        : "rien de prévu"
                    }`}
                    className="hover:bg-accent/50 focus-visible:ring-ring -mx-2 grid grid-cols-[3.75rem_minmax(0,1fr)_auto] items-center gap-2.5 rounded-md px-2 py-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {capitalize(format(date, "EEE d", { locale: fr }))}
                    </span>
                    {loading ? (
                      <Skeleton className="h-4 w-3/4" />
                    ) : first ? (
                      <span className="flex min-w-0 items-center gap-2">
                        <ColorBar entry={first} className="size-1.5" />
                        {first.time && (
                          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                            {first.time}
                          </span>
                        )}
                        <span className="truncate text-[13px]">
                          {first.title}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground/70 text-xs">
                        Rien de prévu
                      </span>
                    )}
                    {!loading && more > 0 ? (
                      <span className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-[11px] tabular-nums">
                        +{more}
                      </span>
                    ) : (
                      <span />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

// Brouillon d'un nouvel événement : la prochaine heure pleine d'aujourd'hui
// (9 h au plus tôt, 18 h au plus tard), pour une heure
export function newEventDraft(now = new Date()) {
  const start = new Date(now);
  start.setMinutes(0, 0, 0);
  start.setHours(Math.min(Math.max(now.getHours() + 1, 9), 18));
  const end = new Date(start);
  end.setHours(start.getHours() + 1);
  return { id: "", title: "", start, end, allDay: false };
}

/**
 * Accueil : la semaine à venir (événements, rendez-vous, échéances de
 * factures, devis, tâches, déclarations…). Un clic ouvre l'élément sur
 * place : sa fiche pour une échéance, la fenêtre d'un événement.
 */
export function UpcomingDaysCard({ className }) {
  const router = useRouter();
  const { canDo, isReady } = useMyPermissions();
  const canCreate = !isReady || canDo("calendar", "create");
  const canEdit = !isReady || canDo("calendar", "edit");
  const canDelete = !isReady || canDo("calendar", "delete");

  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  // Fiches montées au premier clic, gardées ensuite pour leur animation
  const [itemSheetUsed, setItemSheetUsed] = useState(false);
  const [eventDialogUsed, setEventDialogUsed] = useState(false);
  // Choix du menu Filtres du calendrier, lu après le premier rendu (le rendu
  // serveur ne connaît pas le stockage du navigateur)
  const [hiddenSources, setHiddenSources] = useState(null);
  useEffect(() => setHiddenSources(readHiddenSources()), []);

  // Jours calculés au montage : le cadre suit la date du jour à chaque visite
  const days = useMemo(() => upcomingDays(), []);
  const { events, loading: eventsLoading } = useEvents();
  const { createEvent, updateEvent, deleteEvent } = useEventOperations();
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
      setItemSheetUsed(true);
      setSelectedItem(entry.item);
      return;
    }
    // Rendez-vous pris en ligne : géré depuis sa fiche dans le calendrier
    if (entry.isAppointment) {
      router.push(calendarDayUrl(entry.day));
      return;
    }
    setEventDialogUsed(true);
    setSelectedEvent(entry.event);
  };

  const openNewEvent = () => {
    setEventDialogUsed(true);
    setSelectedEvent(newEventDraft());
  };

  const saveEvent = async (event) => {
    const input = {
      title: event.title,
      description: event.description,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      allDay: event.allDay || false,
      color: event.color || "sky",
      location: event.location,
      declarationKind: event.declarationKind || null,
      eventTypeId: event.eventTypeId || null,
      assignedMembers: event.assignedMembers || [],
      emailReminder: event.emailReminder?.enabled
        ? {
            enabled: true,
            anticipation: event.emailReminder.anticipation || null,
            echeance: event.emailReminder.echeance || null,
          }
        : event.id
          ? { enabled: false }
          : undefined,
    };
    const saved = event.id
      ? await updateEvent({ id: event.id, ...input })
      : await createEvent({ ...input, type: "MANUAL" });
    if (saved) {
      toast.success(event.id ? "Événement modifié" : "Événement ajouté");
      setSelectedEvent(null);
    }
  };

  const removeEvent = async (id) => {
    const removed = await deleteEvent(id);
    if (removed) {
      toast.success("Événement supprimé");
      setSelectedEvent(null);
    }
  };

  return (
    <>
      <UpcomingDaysView
        columns={columns}
        loading={loading}
        onOpen={openEntry}
        onCreate={canCreate ? openNewEvent : null}
        className={className}
      />
      {itemSheetUsed && (
        <LinkedItemSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
      {eventDialogUsed && (
        <EventDialog
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSave={saveEvent}
          onDelete={removeEvent}
          canEdit={selectedEvent?.id ? canEdit : canCreate}
          canDelete={canDelete}
          canEditLabels={canEdit}
        />
      )}
    </>
  );
}
