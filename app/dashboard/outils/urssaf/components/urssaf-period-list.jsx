"use client";

import { cn } from "@/src/lib/utils";
import {
  URSSAF_PERIOD_STATUS,
  formatUrssafCents,
  formatUrssafDay,
  formatUrssafEuros,
} from "@/src/utils/urssaf-declaration";

function periodDetail(period) {
  if (period.status === "DECLARED") {
    const revenue = `${formatUrssafEuros(period.revenue)} déclarés`;
    return period.totalToPay > 0
      ? `${revenue}, ${formatUrssafCents(period.totalToPay)} estimés`
      : revenue;
  }
  return `Limite : ${formatUrssafDay(period.dueDate)}`;
}

export function UrssafPeriodList({ periods, selectedKey, onSelect }) {
  return (
    <nav aria-label="Périodes de déclaration">
      <ul className="flex flex-col gap-1">
        {periods.map((period) => {
          const status = URSSAF_PERIOD_STATUS[period.status];
          const selected = period.key === selectedKey;
          return (
            <li key={period.key}>
              <button
                type="button"
                onClick={() => onSelect(period.key)}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "hover:bg-accent focus-visible:ring-ring w-full cursor-pointer rounded-md px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  selected && "bg-accent",
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 text-sm font-medium">
                    {period.label}
                  </span>
                  <span className={cn("shrink-0 text-xs", status?.className)}>
                    {status?.label}
                  </span>
                </span>
                <span className="text-muted-foreground mt-0.5 block text-xs">
                  {periodDetail(period)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
