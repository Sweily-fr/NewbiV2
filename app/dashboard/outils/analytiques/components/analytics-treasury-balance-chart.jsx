"use client";

import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/src/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { ChevronRight } from "lucide-react";

const chartConfig = {
  treasury: { label: "Trésorerie", color: "#93c5fd" },
  income: { label: "Entrées", color: "#4ade80" },
  expenses: { label: "Sorties", color: "#f87171" },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);

export function AnalyticsTreasuryBalanceChart({
  bankTransactions = [],
  initialBalance = 0,
  loading = false,
}) {
  const [timeRange, setTimeRange] = useState("90d");

  const effectiveBalance = useMemo(() => {
    if (initialBalance !== 0) return initialBalance;
    if (bankTransactions.length === 0) return 0;
    return bankTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [initialBalance, bankTransactions]);

  const treasuryData = useMemo(() => {
    const now = new Date();
    const daysMap = { "30d": 30, "90d": 90, "365d": 365 };
    const days = daysMap[timeRange] || 90;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    const daysDiff = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));

    const getTransactionDate = (t) => {
      const rawDate = t.date || t.processedAt || t.createdAt;
      if (!rawDate) return null;
      const d = new Date(rawDate);
      return isNaN(d.getTime()) ? null : d;
    };

    const dailyMovements = [];
    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      const dayTx = bankTransactions.filter((t) => {
        const tDate = getTransactionDate(t);
        return tDate && tDate.toISOString().split("T")[0] === dateStr;
      });

      const dayIncome = dayTx
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      const dayExpenses = Math.abs(
        dayTx.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)
      );

      dailyMovements.push({
        date: dateStr,
        income: dayIncome,
        expenses: dayExpenses,
        netMovement: dayIncome - dayExpenses,
      });
    }

    let treasury = effectiveBalance;
    for (let i = dailyMovements.length - 1; i >= 0; i--) {
      dailyMovements[i].treasury = treasury;
      treasury -= dailyMovements[i].netMovement;
    }

    return dailyMovements;
  }, [bankTransactions, effectiveBalance, timeRange]);

  const treasuryConsumption = useMemo(() => {
    if (treasuryData.length === 0) return 0;
    return treasuryData[treasuryData.length - 1].treasury - treasuryData[0].treasury;
  }, [treasuryData]);

  const hasNonZeroData = treasuryData.some((d) => d.income > 0 || d.expenses > 0);
  const chartMountKey = hasNonZeroData ? "has-data" : "no-data";

  const timeRangeLabel = { "30d": "Dernier mois", "90d": "Derniers 3 mois", "365d": "Dernière année" }[timeRange] || "Derniers 3 mois";

  if (loading) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Solde de trésorerie</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
          <Skeleton className="min-h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs flex flex-col min-h-0 py-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Solde de trésorerie</CardTitle>
          <CardDescription className="text-xs mt-1">
            Évolution du solde{" "}
            <span
              className={`font-medium ${
                treasuryConsumption >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ({treasuryConsumption >= 0 ? "+" : ""}
              {formatCurrency(treasuryConsumption)})
            </span>
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
            >
              {timeRangeLabel}
              <ChevronRight
                className="-me-1 opacity-60 rotate-90"
                size={14}
                aria-hidden="true"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="rounded-xl">
            <DropdownMenuItem className="rounded-lg text-xs" onClick={() => setTimeRange("365d")}>
              Dernière année
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg text-xs" onClick={() => setTimeRange("90d")}>
              Derniers 3 mois
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg text-xs" onClick={() => setTimeRange("30d")}>
              Dernier mois
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
      <ChartContainer
        key={chartMountKey}
        config={chartConfig}
        className="h-[300px] w-full"
      >
        <ComposedChart
          data={treasuryData}
          margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
        >
          <defs>
            <linearGradient id="fillTreasuryAnalytics" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-treasury)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-treasury)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString("fr-FR", {
                month: "short",
                day: "numeric",
              });
            }}
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
                {Math.abs(payload.value) >= 1000000
                  ? `${(payload.value / 1000000).toFixed(1)}M`
                  : Math.abs(payload.value) >= 1000
                    ? `${(payload.value / 1000).toFixed(0)}k`
                    : `${payload.value.toFixed(0)}€`}
              </text>
            )}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="w-[200px]"
                nameKey="month"
                labelFormatter={(value) => value}
                formatter={(value, name) => (
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="text-xs text-muted-foreground">
                      {chartConfig[name]?.label || name}
                    </span>
                    <span className="text-xs font-medium">
                      {formatCurrency(value)}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} barSize={26} />
          <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} barSize={26} />
          <Area
            dataKey="treasury"
            type="monotone"
            fill="url(#fillTreasuryAnalytics)"
            fillOpacity={0.4}
            stroke="var(--color-treasury)"
            strokeWidth={2}
          />
        </ComposedChart>
      </ChartContainer>
      </CardContent>
    </Card>
  );
}
