"use client";

import { useMemo } from "react";
import { Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid, LabelList, Cell } from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";

const CLIENT_COLORS = [
  "#5b50ff", "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#a855f7", "#06b6d4", "#f97316", "#ec4899", "#64748b",
];

const chartConfig = {
  totalTTC: { label: "CA TTC", color: "#5b50ff" },
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

  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm text-sm min-w-[200px]">
      <p className="font-medium mb-2 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: data.fill }} />
        {data.clientName}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">CA TTC</span>
          <span className="font-medium">{formatCurrency(data.totalTTC)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Factures</span>
          <span className="font-medium">{data.invoiceCount}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Part</span>
          <span className="font-medium">{data.percentage?.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

function BarLabel({ x, y, width, height, value }) {
  const isInside = width > value.length * 7 + 16;
  return (
    <text
      x={isInside ? x + 8 : x + width + 6}
      y={y + height / 2}
      fill={isInside ? "#fff" : "hsl(var(--foreground))"}
      dominantBaseline="central"
      fontSize={11}
      fontWeight={500}
    >
      {value}
    </text>
  );
}

export function AnalyticsClientChart({ topClients, loading }) {
  const chartData = useMemo(() => {
    if (!topClients?.length) return [];
    return topClients.map((c, i) => ({
      ...c,
      shortName:
        c.clientName.length > 20
          ? c.clientName.substring(0, 18) + "..."
          : c.clientName,
      fill: CLIENT_COLORS[i % CLIENT_COLORS.length],
    }));
  }, [topClients]);

  if (loading) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top 10 clients</CardTitle>
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
          <CardTitle className="text-sm font-medium">Top 10 clients</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 flex items-center justify-center flex-1 min-h-[350px] text-muted-foreground">
          Aucune donnée pour cette période
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs flex flex-col min-h-0 py-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Top 10 clients</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
      <ChartContainer config={chartConfig} className="h-[350px] w-full">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            hide
            width={0}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="totalTTC"
            radius={[0, 4, 4, 0]}
            barSize={24}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            <LabelList dataKey="shortName" content={<BarLabel />} />
          </Bar>
        </BarChart>
      </ChartContainer>
      </CardContent>
    </Card>
  );
}
