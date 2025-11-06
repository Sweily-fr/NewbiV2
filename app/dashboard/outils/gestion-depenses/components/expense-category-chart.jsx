"use client";

import { TrendingUp } from "lucide-react";
import { Label, Pie, PieChart, Sector } from "recharts";
import { useMemo, useState } from "react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

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

export function ExpenseCategoryChart({ expenses = [] }) {
  const [timeRange, setTimeRange] = useState("90d"); // 30d, 90d, 365d

  // Calculer les données du graphique par catégorie
  const chartData = useMemo(() => {
    // Déterminer la date de début en fonction du filtre
    const now = new Date();
    const daysMap = {
      "30d": 30,
      "90d": 90,
      "365d": 365,
    };
    const days = daysMap[timeRange] || 90;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Filtrer les dépenses payées et dans la période sélectionnée
    const paidExpenses = expenses.filter((expense) => {
      if (expense.status !== "PAID") return false;
      
      // Vérifier la date
      if (!expense.date) return false;
      
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
      
      return expenseDate >= startDate;
    });

    // Grouper par catégorie
    const categoryTotals = paidExpenses.reduce((acc, expense) => {
      const category = expense.category || "OTHER";
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += expense.amount || 0;
      return acc;
    }, {});

    // Convertir en format pour le graphique
    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount: Math.round(amount * 100) / 100, // Arrondir à 2 décimales
        label: categoryLabels[category] || category,
        fill: chartConfig[category]?.color || "hsl(var(--chart-1))",
      }))
      .sort((a, b) => b.amount - a.amount); // Trier par montant décroissant
  }, [expenses, timeRange]);

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
    const daysMap = {
      "30d": 30,
      "90d": 90,
      "365d": 365,
    };
    const days = daysMap[timeRange] || 90;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    
    return {
      start: startDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
      end: now.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
    };
  }, [timeRange]);

  // Formater le montant en euros
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Si pas de données, afficher un message
  if (chartData.length === 0) {
    return (
      <Card className="flex flex-col shadow-xs">
        <CardHeader className="items-center pb-0">
          <CardTitle className="font-normal">
            Répartition par catégorie
          </CardTitle>
          <CardDescription>Aucune dépense à afficher</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center min-h-[250px]">
          <p className="text-sm text-muted-foreground">
            Aucune dépense payée pour le moment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="font-normal text-base">
            Répartition par catégorie
          </CardTitle>
          <CardDescription className="font-normal text-sm">
            Total : {formatCurrency(totalAmount)}
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

          {/* Légende à droite */}
          <div className="flex-1 space-y-3">
            {chartData.slice(0, 5).map((item, index) => {
              const percentage = ((item.amount / totalAmount) * 100).toFixed(1);
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
