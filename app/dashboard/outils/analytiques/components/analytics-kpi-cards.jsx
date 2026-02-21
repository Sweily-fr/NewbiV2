"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  ShoppingCart,
  Users,
  BarChart3,
} from "lucide-react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

const KPI_CONFIG = [
  {
    key: "totalRevenueHT",
    label: "CA HT",
    icon: TrendingUp,
    format: formatCurrency,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    key: "totalRevenueTTC",
    label: "CA TTC",
    icon: BarChart3,
    format: formatCurrency,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    key: "totalExpenses",
    label: "Dépenses",
    icon: ShoppingCart,
    format: formatCurrency,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    key: "netResult",
    label: "Résultat net",
    icon: TrendingDown,
    format: formatCurrency,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    dynamicColor: true,
  },
  {
    key: "invoiceCount",
    label: "Factures",
    icon: Receipt,
    format: (v) => v?.toString() || "0",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    key: "averageInvoiceHT",
    label: "Panier moyen",
    icon: Users,
    format: formatCurrency,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
  },
];

export function AnalyticsKpiCards({ kpi, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {KPI_CONFIG.map((item) => (
          <Card key={item.key}>
            <CardHeader className="pb-2 pt-4 px-4">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Skeleton className="h-7 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {KPI_CONFIG.map((item) => {
        const value = kpi?.[item.key] ?? 0;
        const Icon = item.icon;
        const iconColor =
          item.dynamicColor
            ? value >= 0
              ? "text-emerald-600"
              : "text-red-600"
            : item.color;
        const iconBg =
          item.dynamicColor
            ? value >= 0
              ? "bg-emerald-50"
              : "bg-red-50"
            : item.bgColor;

        return (
          <Card key={item.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
              <div className={`rounded-md p-1.5 ${iconBg}`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl font-semibold tracking-tight">
                {item.format(value)}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
