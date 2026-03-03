"use client";

import { useMemo } from "react";
import {
  Area,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";

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
    .toUpperCase();
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
  const chartData = useMemo(() => {
    if (!monthlyRevenue?.length) return [];
    let cumHT = 0;
    let cumTTC = 0;
    return monthlyRevenue.map((m) => {
      cumHT += m.revenueHT || 0;
      cumTTC += m.revenueTTC || 0;
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
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">CA cumulé</CardTitle>
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
          <CardTitle className="text-sm font-medium">CA cumulé</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 flex items-center justify-center flex-1 min-h-[200px] text-muted-foreground">
          Aucune donnée pour cette période
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs flex flex-col min-h-0 py-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">CA cumulé</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
        <ChartContainer config={chartConfig} className="flex-1 min-h-[350px] w-full">
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
                {`${(payload.value / 1000).toFixed(0)}k`}
              </text>
            )}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="bump"
            dataKey="cumulativeHT"
            stroke="#5b50ff"
            fill="#5b50ff"
            fillOpacity={0.25}
            strokeWidth={1.5}
          />
          <Area
            type="bump"
            dataKey="cumulativeTTC"
            stroke="#5b50ff"
            fill="#5b50ff"
            fillOpacity={0.1}
            strokeWidth={1.5}
            strokeOpacity={0.5}
          />
        </ComposedChart>
      </ChartContainer>
      </CardContent>
    </Card>
  );
}
