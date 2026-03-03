"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";

const TYPE_LABELS = {
  COMPANY: "Entreprise",
  INDIVIDUAL: "Particulier",
};

const TYPE_COLORS = {
  COMPANY: "#5b50ff",
  INDIVIDUAL: "#10b981",
};

const chartConfig = {
  COMPANY: { label: "Entreprise", color: "#5b50ff" },
  INDIVIDUAL: { label: "Particulier", color: "#10b981" },
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
      <p className="font-medium mb-1">{data.name}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span>CA TTC</span>
          <span className="font-medium">{formatCurrency(data.totalTTC)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Clients</span>
          <span className="font-medium">{data.clientCount}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Factures</span>
          <span className="font-medium">{data.invoiceCount}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Part</span>
          <span className="font-medium">{data.percentage.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsClientTypeChart({ revenueByClient, loading }) {
  const chartData = useMemo(() => {
    if (!revenueByClient?.length) return [];

    const grouped = {};
    for (const c of revenueByClient) {
      const type = c.clientType || "COMPANY";
      if (!grouped[type]) {
        grouped[type] = { totalTTC: 0, clientCount: 0, invoiceCount: 0 };
      }
      grouped[type].totalTTC += c.totalTTC;
      grouped[type].clientCount += 1;
      grouped[type].invoiceCount += c.invoiceCount;
    }

    const totalAll = Object.values(grouped).reduce((s, g) => s + g.totalTTC, 0) || 1;

    return Object.entries(grouped).map(([type, data]) => ({
      type,
      name: TYPE_LABELS[type] || type,
      fill: TYPE_COLORS[type] || "#94a3b8",
      totalTTC: Math.round(data.totalTTC * 100) / 100,
      clientCount: data.clientCount,
      invoiceCount: data.invoiceCount,
      percentage: Math.round((data.totalTTC / totalAll) * 10000) / 100,
    }));
  }, [revenueByClient]);

  if (loading) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Répartition par type client</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
          <Skeleton className="min-h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Répartition par type client</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 flex items-center justify-center flex-1 min-h-[300px] text-muted-foreground">
          Aucune donnée pour cette période
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs flex flex-col min-h-0 py-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Répartition par type client</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
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
          <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
        </PieChart>
      </ChartContainer>
      </CardContent>
    </Card>
  );
}
