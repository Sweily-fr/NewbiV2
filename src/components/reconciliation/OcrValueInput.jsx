"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Calendar } from "@/src/components/ui/calendar";
import { Input } from "@/src/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";

// Sélecteur de date identique aux autres calendriers de la plateforme
// (Popover + Calendar, format dd/MM/yyyy). value = "YYYY-MM-DD" ou "".
function DateField({ value, onChange, className = "" }) {
  const date = value ? new Date(`${value}T00:00:00`) : null;
  const valid = Boolean(date && !isNaN(date.getTime()));
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={`justify-start text-left font-normal ${
            valid ? "" : "text-muted-foreground"
          } ${className}`}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">
            {valid ? format(date, "dd/MM/yyyy") : "Choisir une date"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={valid ? date : undefined}
          defaultMonth={valid ? date : undefined}
          onSelect={(selected) => {
            if (selected) onChange(format(selected, "yyyy-MM-dd"));
          }}
          initialFocus
          locale={fr}
        />
      </PopoverContent>
    </Popover>
  );
}

/**
 * Champ de saisie d'une valeur proposée par l'OCR dans les dialogues de
 * comparaison (mode « Modifier ») : texte, date, nombre ou liste.
 * `value` est toujours une chaîne (les dialogues convertissent au patch).
 */
export function OcrValueInput({
  kind = "text",
  value,
  onChange,
  options = [],
  placeholder = "",
  className = "",
}) {
  const base = `h-8 text-sm ${className}`;
  if (kind === "select") {
    return (
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`${base} w-full rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring`}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (kind === "number") {
    return (
      <Input
        type="number"
        inputMode="decimal"
        step="0.01"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${base} w-32`}
      />
    );
  }
  if (kind === "date") {
    return (
      <DateField
        value={value ?? ""}
        onChange={onChange}
        className={`${base} w-40`}
      />
    );
  }
  return (
    <Input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${base} w-full min-w-[10rem]`}
    />
  );
}

/**
 * Applique des brouillons (chaînes saisies) sur une proposition OCR :
 * nombres convertis (virgule acceptée), vide = non lu.
 */
export function applyOcrDrafts(proposal, drafts, numberKeys) {
  if (!proposal) return proposal;
  const out = { ...proposal };
  for (const [key, raw] of Object.entries(drafts || {})) {
    if (numberKeys.has(key)) {
      const n =
        raw === "" || raw === null || raw === undefined
          ? null
          : Number(String(raw).replace(",", "."));
      out[key] = Number.isFinite(n) ? n : null;
    } else {
      out[key] = raw === "" || raw === undefined ? null : raw;
    }
  }
  return out;
}

/** Valeur initiale d'un champ de saisie à partir de la proposition. */
export function ocrDraftValue(proposal, key, kind) {
  const v = proposal?.[key];
  if (v === null || v === undefined) return "";
  if (kind === "date") return String(v).slice(0, 10);
  return String(v);
}
