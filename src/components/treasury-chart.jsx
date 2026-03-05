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
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/src/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { ChevronRight, CalendarIcon, ArrowLeft } from "lucide-react";
import { parseDate } from "@internationalized/date";
import {
  Button as RACButton,
  DatePicker,
  Dialog,
  Group,
  I18nProvider,
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

const TREASURY_SKELETON_HEIGHTS = [45, 55, 40, 70, 50, 65, 35, 80, 48, 60, 72, 42];

export function TreasuryChart({
  expenses = [],
  invoices = [],
  bankTransactions = [],
  className = "",
  initialBalance = 0,
  isLoading = false,
}) {
  const [timeRange, setTimeRange] = useState("90d"); // 90d, 30d, 365d, 730d, custom
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showCustomView, setShowCustomView] = useState(false);
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Obtenir le label de la période sélectionnée
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "cumul-month": return "Cumul mensuel";
      case "cumul-quarter": return "Cumul trimestriel";
      case "cumul-year": return "Cumul annuel";
      case "30d": return "30 derniers jours";
      case "90d": return "3 derniers mois";
      case "365d": return "12 derniers mois";
      case "custom": return "Période personnalisée";
      default: return "3 derniers mois";
    }
  };

  console.log("📊 [TREASURY] Props reçues:", {
    expensesCount: expenses.length,
    invoicesCount: invoices.length,
    bankTransactionsCount: bankTransactions.length,
    initialBalance,
    // Debug: afficher les 3 premières transactions pour voir le format
    sampleTransactions: bankTransactions.slice(0, 3).map((t) => ({
      date: t.date,
      amount: t.amount,
      description: t.description,
      dateType: typeof t.date,
    })),
  });

  // Si initialBalance est 0 mais qu'il y a des transactions,
  // utiliser la somme des transactions comme solde estimé
  const effectiveBalance = useMemo(() => {
    if (initialBalance !== 0) return initialBalance;
    if (bankTransactions.length === 0) return 0;
    return bankTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [initialBalance, bankTransactions]);

  // Calculer les données de trésorerie par jour
  // Le solde actuel (effectiveBalance) est le point d'arrivée, on calcule en arrière
  const treasuryData = useMemo(() => {
    const now = new Date();
    const chartData = [];

    // Déterminer la période
    let startDate, endDate;

    switch (timeRange) {
      case "custom":
        startDate = customStartDate
          ? new Date(customStartDate)
          : new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        endDate = customEndDate ? new Date(customEndDate) : now;
        break;
      case "cumul-month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case "cumul-quarter": {
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterMonth, 1);
        endDate = now;
        break;
      }
      case "cumul-year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
      default: {
        const daysMap = { "30d": 30, "90d": 90, "365d": 365, "730d": 730 };
        const days = daysMap[timeRange] || 90;
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - days);
        endDate = now;
      }
    }

    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Fonction pour extraire la date d'une transaction
    const getTransactionDate = (transaction) => {
      const rawDate =
        transaction.date || transaction.processedAt || transaction.createdAt;
      if (!rawDate) return null;
      const d = new Date(rawDate);
      return isNaN(d.getTime()) ? null : d;
    };

    // Calculer d'abord les mouvements par jour
    const dailyMovements = [];
    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      const dayBankTransactions = bankTransactions.filter((t) => {
        const tDate = getTransactionDate(t);
        return tDate && tDate.toISOString().split("T")[0] === dateStr;
      });

      const dayIncome = dayBankTransactions
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      const dayExpenses = Math.abs(
        dayBankTransactions
          .filter((t) => t.amount < 0)
          .reduce((sum, t) => sum + t.amount, 0)
      );

      dailyMovements.push({
        date: dateStr,
        income: dayIncome,
        expenses: dayExpenses,
        netMovement: dayIncome - dayExpenses,
      });
    }

    // Calculer la trésorerie en partant du solde actuel et en remontant
    // Le dernier jour = solde actuel, puis on soustrait les mouvements pour remonter
    let treasury = effectiveBalance;

    // Parcourir en sens inverse pour calculer le solde de départ
    for (let i = dailyMovements.length - 1; i >= 0; i--) {
      dailyMovements[i].treasury = treasury;
      // Remonter dans le temps = soustraire le mouvement net du jour
      treasury -= dailyMovements[i].netMovement;
    }

    // Maintenant dailyMovements contient les bonnes valeurs de trésorerie
    for (const day of dailyMovements) {
      chartData.push({
        date: day.date,
        income: day.income,
        expenses: day.expenses,
        treasury: day.treasury,
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
  }, [
    bankTransactions,
    effectiveBalance,
    timeRange,
    customStartDate,
    customEndDate,
  ]);

  // Calculer la variation de trésorerie (différence entre fin et début de période)
  const treasuryConsumption = useMemo(() => {
    if (treasuryData.length === 0) return 0;
    const firstDay = treasuryData[0].treasury;
    const lastDay = treasuryData[treasuryData.length - 1].treasury;
    return lastDay - firstDay;
  }, [treasuryData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Clé pour forcer le remontage de Recharts quand les données passent de vide à rempli
  const hasNonZeroData = treasuryData.some((d) => d.income > 0 || d.expenses > 0);
  const chartMountKey = hasNonZeroData ? "has-data" : "no-data";

  const timeRangeDropdown = (
    <DropdownMenu open={dropdownOpen} onOpenChange={(open) => { setDropdownOpen(open); if (!open) setShowCustomView(false); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-sm font-normal text-[#7A7A7A]">
          {getTimeRangeLabel()}
          <ChevronRight className="-me-1 opacity-60 rotate-90" size={14} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="rounded-xl w-80" align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
        {!showCustomView ? (
          <>
            <DropdownMenuItem className="rounded-lg text-sm" onSelect={() => { setTimeRange("cumul-month"); setDropdownOpen(false); }}>Cumul mensuel</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg text-sm" onSelect={() => { setTimeRange("cumul-quarter"); setDropdownOpen(false); }}>Cumul trimestriel</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg text-sm" onSelect={() => { setTimeRange("cumul-year"); setDropdownOpen(false); }}>Cumul annuel</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg text-sm" onSelect={() => { setTimeRange("30d"); setDropdownOpen(false); }}>30 derniers jours</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg text-sm" onSelect={() => { setTimeRange("90d"); setDropdownOpen(false); }}>3 derniers mois</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg text-sm" onSelect={() => { setTimeRange("365d"); setDropdownOpen(false); }}>12 derniers mois</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg text-sm flex items-center justify-between" onSelect={(e) => { e.preventDefault(); setTempStartDate(customStartDate); setTempEndDate(customEndDate); setShowCustomView(true); }}>
              Période personnalisée
              <ChevronRight size={14} className="opacity-60" />
            </DropdownMenuItem>
          </>
        ) : (
          <I18nProvider locale="fr-FR">
          <div onKeyDown={(e) => { if (e.key !== 'Escape') e.stopPropagation(); }} onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex items-center px-1 py-1 border-b">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-[#7A7A7A]" onClick={() => setShowCustomView(false)}>
                <ArrowLeft size={16} />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 px-2 pt-2">
              <div className="min-w-0 space-y-1.5">
                <Label className="text-sm font-medium">Début</Label>
                <DatePicker value={tempStartDate ? parseDate(tempStartDate) : null} onChange={(date) => { if (date) setTempStartDate(date.toString()); }}>
                  <div className="flex">
                    <Group className="w-full min-w-0">
                      <DateInput className="pe-9 text-sm" />
                    </Group>
                    <RACButton className="z-10 -ms-9 -me-px flex w-9 shrink-0 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground data-focus-visible:border-ring data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50">
                      <CalendarIcon size={14} />
                    </RACButton>
                  </div>
                  <RACPopover className="z-50 rounded-lg border bg-background text-popover-foreground shadow-lg outline-hidden data-entering:animate-in data-exiting:animate-out data-[entering]:fade-in-0 data-[entering]:zoom-in-95 data-[exiting]:fade-out-0 data-[exiting]:zoom-out-95" offset={4}>
                    <Dialog className="max-h-[inherit] overflow-auto p-2">
                      <Calendar />
                    </Dialog>
                  </RACPopover>
                </DatePicker>
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label className="text-sm font-medium">Fin</Label>
                <DatePicker value={tempEndDate ? parseDate(tempEndDate) : null} onChange={(date) => { if (date) setTempEndDate(date.toString()); }}>
                  <div className="flex">
                    <Group className="w-full min-w-0">
                      <DateInput className="pe-9 text-sm" />
                    </Group>
                    <RACButton className="z-10 -ms-9 -me-px flex w-9 shrink-0 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground data-focus-visible:border-ring data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50">
                      <CalendarIcon size={14} />
                    </RACButton>
                  </div>
                  <RACPopover className="z-50 rounded-lg border bg-background text-popover-foreground shadow-lg outline-hidden data-entering:animate-in data-exiting:animate-out data-[entering]:fade-in-0 data-[entering]:zoom-in-95 data-[exiting]:fade-out-0 data-[exiting]:zoom-out-95" offset={4}>
                    <Dialog className="max-h-[inherit] overflow-auto p-2">
                      <Calendar />
                    </Dialog>
                  </RACPopover>
                </DatePicker>
              </div>
            </div>
            <div className="flex gap-2 mt-3 px-2 pb-2 justify-end">
              <Button variant="ghost" size="sm" className="h-8 text-sm font-normal" onClick={() => { setShowCustomView(false); setDropdownOpen(false); }}>Annuler</Button>
              <Button size="sm" className="h-8 text-sm font-normal" onClick={() => { setCustomStartDate(tempStartDate); setCustomEndDate(tempEndDate); setTimeRange("custom"); setShowCustomView(false); setDropdownOpen(false); }}>Appliquer</Button>
            </div>
          </div>
          </I18nProvider>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-7 w-32" />
          </div>
          <Skeleton className="h-8 w-28 rounded-md" />
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-4">
          <div className="h-[200px] flex items-end justify-between gap-1">
            {TREASURY_SKELETON_HEIGHTS.map((h, i) => (
              <Skeleton
                key={i}
                className="rounded-t-sm flex-1 animate-pulse"
                style={{ height: `${h}%`, minHeight: "20px" }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base font-normal">Trésorerie</CardTitle>
          <CardDescription>
            <span
              className={`text-2xl font-medium ${
                treasuryConsumption >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {treasuryConsumption >= 0 ? "+" : ""}
              {formatCurrency(treasuryConsumption)}
            </span>
          </CardDescription>
        </div>
        {timeRangeDropdown}
      </CardHeader>
      <CardContent className="px-2 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-4 overflow-visible">
        <ChartContainer
          key={chartMountKey}
          config={chartConfig}
          className="aspect-auto h-[200px] w-full overflow-visible"
        >
          <ComposedChart
            data={treasuryData}
            margin={{
              left: -12,
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
              width={50}
              tickFormatter={(value) => {
                const absValue = Math.abs(value);
                if (absValue >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (absValue >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return `${value.toFixed(0)}€`;
              }}
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
