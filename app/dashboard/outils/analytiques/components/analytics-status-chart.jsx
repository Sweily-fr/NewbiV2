"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Label } from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";

const STATUS_LABELS = {
  DRAFT: "Brouillon",
  PENDING: "En attente",
  OVERDUE: "En retard",
  COMPLETED: "Payée",
  CANCELED: "Annulée",
};

const STATUS_COLORS = {
  DRAFT: "#64748b",
  PENDING: "#f59e0b",
  OVERDUE: "#ef4444",
  COMPLETED: "#10b981",
  CANCELED: "#a855f7",
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

  const totalAmount = useMemo(
    () => chartData.reduce((s, e) => s + (e.totalTTC || 0), 0),
    [chartData]
  );

  if (loading) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Statuts des factures</CardTitle>
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
          <CardTitle className="text-sm font-medium">Statuts des factures</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 flex items-center justify-center flex-1 min-h-[200px] text-muted-foreground">
          Aucune donnée
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs flex flex-col min-h-0 py-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Statuts des factures</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
        <div className="flex items-center gap-8">
          <div className="flex-shrink-0">
            <ChartContainer
              config={chartConfig}
              className="aspect-square h-[280px] w-[280px]"
            >
              <PieChart>
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={false}
                />
                <Pie
                  data={chartData}
                  dataKey="totalTTC"
                  nameKey="name"
                  innerRadius={90}
                  outerRadius={125}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-2xl font-normal"
                            >
                              {formatCurrency(totalAmount).replace(/\s/g, " ")}
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>

          <div className="flex-1 space-y-3">
            {chartData.map((item) => {
              const percentage = totalAmount > 0
                ? ((item.totalTTC / totalAmount) * 100).toFixed(1)
                : "0.0";
              return (
                <div key={item.status} className="flex items-center gap-3">
                  <div
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.fill }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-normal text-foreground truncate">
                      {item.name} ({percentage} %)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
