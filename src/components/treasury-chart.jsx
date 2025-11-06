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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/src/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Info } from "lucide-react";

const chartConfig = {
  treasury: {
    label: "Trésorerie",
    color: "#93c5fd", // Blue-300
  },
  income: {
    label: "Entrées",
    color: "#4ade80", // Green-400
  },
  expenses: {
    label: "Sorties",
    color: "#f87171", // Red-400
  },
};

export function TreasuryChart({
  expenses = [],
  invoices = [],
  className = "",
  initialBalance = 0,
}) {
  const [timeRange, setTimeRange] = useState("90d"); // 90d, 30d, 365d

  console.log("📊 [TREASURY] Props reçues:", {
    expensesCount: expenses.length,
    invoicesCount: invoices.length,
    initialBalance,
  });

  // Calculer les données de trésorerie par jour (comme les autres graphiques)
  const treasuryData = useMemo(() => {
    const now = new Date();
    const chartData = [];
    let cumulativeTreasury = initialBalance;

    // Déterminer le nombre de jours en fonction du filtre
    const daysMap = {
      "30d": 30,
      "90d": 90,
      "365d": 365,
    };
    const days = daysMap[timeRange] || 90;

    // Générer les données pour la période sélectionnée
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Filtrer les factures pour ce jour
      const dayInvoices = invoices.filter((invoice) => {
        if (!invoice.issueDate || invoice.status !== "COMPLETED") return false;

        let invoiceDate;
        if (typeof invoice.issueDate === "string") {
          const timestamp = parseInt(invoice.issueDate);
          invoiceDate = new Date(timestamp);
        } else if (typeof invoice.issueDate === "number") {
          invoiceDate = new Date(invoice.issueDate);
        } else {
          invoiceDate = new Date(invoice.issueDate);
        }

        if (isNaN(invoiceDate.getTime())) return false;
        return invoiceDate.toISOString().split("T")[0] === dateStr;
      });

      // Filtrer les dépenses pour ce jour
      const dayExpenses = expenses.filter((expense) => {
        if (!expense.date || expense.status !== "PAID") return false;

        let expenseDate;
        if (typeof expense.date === "string") {
          const timestamp = parseInt(expense.date);
          if (!isNaN(timestamp) && timestamp > 1000000000000) {
            expenseDate = new Date(timestamp);
          } else {
            expenseDate = new Date(expense.date);
          }
        } else if (typeof expense.date === "number") {
          expenseDate = new Date(expense.date);
        } else {
          expenseDate = new Date(expense.date);
        }

        if (isNaN(expenseDate.getTime())) return false;
        return expenseDate.toISOString().split("T")[0] === dateStr;
      });

      // Calculer les montants du jour
      const dayIncome = dayInvoices.reduce(
        (sum, invoice) => sum + (invoice.finalTotalTTC || 0),
        0
      );
      const dayExpensesAmount = dayExpenses.reduce(
        (sum, expense) => sum + (expense.amount || 0),
        0
      );

      // Mettre à jour la trésorerie cumulée
      cumulativeTreasury += dayIncome - dayExpensesAmount;

      chartData.push({
        date: dateStr,
        income: dayIncome,
        expenses: dayExpensesAmount,
        treasury: cumulativeTreasury,
      });
    }

    console.log("📊 [TREASURY] Données calculées:", {
      totalDays: chartData.length,
      firstDay: chartData[0],
      lastDay: chartData[chartData.length - 1],
      daysWithIncome: chartData.filter((d) => d.income > 0).length,
      daysWithExpenses: chartData.filter((d) => d.expenses > 0).length,
      totalIncome: chartData.reduce((sum, d) => sum + d.income, 0),
      totalExpenses: chartData.reduce((sum, d) => sum + d.expenses, 0),
    });

    return chartData;
  }, [expenses, invoices, initialBalance, timeRange]);

  // Calculer la consommation de trésorerie (différence entre début et fin)
  const treasuryConsumption = useMemo(() => {
    if (treasuryData.length === 0) return 0;
    const firstMonth = treasuryData[0].treasury;
    const lastMonth = treasuryData[treasuryData.length - 1].treasury;
    return lastMonth - initialBalance;
  }, [treasuryData, initialBalance]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base font-normal">Trésorerie</CardTitle>
          <CardDescription>
            <span
              className={`text-xl font-medium ${
                treasuryConsumption >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {treasuryConsumption >= 0 ? "+" : ""}
              {formatCurrency(treasuryConsumption)}
            </span>
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[140px] h-8 text-xs border-none shadow-none"
            aria-label="Sélectionner une période"
          >
            <SelectValue placeholder="Derniers 3 mois" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="30d" className="rounded-lg text-xs">
              Dernier mois
            </SelectItem>
            <SelectItem value="90d" className="rounded-lg text-xs">
              Derniers 3 mois
            </SelectItem>
            <SelectItem value="365d" className="rounded-lg text-xs">
              Dernière année
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[200px] w-full"
        >
          <ComposedChart
            data={treasuryData}
            margin={{
              left: -20,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <defs>
              <linearGradient id="fillTreasury" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-treasury)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-treasury)"
                  stopOpacity={0.1}
                />
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
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
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
            {/* Barres pour les entrées (vert) */}
            <Bar
              dataKey="income"
              fill="var(--color-income)"
              radius={[4, 4, 0, 0]}
              barSize={26}
            />
            {/* Barres pour les sorties (rouge) */}
            <Bar
              dataKey="expenses"
              fill="var(--color-expenses)"
              radius={[4, 4, 0, 0]}
              barSize={26}
            />
            {/* Courbe de trésorerie (zone remplie) */}
            <Area
              dataKey="treasury"
              type="monotone"
              fill="url(#fillTreasury)"
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
