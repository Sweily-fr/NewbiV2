"use client";

import { useMemo } from "react";
import { PieChart, Pie, Tooltip, Label } from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useChartColors } from "@/src/hooks/useChartColors";

const REVENUE_COLORS_BASE = [
  "#5b50ff",
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#eab308",
  "#6366f1",
  "#A585DB",
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatMonthName = (monthStr) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
    "fr-FR",
    { month: "long", year: "numeric" },
  );
};

function RevenueTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm text-sm">
      <p className="font-medium mb-1 capitalize">{data.name}</p>
      <div className="flex items-center justify-between gap-4">
        <span>Revenus HT</span>
        <span className="font-medium">{formatCurrency(data.amount)}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span>Revenus TTC</span>
        <span className="font-medium">{formatCurrency(data.amountTTC)}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span>Factures</span>
        <span className="font-medium">{data.count}</span>
      </div>
    </div>
  );
}

export function AnalyticsRevenuePieChart({ monthlyRevenue, loading }) {
  const { remap } = useChartColors();

  // Mêmes données que le graphique "CA, Dépenses et Marge brute" :
  // CA payé (factures créées + importées) par mois de paiement
  const chartData = useMemo(() => {
    return (monthlyRevenue || [])
      .filter((m) => (m.revenueHT || 0) > 0)
      .map((m, i) => ({
        month: m.month,
        name: formatMonthName(m.month),
        amount: Math.round((m.revenueHT || 0) * 100) / 100,
        amountTTC: Math.round((m.revenueTTC || 0) * 100) / 100,
        count: m.invoiceCount || 0,
        fill: remap(REVENUE_COLORS_BASE[i % REVENUE_COLORS_BASE.length]),
      }));
  }, [monthlyRevenue, remap]);

  const chartConfig = useMemo(() => {
    const cfg = { amount: { label: "Revenus HT" } };
    chartData.forEach((c) => {
      cfg[c.month] = { label: c.name, color: c.fill };
    });
    return cfg;
  }, [chartData]);

  const totalAmount = useMemo(
    () => chartData.reduce((s, c) => s + c.amount, 0),
    [chartData],
  );

  const legendItems = useMemo(
    () => [...chartData].sort((a, b) => b.amount - a.amount).slice(0, 5),
    [chartData],
  );

  if (loading) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Revenus</CardTitle>
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
          <CardTitle className="text-sm font-medium">Revenus</CardTitle>
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
        <CardTitle className="text-sm font-medium">Revenus</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
        <div className="flex items-center gap-8">
          <div className="flex-shrink-0">
            <ChartContainer
              config={chartConfig}
              className="aspect-square h-[280px] w-[280px]"
            >
              <PieChart>
                <Tooltip content={<RevenueTooltip />} cursor={false} />
                <Pie
                  data={chartData}
                  dataKey="amount"
                  nameKey="name"
                  innerRadius={90}
                  outerRadius={125}
                  paddingAngle={2}
                  strokeWidth={0}
                >
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
            {legendItems.map((item) => {
              const percentage = ((item.amount / totalAmount) * 100).toFixed(1);
              return (
                <div key={item.month} className="flex items-center gap-3">
                  <div
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.fill }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-normal text-foreground truncate capitalize">
                      {item.name} ({percentage} %)
                    </p>
                  </div>
                </div>
              );
            })}
            {chartData.length > 5 && (
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full flex-shrink-0 bg-muted" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-normal text-muted-foreground">
                    +{chartData.length - 5} autres mois
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
