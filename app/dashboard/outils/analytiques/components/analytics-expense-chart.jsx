"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  Label,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
} from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { getTransactionCategory } from "@/lib/bank-categories-config";

const CATEGORY_LABELS = {
  OFFICE_SUPPLIES: "Fournitures",
  TRAVEL: "Déplacements",
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

// Mapping des noms de catégories Bridge → enum interne
const BANK_NAME_TO_CATEGORY = {
  "Alimentation": "MEALS",
  "Restaurants": "MEALS",
  "Courses": "MEALS",
  "Transport": "TRAVEL",
  "Carburant": "TRAVEL",
  "Transports en commun": "TRAVEL",
  "Taxi/VTC": "TRAVEL",
  "Parking": "TRAVEL",
  "Logement": "RENT",
  "Loyer": "RENT",
  "Charges": "UTILITIES",
  "Assurance habitation": "INSURANCE",
  "Loisirs": "OTHER",
  "Sorties": "OTHER",
  "Voyages": "ACCOMMODATION",
  "Sport": "OTHER",
  "Santé": "SERVICES",
  "Médecin": "SERVICES",
  "Pharmacie": "SERVICES",
  "Mutuelle": "INSURANCE",
  "Shopping": "OTHER",
  "Vêtements": "OTHER",
  "High-tech": "HARDWARE",
  "Maison": "OFFICE_SUPPLIES",
  "Services": "SERVICES",
  "Téléphone/Internet": "SUBSCRIPTIONS",
  "Abonnements": "SUBSCRIPTIONS",
  "Banque": "SERVICES",
  "Impôts & Taxes": "TAXES",
  "Impôt sur le revenu": "TAXES",
  "Taxe foncière": "TAXES",
  "Éducation": "TRAINING",
  "Formation": "TRAINING",
  "Livres": "TRAINING",
  "Autre": "OTHER",
  "Non catégorisé": "OTHER",
};

// Couleurs par catégorie (identiques au dashboard)
const CATEGORY_COLORS_MAP = {
  OFFICE_SUPPLIES: "#eab308",
  TRAVEL: "rgba(90, 80, 255, 0.60)",
  MEALS: "#f97316",
  ACCOMMODATION: "#06b6d4",
  SOFTWARE: "#3b82f6",
  HARDWARE: "#64748b",
  SERVICES: "#8b5cf6",
  MARKETING: "#ec4899",
  TAXES: "#a855f7",
  RENT: "#ef4444",
  UTILITIES: "#14b8a6",
  SALARIES: "#f59e0b",
  INSURANCE: "#6366f1",
  MAINTENANCE: "#84cc16",
  TRAINING: "#10b981",
  SUBSCRIPTIONS: "#0ea5e9",
  OTHER: "#A585DB",
};

const PAYMENT_COLORS = [
  "#5b50ff", "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4",
];

const PAYMENT_LABELS = {
  BANK_TRANSFER: "Virement",
  CHECK: "Chèque",
  CASH: "Espèces",
  CARD: "Carte",
  CREDIT_CARD: "Carte crédit",
  PAYPAL: "PayPal",
  OTHER: "Autre",
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
    .toUpperCase();
};

function CategoryTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm text-sm">
      <p className="font-medium mb-1">{data.name}</p>
      <div className="flex items-center justify-between gap-4">
        <span>Montant</span>
        <span className="font-medium">{formatCurrency(data.amount)}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span>Nombre</span>
        <span className="font-medium">{data.count}</span>
      </div>
    </div>
  );
}

