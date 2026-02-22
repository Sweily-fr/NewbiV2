"use client";

import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { Info, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/src/lib/utils";

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatPercent = (value) =>
  `${(value || 0).toFixed(1)}%`;

const formatNumber = (value) =>
  (value || 0).toString();

const formatDays = (value) =>
  `${Math.round(value || 0)}j`;

/**
 * Compute N-1 variation percentage
 */
function computeVariation(current, previous) {
  if (previous == null || previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

/**
 * Renders a row of KPI stats in the same compact style as the invoice page.
 * Items are grouped inside bordered cards, separated by vertical dividers.
 */
export function AnalyticsKpiRow({ config, kpi, previousPeriod, loading }) {
  if (loading) {
    return (
      <div className="overflow-x-auto scrollbar-hide">
        <div className="bg-background border rounded-lg px-4 py-3 flex items-center gap-4 w-fit">
          {config.map((item) => (
            <div key={item.key} className="pr-4 last:pr-0 border-r last:border-r-0 border-border">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="bg-background border rounded-lg px-4 py-3 flex items-center w-fit">
        {config.map((item, index) => {
          const value = kpi?.[item.key] ?? 0;
          const format = item.format || formatCurrency;
          const formattedValue = format(value);
          const previousValue = item.previousKey
            ? previousPeriod?.[item.previousKey]
            : previousPeriod?.[item.key];
          const variation = computeVariation(value, previousValue);
          const isPositive = variation != null && (item.invertTrend ? variation < 0 : variation > 0);
          const isNegative = variation != null && (item.invertTrend ? variation > 0 : variation < 0);

          // Currency suffix
          const isCurrency = !item.format || item.format === formatCurrency;

          return (
            <div key={item.key} className="flex items-center">
              {/* Vertical separator between items */}
              {index > 0 && <div className="w-px h-10 bg-border mx-4" />}

              <div>
                <div className="flex items-center gap-1.5 mb-1 whitespace-nowrap">
                  <span className="text-xs text-muted-foreground">
                    {item.label}
                  </span>
                  {item.tooltip && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="bg-[#202020] text-white border-0"
                        >
                          <p>{item.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {/* N-1 variation badge */}
                  {variation != null && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 text-[10px] font-medium rounded-full px-1.5 py-0.5",
                        isPositive && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
                        isNegative && "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
                        !isPositive && !isNegative && "bg-muted text-muted-foreground"
                      )}
                    >
                      {isPositive && <ArrowUpRight className="h-2.5 w-2.5" />}
                      {isNegative && <ArrowDownRight className="h-2.5 w-2.5" />}
                      {variation > 0 ? "+" : ""}{variation.toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-medium tracking-tight">
                    {formattedValue}
                  </span>
                  {isCurrency && (
                    <span className="text-xs text-muted-foreground">€</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Re-export format helpers
export { formatCurrency, formatPercent, formatNumber, formatDays };
