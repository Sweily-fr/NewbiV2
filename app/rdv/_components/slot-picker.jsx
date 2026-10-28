"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Globe, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  dayKeyInZone,
  dayKeyLabel,
  groupSlotsByDay,
  keyToLocalDate,
  lastBookableDay,
  listTimeZones,
  localDateToKey,
  monthFetchRange,
  timeZoneLabel,
} from "@/src/utils/booking";
import { bookingErrorText, fetchSlots } from "../_lib/booking-api";

const monthKeyOf = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const firstOfMonth = (key) => keyToLocalDate(`${key.slice(0, 7)}-01`);

// Jour de la grille : plein à la couleur d'accent s'il est choisi, teinté
// s'il a des créneaux, grisé sinon
function SlotDayButton({ day, modifiers, className, ...props }) {
  const ref = useRef(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  const available = modifiers.available && !modifiers.disabled;

  return (
    <button
      ref={ref}
      type="button"
      {...props}
      className={cn(
        "mx-auto flex size-10 items-center justify-center rounded-full text-sm tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--rdv-accent)] focus-visible:ring-offset-2 sm:size-11",
        modifiers.selected
          ? "bg-[var(--rdv-accent)] font-semibold text-[var(--rdv-on-accent)]"
          : available
            ? "cursor-pointer bg-[color-mix(in_srgb,var(--rdv-accent)_10%,transparent)] font-semibold text-[var(--rdv-accent-ink)] hover:bg-[color-mix(in_srgb,var(--rdv-accent)_20%,transparent)]"
            : "cursor-default text-gray-300",
        modifiers.today &&
          !modifiers.selected &&
          "underline underline-offset-4",
        className,
      )}
    />
  );
}

function NavChevron({ orientation, className }) {
  const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
  return <Icon className={cn("size-4", className)} aria-hidden="true" />;
}

/**
 * Choix d'un créneau : mois (créneaux chargés par plage à chaque mois
 * affiché), jours sans créneau grisés, heures du jour choisi dans le
 * fuseau de l'invité, fuseau modifiable. `excludeToken` : reprogrammation
 * (le rendez-vous en cours n'occupe pas son propre créneau).
 */
export function SlotPicker({
  slug,
  typeSlug,
  pageTimeZone,
  maxDaysAhead,
  guestTimeZone,
  onGuestTimeZoneChange,
  selectedStart = null,
  onSelect,
  excludeToken = null,
  reloadKey = 0,
}) {
  // Bornes fixées à l'ouverture de la page
  const [{ today, lastDay }] = useState(() => {
    const now = new Date();
    return {
      today: dayKeyInZone(now, pageTimeZone),
      lastDay: lastBookableDay(now, { timeZone: pageTimeZone, maxDaysAhead }),
    };
  });
  const startMonth = useMemo(() => firstOfMonth(today), [today]);
  const endMonth = useMemo(
    () => (lastDay ? firstOfMonth(lastDay) : undefined),
    [lastDay],
  );

  const [month, setMonth] = useState(startMonth);
  const monthKey = monthKeyOf(month);
  // Créneaux lus, par mois affiché et par génération : un rechargement
  // (créneau pris entre-temps) ouvre une nouvelle génération, l'ancienne
  // est ignorée. { "<génération>|AAAA-MM": { status, slots } }
  const generation = `${reloadKey}|${excludeToken || ""}`;
  const cacheKey = `${generation}|${monthKey}`;
  const [byMonth, setByMonth] = useState({});
  const [retry, setRetry] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const autoAdvanced = useRef(false);

  useEffect(() => {
    if (byMonth[cacheKey]) return undefined;
    const range = monthFetchRange(monthKey, { today, lastDay });
    if (!range) {
      setByMonth((prev) => ({
        ...prev,
        [cacheKey]: { status: "ready", slots: [] },
      }));
      return undefined;
    }
    const controller = new AbortController();
    setByMonth((prev) => ({
      ...prev,
      [cacheKey]: { status: "loading", slots: [] },
    }));
    fetchSlots(slug, typeSlug, {
      ...range,
      excludeToken,
      signal: controller.signal,
    })
      .then((data) => {
        setByMonth((prev) => ({
          ...prev,
          [cacheKey]: { status: "ready", slots: data?.slots || [] },
        }));
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setByMonth((prev) => ({
          ...prev,
          [cacheKey]: { status: "error", slots: [], error },
        }));
      });
    return () => {
      controller.abort();
      // Mois quitté avant la réponse : il sera relu au retour
      setByMonth((prev) => {
        if (prev[cacheKey]?.status !== "loading") return prev;
        const next = { ...prev };
        delete next[cacheKey];
        return next;
      });
    };
    // byMonth volontairement absent : seul le mois affiché déclenche
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, slug, typeSlug, today, lastDay, retry]);

  const current = byMonth[cacheKey] || { status: "loading", slots: [] };

  // Tous les créneaux lus dans cette génération (les plages de deux mois
  // voisins se recouvrent d'un jour), rangés par jour dans le fuseau de
  // l'invité
  const byDay = useMemo(() => {
    const unique = new Map();
    for (const [key, entry] of Object.entries(byMonth)) {
      if (!key.startsWith(`${generation}|`)) continue;
      for (const slot of entry.slots) unique.set(slot.start, slot);
    }
    return groupSlotsByDay([...unique.values()], guestTimeZone);
  }, [byMonth, generation, guestTimeZone]);

  const monthDays = useMemo(
    () => Object.keys(byDay).filter((key) => key.startsWith(monthKey)),
    [byDay, monthKey],
  );

  // Premier mois sans créneau : on passe une fois au suivant
  useEffect(() => {
    if (autoAdvanced.current || current.status !== "ready") return;
    autoAdvanced.current = true;
    if (monthDays.length === 0 && endMonth && month < endMonth) {
      setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
    }
  }, [current.status, monthDays.length, endMonth, month]);

  // Jour choisi : le premier disponible du mois tant que rien n'est choisi
  // (ou si le changement de fuseau l'a vidé)
  useEffect(() => {
    if (current.status !== "ready") return;
    if (selectedDay && byDay[selectedDay]) return;
    setSelectedDay(monthDays[0] || null);
  }, [current.status, monthDays, byDay, selectedDay]);

  const times = selectedDay ? byDay[selectedDay] || [] : [];
  const zones = useMemo(
    () => listTimeZones([guestTimeZone, pageTimeZone]),
    [guestTimeZone, pageTimeZone],
  );
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const hasNextMonth = !endMonth || nextMonth <= endMonth;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1">
        <div className="relative">
          <DayPicker
            mode="single"
            required
            locale={fr}
            weekStartsOn={1}
            month={month}
            onMonthChange={setMonth}
            startMonth={startMonth}
            endMonth={endMonth}
            fixedWeeks
            showOutsideDays={false}
            selected={selectedDay ? keyToLocalDate(selectedDay) : undefined}
            onSelect={(date) => date && setSelectedDay(localDateToKey(date))}
            disabled={(date) => !byDay[localDateToKey(date)]}
            modifiers={{
              available: (date) => Boolean(byDay[localDateToKey(date)]),
            }}
            formatters={{
              formatCaption: (date) =>
                date.toLocaleString("fr-FR", {
                  month: "long",
                  year: "numeric",
                }),
              formatWeekdayName: (date) =>
                date
                  .toLocaleString("fr-FR", { weekday: "short" })
                  .replace(".", ""),
            }}
            classNames={{
              root: "relative w-full",
              months: "relative flex flex-col",
              month: "flex w-full flex-col gap-3",
              nav: "absolute inset-x-0 top-0 flex items-center justify-between",
              button_previous:
                "flex size-9 cursor-pointer items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent",
              button_next:
                "flex size-9 cursor-pointer items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent",
              month_caption: "flex h-9 items-center justify-center",
              caption_label: "text-base font-medium capitalize text-gray-900",
              month_grid: "w-full border-collapse",
              weekdays: "flex",
              weekday:
                "flex-1 pb-1 text-center text-[11px] font-normal uppercase tracking-wide text-gray-400",
              week: "mt-1 flex w-full",
              day: "flex-1 p-0 text-center",
              hidden: "invisible",
            }}
            components={{ DayButton: SlotDayButton, Chevron: NavChevron }}
          />
          {current.status === "loading" && (
            <div className="pointer-events-none absolute inset-x-0 top-12 bottom-0 flex items-center justify-center bg-white/60">
              <Loader2
                className="size-5 animate-spin text-gray-400"
                aria-label="Chargement des disponibilités"
              />
            </div>
          )}
        </div>

        {current.status === "error" && (
          <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {current.error?.code === "RATE_LIMITED"
              ? bookingErrorText(current.error)
              : "Les disponibilités n'ont pas pu être chargées."}{" "}
            <button
              type="button"
              className="cursor-pointer font-medium underline underline-offset-2"
              onClick={() => {
                setByMonth((prev) => {
                  const next = { ...prev };
                  delete next[cacheKey];
                  return next;
                });
                setRetry((n) => n + 1);
              }}
            >
              Réessayer
            </button>
          </div>
        )}
        {current.status === "ready" && monthDays.length === 0 && (
          <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Aucun créneau disponible ce mois-ci.
            {hasNextMonth && (
              <>
                {" "}
                <button
                  type="button"
                  className="cursor-pointer font-medium text-[var(--rdv-accent-ink)] underline underline-offset-2"
                  onClick={() => setMonth(nextMonth)}
                >
                  Voir le mois suivant
                </button>
              </>
            )}
          </div>
        )}

        <label className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <Globe className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
          <span className="sr-only">Fuseau horaire</span>
          <select
            value={guestTimeZone}
            onChange={(event) => onGuestTimeZoneChange?.(event.target.value)}
            className="min-w-0 flex-1 cursor-pointer truncate rounded-lg border-0 bg-transparent py-1 pr-6 text-sm text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-[var(--rdv-accent)] focus:outline-none"
          >
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {timeZoneLabel(zone)}
                {zone.includes("/") ? ` · ${zone.split("/")[0]}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="lg:w-48 lg:shrink-0">
        {selectedDay && times.length > 0 && (
          <>
            <p className="mb-3 text-sm font-medium text-gray-900">
              {dayKeyLabel(selectedDay)}
            </p>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:max-h-[380px] lg:grid-cols-1 lg:overflow-y-auto lg:pr-1">
              {times.map((slot) => {
                const isSelected = slot.start === selectedStart;
                return (
                  <li key={slot.start}>
                    <button
                      type="button"
                      onClick={() => onSelect?.(slot)}
                      aria-pressed={isSelected}
                      className={cn(
                        "w-full cursor-pointer rounded-xl border py-2.5 text-sm font-semibold tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--rdv-accent)] focus-visible:ring-offset-1",
                        isSelected
                          ? "border-[var(--rdv-accent)] bg-[var(--rdv-accent)] text-[var(--rdv-on-accent)]"
                          : "border-[color-mix(in_srgb,var(--rdv-accent)_40%,transparent)] text-[var(--rdv-accent-ink)] hover:border-[var(--rdv-accent)] hover:bg-[color-mix(in_srgb,var(--rdv-accent)_8%,transparent)]",
                      )}
                    >
                      {slot.time}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
