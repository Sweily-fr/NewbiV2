"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
} from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import { Skeleton } from "@/src/components/ui/skeleton";

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

const CATEGORY_COLORS = [
  "rgba(91, 80, 255, 1)", "rgba(91, 80, 255, 0.9)", "rgba(91, 80, 255, 0.8)", "rgba(91, 80, 255, 0.7)", "rgba(91, 80, 255, 0.6)",
  "rgba(91, 80, 255, 0.52)", "rgba(91, 80, 255, 0.45)", "rgba(91, 80, 255, 0.38)", "rgba(91, 80, 255, 0.32)", "rgba(91, 80, 255, 0.27)",
  "rgba(91, 80, 255, 0.23)", "rgba(91, 80, 255, 0.2)", "rgba(91, 80, 255, 0.17)", "rgba(91, 80, 255, 0.15)", "rgba(91, 80, 255, 0.13)",
  "rgba(91, 80, 255, 0.11)", "rgba(91, 80, 255, 0.09)",
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
    .toUpperCase() + ` ${year.slice(2)}`;
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
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#5b50ff" }} />
            Revenus HT
          </span>
          <span className="font-medium">{formatCurrency(data.revenueHT)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#5b50ff", opacity: 0.45 }} />
            Dépenses
          </span>
          <span className="font-medium">{formatCurrency(data.expenseAmount)}</span>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsExpenseCategoryChart({ expenseByCategory, loading }) {
  const chartData = useMemo(() => {
    if (!expenseByCategory?.length) return [];
    return expenseByCategory.map((c, i) => ({
      ...c,
      name: CATEGORY_LABELS[c.category] || c.category,
      fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));
  }, [expenseByCategory]);

  const chartConfig = useMemo(() => {
    const cfg = {};
    chartData.forEach((c) => {
      cfg[c.category] = { label: c.name, color: c.fill };
    });
    return cfg;
  }, [chartData]);

  if (loading) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Dépenses par catégorie</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Dépenses par catégorie</h3>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Aucune donnée
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-base font-medium mb-4">Dépenses par catégorie</h3>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="amount"
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
          <Tooltip content={<CategoryTooltip />} />
          <Legend
            formatter={(value) => (
              <span className="text-xs">{value}</span>
            )}
          />
        </PieChart>
      </ChartContainer>
    </div>
  );
}

export function AnalyticsRevenueVsExpenseChart({ monthlyRevenue, loading }) {
  const chartData = useMemo(() => {
    if (!monthlyRevenue?.length) return [];
    return monthlyRevenue.map((m) => ({
      ...m,
      monthLabel: formatMonthLabel(m.month),
    }));
  }, [monthlyRevenue]);

  const chartConfig = {
    revenueHT: { label: "Revenus HT", color: "#5b50ff" },
    expenseAmount: { label: "Dépenses", color: "#5b50ff" },
  };

  if (loading) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Revenus vs Dépenses</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Revenus vs Dépenses</h3>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Aucune donnée
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-base font-medium mb-4">Revenus vs Dépenses</h3>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
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
          <Bar dataKey="revenueHT" fill="#5b50ff" fillOpacity={0.8} radius={[4, 4, 0, 0]} barSize={20} />
          <Bar dataKey="expenseAmount" fill="#5b50ff" fillOpacity={0.4} radius={[4, 4, 0, 0]} barSize={20} />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}

export function AnalyticsPaymentMethodChart({ paymentMethodStats, loading }) {
  const chartData = useMemo(() => {
    if (!paymentMethodStats?.length) return [];
    return paymentMethodStats.map((s, i) => ({
      ...s,
      name: PAYMENT_LABELS[s.method] || s.method,
      fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
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
      <div>
        <h3 className="text-base font-medium mb-4">Méthodes de paiement</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Méthodes de paiement</h3>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Aucune donnée
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-base font-medium mb-4">Méthodes de paiement</h3>
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
    </div>
  );
}
