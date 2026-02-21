"use client";

import { useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import { AreaChartIcon, LineChart as LineChartIcon } from "lucide-react";

const chartConfig = {
  cumulativeHT: { label: "CA cumulé HT", color: "#5b50ff" },
  cumulativeTTC: { label: "CA cumulé TTC", color: "#5b50ff" },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

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
            Cumulé HT
          </span>
          <span className="font-medium">{formatCurrency(data.cumulativeHT)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#5b50ff", opacity: 0.5 }} />
            Cumulé TTC
          </span>
          <span className="font-medium">{formatCurrency(data.cumulativeTTC)}</span>
        </div>
        <div className="flex items-center justify-between gap-6 border-t pt-1 mt-1 text-muted-foreground">
          <span>Mois HT</span>
          <span className="font-medium">{formatCurrency(data.revenueHT)}</span>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsCumulativeRevenueChart({ monthlyRevenue, loading }) {
  const [chartType, setChartType] = useState("area");

  const chartData = useMemo(() => {
    if (!monthlyRevenue?.length) return [];
    let cumHT = 0;
    let cumTTC = 0;
    return monthlyRevenue.map((m) => {
      cumHT += m.revenueHT;
      cumTTC += m.revenueTTC;
      return {
        ...m,
        monthLabel: formatMonthLabel(m.month),
        cumulativeHT: Math.round(cumHT * 100) / 100,
        cumulativeTTC: Math.round(cumTTC * 100) / 100,
      };
    });
  }, [monthlyRevenue]);

  if (loading) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">CA cumulé</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">CA cumulé</h3>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Aucune donnée pour cette période
        </div>
      </div>
    );
  }

  const ChartComponent = chartType === "area" ? AreaChart : LineChart;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium">CA cumulé</h3>
        <ToggleGroup type="single" value={chartType} onValueChange={(v) => v && setChartType(v)} size="sm">
          <ToggleGroupItem value="area" aria-label="Area chart">
            <AreaChartIcon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="line" aria-label="Line chart">
            <LineChartIcon className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <ChartComponent data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          {chartType === "area" ? (
            <>
              <Area
                type="monotone"
                dataKey="cumulativeHT"
                stroke="#5b50ff"
                fill="#5b50ff"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="cumulativeTTC"
                stroke="#5b50ff"
                fill="#5b50ff"
                fillOpacity={0.1}
                strokeWidth={2}
                strokeOpacity={0.5}
              />
            </>
          ) : (
            <>
              <Line
                type="monotone"
                dataKey="cumulativeHT"
                stroke="#5b50ff"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="cumulativeTTC"
                stroke="#5b50ff"
                strokeWidth={2}
                strokeOpacity={0.5}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </>
          )}
        </ChartComponent>
      </ChartContainer>
    </div>
  );
}
