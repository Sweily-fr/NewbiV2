"use client";

import { useState, useMemo } from "react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import { Layers, Group } from "lucide-react";

const chartConfig = {
  invoiceCount: { label: "Factures", color: "#5b50ff" },
  expenseCount: { label: "Dépenses", color: "#5b50ff" },
};

const formatMonthLabel = (monthStr) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date
    .toLocaleDateString("fr-FR", { month: "short" })
    .replace(".", "")
    .toUpperCase() + ` ${year.slice(2)}`;
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const [year, month] = (data.month || "").split("-");
  const monthDate = new Date(parseInt(year), parseInt(month) - 1);
  const label = monthDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm text-sm">
      <p className="font-medium mb-2 capitalize">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#5b50ff" }} />
            Factures
          </span>
          <span className="font-medium">{data.invoiceCount}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#5b50ff", opacity: 0.5 }} />
            Dépenses
          </span>
          <span className="font-medium">{data.expenseCount}</span>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsCountChart({ monthlyRevenue, loading }) {
  const [stacked, setStacked] = useState("grouped");

  const chartData = useMemo(() => {
    if (!monthlyRevenue?.length) return [];
    return monthlyRevenue.map((m) => ({
      ...m,
      monthLabel: formatMonthLabel(m.month),
    }));
  }, [monthlyRevenue]);

  if (loading) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Nombre de documents</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Nombre de documents</h3>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Aucune donnée pour cette période
        </div>
      </div>
    );
  }

  const isStacked = stacked === "stacked";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium">Nombre de documents</h3>
        <ToggleGroup type="single" value={stacked} onValueChange={(v) => v && setStacked(v)} size="sm">
          <ToggleGroupItem value="grouped" aria-label="Groupé">
            <Group className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="stacked" aria-label="Empilé">
            <Layers className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span className="text-xs">
                {value === "invoiceCount" ? "Factures" : "Dépenses"}
              </span>
            )}
          />
          <Bar
            dataKey="invoiceCount"
            fill="#5b50ff"
            fillOpacity={0.8}
            radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
            barSize={isStacked ? 24 : 16}
            stackId={isStacked ? "a" : undefined}
          />
          <Bar
            dataKey="expenseCount"
            fill="#5b50ff"
            fillOpacity={0.4}
            radius={isStacked ? [4, 4, 0, 0] : [4, 4, 0, 0]}
            barSize={isStacked ? 24 : 16}
            stackId={isStacked ? "a" : undefined}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
