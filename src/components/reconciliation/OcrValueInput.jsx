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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import CategorySearchSelect from "@/src/components/category-search-select";

// Radix refuse une option de valeur "" : la valeur vide passe par ce code.
const EMPTY_OPTION = "__none__";

// Sélecteur de date identique aux autres calendriers de la plateforme
// (Popover + Calendar, format dd/MM/yyyy). value = "YYYY-MM-DD" ou "".
function DateField({ value, onChange, className = "", align = "start" }) {
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
      {/* collisionPadding : garde une marge avec le bord de la fenêtre au
          lieu de coller le calendrier contre le bord. */}
      <PopoverContent
        className="w-auto p-0"
        align={align}
        collisionPadding={16}
      >
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
 * comparaison (mode « Modifier ») : texte, date, nombre, liste ou catégorie.
 * `value` est toujours une chaîne (les dialogues convertissent au patch).
 */
export function OcrValueInput({
  kind = "text",
  value,
  onChange,
  options = [],
  placeholder = "",
  className = "",
  // Alignement du calendrier sous le champ : "end" l'ouvre vers la gauche,
  // utile quand le champ est en fin de ligne.
  align = "start",
  // Remplace la largeur par défaut du champ (qui varie selon le type) par
  // une largeur unique, pour aligner une colonne de champs.
  widthClassName = null,
}) {
  const base = `h-8 text-sm ${className}`;
  const width = (fallback) => widthClassName || fallback;
  if (kind === "select") {
    // Liste de la plateforme (même rendu que les tiroirs) plutôt que la
    // liste déroulante du navigateur
    return (
      <Select
        value={value || EMPTY_OPTION}
        onValueChange={(v) => onChange(v === EMPTY_OPTION ? "" : v)}
      >
        <SelectTrigger className={`${base} ${width("w-full")}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={EMPTY_OPTION}>-</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (kind === "category") {
    // Même sélecteur de catégorie que les tiroirs (recherche, groupes).
    // Recliquer la catégorie choisie la viderait : on la garde, comme
    // l'ancienne liste.
    return (
      <CategorySearchSelect
        value={value ?? ""}
        onValueChange={(v) => {
          if (v) onChange(v);
        }}
        triggerClassName={`${base} ${width("w-full")}`}
      />
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
        className={`${base} ${width("w-32")}`}
      />
    );
  }
  if (kind === "date") {
    return (
      <DateField
        value={value ?? ""}
        onChange={onChange}
        align={align}
        className={`${base} ${width("w-40")}`}
      />
    );
  }
  return (
    <Input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${base} ${width("w-full min-w-[10rem]")}`}
    />
  );
}

/**
 * Nombre saisi en texte : virgule décimale, espaces des milliers (insécables
 * compris, « 1 234,56 »), points ou virgules des milliers (« 1.234,56 »,
 * « 1,234.56 ») et symboles € et % acceptés. null si vide ou illisible (une
 * saisie sans chiffre, faite d'espaces ou de « € », n'est pas 0).
 */
export function parseOcrNumber(raw) {
  if (raw === "" || raw === null || raw === undefined) return null;
  let s = String(raw).replace(/[\s€%]/g, "");
  if (!/\d/.test(s)) return null;
  // Le dernier séparateur est décimal, les autres séparent les milliers ;
  // un même séparateur répété seul (« 1.234.567 ») ne sépare que des milliers
  const last = Math.max(s.lastIndexOf(","), s.lastIndexOf("."));
  if (last >= 0) {
    const sep = s[last];
    const other = sep === "," ? "." : ",";
    if (s.indexOf(sep) !== last && !s.includes(other)) {
      s = s.split(sep).join("");
    } else {
      s = `${s.slice(0, last).replace(/[.,]/g, "")}.${s.slice(last + 1)}`;
    }
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Applique des brouillons (chaînes saisies) sur une proposition OCR :
 * nombres convertis (cf. parseOcrNumber), vide = non lu.
 */
export function applyOcrDrafts(proposal, drafts, numberKeys) {
  if (!proposal) return proposal;
  const out = { ...proposal };
  for (const [key, raw] of Object.entries(drafts || {})) {
    if (numberKeys.has(key)) {
      out[key] = parseOcrNumber(raw);
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
