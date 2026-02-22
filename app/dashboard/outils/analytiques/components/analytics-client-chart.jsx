"use client";

import { useMemo } from "react";
import { Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid, LabelList } from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import { Skeleton } from "@/src/components/ui/skeleton";

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
    <div className="rounded-lg border bg-background p-3 shadow-sm text-sm">
      <p className="font-medium mb-1">{data.clientName}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span>CA TTC</span>
          <span className="font-medium">{formatCurrency(data.totalTTC)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Factures</span>
          <span className="font-medium">{data.invoiceCount}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Part</span>
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
    return topClients.map((c) => ({
      ...c,
      shortName:
        c.clientName.length > 20
          ? c.clientName.substring(0, 18) + "..."
          : c.clientName,
    }));
  }, [topClients]);

  if (loading) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Top 10 clients</h3>
        <Skeleton className="h-[350px] w-full" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Top 10 clients</h3>
        <div className="flex items-center justify-center h-[350px] text-muted-foreground">
          Aucune donnée pour cette période
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-base font-medium mb-4">Top 10 clients</h3>
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
            fill="#5b50ff"
            radius={[0, 4, 4, 0]}
            barSize={24}
          >
            <LabelList dataKey="shortName" content={<BarLabel />} />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
