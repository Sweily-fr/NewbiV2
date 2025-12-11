"use client";

import { TrendingUp, ChevronRight, CalendarIcon } from "lucide-react";
import { Label, Pie, PieChart, Sector } from "recharts";
import { useMemo, useState } from "react";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { aggregateByCategory } from "@/lib/bank-categories-config";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  ChartConfig,
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
import { Label as FormLabel } from "@/src/components/ui/label";
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

// Mapping des catégories avec leurs labels et couleurs
const categoryLabels = {
  OFFICE_SUPPLIES: "Fournitures",
  TRAVEL: "Transport",
  MEALS: "Repas",
  ACCOMMODATION: "Hébergement",
  SOFTWARE: "Logiciels",
  HARDWARE: "Matériel",
  SERVICES: "Services",
  MARKETING: "Marketing",
  TAXES: "Taxes",
  RENT: "Loyer",
  UTILITIES: "Charges",
  SALARIES: "Salaires",
  INSURANCE: "Assurance",
  MAINTENANCE: "Maintenance",
  TRAINING: "Formation",
  SUBSCRIPTIONS: "Abonnements",
  OTHER: "Autre",
};

const chartConfig = {
  amount: {
    label: "Montant",
  },
  OFFICE_SUPPLIES: {
    label: "Fournitures",
    color: "#eab308", // Yellow-500
  },
  TRAVEL: {
    label: "Transport",
    color: "rgba(90, 80, 255, 0.60)", // Violet principal (ne pas changer)
  },
  MEALS: {
    label: "Repas",
    color: "#f97316", // Orange-500
  },
  ACCOMMODATION: {
    label: "Hébergement",
    color: "#06b6d4", // Cyan-500
  },
  SOFTWARE: {
    label: "Logiciels",
    color: "#3b82f6", // Blue-500
  },
  HARDWARE: {
    label: "Matériel",
    color: "#64748b", // Slate-500
  },
  SERVICES: {
    label: "Services",
    color: "#8b5cf6", // Violet-500
  },
  MARKETING: {
    label: "Marketing",
    color: "#ec4899", // Pink-500
  },
  TAXES: {
    label: "Taxes",
    color: "#a855f7", // Purple-500
  },
  RENT: {
    label: "Loyer",
    color: "#ef4444", // Red-500
  },
  UTILITIES: {
    label: "Charges",
    color: "#14b8a6", // Teal-500
  },
  SALARIES: {
    label: "Salaires",
    color: "#f59e0b", // Amber-500
  },
  INSURANCE: {
    label: "Assurance",
    color: "#6366f1", // Indigo-500
  },
  MAINTENANCE: {
    label: "Maintenance",
    color: "#84cc16", // Lime-500
  },
  TRAINING: {
    label: "Formation",
    color: "#10b981", // Emerald-500
  },
  SUBSCRIPTIONS: {
    label: "Abonnements",
    color: "#0ea5e9", // Sky-500
  },
  OTHER: {
    label: "Autre",
    color: "#9ca3af", // Gray-400
  },
};

