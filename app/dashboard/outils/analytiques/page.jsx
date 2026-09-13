"use client";

import { useState, useMemo } from "react";
import { useDashboardData } from "@/src/hooks/useDashboardData";
import { useTreasuryForecastData } from "@/src/hooks/useTreasuryForecast";
import { AnalyticsTreasuryBalanceChart } from "./components/analytics-treasury-balance-chart";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useFinancialAnalytics } from "@/src/hooks/useFinancialAnalytics";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { getPlanLimits } from "@/src/lib/plan-limits";
import { Lock } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";

import {
  AnalyticsDateFilter,
  getDateRangeForPreset,
} from "./components/analytics-date-filter";
import {
  AnalyticsKpiRow,
  formatCurrency,
  formatPercent,
  formatNumber,
  formatDays,
} from "./components/analytics-kpi-cards";
import { AnalyticsAlertBanner } from "./components/analytics-alert-banner";
import { AnalyticsRevenueChart } from "./components/analytics-revenue-chart";
import { AnalyticsCumulativeRevenueChart } from "./components/analytics-cumulative-revenue-chart";
import { AnalyticsVatChart } from "./components/analytics-vat-chart";
import { AnalyticsMarginChart } from "./components/analytics-margin-chart";
import { AnalyticsCountChart } from "./components/analytics-count-chart";
import { AnalyticsClientChart } from "./components/analytics-client-chart";
import { AnalyticsClientTypeChart } from "./components/analytics-client-type-chart";
import { AnalyticsProductChart } from "./components/analytics-product-chart";
import { AnalyticsStatusChart } from "./components/analytics-status-chart";
import {
  AnalyticsExpenseCategoryChart,
  AnalyticsPaymentMethodChart,
} from "./components/analytics-expense-chart";
import { AnalyticsRevenuePieChart } from "./components/analytics-revenue-pie-chart";
import { AnalyticsClientTable } from "./components/analytics-data-table";
import { AnalyticsCrossTabTable } from "./components/analytics-cross-tab-table";
import { AnalyticsOverdueTable } from "./components/analytics-overdue-table";
import { AnalyticsAgingChart } from "./components/analytics-aging-chart";
import { AnalyticsCollectionChart } from "./components/analytics-collection-chart";
import { AnalyticsTreasuryForecastChart } from "./components/analytics-treasury-forecast-chart";
import { AnalyticsBankFlowChart } from "./components/analytics-bank-flow-chart";
import BankBalanceCard from "@/src/components/banking/BankBalanceCard";
import RecentTransactionsCard from "@/src/components/banking/RecentTransactionsCard";
import { TreasuryChart } from "@/src/components/treasury-chart";
import { ChartAreaInteractive } from "@/src/components/chart-area-interactive";
import { IncomeCategoryChart } from "@/app/dashboard/components/income-category-chart";
import { ExpenseCategoryChart } from "@/app/dashboard/outils/transactions/components/expense-category-chart";
import { InvoicesToCollectCard } from "@/app/dashboard/components/invoices-to-collect-card";
import { PurchaseInvoicesStatsCard } from "@/app/dashboard/components/purchase-invoices-stats-card";
import { PendingQuotesCard } from "@/app/dashboard/components/pending-quotes-card";
import { OverdueInvoicesCard } from "@/app/dashboard/components/overdue-invoices-card";
import { MonthlyRevenueCard } from "@/app/dashboard/components/monthly-revenue-card";
import { TopClientsCard } from "@/app/dashboard/components/top-clients-card";
import { WeekCalendarCard } from "@/app/dashboard/components/week-calendar-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";

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

// ==============================
// KPI CONFIGS PER TAB
// ==============================

