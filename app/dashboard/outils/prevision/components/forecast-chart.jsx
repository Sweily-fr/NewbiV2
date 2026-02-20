"use client";

import { useMemo, useCallback } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  ReferenceArea,
  Cell,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  ChartContainer,
} from "@/src/components/ui/chart";
import { Skeleton } from "@/src/components/ui/skeleton";

const chartConfig = {
  actualIncome: { label: "Entrées réelles", color: "#22c55e" },
  forecastIncome: { label: "Prév. entrées", color: "#22c55e" },
  actualExpense: { label: "Sorties réelles", color: "#f87171" },
  forecastExpense: { label: "Prév. sorties", color: "#f87171" },
  balance: { label: "Solde", color: "#3b82f6" },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatMonthLabel = (monthStr) => {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  const label = date
    .toLocaleDateString("fr-FR", { month: "short" })
    .replace(".", "")
    .toUpperCase();
  return `${label}. ${year.slice(2)}`;
};

// Custom tooltip matching the reference design
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  // Parse month for display
  const [year, month] = (data.month || "").split("-");
  const monthDate = new Date(parseInt(year), parseInt(month) - 1);
  const monthLabel = monthDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  const capitalizedLabel =
    monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const forecastIncome = data.forecastIncome || 0;
  const actualIncome = data.actualIncome || 0;
  const forecastExpense = data.forecastExpense || 0;
  const actualExpense = data.actualExpense || 0;

  const incomePct =
    forecastIncome > 0
      ? Math.round((actualIncome / forecastIncome) * 100)
      : null;
  const expensePct =
    forecastExpense > 0
      ? Math.round((actualExpense / forecastExpense) * 100)
      : null;

  return (
    <div className="bg-white dark:bg-card rounded-xl shadow-lg border p-4 min-w-[240px]">
      <div className="text-sm font-medium text-foreground border-b pb-2 mb-3">
        {capitalizedLabel}
      </div>

      {/* Entrées */}
      {(forecastIncome > 0 || actualIncome > 0) && (
        <div className="mb-3">
          <div className="text-xs font-medium text-foreground mb-1.5">
            Entrées
          </div>
          {forecastIncome > 0 && (
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-green-500/30" style={{
                  backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(34,197,94,0.5) 2px, rgba(34,197,94,0.5) 4px)",
                }} />
                <span className="text-xs text-muted-foreground">Prévision</span>
              </div>
              <span className="text-xs font-medium">{formatCurrency(forecastIncome)}</span>
            </div>
          )}
          {actualIncome > 0 && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-green-500" />
                <span className="text-xs text-muted-foreground">Réelles</span>
              </div>
              <div className="flex items-center gap-2">
                {incomePct !== null && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {incomePct}%
                  </span>
                )}
                <span className="text-xs font-medium">{formatCurrency(actualIncome)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sorties */}
      {(forecastExpense > 0 || actualExpense > 0) && (
        <div>
          <div className="text-xs font-medium text-foreground mb-1.5">
            Sorties
          </div>
          {forecastExpense > 0 && (
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-red-400/30" style={{
                  backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(248,113,113,0.5) 2px, rgba(248,113,113,0.5) 4px)",
                }} />
                <span className="text-xs text-muted-foreground">Prévision</span>
              </div>
              <span className="text-xs font-medium">{formatCurrency(forecastExpense)}</span>
            </div>
          )}
          {actualExpense > 0 && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-red-400" />
                <span className="text-xs text-muted-foreground">Réelles</span>
              </div>
              <div className="flex items-center gap-2">
                {expensePct !== null && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {expensePct}%
                  </span>
                )}
                <span className="text-xs font-medium">{formatCurrency(actualExpense)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ForecastChart({ months, loading, showForecast }) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const chartData = useMemo(() => {
    if (!months?.length) return [];
    return months.map((m) => ({
      month: m.month,
      label: formatMonthLabel(m.month),
      // Actual values (solid bars)
      actualIncome: m.actualIncome || 0,
      actualExpense: m.actualExpense || 0,
      // Forecast remainder (hatched bars) — only the portion above actual
      forecastIncome: showForecast
        ? Math.max(0, (m.forecastIncome || 0) - (m.actualIncome || 0))
        : 0,
      forecastExpense: showForecast
        ? Math.max(0, (m.forecastExpense || 0) - (m.actualExpense || 0))
        : 0,
      // Keep raw forecast for tooltip
      rawForecastIncome: m.forecastIncome || 0,
      rawForecastExpense: m.forecastExpense || 0,
      // Balance line — ensure minimum 0 for cleaner display
      balance: Math.max(0, m.closingBalance || 0),
      rawBalance: m.closingBalance || 0,
      isCurrent: m.month === currentMonth,
    }));
  }, [months, showForecast, currentMonth]);

  // Find current month index for ReferenceArea highlight
  const currentIdx = chartData.findIndex((d) => d.isCurrent);

  if (loading) {
    return (
      <Card className="shadow-xs">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-normal">
          Évolution de la trésorerie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full">
          <ComposedChart
            data={chartData}
            margin={{ left: 0, right: 12, top: 12, bottom: 12 }}
          >
            <defs>
              {/* Striped/hatched pattern for forecast income (green) */}
              <pattern
                id="hatchIncome"
                patternUnits="userSpaceOnUse"
                width="6"
                height="6"
                patternTransform="rotate(45)"
              >
                <rect width="6" height="6" fill="#dcfce7" />
                <line
                  x1="0" y1="0" x2="0" y2="6"
                  stroke="#22c55e"
                  strokeWidth="2.5"
                  strokeOpacity="0.5"
                />
              </pattern>
              {/* Striped/hatched pattern for forecast expense (red) */}
              <pattern
                id="hatchExpense"
                patternUnits="userSpaceOnUse"
                width="6"
                height="6"
                patternTransform="rotate(45)"
              >
                <rect width="6" height="6" fill="#fee2e2" />
                <line
                  x1="0" y1="0" x2="0" y2="6"
                  stroke="#f87171"
                  strokeWidth="2.5"
                  strokeOpacity="0.5"
                />
              </pattern>
              {/* Gradient for balance area fill */}
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              strokeDasharray="0"
              className="stroke-border"
            />

            {/* Current month highlight */}
            {currentIdx >= 0 && (
              <ReferenceArea
                x1={chartData[currentIdx]?.label}
                x2={chartData[currentIdx]?.label}
                className="fill-muted"
                fillOpacity={0.5}
                ifOverflow="extendDomain"
              />
            )}

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={({ x, y, payload }) => {
                const dataItem = chartData.find(
                  (d) => d.label === payload.value
                );
                const isCurrent = dataItem?.isCurrent;
                return (
                  <text
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    fontSize={11}
                    fill={isCurrent ? "#3b82f6" : "#9ca3af"}
                    fontWeight={isCurrent ? 600 : 400}
                  >
                    {payload.value}
                  </text>
                );
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, "auto"]}
              tickFormatter={(v) => {
                if (v === 0) return "0";
                if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                return String(v);
              }}
              width={50}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={false}
            />

            {/* Income bars: actual (solid green) stacked with forecast (hatched green) */}
            <Bar
              dataKey="actualIncome"
              stackId="income"
              fill="#22c55e"
              barSize={14}
              radius={[0, 0, 0, 0]}
            />
            {showForecast && (
              <Bar
                dataKey="forecastIncome"
                stackId="income"
                fill="url(#hatchIncome)"
                barSize={14}
                radius={[2, 2, 0, 0]}
              />
            )}

            {/* Expense bars: actual (solid red) stacked with forecast (hatched red) */}
            <Bar
              dataKey="actualExpense"
              stackId="expense"
              fill="#fca5a5"
              barSize={14}
              radius={[0, 0, 0, 0]}
            />
            {showForecast && (
              <Bar
                dataKey="forecastExpense"
                stackId="expense"
                fill="url(#hatchExpense)"
                barSize={14}
                radius={[2, 2, 0, 0]}
              />
            )}

            {/* Balance line with dots */}
            <Line
              dataKey="balance"
              type="monotone"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{
                r: 3,
                fill: "#ffffff",
                stroke: "#3b82f6",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5,
                fill: "#ffffff",
                stroke: "#3b82f6",
                strokeWidth: 2,
              }}
              connectNulls
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
