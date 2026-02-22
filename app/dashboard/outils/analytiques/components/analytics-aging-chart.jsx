"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import { Skeleton } from "@/src/components/ui/skeleton";

const chartConfig = {
  totalTTC: { label: "Montant TTC", color: "#5b50ff" },
};

const BUCKET_COLORS = ["#fbbf24", "#f97316", "#ef4444", "#dc2626"];

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
      <p className="font-medium mb-2">{data.label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6">
          <span>Montant</span>
          <span className="font-medium">{formatCurrency(data.totalTTC)}</span>
        </div>
        <div className="flex items-center justify-between gap-6 text-muted-foreground">
          <span>Factures</span>
          <span>{data.count}</span>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsAgingChart({ agingBuckets, loading }) {
  const chartData = useMemo(() => {
    if (!agingBuckets?.length) return [];
    return agingBuckets;
  }, [agingBuckets]);

  if (loading) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Ancienneté des créances</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  const hasData = chartData.some((b) => b.count > 0);

  if (!hasData) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Ancienneté des créances</h3>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Aucune créance en cours
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-base font-medium mb-4">Ancienneté des créances</h3>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
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
          <Bar dataKey="totalTTC" radius={[4, 4, 0, 0]} barSize={40}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={BUCKET_COLORS[index] || BUCKET_COLORS[3]} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