const SYNTHESE_KPI = [
  {
    key: "netRevenueHT",
    label: "CA HT net",
    tooltip: "Chiffre d'affaires HT après déduction des avoirs",
  },
  {
    key: "totalExpensesHT",
    label: "Dépenses HT",
    tooltip: "Total des dépenses hors taxes",
    invertTrend: true,
  },
  {
    key: "grossMargin",
    label: "Marge brute",
    tooltip: "CA HT net - Dépenses HT",
  },
  {
    key: "grossMarginRate",
    label: "Taux de marge",
    format: formatPercent,
    tooltip: "Marge brute / CA HT net",
  },
  {
    key: "invoiceCount",
    label: "Factures émises",
    format: formatNumber,
    tooltip: "Nombre de factures émises (hors brouillons)",
  },
  {
    key: "averageInvoiceHT",
    label: "Panier moyen",
    tooltip: "CA HT / Nombre de factures",
  },
  {
    key: "collectionRate",
    label: "Taux recouvrement",
    format: formatPercent,
    tooltip: "Factures payées / Total factures émises",
  },
  {
    key: "dso",
    label: "DSO",
    format: formatDays,
    tooltip: "Délai moyen de paiement en jours",
    invertTrend: true,
  },
];

const RENTABILITE_KPI = [
  {
    key: "netRevenueHT",
    label: "CA HT net",
    tooltip: "Chiffre d'affaires HT après déduction des avoirs",
  },
  {
    key: "totalExpensesHT",
    label: "Dépenses HT",
    tooltip: "Total des dépenses hors taxes",
    invertTrend: true,
  },
  {
    key: "grossMargin",
    label: "Marge brute",
    tooltip: "CA HT net - Dépenses HT",
  },
  { key: "grossMarginRate", label: "Taux de marge", format: formatPercent },
  {
    key: "chargeRate",
    label: "Taux de charges",
    format: formatPercent,
    tooltip: "Dépenses HT / CA HT net",
    invertTrend: true,
  },
  {
    key: "averageInvoiceHT",
    label: "Panier moyen",
    tooltip: "CA HT / Nombre de factures",
  },
];

// Le libellé et le tooltip du solde projeté dépendent de la période
// sélectionnée : construits dans le composant (voir bankKpiConfig).
const TRESORERIE_BANK_KPI_BASE = [
  {
    key: "bankBalance",
    label: "Solde bancaire",
    tooltip: "Solde actuel de tous les comptes connectés (à ce jour)",
  },
  {
    key: "burnRate",
    label: "Burn rate mensuel",
    tooltip:
      "Moyenne mensuelle des sorties bancaires sur la période sélectionnée",
    invertTrend: true,
  },
  {
    key: "runway",
    label: "Runway",
    format: (v) => `${Math.round(v || 0)} mois`,
    tooltip:
      "Nombre de mois de trésorerie restants au rythme de dépenses de la période sélectionnée",
  },
];

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  month: "short",
  year: "numeric",
});
const formatMonthKeyLabel = (monthKey) => {
  if (!monthKey) return "";
  const [y, m] = monthKey.split("-").map(Number);
  return MONTH_LABEL_FORMATTER.format(new Date(y, m - 1, 1)).replace(".", "");
};
const toDateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const TRESORERIE_KPI = [
  {
    key: "outstandingReceivables",
    label: "Créances en cours TTC",
    tooltip:
      "Somme TTC des factures en attente et en retard à ce jour (indépendant de la période)",
  },
  {
    key: "overdueAmount",
    label: "Factures en retard TTC",
    tooltip:
      "Montant TTC des factures dont la date d'échéance est dépassée à ce jour (indépendant de la période)",
  },
  {
    key: "dso",
    label: "DSO",
    format: formatDays,
    tooltip: "Délai moyen de paiement en jours",
    invertTrend: true,
  },
  {
    key: "collectionRate",
    label: "Taux recouvrement",
    format: (v) => `${(v || 0).toFixed(2)}%`,
    tooltip:
      "Montant encaissé / Montant impayé (factures échues sans avoir, Newbi + importées) × 100",
  },
];

