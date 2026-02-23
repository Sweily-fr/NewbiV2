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
      <div>
        <h3 className="text-base font-medium mb-1">Prévisions de trésorerie</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Réel vs prévu par mois avec évolution du solde
        </p>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div>
        <h3 className="text-base font-medium mb-1">Prévisions de trésorerie</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Réel vs prévu par mois avec évolution du solde
        </p>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Aucune donnée prévisionnelle disponible
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-base font-medium mb-1">Prévisions de trésorerie</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Réel vs prévu par mois avec évolution du solde
      </p>
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
    </div>
  );
}
