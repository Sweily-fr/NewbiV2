"use client";

import { useMemo } from "react";
import {
  CalendarX2,
  ChevronRight,
  CircleAlert,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";
import {
  dayKeyInZone,
  durationLabel,
  locationKindLabel,
  longDateLabel,
  timeRangeLabel,
} from "@/src/utils/booking";
import { CopyButton, LocationKindIcon } from "./shared";

export const BOOKING_TABS = [
  { value: "upcoming", label: "À venir" },
  { value: "past", label: "Passées" },
  { value: "cancelled", label: "Annulées" },
];

const EMPTY_TEXT = {
  upcoming: {
    title: "Aucun rendez-vous à venir",
    text: "Partagez le lien de votre page : les réservations apparaîtront ici et dans votre Calendrier.",
  },
  past: { title: "Aucun rendez-vous passé", text: null },
  cancelled: { title: "Aucun rendez-vous annulé", text: null },
};

export const guestName = (guest) =>
  [guest?.firstName, guest?.lastName].filter(Boolean).join(" ") || "Invité";

/** Réservations rangées par jour (fuseau de la page), ordre de l'API gardé. */
function groupByDay(bookings, timeZone) {
  const groups = [];
  for (const booking of bookings) {
    const key = dayKeyInZone(booking.startAt, timeZone);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(booking);
    else
      groups.push({
        key,
        label: longDateLabel(booking.startAt, timeZone),
        items: [booking],
      });
  }
  return groups;
}

function BookingRow({ booking, timeZone, onOpen }) {
  const cancelled = booking.status === "CANCELLED";
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(booking)}
        className="group grid w-full cursor-pointer grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-4 rounded-xl border bg-background px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none md:grid-cols-[110px_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
      >
        <span
          className={cn(
            "text-sm font-medium tabular-nums",
            cancelled && "text-muted-foreground line-through",
          )}
        >
          {timeRangeLabel(booking.startAt, booking.endAt, timeZone)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">
            {guestName(booking.guest)}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {booking.guest?.email}
          </span>
        </span>
        <span className="hidden min-w-0 md:block">
          <span className="block truncate text-sm">{booking.typeName}</span>
          <span className="block text-xs text-muted-foreground">
            {durationLabel(booking.durationMinutes)}
          </span>
        </span>
        <span className="hidden min-w-0 items-center gap-1.5 text-sm text-muted-foreground md:flex">
          <LocationKindIcon
            kind={booking.location?.kind}
            className="size-3.5 shrink-0"
          />
          <span className="truncate">
            {locationKindLabel(booking.location?.kind)}
          </span>
          {booking.meetingWarning && !cancelled && (
            <TriangleAlert
              className="size-3.5 shrink-0 text-amber-500"
              aria-label="Lien de visio à envoyer"
            />
          )}
        </span>
        <ChevronRight
          className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </button>
    </li>
  );
}

/**
 * Onglet Réservations : à venir, passées, annulées ; une ligne par
 * rendez-vous (heure, invité, type, lieu), regroupées par jour.
 */
export function BookingsPanel({
  tab,
  onTabChange,
  bookings,
  totalCount,
  loading,
  error,
  onRetry,
  onOpen,
  onLoadMore,
  loadingMore,
  timeZone,
  publicUrl,
}) {
  const groups = useMemo(
    () => groupByDay(bookings, timeZone),
    [bookings, timeZone],
  );
  const empty = EMPTY_TEXT[tab] || EMPTY_TEXT.upcoming;

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Réservations"
        className="flex flex-wrap gap-1.5"
      >
        {BOOKING_TABS.map((item) => {
          const active = item.value === tab;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(item.value)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {item.label}
              {active && !loading && (
                <span className="ml-1.5 text-xs opacity-70 tabular-nums">
                  {totalCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3 pt-2">
          <Skeleton className="h-4 w-40" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[62px] w-full rounded-xl" />
          ))}
        </div>
      ) : error && bookings.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <CircleAlert className="mb-3 size-10 text-muted-foreground" />
          <p className="font-medium">
            Impossible d&apos;afficher les réservations
          </p>
          <p className="mt-1 mb-4 max-w-sm text-sm text-muted-foreground">
            Le chargement a échoué. Vérifiez votre connexion, puis réessayez.
          </p>
          <Button
            variant="outline"
            onClick={onRetry}
            className="cursor-pointer"
          >
            Réessayer
          </Button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <CalendarX2 className="mb-3 size-10 text-muted-foreground/70" />
          <p className="font-medium">{empty.title}</p>
          {empty.text && (
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {empty.text}
            </p>
          )}
          {tab === "upcoming" && publicUrl && (
            <CopyButton text={publicUrl} className="mt-4" />
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.key} className="space-y-2">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {group.label}
              </h3>
              <ul className="space-y-2">
                {group.items.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    timeZone={timeZone}
                    onOpen={onOpen}
                  />
                ))}
              </ul>
            </section>
          ))}
          {bookings.length < totalCount && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="cursor-pointer"
              >
                {loadingMore && <Loader2 className="size-3.5 animate-spin" />}
                Afficher plus
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
