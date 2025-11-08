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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Info, ChevronRight, CalendarIcon } from "lucide-react";
import { parseDate } from "@internationalized/date";
import {
  Button as RACButton,
  DatePicker,
  Dialog,
  Group,
  Popover as RACPopover,
} from "react-aria-components";
import { Calendar } from "@/src/components/ui/calendar-rac";
import { DateInput } from "@/src/components/ui/datefield-rac";

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
  const [timeRange, setTimeRange] = useState("90d"); // 90d, 30d, 365d, 730d, custom
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Obtenir le label de la période sélectionnée
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "30d": return "Dernier mois";
      case "90d": return "Derniers 3 mois";
      case "365d": return "Dernière année";
      case "custom": return "Période personnalisée";
      default: return "Derniers 3 mois";
    }
  };

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

    // Déterminer la période
    let startDate, endDate;
    
    if (timeRange === "custom") {
      // Période personnalisée
      startDate = customStartDate ? new Date(customStartDate) : new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      endDate = customEndDate ? new Date(customEndDate) : now;
    } else {
      // Périodes prédéfinies
      const daysMap = {
        "30d": 30,
        "90d": 90,
        "365d": 365,
        "730d": 730,
      };
      const days = daysMap[timeRange] || 90;
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);
      endDate = now;
    }

    // Calculer le nombre de jours entre les deux dates
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Générer les données pour la période sélectionnée
    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
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
  }, [expenses, invoices, initialBalance, timeRange, customStartDate, customEndDate]);

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs border-none shadow-none">
              {getTimeRangeLabel()}
              <ChevronRight className="-me-1 opacity-60 rotate-90" size={14} aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="rounded-xl">
            <DropdownMenuItem 
              className="rounded-lg text-xs"
              onClick={() => setTimeRange("365d")}
            >
              Dernière année
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="rounded-lg text-xs"
              onClick={() => setTimeRange("90d")}
            >
              Derniers 3 mois
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="rounded-lg text-xs"
              onClick={() => setTimeRange("30d")}
            >
              Dernier mois
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="rounded-lg text-xs">
                Période personnalisée
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-64 p-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">
                        Date de début
                      </Label>
                      <DatePicker
                        value={customStartDate ? parseDate(customStartDate) : null}
                        onChange={(date) => {
                          if (date) {
                            setCustomStartDate(date.toString());
                            setTimeRange("custom");
                          }
                        }}
                      >
                        <div className="flex">
                          <Group className="w-full">
                            <DateInput className="pe-9" />
                          </Group>
                          <RACButton className="z-10 -ms-9 -me-px flex w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground data-focus-visible:border-ring data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50">
                            <CalendarIcon size={16} />
                          </RACButton>
                        </div>
                        <RACPopover
                          className="z-50 rounded-lg border bg-background text-popover-foreground shadow-lg outline-hidden data-entering:animate-in data-exiting:animate-out data-[entering]:fade-in-0 data-[entering]:zoom-in-95 data-[exiting]:fade-out-0 data-[exiting]:zoom-out-95"
                          offset={4}
                        >
                          <Dialog className="max-h-[inherit] overflow-auto p-2">
                            <Calendar />
                          </Dialog>
                        </RACPopover>
                      </DatePicker>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">
                        Date de fin
                      </Label>
                      <DatePicker
                        value={customEndDate ? parseDate(customEndDate) : null}
                        onChange={(date) => {
                          if (date) {
                            setCustomEndDate(date.toString());
                            setTimeRange("custom");
                          }
                        }}
                      >
                        <div className="flex">
                          <Group className="w-full">
                            <DateInput className="pe-9" />
                          </Group>
                          <RACButton className="z-10 -ms-9 -me-px flex w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground data-focus-visible:border-ring data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50">
                            <CalendarIcon size={16} />
                          </RACButton>
                        </div>
                        <RACPopover
                          className="z-50 rounded-lg border bg-background text-popover-foreground shadow-lg outline-hidden data-entering:animate-in data-exiting:animate-out data-[entering]:fade-in-0 data-[entering]:zoom-in-95 data-[exiting]:fade-out-0 data-[exiting]:zoom-out-95"
                          offset={4}
                        >
                          <Dialog className="max-h-[inherit] overflow-auto p-2">
                            <Calendar />
                          </Dialog>
                        </RACPopover>
                      </DatePicker>
                    </div>
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
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
