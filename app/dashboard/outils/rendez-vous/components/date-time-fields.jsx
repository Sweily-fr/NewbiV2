"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Calendar } from "@/src/components/ui/calendar";
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

/**
 * Champs de date et d'heure de la prise de rendez-vous, sur le modèle du
 * reste de la plateforme : bouton « 28 novembre 2026 » qui ouvre le
 * calendrier (comme les dates des factures), heure choisie dans une liste
 * (comme le Calendrier). Les valeurs restent des chaînes locales
 * (« AAAA-MM-JJ », « HH:mm », « AAAA-MM-JJTHH:mm ») : le fuseau est celui de
 * la page, appliqué ailleurs.
 */

const pad = (n) => String(n).padStart(2, "0");

/** « AAAA-MM-JJ » → Date locale à midi (évite les décalages de jour). */
function keyToDate(key) {
  const [y, m, d] = String(key || "")
    .split("-")
    .map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d, 12);
}

const dateToKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Heures de la journée, au pas donné ; 24:00 en option pour une fin. */
export function timeOptions({ step = 15, endOfDay = false, extra = [] } = {}) {
  const values = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += step) {
    values.push(`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`);
  }
  if (endOfDay) values.push("24:00");
  // Valeur déjà enregistrée hors du pas (09:05) : gardée dans la liste
  for (const value of extra) {
    if (value && /^\d{2}:\d{2}$/.test(value) && !values.includes(value)) {
      values.push(value);
    }
  }
  return values.sort();
}

const timeLabel = (value) => {
  const [h, m] = value.split(":");
  return `${Number(h)}:${m}`;
};

/** Date seule : bouton + calendrier en fenêtre. */
export function DatePickerButton({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = "Choisir une date",
  ariaLabel,
  invalid = false,
  isDisabledDay,
  className,
}) {
  const [open, setOpen] = useState(false);
  const selected = keyToDate(value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            invalid && "border-red-500",
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4 shrink-0" />
          <span className="truncate">
            {selected ? format(selected, "PPP", { locale: fr }) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={fr}
          weekStartsOn={1}
          selected={selected}
          defaultMonth={selected || new Date()}
          disabled={isDisabledDay}
          onSelect={(date) => {
            if (!date) return;
            onChange(dateToKey(date));
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

/** Heure seule : liste au quart d'heure (pas réglable). */
export function TimeSelect({
  value,
  onChange,
  ariaLabel,
  disabled = false,
  step = 15,
  endOfDay = false,
  placeholder = "Heure",
  className,
}) {
  const options = useMemo(
    () => timeOptions({ step, endOfDay, extra: [value] }),
    [step, endOfDay, value],
  );
  return (
    <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn("w-28 shrink-0 tabular-nums", className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {timeLabel(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Date et heure (« AAAA-MM-JJTHH:mm ») : calendrier + liste d'heures. Une
 * date choisie sans heure prend `defaultTime` ; l'heure attend une date.
 */
export function DateTimeField({
  id,
  value,
  onChange,
  disabled = false,
  invalid = false,
  label,
  defaultTime = "18:00",
  isDisabledDay,
}) {
  const [date = "", time = ""] = String(value || "").split("T");
  return (
    <div className="flex min-w-0 gap-2">
      {/* La date prend la place restante ; l'heure garde sa largeur */}
      <div className="min-w-0 flex-1">
        <DatePickerButton
          id={id}
          value={date}
          disabled={disabled}
          invalid={invalid}
          isDisabledDay={isDisabledDay}
          ariaLabel={label ? `${label}, date` : undefined}
          onChange={(nextDate) =>
            onChange(`${nextDate}T${time || defaultTime}`)
          }
          className="shrink"
        />
      </div>
      <TimeSelect
        value={time}
        disabled={disabled || !date}
        ariaLabel={label ? `${label}, heure` : undefined}
        onChange={(nextTime) => date && onChange(`${date}T${nextTime}`)}
      />
    </div>
  );
}
