"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fr } from "date-fns/locale";
import {
  CalendarPlus,
  CircleAlert,
  Link2,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Calendar } from "@/src/components/ui/calendar";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import {
  availabilityDraftError,
  availabilityToDraft,
  dayKeyInZone,
  dayKeyLabel,
  defaultDayIntervals,
  draftToAvailability,
  intervalsError,
  listTimeZones,
  localDateToKey,
  nextIntervalAfter,
  normalizeOverrides,
  timeZoneOffsetLabel,
  WEEK_DAYS,
} from "@/src/utils/booking";
import { PROVIDER_NAMES, SettingsSection } from "./shared";

const AUTO_WRITE = "auto";

/** Plages d'une journée : début, fin, retrait ; ajout d'une plage. */
function IntervalsEditor({ intervals, onChange, disabled, label }) {
  const error = intervalsError(intervals);
  const update = (index, key, value) =>
    onChange(
      intervals.map((interval, i) =>
        i === index ? { ...interval, [key]: value } : interval,
      ),
    );
  return (
    <div className="space-y-2">
      {intervals.map((interval, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            type="time"
            step={300}
            value={interval.start}
            disabled={disabled}
            aria-label={`${label}, début de la plage ${index + 1}`}
            onChange={(event) => update(index, "start", event.target.value)}
            className="w-[108px] tabular-nums"
          />
          <span className="text-muted-foreground" aria-hidden="true">
            à
          </span>
          <Input
            type="time"
            step={300}
            value={interval.end}
            disabled={disabled}
            aria-label={`${label}, fin de la plage ${index + 1}`}
            onChange={(event) => update(index, "end", event.target.value)}
            className="w-[108px] tabular-nums"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="size-8 cursor-pointer text-muted-foreground"
            aria-label={`Retirer la plage ${index + 1}`}
            onClick={() => onChange(intervals.filter((_, i) => i !== index))}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-7 cursor-pointer px-2 text-xs text-muted-foreground"
          onClick={() => onChange([...intervals, nextIntervalAfter(intervals)])}
        >
          <Plus className="size-3" />
          Ajouter une plage
        </Button>
        {error && (
          <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
            <CircleAlert className="size-3" aria-hidden="true" />
            {error}
          </span>
        )}
      </div>
    </div>
  );
}

function initialState(page) {
  return {
    draft: availabilityToDraft(page.availability),
    overrides: normalizeOverrides(page.dateOverrides),
    timezone: page.timezone || "Europe/Paris",
    busyConnectionIds: page.busyConnectionIds || [],
    writeConnectionId: page.writeConnectionId || null,
  };
}

const snapshot = (state) =>
  JSON.stringify({
    availability: draftToAvailability(state.draft),
    dateOverrides: normalizeOverrides(state.overrides),
    timezone: state.timezone,
    busy: [...state.busyConnectionIds].sort(),
    write: state.writeConnectionId,
  });

/**
 * Onglet Disponibilités : horaires de la semaine, exceptions par date,
 * fuseau de la page, agendas lus pour les créneaux occupés et agenda où
 * écrire les rendez-vous.
 */
export function AvailabilityPanel({
  page,
  connections,
  canEdit,
  readOnly,
  onSave,
}) {
  const [state, setState] = useState(() => initialState(page));
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // Page enregistrée (ici ou ailleurs) : l'éditeur repart de l'API
  useEffect(() => {
    setState(initialState(page));
  }, [page]);

  const disabled = !canEdit || readOnly || saving;
  const dirty = snapshot(state) !== snapshot(initialState(page));
  const error = availabilityDraftError(state.draft, state.overrides);
  const zones = useMemo(
    () => listTimeZones([state.timezone]),
    [state.timezone],
  );
  const usable = connections.filter((c) => c.status !== "disconnected");
  const activeConnections = usable.filter((c) => c.status === "active");
  // Liste vide = toutes les connexions actives sont lues
  const readsAll = state.busyConnectionIds.length === 0;
  const isBusySource = (id) => readsAll || state.busyConnectionIds.includes(id);
  const today = dayKeyInZone(new Date(), state.timezone);

  const setDay = (dayOfWeek, patch) =>
    setState((prev) => ({
      ...prev,
      draft: prev.draft.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day,
      ),
    }));

  const setOverride = (date, intervals) =>
    setState((prev) => ({
      ...prev,
      overrides: prev.overrides.map((o) =>
        o.date === date ? { ...o, intervals } : o,
      ),
    }));

  const toggleBusy = (id, checked) =>
    setState((prev) => {
      const current = prev.busyConnectionIds.length
        ? prev.busyConnectionIds
        : activeConnections.map((c) => c.id);
      const next = checked
        ? [...new Set([...current, id])]
        : current.filter((value) => value !== id);
      // Toutes cochées : on revient à « toutes » (suit les futures connexions)
      const all = activeConnections.every((c) => next.includes(c.id));
      return { ...prev, busyConnectionIds: all ? [] : next };
    });

  const handleSave = async () => {
    if (error) return;
    setSaving(true);
    try {
      await onSave({
        availability: draftToAvailability(state.draft),
        dateOverrides: normalizeOverrides(state.overrides),
        timezone: state.timezone,
        busyConnectionIds: state.busyConnectionIds,
        writeConnectionId: state.writeConnectionId,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <div className="grid gap-4 pb-20 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <SettingsSection
            title="Horaires de la semaine"
            description="Les créneaux proposés tombent dans ces plages, hors événements de vos agendas."
          >
            <ul className="divide-y">
              {state.draft.map((day) => {
                const meta = WEEK_DAYS.find(
                  (d) => d.dayOfWeek === day.dayOfWeek,
                );
                return (
                  <li
                    key={day.dayOfWeek}
                    className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start"
                  >
                    <label className="flex w-36 shrink-0 items-center gap-3 pt-1.5">
                      <Switch
                        checked={day.enabled}
                        disabled={disabled}
                        onCheckedChange={(checked) =>
                          setDay(day.dayOfWeek, {
                            enabled: checked,
                            intervals:
                              checked && day.intervals.length === 0
                                ? defaultDayIntervals()
                                : day.intervals,
                          })
                        }
                        aria-label={`${meta.label} ouvert`}
                      />
                      <span
                        className={cn(
                          "text-sm",
                          !day.enabled && "text-muted-foreground",
                        )}
                      >
                        {meta.label}
                      </span>
                    </label>
                    {day.enabled ? (
                      <IntervalsEditor
                        intervals={day.intervals}
                        disabled={disabled}
                        label={meta.label}
                        onChange={(intervals) =>
                          setDay(day.dayOfWeek, { intervals })
                        }
                      />
                    ) : (
                      <span className="pt-2 text-sm text-muted-foreground">
                        Indisponible
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </SettingsSection>

          <SettingsSection
            title="Exceptions"
            description="Un jour fermé (congés, jour férié) ou des horaires différents ce jour-là."
            action={
              <Popover open={addOpen} onOpenChange={setAddOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className="cursor-pointer"
                  >
                    <CalendarPlus className="size-3.5" />
                    Ajouter une date
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    locale={fr}
                    weekStartsOn={1}
                    disabled={(date) =>
                      localDateToKey(date) < today ||
                      state.overrides.some(
                        (o) => o.date === localDateToKey(date),
                      )
                    }
                    onSelect={(date) => {
                      if (!date) return;
                      const key = localDateToKey(date);
                      setState((prev) => ({
                        ...prev,
                        overrides: normalizeOverrides([
                          ...prev.overrides,
                          { date: key, intervals: [] },
                        ]),
                      }));
                      setAddOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            }
          >
            {state.overrides.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune exception.</p>
            ) : (
              <ul className="divide-y">
                {state.overrides.map((override) => {
                  const closed = override.intervals.length === 0;
                  const label = dayKeyLabel(override.date);
                  const past = override.date < today;
                  return (
                    <li
                      key={override.date}
                      className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start"
                    >
                      <div className="w-44 shrink-0 pt-1.5">
                        <p
                          className={cn(
                            "text-sm",
                            past && "text-muted-foreground",
                          )}
                        >
                          {label}
                          <span className="ml-1 text-xs text-muted-foreground">
                            {override.date.slice(0, 4)}
                          </span>
                        </p>
                        <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <Switch
                            checked={!closed}
                            disabled={disabled}
                            onCheckedChange={(open) =>
                              setOverride(
                                override.date,
                                open ? defaultDayIntervals() : [],
                              )
                            }
                            aria-label={`${label} : horaires spéciaux`}
                          />
                          {closed ? "Fermé" : "Horaires spéciaux"}
                        </label>
                      </div>
                      <div className="flex flex-1 items-start justify-between gap-2">
                        {closed ? (
                          <span className="pt-2 text-sm text-muted-foreground">
                            Aucun rendez-vous ce jour-là
                          </span>
                        ) : (
                          <IntervalsEditor
                            intervals={override.intervals}
                            disabled={disabled}
                            label={label}
                            onChange={(intervals) =>
                              setOverride(override.date, intervals)
                            }
                          />
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={disabled}
                          className="size-8 shrink-0 cursor-pointer text-muted-foreground"
                          aria-label={`Supprimer l'exception du ${label}`}
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              overrides: prev.overrides.filter(
                                (o) => o.date !== override.date,
                              ),
                            }))
                          }
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SettingsSection>
        </div>

        <div className="space-y-4">
          <SettingsSection
            title="Fuseau horaire"
            description="Vos horaires sont lus dans ce fuseau. L'invité voit les créneaux dans le sien."
          >
            <select
              value={state.timezone}
              disabled={disabled}
              onChange={(event) =>
                setState((prev) => ({ ...prev, timezone: event.target.value }))
              }
              aria-label="Fuseau horaire de la page"
              className="h-9 w-full cursor-pointer rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone.replace(/_/g, " ")} ({timeZoneOffsetLabel(zone)})
                </option>
              ))}
            </select>
          </SettingsSection>

          <SettingsSection
            title="Agendas connectés"
            description="Vos événements occupent les créneaux, et chaque rendez-vous y est ajouté."
          >
            {usable.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <Link2
                  className="mx-auto mb-2 size-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium">
                  Connectez votre agenda pour éviter les doubles réservations
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Google Agenda, Outlook ou Apple Calendrier : vos rendez-vous
                  existants bloquent les créneaux, et les liens Meet ou Teams
                  sont créés automatiquement.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href="/dashboard/calendar?agendas=1">
                    Connecter un agenda
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Lus pour les créneaux occupés
                  </p>
                  <ul className="space-y-2">
                    {usable.map((connection) => {
                      const active = connection.status === "active";
                      return (
                        <li key={connection.id}>
                          <label
                            className={cn(
                              "flex items-center gap-3 rounded-lg border p-2.5",
                              !active && "opacity-70",
                            )}
                          >
                            <Checkbox
                              checked={active && isBusySource(connection.id)}
                              disabled={disabled || !active}
                              onCheckedChange={(checked) =>
                                toggleBusy(connection.id, Boolean(checked))
                              }
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm">
                                {PROVIDER_NAMES[connection.provider] ||
                                  connection.provider}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {connection.accountEmail ||
                                  connection.accountName}
                              </span>
                            </span>
                            {!active && (
                              <span className="shrink-0 text-xs text-amber-600 dark:text-amber-400">
                                À reconnecter
                              </span>
                            )}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Agenda où ajouter les rendez-vous
                  </p>
                  <Select
                    value={state.writeConnectionId || AUTO_WRITE}
                    disabled={disabled}
                    onValueChange={(value) =>
                      setState((prev) => ({
                        ...prev,
                        writeConnectionId: value === AUTO_WRITE ? null : value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AUTO_WRITE}>
                        Automatique (Google, puis Outlook, puis Apple)
                      </SelectItem>
                      {activeConnections.map((connection) => (
                        <SelectItem key={connection.id} value={connection.id}>
                          {PROVIDER_NAMES[connection.provider] ||
                            connection.provider}
                          {connection.accountEmail
                            ? ` · ${connection.accountEmail}`
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Le lien Meet ou Teams est créé avec ce compte.
                  </p>
                </div>
              </div>
            )}
          </SettingsSection>
        </div>
      </div>

      {canEdit && (dirty || saving) && (
        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <span
            className={cn(
              "mr-auto text-sm",
              error
                ? "text-red-600 dark:text-red-400"
                : "text-muted-foreground",
            )}
          >
            {error || "Modifications non enregistrées"}
          </span>
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => setState(initialState(page))}
            className="cursor-pointer"
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            disabled={saving || Boolean(error) || readOnly}
            onClick={handleSave}
            className="cursor-pointer"
          >
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      )}
    </div>
  );
}
