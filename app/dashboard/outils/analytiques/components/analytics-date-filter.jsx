"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Calendar } from "@/src/components/ui/calendar";
import { CalendarDays, ChevronDown, Check } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const PERIOD_PRESETS = [
  { value: "current_month", label: "Mois en cours" },
  { value: "last_3_months", label: "3 derniers mois" },
  { value: "current_year", label: "Année en cours" },
  { value: "last_year", label: "Année précédente" },
  { value: "custom", label: "Personnalisée" },
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
  return date.toISOString().split("T")[0];
}

export function AnalyticsDateFilter({ period, onPeriodChange, dateRange, onDateRangeChange }) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customRange, setCustomRange] = useState(undefined);

  const currentPreset = PERIOD_PRESETS.find((p) => p.value === period);

  const handlePresetSelect = (preset) => {
    if (preset === "custom") {
      onPeriodChange("custom");
      // Delay opening to avoid conflict with DropdownMenu close event
      setTimeout(() => setCustomOpen(true), 150);
      return;
    }
    onPeriodChange(preset);
    const range = getDateRangeForPreset(preset);
    if (range) onDateRangeChange(range);
  };

  const handleCustomConfirm = () => {
    if (customRange?.from && customRange?.to) {
      onDateRangeChange({
        startDate: formatDate(customRange.from),
        endDate: formatDate(customRange.to),
      });
      setCustomOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            {currentPreset?.label || "Période"}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Période</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {PERIOD_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.value}
              onClick={() => handlePresetSelect(preset.value)}
              className="gap-2"
            >
              <Check
                className={cn(
                  "h-4 w-4",
                  period === preset.value ? "opacity-100" : "opacity-0"
                )}
              />
              {preset.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {period === "custom" && (
        <Popover open={customOpen} onOpenChange={setCustomOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <CalendarDays className="h-3.5 w-3.5" />
              {dateRange.startDate && dateRange.endDate
                ? `${format(new Date(dateRange.startDate), "dd MMM yyyy", { locale: fr })} – ${format(new Date(dateRange.endDate), "dd MMM yyyy", { locale: fr })}`
                : "Choisir les dates"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end">
            <div className="flex flex-col gap-4">
              <Calendar
                mode="range"
                selected={customRange}
                onSelect={setCustomRange}
                numberOfMonths={2}
                locale={fr}
              />
              <Button
                size="sm"
                onClick={handleCustomConfirm}
                disabled={!customRange?.from || !customRange?.to}
              >
                Appliquer
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {period !== "custom" && dateRange.startDate && dateRange.endDate && (
        <span className="text-xs text-muted-foreground">
          {format(new Date(dateRange.startDate), "dd MMM yyyy", { locale: fr })} -{" "}
          {format(new Date(dateRange.endDate), "dd MMM yyyy", { locale: fr })}
        </span>
      )}
    </div>
  );
}

export { getDateRangeForPreset };
