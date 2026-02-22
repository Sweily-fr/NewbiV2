"use client";

import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import { Skeleton } from "@/src/components/ui/skeleton";

const chartConfig = {
  invoicedTTC: { label: "Facturé TTC", color: "#5b50ff" },
  collectedTTC: { label: "Encaissé TTC", color: "#10b981" },
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
    .toUpperCase() + ` ${year.slice(2)}`;
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
            Facturé
          </span>
          <span className="font-medium">{formatCurrency(data.invoicedTTC)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Encaissé
          </span>
          <span className="font-medium">{formatCurrency(data.collectedTTC)}</span>
        </div>
        <div className="flex items-center justify-between gap-6 text-muted-foreground border-t pt-1 mt-1">
          <span>Taux</span>
          <span>
            {data.invoicedTTC > 0
              ? `${((data.collectedTTC / data.invoicedTTC) * 100).toFixed(0)}%`
              : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsCollectionChart({ monthlyCollection, loading }) {
  const chartData = useMemo(() => {
    if (!monthlyCollection?.length) return [];
    return monthlyCollection.map((m) => ({
      ...m,
      monthLabel: formatMonthLabel(m.month),
    }));
  }, [monthlyCollection]);

  if (loading) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Recouvrement mensuel</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Recouvrement mensuel</h3>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Aucune donnée pour cette période
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-base font-medium mb-4">Recouvrement mensuel</h3>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="monthLabel"
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
          <Bar
            dataKey="invoicedTTC"
            fill="#5b50ff"
            fillOpacity={0.6}
            radius={[4, 4, 0, 0]}
            barSize={24}
          />
          <Line
            type="monotone"
            dataKey="collectedTTC"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: "#10b981" }}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}
