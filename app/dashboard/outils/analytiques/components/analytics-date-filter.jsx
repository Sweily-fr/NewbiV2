"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Calendar } from "@/src/components/ui/calendar";
import { CalendarDays, X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const PERIOD_PRESETS = [
  { value: "current_month", label: "Mois en cours" },
  { value: "last_3_months", label: "3 derniers mois" },
  { value: "current_year", label: "Année en cours" },
  { value: "last_year", label: "Année précédente" },
];

function getDateRangeForPreset(preset) {
  const now = new Date();
  switch (preset) {
    case "current_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: formatDate(start), endDate: formatDate(end) };
    }
    case "last_3_months": {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: formatDate(start), endDate: formatDate(end) };
    }
    case "current_year": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { startDate: formatDate(start), endDate: formatDate(end) };
    }
    case "last_year": {
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear() - 1, 11, 31);
      return { startDate: formatDate(start), endDate: formatDate(end) };
    }
    default:
      return null;
  }
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function AnalyticsDateFilter({ period, onPeriodChange, dateRange, onDateRangeChange }) {
  const [open, setOpen] = useState(false);
  const [calendarRange, setCalendarRange] = useState(undefined);

  const handlePresetClick = (preset) => {
    onPeriodChange(preset);
    const range = getDateRangeForPreset(preset);
    if (range) onDateRangeChange(range);
    setCalendarRange(undefined);
    setOpen(false);
  };

  const handleCalendarSelect = (range) => {
    setCalendarRange(range || undefined);
    if (range?.from && range?.to) {
      onPeriodChange("custom");
      onDateRangeChange({
        startDate: formatDate(range.from),
        endDate: formatDate(range.to),
      });
    }
  };

  const handleClear = () => {
    setCalendarRange(undefined);
    handlePresetClick("current_year");
  };

  const currentLabel = period === "custom"
    ? dateRange?.startDate && dateRange?.endDate
      ? `${format(new Date(dateRange.startDate), "dd MMM yyyy", { locale: fr })} - ${format(new Date(dateRange.endDate), "dd MMM yyyy", { locale: fr })}`
      : "Personnalisée"
    : PERIOD_PRESETS.find((p) => p.value === period)?.label || "Période";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarDays className="h-4 w-4" />
          <span className="truncate max-w-[200px]">{currentLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-3 space-y-2">
          {/* Raccourcis rapides */}
          <div className="flex flex-wrap gap-1.5">
            {PERIOD_PRESETS.map((preset) => (
              <Button
                key={preset.value}
                variant={period === preset.value ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => handlePresetClick(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Calendrier */}
        <div className="border-t pt-3 pb-5 flex justify-center">
          <Calendar
            mode="range"
            selected={calendarRange}
            onSelect={handleCalendarSelect}
            locale={fr}
            numberOfMonths={2}
            className="p-0"
          />
        </div>

        {/* Plage sélectionnée */}
        {calendarRange?.from && (
          <div className="border-t px-3 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {format(calendarRange.from, "dd MMM yyyy", { locale: fr })}
                {calendarRange.to &&
                  ` - ${format(calendarRange.to, "dd MMM yyyy", { locale: fr })}`}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleClear}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { getDateRangeForPreset };
