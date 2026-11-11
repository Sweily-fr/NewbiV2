"use client";

import { useMemo, useState } from "react";
import { CheckIcon, ChevronDownIcon, Loader2, X } from "lucide-react";

import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";

export const MAX_ACTIVITY_CODES = 50;
const MAX_NAF_RESULTS = 50;

// Recherche insensible à la casse et aux accents (« electricien » trouve
// « Électricien »)
const normalize = (text) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

// « 47.76 z » → « 4776Z » : un code se tape avec ou sans point
const normalizeCode = (text) =>
  String(text || "")
    .toUpperCase()
    .replace(/[.\s]/g, "");

/** 2 si le libellé ou un code commence par la saisie, 1 s'il la contient. */
function score(query, label, codes) {
  const text = normalize(label);
  const code = normalizeCode(query);
  if (text.startsWith(query) || codes.some((c) => c.startsWith(code))) return 2;
  if (
    text.includes(query) ||
    (code.length >= 2 && codes.some((c) => c.includes(code)))
  )
    return 1;
  return 0;
}

/** Codes NAF distincts d'une sélection (un métier en apporte plusieurs). */
export function selectedCodes(selection) {
  return new Set(selection.flatMap((s) => s.codes));
}

/**
 * Activités recherchées : métiers courants (avec leurs codes NAF) en tête,
 * puis n'importe quelle sous-classe de la nomenclature NAF. Sélection
 * multiple, `maxCodes` codes au plus (50 par défaut).
 */
export default function ProspectActivityPicker({
  trades = [],
  activities = [],
  loadingActivities = false,
  value,
  onChange,
  maxCodes = MAX_ACTIVITY_CODES,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const query = normalize(search);
  const chosen = useMemo(() => new Set(value.map((v) => v.key)), [value]);
  const codeCount = selectedCodes(value).size;

  const tradeOptions = useMemo(
    () =>
      trades
        .map((t) => ({
          key: `trade:${t.id}`,
          type: "trade",
          id: t.id,
          label: t.label,
          codes: t.nafCodes || [],
        }))
        .map((o) => ({
          ...o,
          score: query ? score(query, o.label, o.codes) : 1,
        }))
        .filter((o) => o.score > 0)
        .sort((a, b) => b.score - a.score),
    [trades, query],
  );

  const nafOptions = useMemo(() => {
    if (!query) return [];
    return activities
      .map((a) => ({
        key: `naf:${a.code}`,
        type: "naf",
        id: a.code,
        label: a.label,
        codes: [a.code],
        score: score(query, a.label, [a.code]),
      }))
      .filter((o) => o.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_NAF_RESULTS);
  }, [activities, query]);

  const toggle = (option) => {
    if (chosen.has(option.key)) {
      onChange(value.filter((v) => v.key !== option.key));
      return;
    }
    const { key, type, id, label, codes } = option;
    onChange([...value, { key, type, id, label, codes }]);
  };

  // Ajout refusé s'il ferait dépasser la limite de codes
  const wouldOverflow = (option) =>
    !chosen.has(option.key) &&
    selectedCodes([...value, option]).size > maxCodes;

  const renderOption = (option, codesLabel) => {
    const blocked = wouldOverflow(option);
    return (
      <CommandItem
        key={option.key}
        value={option.key}
        disabled={blocked}
        onSelect={() => toggle(option)}
        className="items-start gap-2"
      >
        <CheckIcon
          size={16}
          className={cn(
            "mt-0.5 shrink-0",
            chosen.has(option.key) ? "opacity-100" : "opacity-0",
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="block">{option.label}</span>
          {blocked && (
            <span className="block text-xs text-muted-foreground">
              Limite de {maxCodes} codes NAF atteinte
            </span>
          )}
        </span>
        <span className="shrink-0 pt-0.5 font-mono text-xs text-muted-foreground">
          {codesLabel}
        </span>
      </CommandItem>
    );
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <span
              key={v.key}
              className="inline-flex max-w-full items-center gap-1 rounded-md bg-[#5a50ff]/10 px-2 py-1 text-xs font-medium text-[#5a50ff] dark:text-[#8b85ff]"
            >
              <span className="truncate">
                {v.type === "naf" ? (
                  <>
                    <span className="font-mono">{v.id}</span> · {v.label}
                  </>
                ) : (
                  v.label
                )}
              </span>
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x.key !== v.key))}
                aria-label={`Retirer ${v.label}`}
                className="shrink-0 opacity-60 hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) setSearch("");
          setOpen(next);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between border-input bg-background px-3 font-normal hover:bg-background"
          >
            <span className="truncate text-muted-foreground">
              {value.length
                ? "Ajouter une activité"
                : "Métier, activité ou code NAF"}
            </span>
            <ChevronDownIcon
              size={16}
              className="shrink-0 text-muted-foreground/80"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popper-anchor-width)] border-input p-0"
          align="start"
          sideOffset={4}
        >
          {/* Filtre et tri faits ici : 732 activités, seules les 50 meilleures
              sont rendues */}
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Ex. fleuriste, menuisier, 4776Z"
              value={search}
              onValueChange={setSearch}
            />
            {/* Molette et doigt : la liste défile même sous le verrou de
                défilement de la fenêtre parente */}
            <CommandList
              className="max-h-[280px] overflow-y-auto overscroll-contain"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <CommandEmpty>
                {loadingActivities ? (
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Chargement des activités…
                  </span>
                ) : (
                  "Aucune activité trouvée."
                )}
              </CommandEmpty>
              {tradeOptions.length > 0 && (
                <CommandGroup heading="Métiers courants">
                  {tradeOptions.map((o) =>
                    renderOption(o, o.codes.join(" · ")),
                  )}
                </CommandGroup>
              )}
              {nafOptions.length > 0 && (
                <CommandGroup heading="Toutes les activités (code NAF)">
                  {nafOptions.map((o) => renderOption(o, o.id))}
                </CommandGroup>
              )}
              {!query && (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  Tapez un mot ou un code pour chercher parmi les{" "}
                  {activities.length || 732} activités de la nomenclature NAF.
                </p>
              )}
            </CommandList>
          </Command>
          <p className="border-t px-3 py-2 text-xs text-muted-foreground">
            {codeCount}/{maxCodes} codes NAF choisis
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
