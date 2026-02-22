"use client";

import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import { Skeleton } from "@/src/components/ui/skeleton";

const chartConfig = {
  revenueHT: { label: "CA HT", color: "#10b981" },
  expenseAmountHT: { label: "Dépenses HT", color: "#ef4444" },
  grossMargin: { label: "Marge brute", color: "#5b50ff" },
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
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            CA HT
          </span>
          <span className="font-medium">{formatCurrency(data.revenueHT)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            Dépenses HT
          </span>
          <span className="font-medium">{formatCurrency(data.expenseAmountHT)}</span>
        </div>
        <div className="flex items-center justify-between gap-6 border-t pt-1 mt-1">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#5b50ff" }} />
            Marge brute
          </span>
          <span className={`font-medium ${data.grossMargin >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {formatCurrency(data.grossMargin)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsRevenueChart({ monthlyRevenue, loading }) {
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
        <h3 className="text-base font-medium mb-4">CA, Dépenses et Marge brute</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">CA, Dépenses et Marge brute</h3>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Aucune donnée pour cette période
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-base font-medium mb-4">CA, Dépenses et Marge brute</h3>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={({ y, payload }) => (
              <text x={0} y={y} textAnchor="start" dominantBaseline="middle" fontSize={11} className="fill-muted-foreground">
                {`${(payload.value / 1000).toFixed(0)}k`}
              </text>
            )}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="revenueHT"
            fill="#10b981"
            fillOpacity={0.8}
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
          <Bar
            dataKey="expenseAmountHT"
            fill="#ef4444"
            fillOpacity={0.7}
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
          <Line
            type="monotone"
            dataKey="grossMargin"
            stroke="#5b50ff"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}
