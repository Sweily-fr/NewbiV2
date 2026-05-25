"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { useDashboardData } from "@/src/hooks/useDashboardData";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useChartColors } from "@/src/hooks/useChartColors";
import { usePurchaseInvoiceStats } from "@/src/hooks/usePurchaseInvoices";
import {
  getIncomeChartConfig,
  getExpenseChartConfig,
} from "@/src/utils/chartDataProcessors";
import { GET_TREASURY_CHART } from "@/src/graphql/queries/dashboardAggregation";
import { TreasuryChart } from "@/src/components/treasury-chart";
import { ChartAreaInteractive } from "@/src/components/chart-area-interactive";
import { IncomeCategoryChart } from "@/app/dashboard/components/income-category-chart";
import { ExpenseCategoryChart } from "@/app/dashboard/outils/transactions/components/expense-category-chart";
import { Card, CardHeader, CardTitle } from "@/src/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

// T1 : filtres période pour le CA (mensuel, trimestriel, annuel)
const CA_PERIOD_OPTIONS = [
  { value: "month", label: "Mensuel" },
  { value: "quarter", label: "Trimestriel" },
  { value: "year", label: "Annuel" },
];

function getCaPeriodRange(period) {
  const now = new Date();
  switch (period) {
    case "month":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: now,
      };
    case "quarter": {
      const qm = Math.floor(now.getMonth() / 3) * 3;
      return { start: new Date(now.getFullYear(), qm, 1), end: now };
    }
    case "year":
    default:
      return { start: new Date(now.getFullYear(), 0, 1), end: now };
  }
}

