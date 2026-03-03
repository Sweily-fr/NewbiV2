"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";

const chartConfig = {
  totalHT: { label: "CA HT", color: "#5b50ff" },
};

const BAR_COLORS = [
  "#5b50ff", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
];

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
      <p className="font-medium mb-1">{data.description || data.name}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span>CA HT</span>
          <span className="font-medium">{formatCurrency(data.totalHT || data.size)}</span>
        </div>
        {data.totalQuantity != null && (
          <div className="flex items-center justify-between gap-4">
            <span>Quantité</span>
            <span className="font-medium">{data.totalQuantity}</span>
          </div>
        )}
        {data.averageUnitPrice != null && (
          <div className="flex items-center justify-between gap-4">
            <span>Prix moyen</span>
            <span className="font-medium">{formatCurrency(data.averageUnitPrice)}</span>
          </div>
        )}
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

export function AnalyticsProductChart({ revenueByProduct, loading }) {
  const chartData = useMemo(() => {
    if (!revenueByProduct?.length) return [];
    return revenueByProduct.slice(0, 10).map((p, i) => ({
      ...p,
      shortDesc:
        p.description.length > 25
          ? p.description.substring(0, 23) + "..."
          : p.description,
      name: p.description,
      size: p.totalHT,
      fill: BAR_COLORS[i % BAR_COLORS.length],
    }));
  }, [revenueByProduct]);

  if (loading) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top produits / services</CardTitle>
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
          <CardTitle className="text-sm font-medium">Top produits / services</CardTitle>
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
        <CardTitle className="text-sm font-medium">Top produits / services</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            barCategoryGap="15%"
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
              dataKey="shortDesc"
              hide
              width={0}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="totalHT"
              radius={[0, 4, 4, 0]}
              barSize={18}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList dataKey="shortDesc" content={<BarLabel />} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
