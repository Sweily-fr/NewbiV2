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
  Legend,
} from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";

const chartConfig = {
  actualIncome: { label: "Revenus réels", color: "#10b981" },
  forecastIncome: { label: "Revenus prévus", color: "#6ee7b7" },
  actualExpense: { label: "Dépenses réelles", color: "#ef4444" },
  forecastExpense: { label: "Dépenses prévues", color: "#fca5a5" },
  closingBalance: { label: "Solde", color: "#3b82f6" },
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
  return (
    date
      .toLocaleDateString("fr-FR", { month: "short" })
      .replace(".", "")
      .toUpperCase() + ` ${year.slice(2)}`
  );
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const label = formatMonthLabel(data.month);

  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm text-sm min-w-[200px]">
      <p className="font-medium mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Revenus réels
          </span>
          <span className="font-medium">{formatCurrency(data.actualIncome)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            Revenus prévus
          </span>
          <span className="font-medium">{formatCurrency(data.forecastIncome)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            Dépenses réelles
          </span>
          <span className="font-medium">{formatCurrency(data.actualExpense)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
            Dépenses prévues
          </span>
          <span className="font-medium">{formatCurrency(data.forecastExpense)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t pt-1 mt-1">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            Solde
          </span>
          <span className="font-medium">{formatCurrency(data.closingBalance)}</span>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsTreasuryForecastChart({ forecastData, loading }) {
  const chartData = useMemo(() => {
    if (!forecastData?.months?.length) return [];
    return forecastData.months.map((m) => ({
      ...m,
      monthLabel: formatMonthLabel(m.month),
    }));
  }, [forecastData]);

  if (loading) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Prévisions de trésorerie</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
          <Skeleton className="min-h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Prévisions de trésorerie</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 flex items-center justify-center flex-1 min-h-[200px] text-muted-foreground">
          Aucune donnée prévisionnelle disponible
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs flex flex-col min-h-0 py-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Prévisions de trésorerie</CardTitle>
          <CardDescription className="text-xs mt-1">Réel vs prévu par mois</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={({ y, payload }) => (
              <text
                x={0}
                y={y}
                textAnchor="start"
                dominantBaseline="middle"
                fontSize={11}
                className="fill-muted-foreground"
              >
                {`${(payload.value / 1000).toFixed(0)}k`}
              </text>
            )}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-muted-foreground">
                {chartConfig[value]?.label || value}
              </span>
            )}
          />
          {/* Revenus réels */}
          <Bar
            dataKey="actualIncome"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            barSize={16}
          />
          {/* Revenus prévus */}
          <Bar
            dataKey="forecastIncome"
            fill="#6ee7b7"
            fillOpacity={0.6}
            radius={[4, 4, 0, 0]}
            barSize={16}
            strokeDasharray="4 2"
            stroke="#6ee7b7"
          />
          {/* Dépenses réelles */}
          <Bar
            dataKey="actualExpense"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
            barSize={16}
          />
          {/* Dépenses prévues */}
          <Bar
            dataKey="forecastExpense"
            fill="#fca5a5"
            fillOpacity={0.6}
            radius={[4, 4, 0, 0]}
            barSize={16}
            strokeDasharray="4 2"
            stroke="#fca5a5"
          />
          {/* Ligne solde */}
          <Line
            type="monotone"
            dataKey="closingBalance"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#3b82f6" }}
            activeDot={{ r: 6, fill: "#3b82f6" }}
          />
        </ComposedChart>
      </ChartContainer>
      </CardContent>
    </Card>
  );
}
