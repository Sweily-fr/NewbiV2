"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";

const chartConfig = {
  grossMarginRate: { label: "Taux de marge brute %", color: "#5b50ff" },
};

const formatMonthLabel = (monthStr) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date
    .toLocaleDateString("fr-FR", { month: "short" })
    .replace(".", "")
    .toUpperCase();
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

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
      <p className="font-medium mb-10 capitalize">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#5b50ff" }} />
            Taux de marge brute
          </span>
          <span className={`font-medium ${data.grossMarginRate >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {data.grossMarginRate.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-6 text-muted-foreground">
          <span>CA HT net</span>
          <span>{formatCurrency(data.netRevenueHT)}</span>
        </div>
        <div className="flex items-center justify-between gap-6 text-muted-foreground">
          <span>Dépenses HT</span>
          <span>{formatCurrency(data.expenseAmountHT)}</span>
        </div>
        <div className="flex items-center justify-between gap-6 text-muted-foreground">
          <span>Marge brute</span>
          <span>{formatCurrency(data.grossMargin)}</span>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsMarginChart({ monthlyRevenue, loading }) {
  const chartData = useMemo(() => {
    if (!monthlyRevenue?.length) return [];
    return monthlyRevenue.map((m) => ({
      ...m,
      monthLabel: formatMonthLabel(m.month),
      // Use grossMarginRate from backend instead of computing client-side
      grossMarginRate: m.grossMarginRate ?? 0,
    }));
  }, [monthlyRevenue]);

  if (loading) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Taux de marge brute %</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
          <Skeleton className="min-h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Taux de marge brute %</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 flex items-center justify-center flex-1 min-h-[350px] text-muted-foreground">
          Aucune donnée pour cette période
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs flex flex-col min-h-0 py-4">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Taux de marge brute %</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
        <ChartContainer config={chartConfig} className="flex-1 min-h-[350px] w-full">
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="fillMarginRate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5b50ff" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#5b50ff" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <YAxis
            tickCount={6}
            tick={({ y, payload }) => (
              <text x={0} y={y} textAnchor="start" dominantBaseline="middle" fontSize={11} className="fill-muted-foreground">
                {`${payload.value}%`}
              </text>
            )}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
          <Area
            type="bump"
            dataKey="grossMarginRate"
            stroke="#5b50ff"
            strokeWidth={1.5}
            fill="url(#fillMarginRate)"
            fillOpacity={0.4}
            dot={false}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </AreaChart>
      </ChartContainer>
      </CardContent>
    </Card>
  );
}
