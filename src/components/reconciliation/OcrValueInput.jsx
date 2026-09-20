"use client";

import { Input } from "@/src/components/ui/input";

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
      <Input
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
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