function MonthlyTooltip({ active, payload }) {
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
            Revenus HT
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
          <span className={`font-medium ${data.grossMargin >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {formatCurrency(data.grossMargin)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsExpenseCategoryChart({ expenseByCategory, totalExpensesHT, totalExpensesTTC, bankTransactions, loading }) {
  const chartData = useMemo(() => {
    // Aggregate bank transactions by mapped internal category
    const bankByCategory = {};
    (bankTransactions || []).forEach((t) => {
      if (t.amount >= 0) return;
      const bankCat = getTransactionCategory(t);
      const internalKey = BANK_NAME_TO_CATEGORY[bankCat.name] || "OTHER";
      if (!bankByCategory[internalKey]) {
        bankByCategory[internalKey] = { amount: 0, count: 0 };
      }
      bankByCategory[internalKey].amount += Math.abs(t.amount);
      bankByCategory[internalKey].count += 1;
    });

    const hasBankData = Object.keys(bankByCategory).length > 0;

    // Check if expense model data is mostly "OTHER"
    const expenseNonOther = (expenseByCategory || []).filter(
      (c) => c.category !== "OTHER"
    );
    const expenseMostlyOther =
      expenseNonOther.length === 0 && (expenseByCategory || []).length > 0;

    const merged = {};

    if (hasBankData && expenseMostlyOther) {
      Object.entries(bankByCategory).forEach(([cat, data]) => {
        merged[cat] = { category: cat, amount: data.amount, count: data.count };
      });
    } else if (expenseByCategory?.length) {
      expenseByCategory.forEach((c) => {
        merged[c.category] = {
          category: c.category,
          amount: c.amount,
          count: c.count,
        };
      });
      if (hasBankData && merged.OTHER) {
        const otherAmount = merged.OTHER.amount;
        const bankTotal = Object.values(bankByCategory).reduce(
          (s, d) => s + d.amount,
          0
        );
        if (bankTotal > 0) {
          delete merged.OTHER;
          Object.entries(bankByCategory).forEach(([cat, data]) => {
            const scaled = (data.amount / bankTotal) * otherAmount;
            if (merged[cat]) {
              merged[cat].amount += scaled;
              merged[cat].count += data.count;
            } else {
              merged[cat] = {
                category: cat,
                amount: scaled,
                count: data.count,
              };
            }
          });
        }
      }
    } else if (hasBankData) {
      Object.entries(bankByCategory).forEach(([cat, data]) => {
        merged[cat] = { category: cat, amount: data.amount, count: data.count };
      });
    }

    const result = Object.values(merged)
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    return result.map((c) => ({
      ...c,
      amount: Math.round(c.amount * 100) / 100,
      label: CATEGORY_LABELS[c.category] || c.category,
      fill: CATEGORY_COLORS_MAP[c.category] || CATEGORY_COLORS_MAP.OTHER,
    }));
  }, [expenseByCategory, bankTransactions]);

  const chartConfig = useMemo(() => {
    const cfg = { amount: { label: "Montant" } };
    chartData.forEach((c) => {
      cfg[c.category] = { label: c.label, color: c.fill };
    });
    return cfg;
  }, [chartData]);

  const totalAmount = useMemo(
    () => chartData.reduce((s, e) => s + e.amount, 0),
    [chartData]
  );

  if (loading) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Dépenses par catégorie</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
          <Skeleton className="min-h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Dépenses par catégorie</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 flex items-center justify-center flex-1 min-h-[200px] text-muted-foreground">
          Aucune donnée
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs flex flex-col min-h-0 py-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Dépenses par catégorie</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
        <div className="flex items-center gap-8">
          <div className="flex-shrink-0">
            <ChartContainer
              config={chartConfig}
              className="aspect-square h-[280px] w-[280px]"
            >
              <PieChart>
                <Tooltip
                  content={<CategoryTooltip />}
                  cursor={false}
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
                              y={viewBox.cy}
                              className="fill-foreground text-2xl font-normal"
                            >
                              {formatCurrency(totalAmount).replace(/\s/g, " ")}
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

          <div className="flex-1 space-y-3">
            {chartData.slice(0, 5).map((item) => {
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
    </Card>
  );
}

export function AnalyticsRevenueVsExpenseChart({ monthlyRevenue, bankTransactions, loading }) {
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
        grossMargin: m.grossMargin ?? ((m.revenueHT || 0) - expense),
      };
    });
  }, [monthlyRevenue, bankTransactions]);

  const chartConfig = {
    revenueHT: { label: "Revenus HT", color: "#10b981" },
    expenseAmount: { label: "Dépenses", color: "#ef4444" },
    grossMargin: { label: "Marge brute", color: "#5b50ff" },
  };

  if (loading) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Revenus vs Dépenses</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
          <Skeleton className="min-h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Revenus vs Dépenses</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 flex items-center justify-center flex-1 min-h-[200px] text-muted-foreground">
          Aucune donnée
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs flex flex-col min-h-0 py-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Revenus vs Dépenses</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
        <ChartContainer config={chartConfig} className="flex-1 min-h-[350px] w-full">
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="monthLabel"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={0}
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
            <Tooltip content={<MonthlyTooltip />} />
            <Bar dataKey="revenueHT" fill="#10b981" fillOpacity={0.8} radius={[4, 4, 0, 0]} barSize={20} />
            <Bar dataKey="expenseAmount" fill="#ef4444" fillOpacity={0.7} radius={[4, 4, 0, 0]} barSize={20} />
            <Line
              type="bump"
              dataKey="grossMargin"
              stroke="#5b50ff"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function AnalyticsPaymentMethodChart({ paymentMethodStats, loading }) {
  const chartData = useMemo(() => {
    if (!paymentMethodStats?.length) return [];
    return paymentMethodStats.map((s, i) => ({
      ...s,
      name: PAYMENT_LABELS[s.method] || s.method,
      fill: PAYMENT_COLORS[i % PAYMENT_COLORS.length],
    }));
  }, [paymentMethodStats]);

  const chartConfig = useMemo(() => {
    const cfg = {};
    chartData.forEach((c) => {
      cfg[c.method] = { label: c.name, color: c.fill };
    });
    return cfg;
  }, [chartData]);

  if (loading) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Méthodes de paiement</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
          <Skeleton className="min-h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Méthodes de paiement</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 flex items-center justify-center flex-1 min-h-[300px] text-muted-foreground">
          Aucune donnée
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs flex flex-col min-h-0 py-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Méthodes de paiement</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="totalTTC"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={70}
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0]?.payload;
              if (!data) return null;
              return (
                <div className="rounded-lg border bg-background p-3 shadow-sm text-sm">
                  <p className="font-medium mb-1">{data.name}</p>
                  <div className="flex items-center justify-between gap-4">
                    <span>Total TTC</span>
                    <span className="font-medium">{formatCurrency(data.totalTTC)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Nombre</span>
                    <span className="font-medium">{data.count}</span>
                  </div>
                </div>
              );
            }}
          />
          <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
        </PieChart>
      </ChartContainer>
      </CardContent>
    </Card>
  );
}
