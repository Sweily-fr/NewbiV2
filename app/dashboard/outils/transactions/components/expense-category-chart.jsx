"use client";

import { ChevronRight, CalendarIcon, ArrowLeft } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";
import { useMemo, useState } from "react";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { aggregateByCategory } from "@/lib/bank-categories-config";

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
import { Label as FormLabel } from "@/src/components/ui/label";
import { parseDate } from "@internationalized/date";
import {
  Button as RACButton,
  DatePicker,
  Dialog,
  Group,
  Popover as RACPopover,
  I18nProvider,
} from "react-aria-components";
import { Calendar } from "@/src/components/ui/calendar-rac";
import { DateInput } from "@/src/components/ui/datefield-rac";

// chartConfig dynamique généré à partir des données réelles
const baseChartConfig = {
  amount: {
    label: "Montant",
  },
};

export function ExpenseCategoryChart({
  bankTransactions = [],
  className,
  isLoading = false,
}) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = useState("90d"); // 30d, 90d, 365d, custom
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showCustomView, setShowCustomView] = useState(false);
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Calcul centralisé des dates de période
  const computedDates = useMemo(() => {
    const now = new Date();
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
        const daysMap = { "30d": 30, "90d": 90, "365d": 365 };
        const days = daysMap[timeRange] || 90;
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - days);
        endDate = now;
      }
    }

    return { startDate, endDate };
  }, [timeRange, customStartDate, customEndDate]);

  const dateRange = useMemo(() => ({
    start: computedDates.startDate.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    end: computedDates.endDate.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  }), [computedDates]);

  // Calculer les données du graphique par catégorie (MODE BANCAIRE PUR)
  const chartData = useMemo(() => {
    const { startDate, endDate } = computedDates;

    // Filtrer les transactions bancaires négatives (sorties) dans la période
    const expenseTransactions = bankTransactions.filter((transaction) => {
      if (transaction.amount >= 0) return false;

      const rawDate =
        transaction.date || transaction.processedAt || transaction.createdAt;
      if (!rawDate) return false;

      const transactionDate = new Date(rawDate);
      if (isNaN(transactionDate.getTime())) return false;

      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Agréger par catégorie en utilisant la fonction de bank-categories-config
    const categoryData = aggregateByCategory(expenseTransactions, false);

    return categoryData.map((cat) => ({
      category: cat.name,
      amount: Math.round(cat.amount * 100) / 100,
      label: cat.name,
      fill: cat.color,
    }));
  }, [bankTransactions, computedDates]);

  // Générer le chartConfig dynamiquement à partir des données réelles
  const chartConfig = useMemo(() => {
    const config = { ...baseChartConfig };
    chartData.forEach((item) => {
      config[item.category] = {
        label: item.label,
        color: item.fill,
      };
    });
    return config;
  }, [chartData]);

  // Calculer le total et la catégorie principale
  const totalAmount = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.amount, 0);
  }, [chartData]);


  // Formater le montant en euros
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Obtenir le label de la période sélectionnée
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "cumul-month":
        return "Cumul mensuel";
      case "cumul-quarter":
        return "Cumul trimestriel";
      case "cumul-year":
        return "Cumul annuel";
      case "30d":
        return "30 derniers jours";
      case "90d":
        return "3 derniers mois";
      case "365d":
        return "12 derniers mois";
      case "custom":
        return "Période personnalisée";
      default:
        return "3 derniers mois";
    }
  };

  const timeRangeDropdown = (
    <DropdownMenu open={dropdownOpen} onOpenChange={(open) => { setDropdownOpen(open); if (!open) setShowCustomView(false); }}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-sm font-normal text-[#7A7A7A]"
        >
          {getTimeRangeLabel()}
          <ChevronRight
            className="-me-1 opacity-60 rotate-90"
            size={14}
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="rounded-xl w-80" align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
        {!showCustomView ? (
          <>
            <DropdownMenuItem
              className="rounded-lg text-sm"
              onSelect={() => { setTimeRange("cumul-month"); setDropdownOpen(false); }}
            >
              Cumul mensuel
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg text-sm"
              onSelect={() => { setTimeRange("cumul-quarter"); setDropdownOpen(false); }}
            >
              Cumul trimestriel
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg text-sm"
              onSelect={() => { setTimeRange("cumul-year"); setDropdownOpen(false); }}
            >
              Cumul annuel
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg text-sm"
              onSelect={() => { setTimeRange("30d"); setDropdownOpen(false); }}
            >
              30 derniers jours
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg text-sm"
              onSelect={() => { setTimeRange("90d"); setDropdownOpen(false); }}
            >
              3 derniers mois
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg text-sm"
              onSelect={() => { setTimeRange("365d"); setDropdownOpen(false); }}
            >
              12 derniers mois
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg text-sm flex items-center justify-between"
              onSelect={(e) => {
                e.preventDefault();
                setTempStartDate(customStartDate);
                setTempEndDate(customEndDate);
                setShowCustomView(true);
              }}
            >
              Période personnalisée
              <ChevronRight size={14} className="opacity-60" />
            </DropdownMenuItem>
          </>
        ) : (
          <I18nProvider locale="fr-FR">
          <div
            onKeyDown={(e) => { if (e.key !== 'Escape') e.stopPropagation(); }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center px-1 py-1 border-b">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[#7A7A7A]"
                onClick={() => setShowCustomView(false)}
              >
                <ArrowLeft size={16} />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 px-2 pt-2">
              <div className="min-w-0 space-y-1.5">
                <FormLabel className="text-sm font-medium">Début</FormLabel>
                <DatePicker
                  value={tempStartDate ? parseDate(tempStartDate) : null}
                  onChange={(date) => { if (date) setTempStartDate(date.toString()); }}
                >
                  <div className="flex">
                    <Group className="w-full min-w-0">
                      <DateInput className="pe-9 text-sm" />
                    </Group>
                    <RACButton className="z-10 -ms-9 -me-px flex w-9 shrink-0 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground data-focus-visible:border-ring data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50">
                      <CalendarIcon size={14} />
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
              <div className="min-w-0 space-y-1.5">
                <FormLabel className="text-sm font-medium">Fin</FormLabel>
                <DatePicker
                  value={tempEndDate ? parseDate(tempEndDate) : null}
                  onChange={(date) => { if (date) setTempEndDate(date.toString()); }}
                >
                  <div className="flex">
                    <Group className="w-full min-w-0">
                      <DateInput className="pe-9 text-sm" />
                    </Group>
                    <RACButton className="z-10 -ms-9 -me-px flex w-9 shrink-0 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground data-focus-visible:border-ring data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50">
                      <CalendarIcon size={14} />
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
            <div className="flex gap-2 mt-3 px-2 pb-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-sm font-normal"
                onClick={() => { setShowCustomView(false); setDropdownOpen(false); }}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                className="h-8 text-sm font-normal"
                onClick={() => {
                  setCustomStartDate(tempStartDate);
                  setCustomEndDate(tempEndDate);
                  setTimeRange("custom");
                  setShowCustomView(false);
                  setDropdownOpen(false);
                }}
              >
                Appliquer
              </Button>
            </div>
          </div>
          </I18nProvider>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isLoading) {
    return (
      <Card className={`@container/card flex flex-col ${className || ""}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-28 rounded-md" />
        </CardHeader>
        <CardContent className="flex-1 pb-2 sm:pb-4">
          <div className="flex items-center gap-8">
            <Skeleton className="h-[240px] w-[240px] rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-3 hidden md:block">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-3 w-full max-w-[150px]" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Si pas de données, afficher un message avec le filtre
  if (chartData.length === 0) {
    return (
      <Card className={`@container/card flex flex-col ${className || ""}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="font-normal text-base">
              Sorties par catégorie
            </CardTitle>
            <CardDescription className="font-normal text-sm">
              Aucune dépense à afficher
            </CardDescription>
          </div>
          {timeRangeDropdown}
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center min-h-[250px]">
          <p className="text-sm text-muted-foreground">
            Aucune dépense payée pour cette période
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`@container/card flex flex-col ${className || ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="font-normal text-base">
            Sorties par catégorie
          </CardTitle>
          <CardDescription className="font-normal text-sm">
            Total : {formatCurrency(totalAmount)}
          </CardDescription>
        </div>
        {timeRangeDropdown}
      </CardHeader>
      <CardContent className="flex-1 pb-2 sm:pb-4">
        <div className="flex items-center gap-8">
          {/* Graphique à gauche */}
          <div className="flex-shrink-0">
            <ChartContainer
              config={chartConfig}
              className="aspect-square h-[280px] w-[280px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, name, item) => (
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                            style={{
                              backgroundColor: item.payload.fill,
                            }}
                          />
                          <div className="flex flex-col">
                            <span className="font-normal">
                              {item.payload.label}
                            </span>
                            <span className="text-muted-foreground font-normal">
                              {formatCurrency(value)}
                            </span>
                          </div>
                        </div>
                      )}
                    />
                  }
                />
                <Pie
                  data={chartData}
                  dataKey="amount"
                  nameKey="label"
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
                              y={(viewBox.cy || 0) - 10}
                              className="fill-foreground text-2xl font-normal"
                            >
                              {formatCurrency(totalAmount).replace(/\s/g, " ")}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 20}
                              className="fill-muted-foreground text-xs font-normal"
                            >
                              Du {dateRange.start}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 38}
                              className="fill-muted-foreground text-xs font-normal"
                            >
                              au {dateRange.end}
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

          {/* Légende à droite - Masquée sur mobile */}
          {!isMobile && (
            <div className="flex-1 space-y-3">
              {chartData.slice(0, 5).map((item, index) => {
                const percentage = ((item.amount / totalAmount) * 100).toFixed(
                  1
                );
                return (
                  <div key={item.category} className="flex items-center gap-3">
                    <div
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.fill }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-normal text-foreground truncate">
                        {item.label} ({percentage} %)
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
                      +{chartData.length - 5} autres catégories
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