export default function VueDensemblePage() {
  const { workspaceId } = useRequiredWorkspace();
  const { remap } = useChartColors();
  // T1 — filtre période sur la carte CA
  const [caPeriod, setCaPeriod] = useState("year");

  const {
    bankAccounts,
    bankBalance,
    totalIncome,
    totalExpenses,
    invoices,
    isLoading: bankLoading,
    formatCurrency,
  } = useDashboardData();

  // T2 — Stats des factures d'achats (non payées) pour la carte "À Payer"
  const { stats: purchaseInvoiceStats, loading: piStatsLoading } =
    usePurchaseInvoiceStats();

  const { data: flowChartData, loading: flowChartLoading } = useQuery(
    GET_TREASURY_CHART,
    {
      variables: {
        workspaceId,
        period: { preset: "365d" },
      },
      fetchPolicy: "cache-and-network",
      skip: !workspaceId,
    },
  );

  const incomeChartData = useMemo(() => {
    const points = flowChartData?.dashboardTreasuryChart?.dataPoints || [];
    return points.map((d) => ({ date: d.date, desktop: d.income, mobile: 0 }));
  }, [flowChartData]);

  const expenseChartData = useMemo(() => {
    const points = flowChartData?.dashboardTreasuryChart?.dataPoints || [];
    return points.map((d) => ({
      date: d.date,
      desktop: d.expenses,
      mobile: 0,
    }));
  }, [flowChartData]);

  const incomeChartConfig = getIncomeChartConfig(remap);
  const expenseChartConfig = getExpenseChartConfig(remap);
  const cardsLoading = bankLoading;
  const chartsLoading = flowChartLoading;

  // T1 — CA HT calculé sur les factures payées dont paymentDate est dans la période
  const caForPeriod = useMemo(() => {
    const { start, end } = getCaPeriodRange(caPeriod);
    return (invoices || [])
      .filter((i) => i.status === "COMPLETED")
      .filter((i) => {
        const d = i.paymentDate ? new Date(i.paymentDate) : null;
        if (!d || isNaN(d.getTime())) return false;
        return d >= start && d <= end;
      })
      .reduce((s, i) => s + (i.finalTotalHT || 0), 0);
  }, [invoices, caPeriod]);

  // T3 — Encours clients = factures à émettre (DRAFT) + en retard (OVERDUE)
  // + en attente (PENDING, échéance future). Exclut COMPLETED et CANCELED.
  const encoursClients = useMemo(() => {
    return (invoices || [])
      .filter((i) => ["DRAFT", "PENDING", "OVERDUE"].includes(i.status))
      .reduce((s, i) => s + (i.finalTotalTTC || i.finalTotalHT || 0), 0);
  }, [invoices]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between pt-3 sm:pt-4 mb-3 px-4 sm:px-6">
        <h1 className="text-2xl font-medium">Vue d&apos;ensemble</h1>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pb-6">
        <div className="flex flex-col gap-4 md:gap-6 mt-3">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full">
            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle className="text-sm font-normal">
                  Solde de Trésorerie
                </CardTitle>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-medium">
                    {formatCurrency(bankBalance)}
                  </span>
                  <div className="flex items-center -space-x-2">
                    {(bankAccounts || []).slice(0, 3).map((account) => (
                      <Avatar
                        key={account.id}
                        className="size-7 ring-2 ring-background bg-muted"
                      >
                        {account.institutionLogo ? (
                          <AvatarImage
                            src={account.institutionLogo}
                            alt={
                              account.institutionName ||
                              account.bankName ||
                              account.name
                            }
                            className="object-contain p-0.5"
                          />
                        ) : null}
                        <AvatarFallback className="text-[10px] bg-muted">
                          {(
                            account.institutionName ||
                            account.bankName ||
                            account.name ||
                            "B"
                          )
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {(bankAccounts || []).length > 3 && (
                      <div className="size-7 ring-2 ring-background rounded-full flex items-center justify-center text-[10px] font-medium text-foreground bg-muted">
                        +{(bankAccounts || []).length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="shadow-xs">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-normal">
                    Chiffre d&apos;Affaires
                  </CardTitle>
                  <Select value={caPeriod} onValueChange={setCaPeriod}>
                    <SelectTrigger className="h-7 w-auto border-none bg-transparent px-1 text-xs text-muted-foreground hover:bg-muted/50 focus:ring-0 shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {CA_PERIOD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <span className="text-xl font-medium">
                  {formatCurrency(caForPeriod)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    HT
                  </span>
                </span>
              </CardHeader>
            </Card>

            <Card className="shadow-xs">
              <CardHeader>
                <div className="grid grid-cols-2 divide-x">
                  <div className="pr-4">
                    <p className="text-sm font-normal">À Payer</p>
                    <span className="text-xl font-medium mt-1 block">
                      {piStatsLoading
                        ? "—"
                        : formatCurrency(
                            purchaseInvoiceStats?.totalToPay || 0,
                          )}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        TTC
                      </span>
                    </span>
                  </div>
                  <div className="pl-4">
                    <p className="text-sm font-normal">Encours Clients</p>
                    <span className="text-xl font-medium mt-1 block">
                      {formatCurrency(encoursClients)}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        TTC
                      </span>
                    </span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Trésorerie */}
          <TreasuryChart
            workspaceId={workspaceId}
            className="shadow-xs w-full"
            isLoading={cardsLoading}
          />

          {/* Entrées / Sorties */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
            <ChartAreaInteractive
              title="Entrées"
              computeDescription={(filtered) =>
                formatCurrency(
                  filtered.reduce((sum, d) => sum + (d.desktop || 0), 0),
                )
              }
              height="200px"
              className="shadow-xs w-full md:w-1/2"
              config={incomeChartConfig}
              data={incomeChartData}
              hideMobileCurve={true}
              isLoading={chartsLoading}
            />
            <ChartAreaInteractive
              title="Sorties"
              computeDescription={(filtered) =>
                formatCurrency(
                  filtered.reduce((sum, d) => sum + (d.desktop || 0), 0),
                )
              }
              height="200px"
              className="shadow-xs w-full md:w-1/2"
              config={expenseChartConfig}
              data={expenseChartData}
              hideMobileCurve={true}
              isLoading={chartsLoading}
            />
          </div>

          {/* Répartition par catégorie */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
            <IncomeCategoryChart
              workspaceId={workspaceId}
              className="shadow-xs w-full md:w-1/2"
            />
            <ExpenseCategoryChart
              workspaceId={workspaceId}
              className="shadow-xs w-full md:w-1/2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
