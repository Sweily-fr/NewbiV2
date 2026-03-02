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
  Legend,
} from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import { Skeleton } from "@/src/components/ui/skeleton";

const chartConfig = {
  invoiced: { label: "Facturé HT", color: "#5b50ff" },
  collected: { label: "Encaissé bancaire", color: "#10b981" },
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
  return (
    date
      .toLocaleDateString("fr-FR", { month: "short" })
      .replace(".", "")
      .toUpperCase() + ` ${year.slice(2)}`
  );
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const label = formatMonthLabel(data.month);
  const gap = (data.invoiced || 0) - (data.collected || 0);

  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm text-sm min-w-[200px]">
      <p className="font-medium mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "#5b50ff" }}
            />
            Facturé
          </span>
          <span className="font-medium">{formatCurrency(data.invoiced)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Encaissé
          </span>
          <span className="font-medium">{formatCurrency(data.collected)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t pt-1 mt-1 text-muted-foreground">
          <span>Écart</span>
          <span className={gap >= 0 ? "text-emerald-600" : "text-red-500"}>
            {gap > 0 ? "+" : ""}
            {formatCurrency(gap)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsBankFlowChart({
  monthlyRevenue,
  bankTransactions,
  loading,
}) {
  const chartData = useMemo(() => {
    if (!monthlyRevenue?.length) return [];

    // Aggregate positive bank transactions by month
    const bankByMonth = {};
    (bankTransactions || []).forEach((t) => {
      if (t.amount <= 0) return;
      const rawDate = t.date || t.processedAt || t.createdAt;
      if (!rawDate) return;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return;
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      bankByMonth[monthKey] = (bankByMonth[monthKey] || 0) + t.amount;
    });

    return monthlyRevenue.map((m) => ({
      month: m.month,
      monthLabel: formatMonthLabel(m.month),
      invoiced: m.revenueHT || 0,
      collected: bankByMonth[m.month] || 0,
    }));
  }, [monthlyRevenue, bankTransactions]);

  if (loading) {
    return (
      <div>
        <h3 className="text-base font-medium mb-1">Facturé vs Encaissé</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Comparaison entre le montant facturé et les entrées bancaires
        </p>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div>
        <h3 className="text-base font-medium mb-1">Facturé vs Encaissé</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Comparaison entre le montant facturé et les entrées bancaires
        </p>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Aucune donnée pour cette période
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-base font-medium mb-1">Facturé vs Encaissé</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Comparaison entre le montant facturé et les entrées bancaires
      </p>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={({ y, payload }) => (
              <text
                x={0}
                y={y}
                textAnchor="start"
                dominantBaseline="middle"
                fontSize={11}
                className="fill-muted-foreground"
              >
                {`${(payload.value / 1000).toFixed(0)}k`}
              </text>
            )}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-muted-foreground">
                {chartConfig[value]?.label || value}
              </span>
            )}
          />
          <Bar
            dataKey="invoiced"
            fill="#5b50ff"
            fillOpacity={0.7}
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
          <Bar
            dataKey="collected"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}
