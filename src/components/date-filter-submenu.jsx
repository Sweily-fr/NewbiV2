"use client";

import { format, isSameDay, startOfDay, subDays } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/src/components/ui/button";
import { Calendar } from "@/src/components/ui/calendar";
import { DropdownMenuSubContent } from "@/src/components/ui/dropdown-menu";
import { cn } from "@/src/lib/utils";

// Plages rapides partagées par les filtres Factures / Devis / Bons de
// commande. `days` = nombre de jours jusqu'à aujourd'hui inclus, `offset` =
// décalage vers le passé (Hier = 1 jour décalé d'un jour).
const QUICK_RANGES = [
  { key: "today", label: "Aujourd'hui", days: 1, offset: 0 },
  { key: "yesterday", label: "Hier", days: 1, offset: 1 },
  { key: "last7days", label: "7 derniers jours", days: 7, offset: 0 },
  { key: "last30days", label: "30 derniers jours", days: 30, offset: 0 },
];

function quickRangeBounds({ days, offset }) {
  const today = startOfDay(new Date());
  const to = subDays(today, offset);
  return { from: subDays(to, days - 1), to };
}

// Plage rapide correspondant à la sélection courante (pour la surligner).
function findActiveQuickRange(dateRange) {
  if (!dateRange?.from || !dateRange?.to) return null;
  return (
    QUICK_RANGES.find((range) => {
      const bounds = quickRangeBounds(range);
      return (
        isSameDay(bounds.from, dateRange.from) &&
        isSameDay(bounds.to, dateRange.to)
      );
    })?.key ?? null
  );
}

function formatDay(date) {
  return format(date, "d MMM yyyy", { locale: fr });
}

/**
 * Contenu du sous-menu « Date d'émission » des filtres de documents :
 * plages rapides, calendrier, rappel de la plage choisie + Effacer.
 * Les trois zones ont une hauteur stable pour que le sous-menu ne se
 * repositionne pas pendant la sélection.
 */
export function DateFilterSubmenu({
  dateRange,
  onSelectRange,
  onQuickRange,
  onClear,
}) {
  const activeQuickRange = findActiveQuickRange(dateRange);
  const from = dateRange?.from || null;
  const to = dateRange?.to || null;

  let summary = "Aucune période sélectionnée";
  if (from && to && !isSameDay(from, to)) {
    summary = `${formatDay(from)} - ${formatDay(to)}`;
  } else if (from) {
    summary = formatDay(from);
  }

  return (
    <DropdownMenuSubContent className="w-auto p-0" sideOffset={6}>
      <div className="flex max-w-[296px] flex-wrap gap-1.5 px-3 pt-3 pb-2.5">
        {QUICK_RANGES.map((range) => {
          const active = activeQuickRange === range.key;
          return (
            <Button
              key={range.key}
              type="button"
              variant={active ? "primary" : "outline"}
              size="sm"
              className={cn(
                "h-7 rounded-full px-3 text-xs font-normal",
                active && "font-medium",
              )}
              onClick={() => onQuickRange(range.key)}
            >
              {range.label}
            </Button>
          );
        })}
      </div>

      <div className="border-t px-3 pt-2 pb-1">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={onSelectRange}
          defaultMonth={from || undefined}
          locale={fr}
          numberOfMonths={1}
          className="p-0"
        />
      </div>

      <div className="flex min-h-11 items-center justify-between gap-3 border-t px-3 py-1.5">
        <p
          className={cn(
            "truncate text-xs",
            from ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {summary}
          {from && !to && (
            <span className="ml-1 italic text-muted-foreground">
              (choisissez la date de fin)
            </span>
          )}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 px-2 text-xs"
          disabled={!from}
          onClick={onClear}
        >
          Effacer
        </Button>
      </div>
    </DropdownMenuSubContent>
  );
}
