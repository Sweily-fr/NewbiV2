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
  revenueHT: { label: "CA HT", color: "#10b981" },
  expenseAmount: { label: "Dépenses HT", color: "#ef4444" },
  grossMarginComputed: { label: "Marge brute", color: "#5b50ff" },
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
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            CA HT
          </span>
          <span className="font-medium">{formatCurrency(data.revenueHT)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            Dépenses HT
          </span>
          <span className="font-medium">{formatCurrency(data.expenseAmount)}</span>
        </div>
        <div className="flex items-center justify-between gap-6 border-t pt-1 mt-1">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#5b50ff" }} />
            Marge brute
          </span>
          <span className={`font-medium ${data.grossMarginComputed >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {formatCurrency(data.grossMarginComputed)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsRevenueChart({ monthlyRevenue, bankTransactions, loading }) {
  const chartData = useMemo(() => {
    if (!monthlyRevenue?.length) return [];

    // Aggregate negative bank transactions by month as expenses
    const bankExpenseByMonth = {};
    (bankTransactions || []).forEach((t) => {
      if (t.amount >= 0) return;
      const rawDate = t.date || t.processedAt || t.createdAt;
      if (!rawDate) return;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return;
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      bankExpenseByMonth[monthKey] = (bankExpenseByMonth[monthKey] || 0) + Math.abs(t.amount);
    });

    return monthlyRevenue.map((m) => {
      const expenseFromModel = m.expenseAmountHT || 0;
      const expenseFromBank = bankExpenseByMonth[m.month] || 0;
      const expense = expenseFromModel > 0 ? expenseFromModel : expenseFromBank;
      return {
        ...m,
        monthLabel: formatMonthLabel(m.month),
        expenseAmount: expense,
        grossMarginComputed: (m.revenueHT || 0) - expense,
      };
    });
  }, [monthlyRevenue, bankTransactions]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-0">
        <h3 className="text-sm font-medium mb-4 shrink-0">CA, Dépenses et Marge brute</h3>
        <Skeleton className="flex-1 min-h-[200px] w-full" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="flex flex-col min-h-0">
        <h3 className="text-sm font-medium mb-4 shrink-0">CA, Dépenses et Marge brute</h3>
        <div className="flex items-center justify-center flex-1 min-h-[200px] text-muted-foreground">
          Aucune donnée pour cette période
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0">
      <h3 className="text-sm font-medium mb-4 shrink-0">CA, Dépenses et Marge brute</h3>
      <ChartContainer config={chartConfig} className="flex-1 min-h-[200px] w-full">
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
            dataKey="revenueHT"
            fill="#10b981"
            fillOpacity={0.8}
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
          <Bar
            dataKey="expenseAmount"
            fill="#ef4444"
            fillOpacity={0.7}
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
          <Line
            type="bump"
            dataKey="grossMarginComputed"
            stroke="#5b50ff"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}
