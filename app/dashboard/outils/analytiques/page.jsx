"use client";

import { useState, useMemo } from "react";
import { useDashboardData } from "@/src/hooks/useDashboardData";
import { useTreasuryForecastData } from "@/src/hooks/useTreasuryForecast";
import { AnalyticsTreasuryBalanceChart } from "./components/analytics-treasury-balance-chart";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useFinancialAnalytics } from "@/src/hooks/useFinancialAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";

import {
  AnalyticsDateFilter,
  getDateRangeForPreset,
} from "./components/analytics-date-filter";
import { AnalyticsKpiRow, formatCurrency, formatPercent, formatNumber, formatDays } from "./components/analytics-kpi-cards";
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
  AnalyticsRevenueVsExpenseChart,
  AnalyticsPaymentMethodChart,
} from "./components/analytics-expense-chart";
import { AnalyticsClientTable } from "./components/analytics-data-table";
import { AnalyticsCrossTabTable } from "./components/analytics-cross-tab-table";
import { AnalyticsOverdueTable } from "./components/analytics-overdue-table";
import { AnalyticsAgingChart } from "./components/analytics-aging-chart";
import { AnalyticsCollectionChart } from "./components/analytics-collection-chart";
import { AnalyticsTreasuryForecastChart } from "./components/analytics-treasury-forecast-chart";
import { AnalyticsBankFlowChart } from "./components/analytics-bank-flow-chart";

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
  { key: "netRevenueHT", label: "CA HT net", tooltip: "Chiffre d'affaires HT après déduction des avoirs" },
  { key: "totalExpensesHT", label: "Dépenses HT", tooltip: "Total des dépenses hors taxes", invertTrend: true },
  { key: "grossMargin", label: "Marge brute", tooltip: "CA HT net - Dépenses HT" },
  { key: "grossMarginRate", label: "Taux de marge", format: formatPercent, tooltip: "Marge brute / CA HT net" },
  { key: "invoiceCount", label: "Factures émises", format: formatNumber, tooltip: "Nombre de factures émises (hors brouillons)" },
  { key: "averageInvoiceHT", label: "Panier moyen", tooltip: "CA HT / Nombre de factures" },
  { key: "collectionRate", label: "Taux recouvrement", format: formatPercent, tooltip: "Factures payées / Total factures émises" },
  { key: "dso", label: "DSO", format: formatDays, tooltip: "Délai moyen de paiement en jours", invertTrend: true },
];

const RENTABILITE_KPI = [
  { key: "netRevenueHT", label: "CA HT net", tooltip: "Chiffre d'affaires HT après déduction des avoirs" },
  { key: "totalExpensesHT", label: "Dépenses HT", tooltip: "Total des dépenses hors taxes", invertTrend: true },
  { key: "grossMargin", label: "Marge brute", tooltip: "CA HT net - Dépenses HT" },
  { key: "grossMarginRate", label: "Taux de marge", format: formatPercent },
  { key: "chargeRate", label: "Taux de charges", format: formatPercent, tooltip: "Dépenses HT / CA HT net", invertTrend: true },
  { key: "averageInvoiceHT", label: "Panier moyen", tooltip: "CA HT / Nombre de factures" },
];

const TRESORERIE_BANK_KPI = [
  { key: "bankBalance", label: "Solde bancaire", tooltip: "Solde actuel de tous les comptes connectés" },
  { key: "burnRate", label: "Burn rate mensuel", tooltip: "Moyenne des sorties bancaires sur les 3 derniers mois", invertTrend: true },
  { key: "runway", label: "Runway", format: (v) => `${Math.round(v || 0)} mois`, tooltip: "Nombre de mois de trésorerie restants au rythme actuel" },
  { key: "projectedBalance", label: "Solde projeté (3 mois)", tooltip: "Solde estimé dans 3 mois basé sur les prévisions" },
];

const TRESORERIE_KPI = [
  { key: "outstandingReceivables", label: "Créances en cours", tooltip: "Somme des factures en attente et en retard" },
  { key: "overdueAmount", label: "Factures en retard", tooltip: "Factures dont la date d'échéance est dépassée" },
  { key: "dso", label: "DSO", format: formatDays, tooltip: "Délai moyen de paiement en jours", invertTrend: true },
  { key: "collectionRate", label: "Taux recouvrement", format: formatPercent, tooltip: "Factures payées / Total factures émises" },
];

const COMMERCIAL_KPI = [
  { key: "activeClientCount", label: "Clients actifs", format: formatNumber, tooltip: "Clients ayant au moins une facture sur la période" },
  { key: "newClientCount", label: "Nouveaux clients", format: formatNumber, tooltip: "Clients actifs cette période mais pas sur N-1" },
  { key: "retainedClientCount", label: "Clients fidélisés", format: formatNumber, tooltip: "Clients actifs sur les deux périodes" },
  { key: "quoteConversionRate", label: "Conversion devis", format: formatPercent, tooltip: "Devis acceptés / Total devis" },
  { key: "topClientConcentration", label: "Concentration top 3", format: formatPercent, tooltip: "Part du CA des 3 premiers clients", invertTrend: true },
];


