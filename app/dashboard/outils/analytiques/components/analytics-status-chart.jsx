"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import { Skeleton } from "@/src/components/ui/skeleton";

const STATUS_LABELS = {
  DRAFT: "Brouillon",
  PENDING: "En attente",
  OVERDUE: "En retard",
  COMPLETED: "Payée",
  CANCELED: "Annulée",
};

const STATUS_COLORS = {
  DRAFT: "rgba(91, 80, 255, 0.3)",
  PENDING: "rgba(91, 80, 255, 0.55)",
  OVERDUE: "rgba(91, 80, 255, 0.7)",
  COMPLETED: "rgba(91, 80, 255, 1)",
  CANCELED: "rgba(91, 80, 255, 0.15)",
};

const chartConfig = Object.fromEntries(
  Object.entries(STATUS_LABELS).map(([key, label]) => [
    key,
    { label, color: STATUS_COLORS[key] },
  ])
);

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
      <p className="font-medium mb-1">{STATUS_LABELS[data.status] || data.status}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span>Montant TTC</span>
          <span className="font-medium">{formatCurrency(data.totalTTC)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Nombre</span>
          <span className="font-medium">{data.count}</span>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsStatusChart({ statusBreakdown, loading }) {
  const chartData = useMemo(() => {
    if (!statusBreakdown?.length) return [];
    return statusBreakdown.map((s) => ({
      ...s,
      name: STATUS_LABELS[s.status] || s.status,
      fill: STATUS_COLORS[s.status] || "#94a3b8",
    }));
  }, [statusBreakdown]);

  if (loading) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Statuts des factures</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Statuts des factures</h3>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Aucune donnée
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-base font-medium mb-4">Statuts des factures</h3>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="totalTTC"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={70}
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span className="text-xs">{value}</span>
            )}
          />
        </PieChart>
      </ChartContainer>
    </div>
  );
}
