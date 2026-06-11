"use client";

import { useMemo } from "react";
import { PieChart, Pie, Tooltip, Label } from "recharts";
import { ChartContainer } from "@/src/components/ui/chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { getTransactionCategory } from "@/lib/bank-categories-config";
import { useChartColors } from "@/src/hooks/useChartColors";

const CA_NAME = "Chiffre d'affaires";
const CA_COLOR = "#5b50ff";

// Labels des sous-catégories fines de revenus posées manuellement sur les
// transactions (mêmes valeurs que le CategorySearchSelect de l'outil
// Transactions). Le helper getTransactionCategory ne lit pas le champ
// `category` : on le résout ici en priorité, comme le fait le backend.
const INCOME_CATEGORY_LABELS = {
  ventes: "Ventes de produits",
  services: "Prestations de services",
  honoraires: "Honoraires",
  commissions: "Commissions",
  consulting: "Consulting",
  abonnements_revenus: "Abonnements",
  licences_revenus: "Licences",
  royalties: "Royalties",
  loyers_revenus: "Loyers perçus",
  interets: "Intérêts",
  dividendes: "Dividendes",
  plus_values: "Plus-values",
  subventions: "Subventions",
  remboursements_revenus: "Remboursements",
  indemnites: "Indemnités",
  cadeaux_recus: "Cadeaux reçus",
  autre_revenu: "Autre revenu",
};

const FALLBACK_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

function RevenueTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm text-sm">
      <p className="font-medium mb-1">{data.name}</p>
      {data.isCA ? (
        <>
          <div className="flex items-center justify-between gap-4">
            <span>Revenus HT</span>
            <span className="font-medium">{formatCurrency(data.amountHT)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Revenus TTC</span>
            <span className="font-medium">{formatCurrency(data.amount)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Factures</span>
            <span className="font-medium">{data.count}</span>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <span>Montant</span>
            <span className="font-medium">{formatCurrency(data.amount)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Transactions</span>
            <span className="font-medium">{data.count}</span>
          </div>
        </>
      )}
    </div>
  );
}

export function AnalyticsRevenuePieChart({
  monthlyRevenue,
  bankTransactions,
  loading,
}) {
  const { remap } = useChartColors();

  // Mêmes règles que la vue d'ensemble (« Entrées par catégorie ») :
  // la part « Chiffre d'affaires » vient des factures payées (créées +
  // importées, par date de paiement — mêmes données que le graphique
  // "CA, Dépenses et Marge brute"), les autres parts des transactions
  // bancaires entrantes. Les transactions rattachées à une facture sont
  // exclues pour ne pas compter deux fois les factures encaissées.
  const chartData = useMemo(() => {
    const caHT = (monthlyRevenue || []).reduce(
      (s, m) => s + (m.revenueHT || 0),
      0,
    );
    const caTTC = (monthlyRevenue || []).reduce(
      (s, m) => s + (m.revenueTTC || 0),
      0,
    );
    const caCount = (monthlyRevenue || []).reduce(
      (s, m) => s + (m.invoiceCount || 0),
      0,
    );

    const incomeTransactions = (bankTransactions || []).filter(
      (t) => t.amount > 0 && !t.linkedInvoiceId,
    );

    // Catégorie manuelle (sous-catégorie fine) prioritaire, sinon
    // catégorisation automatique (Bridge / description).
    const totals = {};
    incomeTransactions.forEach((t) => {
      const manualLabel = INCOME_CATEGORY_LABELS[t.category];
      const cat = manualLabel
        ? { name: manualLabel, color: null }
        : getTransactionCategory(t);
      if (!totals[cat.name]) {
        totals[cat.name] = {
          name: cat.name,
          amount: 0,
          count: 0,
          color: cat.color,
        };
      }
      totals[cat.name].amount += Math.abs(t.amount);
      totals[cat.name].count += 1;
    });
    const bankCategories = Object.values(totals);
    let fallbackIndex = 0;
    bankCategories.forEach((c) => {
      if (!c.color) {
        c.color = FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length];
        fallbackIndex += 1;
      }
    });

    // La catégorie catch-all « Chiffre d'affaires » des transactions est
    // fusionnée avec la part issue des factures (montants TTC).
    const slices = [];
    let ca = { amount: caTTC, amountHT: caHT, count: caCount };
    bankCategories.forEach((c) => {
      if (c.name === CA_NAME) {
        ca = {
          amount: ca.amount + c.amount,
          amountHT: ca.amountHT,
          count: ca.count + c.count,
        };
      } else {
        slices.push({
          name: c.name,
          amount: c.amount,
          count: c.count,
          isCA: false,
          fill: remap(c.color),
        });
      }
    });
    if (ca.amount > 0) {
      slices.push({
        name: CA_NAME,
        amount: ca.amount,
        amountHT: ca.amountHT,
        count: ca.count,
        isCA: true,
        fill: remap(CA_COLOR),
      });
    }

    return slices
      .filter((s) => s.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .map((s) => ({ ...s, amount: Math.round(s.amount * 100) / 100 }));
  }, [monthlyRevenue, bankTransactions, remap]);

  const chartConfig = useMemo(() => {
    const cfg = { amount: { label: "Montant" } };
    chartData.forEach((c) => {
      cfg[c.name] = { label: c.name, color: c.fill };
    });
    return cfg;
  }, [chartData]);

  const totalAmount = useMemo(
    () => chartData.reduce((s, c) => s + c.amount, 0),
    [chartData],
  );

  const legendItems = useMemo(() => chartData.slice(0, 5), [chartData]);

  if (loading) {
    return (
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Revenus par catégorie
          </CardTitle>
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
          <CardTitle className="text-sm font-medium">
            Revenus par catégorie
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 flex items-center justify-center flex-1 min-h-[200px] text-muted-foreground">
          Aucune donnée pour cette période
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs flex flex-col min-h-0 py-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Revenus par catégorie
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
        <div className="flex items-center gap-8">
          <div className="flex-shrink-0">
            <ChartContainer
              config={chartConfig}
              className="aspect-square h-[280px] w-[280px]"
            >
              <PieChart>
                <Tooltip content={<RevenueTooltip />} cursor={false} />
                <Pie
                  data={chartData}
                  dataKey="amount"
                  nameKey="name"
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
            {legendItems.map((item) => {
              const percentage = ((item.amount / totalAmount) * 100).toFixed(1);
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <div
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.fill }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-normal text-foreground truncate">
                      {item.name} ({percentage} %)
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