export default function AnalytiquesPage() {
  const { workspaceId } = useRequiredWorkspace();

  const [period, setPeriod] = useState("current_year");
  const [dateRange, setDateRange] = useState(() => getDateRangeForPreset("current_year"));

  // Fetch analytics data
  const { analyticsData, loading } = useFinancialAnalytics(
    dateRange?.startDate,
    dateRange?.endDate
  );

  // Bank data
  const {
    bankTransactions,
    bankAccounts,
    bankBalance,
    totalIncome,
    totalExpenses,
    isLoading: bankLoading,
  } = useDashboardData();

  // Treasury forecast (6 months: 3 past + 3 future)
  const forecastStart = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  }, []);
  const forecastEnd = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().slice(0, 10);
  }, []);

  const { forecastData, loading: forecastLoading } = useTreasuryForecastData(
    forecastStart,
    forecastEnd
  );

  // Bank KPI calculations
  const bankKpi = useMemo(() => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const recentExpenses =
      bankTransactions?.filter(
        (t) => t.amount < 0 && new Date(t.date) >= threeMonthsAgo
      ) || [];
    const burnRate =
      recentExpenses.length > 0
        ? Math.abs(recentExpenses.reduce((s, t) => s + t.amount, 0)) / 3
        : 0;
    const runway = burnRate > 0 ? (bankBalance || 0) / burnRate : 99;

    return {
      bankBalance: bankBalance || 0,
      burnRate,
      runway: Math.min(runway, 99),
      projectedBalance: forecastData?.kpi?.projectedBalance3Months || 0,
    };
  }, [bankTransactions, bankBalance, forecastData]);

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
        <Tabs defaultValue="synthese" className="flex flex-col flex-1 min-h-0 gap-3">
          <TabsList className="mx-4 sm:mx-6 shrink-0">
            <TabsTrigger value="synthese">Synthèse</TabsTrigger>
            <TabsTrigger value="rentabilite">Rentabilité</TabsTrigger>
            <TabsTrigger value="tresorerie">Trésorerie</TabsTrigger>
            <TabsTrigger value="commercial">Clients</TabsTrigger>
            <TabsTrigger value="detail">Taxes</TabsTrigger>
          </TabsList>

          {/* ===== Tab 1 — SYNTHESE ===== */}
          <TabsContent value="synthese" className="space-y-8 flex-1 min-h-0 overflow-y-auto pb-8">
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
                bankTransactions={bankTransactions}
                loading={loading || bankLoading}
              />
              <AnalyticsMarginChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                loading={loading}
              />
            </div>
          </TabsContent>

          {/* ===== Tab 2 — RENTABILITE ===== */}
          <TabsContent value="rentabilite" className="space-y-8 flex-1 min-h-0 overflow-y-auto pb-8">
            <AnalyticsAlertBanner alerts={analyticsData?.alerts?.filter(a => a.type === 'MARGIN')} />

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
                bankTransactions={bankTransactions}
                loading={loading || bankLoading}
              />
              <AnalyticsCumulativeRevenueChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                loading={loading}
              />
            </div>

            {/* Expense Category + Revenue vs Expense */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-6">
              <AnalyticsExpenseCategoryChart
                expenseByCategory={analyticsData?.expenseByCategory}
                totalExpensesHT={analyticsData?.kpi?.totalExpensesHT}
                totalExpensesTTC={analyticsData?.kpi?.totalExpensesTTC}
                bankTransactions={bankTransactions}
                loading={loading || bankLoading}
              />
              <AnalyticsRevenueVsExpenseChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                bankTransactions={bankTransactions}
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
          <TabsContent value="tresorerie" className="space-y-8 flex-1 min-h-0 overflow-y-auto pb-8">
            <AnalyticsAlertBanner alerts={analyticsData?.alerts?.filter(a => a.type === 'DSO' || a.type === 'OVERDUE')} />

            {/* Bank KPI Cards */}
            <div className="px-4 sm:px-6">
              <AnalyticsKpiRow
                config={TRESORERIE_BANK_KPI}
                kpi={bankKpi}
                loading={bankLoading}
              />
            </div>

            {/* Treasury balance chart (without Card wrapper) */}
            <div className="px-4 sm:px-6">
              <AnalyticsTreasuryBalanceChart
                bankTransactions={bankTransactions || []}
                initialBalance={bankBalance || 0}
                loading={bankLoading}
              />
            </div>

            {/* Forecast Chart */}
            <div className="px-4 sm:px-6">
              <AnalyticsTreasuryForecastChart
                forecastData={forecastData}
                loading={forecastLoading}
              />
            </div>

            {/* Bank Flow + Collection side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-6">
              <AnalyticsBankFlowChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                bankTransactions={bankTransactions}
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

            {/* Overdue Table */}
            <AnalyticsOverdueTable
              overdueInvoices={analyticsData?.collection?.overdueInvoices}
              loading={loading}
            />
          </TabsContent>

          {/* ===== Tab 4 — COMMERCIAL ===== */}
          <TabsContent value="commercial" className="space-y-8 flex-1 min-h-0 overflow-y-auto pb-8">
            <AnalyticsAlertBanner alerts={analyticsData?.alerts?.filter(a => a.type === 'CONCENTRATION')} />

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

            {/* Monthly invoice count */}
            <div className="px-4 sm:px-6">
              <AnalyticsCountChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
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

          {/* ===== Tab 5 — DETAIL & EXPORT ===== */}
          <TabsContent value="detail" className="space-y-8 flex-1 min-h-0 overflow-y-auto pb-8">
            {/* VAT Chart + Payment Method */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-6">
              <AnalyticsVatChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                loading={loading}
              />
              <AnalyticsPaymentMethodChart
                paymentMethodStats={analyticsData?.paymentMethodStats}
                loading={loading}
              />
            </div>

            {/* Cross Tab Expenses x Month */}
            <AnalyticsCrossTabTable
              title="Tableau croisé Dépenses x Mois"
              data={analyticsData?.expenseByCategoryMonthly}
              rowKeyField="category"
              valueOptions={[
                { key: "amount", label: "Montant" },
                { key: "count", label: "Nombre" },
              ]}
              defaultValue="amount"
              rowLabelMap={CATEGORY_LABELS}
              loading={loading}
            />

          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}