export function ExpenseCategoryChart({
  expenses = [],
  bankTransactions = [],
  className,
}) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = useState("90d"); // 30d, 90d, 365d, custom
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Calculer les données du graphique par catégorie
  // MODE BANCAIRE PUR : Utiliser les transactions bancaires négatives
  const chartData = useMemo(() => {
    console.log(
      "📊 [ExpenseCategoryChart] Calcul des données - MODE BANCAIRE PUR"
    );
    console.log(
      "📊 [ExpenseCategoryChart] Transactions bancaires:",
      bankTransactions?.length || 0
    );

    // Déterminer la période
    const now = new Date();
    let startDate, endDate;

    if (timeRange === "custom") {
      startDate = customStartDate
        ? new Date(customStartDate)
        : new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      endDate = customEndDate ? new Date(customEndDate) : now;
    } else {
      const daysMap = {
        "30d": 30,
        "90d": 90,
        "365d": 365,
      };
      const days = daysMap[timeRange] || 90;
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);
      endDate = now;
    }

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

    console.log(
      "📊 [ExpenseCategoryChart] Transactions sorties filtrées:",
      expenseTransactions.length
    );

    // Agréger par catégorie en utilisant la fonction de bank-categories-config
    const categoryData = aggregateByCategory(expenseTransactions, false);

    // Convertir en format pour le graphique
    const result = categoryData.map((cat) => ({
      category: cat.name,
      amount: Math.round(cat.amount * 100) / 100,
      label: cat.name,
      fill: cat.color,
    }));

    console.log("📊 [ExpenseCategoryChart] Données du graphique:", result);
    return result;
  }, [bankTransactions, timeRange, customStartDate, customEndDate]);

  // Calculer le total et la catégorie principale
  const totalAmount = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.amount, 0);
  }, [chartData]);

  const topCategory = useMemo(() => {
    return chartData.length > 0 ? chartData[0] : null;
  }, [chartData]);

  const topCategoryPercentage = useMemo(() => {
    if (!topCategory || totalAmount === 0) return 0;
    return ((topCategory.amount / totalAmount) * 100).toFixed(1);
  }, [topCategory, totalAmount]);

  // Calculer les dates de début et fin de la période
  const dateRange = useMemo(() => {
    const now = new Date();
    let startDate, endDate;

    if (timeRange === "custom") {
      startDate = customStartDate
        ? new Date(customStartDate)
        : new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      endDate = customEndDate ? new Date(customEndDate) : now;
    } else {
      const daysMap = {
        "30d": 30,
        "90d": 90,
        "365d": 365,
      };
      const days = daysMap[timeRange] || 90;
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);
      endDate = now;
    }

    return {
      start: startDate.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      end: endDate.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
  }, [timeRange, customStartDate, customEndDate]);

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
      case "30d":
        return "Dernier mois";
      case "90d":
        return "Derniers 3 mois";
      case "365d":
        return "Dernière année";
      case "custom":
        return "Période personnalisée";
      default:
        return "Derniers 3 mois";
    }
  };

  // Composant DropdownMenu réutilisable
  const TimeRangeSelect = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs border-none shadow-none"
        >
          {getTimeRangeLabel()}
          <ChevronRight
            className="-me-1 opacity-60 rotate-90"
            size={14}
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="rounded-xl">
        <DropdownMenuItem
          className="rounded-lg text-xs"
          onClick={() => setTimeRange("30d")}
        >
          Dernier mois
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-lg text-xs"
          onClick={() => setTimeRange("90d")}
        >
          Derniers 3 mois
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-lg text-xs"
          onClick={() => setTimeRange("365d")}
        >
          Dernière année
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="rounded-lg text-xs">
            Période personnalisée
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-64 p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <FormLabel className="text-xs font-medium">
                    Date de début
                  </FormLabel>
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
                  <FormLabel className="text-xs font-medium">
                    Date de fin
                  </FormLabel>
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
  );

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
          <TimeRangeSelect />
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
        <TimeRangeSelect />
      </CardHeader>
      <CardContent className="flex-1 pb-2 sm:pb-4">
        <div className="flex items-center gap-8">
          {/* Graphique à gauche */}
          <div className="flex-shrink-0">
            <ChartContainer
              config={chartConfig}
              className="aspect-square h-[240px] w-[240px]"
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
                  innerRadius={80}
                  outerRadius={110}
                  strokeWidth={0}
                  activeIndex={0}
                  activeShape={({ outerRadius = 0, ...props }) => (
                    <Sector {...props} outerRadius={outerRadius + 8} />
                  )}
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
      {/* <CardFooter className="flex-col gap-2 text-sm pt-0 border-t">
        {topCategory && (
          <div className="w-full pt-4">
            <div className="text-muted-foreground font-normal text-sm">
              Catégorie la plus importante :{" "}
              {formatCurrency(topCategory.amount)}
            </div>
          </div>
        )}
      </CardFooter> */}
    </Card>
  );
}