const COMMERCIAL_KPI = [
  {
    key: "activeClientCount",
    label: "Clients actifs",
    format: formatNumber,
    tooltip: "Clients ayant au moins une facture sur la période",
  },
  {
    key: "newClientCount",
    label: "Nouveaux clients",
    format: formatNumber,
    tooltip: "Clients actifs cette période mais pas sur N-1",
  },
  {
    key: "quoteConversionRate",
    label: "Conversion devis",
    format: formatPercent,
    tooltip: "Devis acceptés / Total devis",
  },
  {
    key: "topClientConcentration",
    label: "Concentration top 3",
    format: formatPercent,
    tooltip: "Part du CA des 3 premiers clients",
    invertTrend: true,
  },
];

export default function AnalytiquesPage() {
  const { workspaceId } = useRequiredWorkspace();
  const { subscription } = useSubscription();
  const planLimits = getPlanLimits(subscription?.plan);
  const hasAdvancedAnalytics = planLimits.advancedAnalytics;

  const [period, setPeriod] = useState("current_year");
  const [dateRange, setDateRange] = useState(() =>
    getDateRangeForPreset("current_year"),
  );

  // Fetch analytics data
  const { analyticsData, loading } = useFinancialAnalytics(
    dateRange?.startDate,
    dateRange?.endDate,
  );

  // Bank data
  const {
    bankTransactions,
    bankAccounts,
    bankBalance,
    totalIncome,
    totalExpenses,
    invoices,
    paidInvoices,
    paidExpenses,
    isLoading: bankLoading,
    invoicesLoading,
    transactionsLoading,
    formatCurrency: dashFormatCurrency,
  } = useDashboardData();

  // Transactions bancaires restreintes à la période sélectionnée — le hook
  // useDashboardData renvoie l'historique complet, sans filtre de dates
  const filteredBankTransactions = useMemo(() => {
    if (!dateRange?.startDate || !dateRange?.endDate) return bankTransactions;
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    end.setHours(23, 59, 59, 999);
    return (bankTransactions || []).filter((t) => {
      const rawDate = t.date || t.processedAt || t.createdAt;
      if (!rawDate) return false;
      const d = new Date(rawDate);
      return !isNaN(d.getTime()) && d >= start && d <= end;
    });
  }, [bankTransactions, dateRange]);

  // Prévision de trésorerie calée sur la période sélectionnée. La fenêtre
  // demandée à l'API est élargie au mois courant : le resolver ancre les
  // soldes sur le solde bancaire actuel et ne sait pas reconstituer une
  // période entièrement passée sans lui. Les mois hors période sont ensuite
  // retirés côté front (periodForecastData).
  const todayKey = toDateKey(new Date());
  const periodStartKey = dateRange?.startDate || todayKey;
  const periodEndKey = dateRange?.endDate || todayKey;
  const forecastStart = periodStartKey < todayKey ? periodStartKey : todayKey;
  const forecastEnd = periodEndKey > todayKey ? periodEndKey : todayKey;

  const { forecastData, loading: forecastLoading } = useTreasuryForecastData(
    forecastStart,
    forecastEnd,
  );

  const periodForecastData = useMemo(() => {
    if (!forecastData?.months) return forecastData;
    const startMonth = periodStartKey.slice(0, 7);
    const endMonth = periodEndKey.slice(0, 7);
    return {
      ...forecastData,
      months: forecastData.months.filter(
        (m) => m.month >= startMonth && m.month <= endMonth,
      ),
    };
  }, [forecastData, periodStartKey, periodEndKey]);

  // Solde projeté = solde de clôture du dernier mois de la période. Si la
  // période est déjà terminée, c'est le solde constaté en fin de période.
  const lastPeriodMonth =
    periodForecastData?.months?.[periodForecastData.months.length - 1] || null;
  const periodEndsInFuture = periodEndKey.slice(0, 7) > todayKey.slice(0, 7);
  const bankKpiConfig = useMemo(
    () => [
      ...TRESORERIE_BANK_KPI_BASE,
      periodEndsInFuture
        ? {
            key: "projectedBalance",
            label: `Solde projeté (fin ${formatMonthKeyLabel(
              lastPeriodMonth?.month || periodEndKey.slice(0, 7),
            )})`,
            tooltip:
              "Solde estimé à la fin de la période sélectionnée, basé sur les prévisions de trésorerie",
          }
        : {
            key: "projectedBalance",
            label: "Solde fin de période",
            tooltip:
              "Solde bancaire reconstitué à la fin de la période sélectionnée",
          },
    ],
    [periodEndsInFuture, lastPeriodMonth?.month, periodEndKey],
  );

  // Bank KPI calculations, sur la période sélectionnée
  const bankKpi = useMemo(() => {
    const now = new Date();
    const start = dateRange?.startDate ? new Date(dateRange.startDate) : null;
    let end = dateRange?.endDate ? new Date(dateRange.endDate) : now;
    end.setHours(23, 59, 59, 999);
    // Pas de sorties dans le futur : le rythme se mesure jusqu'à aujourd'hui
    if (end > now) end = now;

    const periodExpenses = (bankTransactions || []).filter((t) => {
      if (!(t.amount < 0)) return false;
      const d = new Date(t.date || t.processedAt || t.createdAt);
      if (isNaN(d.getTime())) return false;
      return (!start || d >= start) && d <= end;
    });
    const totalOut = Math.abs(periodExpenses.reduce((s, t) => s + t.amount, 0));
    // Nombre de mois écoulés dans la période (fraction, minimum 1 mois pour
    // ne pas extrapoler un burn rate à partir de quelques jours)
    const elapsedDays = start
      ? Math.max((end - start) / (1000 * 60 * 60 * 24), 0)
      : 0;
    const monthsInPeriod = Math.max(elapsedDays / 30.44, 1);
    const burnRate = totalOut > 0 ? totalOut / monthsInPeriod : 0;
    const runway = burnRate > 0 ? (bankBalance || 0) / burnRate : 99;

    return {
      bankBalance: bankBalance || 0,
      burnRate,
      runway: Math.min(runway, 99),
      projectedBalance: lastPeriodMonth
        ? lastPeriodMonth.closingBalance
        : bankBalance || 0,
    };
  }, [bankTransactions, bankBalance, dateRange, lastPeriodMonth]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 sm:pt-4 mb-3 px-4 sm:px-6 gap-3">
        <h1 className="text-2xl font-medium">Analytique</h1>
        <div className="flex flex-wrap items-center gap-2">
          {/* Date filter */}
          <AnalyticsDateFilter
            period={period}
            onPeriodChange={setPeriod}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 min-h-0 flex flex-col">
        <Tabs
          defaultValue="synthese"
          className="flex flex-col flex-1 min-h-0 gap-3"
        >
          <TabsList className="mx-4 sm:mx-6 shrink-0">
            <TabsTrigger value="synthese">Synthèse</TabsTrigger>
            {hasAdvancedAnalytics ? (
              <>
                <TabsTrigger value="rentabilite">Rentabilité</TabsTrigger>
                <TabsTrigger value="tresorerie">Trésorerie</TabsTrigger>
                <TabsTrigger value="commercial">Clients</TabsTrigger>
                <TabsTrigger value="detail">Taxes</TabsTrigger>
              </>
            ) : (
              <>
                {["Rentabilité", "Trésorerie", "Clients", "Taxes"].map(
                  (label) => (
                    <Tooltip key={label}>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground/50 cursor-not-allowed">
                          {label}
                          <Lock size={12} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Passez au plan PME ou Entreprise pour accéder aux
                        analyses avancées
                      </TooltipContent>
                    </Tooltip>
                  ),
                )}
              </>
            )}
          </TabsList>

          {/* ===== Tab 1 — SYNTHESE ===== */}
          <TabsContent
            value="synthese"
            className="space-y-8 flex-1 min-h-0 overflow-y-auto pb-8"
          >
            <AnalyticsAlertBanner alerts={analyticsData?.alerts} />

            {/* KPI Cards */}
            <div className="px-4 sm:px-6">
              <AnalyticsKpiRow
                config={SYNTHESE_KPI}
                kpi={analyticsData?.kpi}
                previousPeriod={analyticsData?.previousPeriod}
                loading={loading}
              />
            </div>

            {/* 2 Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-6">
              <AnalyticsRevenueChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                bankTransactions={filteredBankTransactions}
                loading={loading || bankLoading}
              />
              <AnalyticsMarginChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                loading={loading}
              />
            </div>
          </TabsContent>

          {/* ===== Tab 2 — RENTABILITE ===== */}
          <TabsContent
            value="rentabilite"
            className="space-y-8 flex-1 min-h-0 overflow-y-auto pb-8"
          >
            <AnalyticsAlertBanner
              alerts={analyticsData?.alerts?.filter((a) => a.type === "MARGIN")}
            />

            {/* KPI Cards */}
            <div className="px-4 sm:px-6">
              <AnalyticsKpiRow
                config={RENTABILITE_KPI}
                kpi={analyticsData?.kpi}
                previousPeriod={analyticsData?.previousPeriod}
                loading={loading}
              />
            </div>

            {/* Revenue Chart + Cumulative Revenue */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-6">
              <AnalyticsRevenueChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                bankTransactions={filteredBankTransactions}
                loading={loading || bankLoading}
              />
              <AnalyticsCumulativeRevenueChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                loading={loading}
              />
            </div>

            {/* Expense Category + Revenue Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-6">
              <AnalyticsExpenseCategoryChart
                expenseByCategory={analyticsData?.expenseByCategory}
                totalExpensesHT={analyticsData?.kpi?.totalExpensesHT}
                totalExpensesTTC={analyticsData?.kpi?.totalExpensesTTC}
                bankTransactions={filteredBankTransactions}
                loading={loading || bankLoading}
              />
              <AnalyticsRevenuePieChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                bankTransactions={filteredBankTransactions}
                loading={loading || bankLoading}
              />
            </div>

            {/* Product Chart (full width, with bar/treemap/table toggle) */}
            <div className="px-4 sm:px-6">
              <AnalyticsProductChart
                revenueByProduct={analyticsData?.revenueByProduct}
                loading={loading}
              />
            </div>
          </TabsContent>

          {/* ===== Tab 3 — TRESORERIE & RECOUVREMENT ===== */}
          <TabsContent
            value="tresorerie"
            className="space-y-8 flex-1 min-h-0 overflow-y-auto pb-8"
          >
            <AnalyticsAlertBanner
              alerts={analyticsData?.alerts?.filter(
                (a) => a.type === "DSO" || a.type === "OVERDUE",
              )}
            />

            {/* Bank KPI Cards */}
            <div className="px-4 sm:px-6">
              <AnalyticsKpiRow
                config={bankKpiConfig}
                kpi={bankKpi}
                loading={bankLoading || forecastLoading}
              />
            </div>

            {/* Treasury balance chart (without Card wrapper) */}
            <div className="px-4 sm:px-6">
              <AnalyticsTreasuryBalanceChart
                bankTransactions={bankTransactions || []}
                initialBalance={bankBalance || 0}
                dateRange={dateRange}
                loading={bankLoading}
              />
            </div>

            {/* Forecast Chart */}
            <div className="px-4 sm:px-6">
              <AnalyticsTreasuryForecastChart
                forecastData={periodForecastData}
                loading={forecastLoading}
              />
            </div>

            {/* Facturé vs Encaissé + Recouvrement mensuel côte à côte */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-6">
              <AnalyticsBankFlowChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                monthlyCollection={analyticsData?.collection?.monthlyCollection}
                bankTransactions={filteredBankTransactions}
                loading={loading || bankLoading}
              />
              <AnalyticsCollectionChart
                monthlyCollection={analyticsData?.collection?.monthlyCollection}
                loading={loading}
              />
            </div>

            {/* Section separator */}
            <div className="px-4 sm:px-6">
              <h2 className="text-lg font-medium text-muted-foreground">
                Analyse du recouvrement
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Créances, retards et ancienneté reflètent la situation à ce
                jour. DSO, taux de recouvrement et statuts suivent la période
                sélectionnée.
              </p>
            </div>

            {/* Recovery KPI Cards */}
            <div className="px-4 sm:px-6">
              <AnalyticsKpiRow
                config={TRESORERIE_KPI}
                kpi={analyticsData?.kpi}
                previousPeriod={analyticsData?.previousPeriod}
                loading={loading}
              />
            </div>

            {/* Status Chart + Aging Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-6">
              <AnalyticsStatusChart
                statusBreakdown={analyticsData?.statusBreakdown}
                loading={loading}
              />
              <AnalyticsAgingChart
                agingBuckets={analyticsData?.collection?.agingBuckets}
                loading={loading}
              />
            </div>

            {/* Payment Method (déplacé depuis l'onglet Taxes — T21) */}
            <div className="px-4 sm:px-6">
              <AnalyticsPaymentMethodChart
                paymentMethodStats={analyticsData?.paymentMethodStats}
                loading={loading}
              />
            </div>

            {/* Overdue Table */}
            <AnalyticsOverdueTable
              overdueInvoices={analyticsData?.collection?.overdueInvoices}
              loading={loading}
            />
          </TabsContent>

          {/* ===== Tab 4 — COMMERCIAL ===== */}
          <TabsContent
            value="commercial"
            className="space-y-8 flex-1 min-h-0 overflow-y-auto pb-8"
          >
            <AnalyticsAlertBanner
              alerts={analyticsData?.alerts?.filter(
                (a) => a.type === "CONCENTRATION",
              )}
            />

            {/* KPI Cards */}
            <div className="px-4 sm:px-6">
              <AnalyticsKpiRow
                config={COMMERCIAL_KPI}
                kpi={analyticsData?.kpi}
                previousPeriod={analyticsData?.previousPeriod}
                loading={loading}
              />
            </div>

            {/* Client Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-6">
              <AnalyticsClientChart
                topClients={analyticsData?.topClients}
                loading={loading}
              />
              <AnalyticsClientTypeChart
                revenueByClient={analyticsData?.revenueByClient}
                loading={loading}
              />
            </div>

            {/* Client Table */}
            <AnalyticsClientTable
              revenueByClient={analyticsData?.revenueByClient}
              loading={loading}
            />

            {/* Cross Tab Client x Month */}
            <AnalyticsCrossTabTable
              title="Tableau croisé Client x Mois"
              data={analyticsData?.revenueByClientMonthly}
              rowKeyField="clientName"
              valueOptions={[
                { key: "totalHT", label: "CA HT" },
                { key: "totalTTC", label: "CA TTC" },
                { key: "totalVAT", label: "TVA" },
                { key: "invoiceCount", label: "Nb factures" },
              ]}
              defaultValue="totalHT"
              loading={loading}
            />
          </TabsContent>

          {/* ===== Tab 5 — TAXES ===== */}
          <TabsContent
            value="detail"
            className="space-y-8 flex-1 min-h-0 overflow-y-auto pb-8"
          >
            {/* VAT Chart (Méthode de paiement déplacée vers Trésorerie — T21,
                Tableau croisé Dépenses x Mois supprimé — T23) */}
            <div className="px-4 sm:px-6">
              <AnalyticsVatChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                loading={loading}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
