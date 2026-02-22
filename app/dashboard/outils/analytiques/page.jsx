"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useFinancialAnalytics } from "@/src/hooks/useFinancialAnalytics";
import { GET_CLIENTS } from "@/src/graphql/clientQueries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Download,
  Filter,
  ChevronDown,
  X,
} from "lucide-react";
import { cn } from "@/src/lib/utils";

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
import { AnalyticsClientTable, AnalyticsProductTable } from "./components/analytics-data-table";
import { AnalyticsCrossTabTable } from "./components/analytics-cross-tab-table";
import { AnalyticsExportDialog } from "./components/analytics-export-dialog";
import { AnalyticsOverdueTable } from "./components/analytics-overdue-table";
import { AnalyticsAgingChart } from "./components/analytics-aging-chart";
import { AnalyticsCollectionChart } from "./components/analytics-collection-chart";
import { AnalyticsExpenseDetailTable } from "./components/analytics-expense-detail-table";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "En attente", color: "bg-amber-400" },
  { value: "COMPLETED", label: "Payée", color: "bg-emerald-500" },
  { value: "OVERDUE", label: "En retard", color: "bg-red-500" },
  { value: "CANCELED", label: "Annulée", color: "bg-gray-400" },
];

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

function Separator() {
  return <div className="border-t border-border" />;
}

export default function AnalytiquesPage() {
  const { workspaceId } = useRequiredWorkspace();

  const [period, setPeriod] = useState("current_year");
  const [dateRange, setDateRange] = useState(() => getDateRangeForPreset("current_year"));
  const [clientFilter, setClientFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [exportOpen, setExportOpen] = useState(false);

  // Fetch clients for filter dropdown
  const { data: clientsData } = useQuery(GET_CLIENTS, {
    variables: { workspaceId, limit: 200 },
    skip: !workspaceId,
  });
  const clients = useMemo(
    () => clientsData?.clients?.items || [],
    [clientsData]
  );

  // Fetch analytics data
  const { analyticsData, loading } = useFinancialAnalytics(
    dateRange?.startDate,
    dateRange?.endDate,
    {
      clientIds: clientFilter,
      status: statusFilter,
    }
  );

  const selectedClientLabel = useMemo(() => {
    if (clientFilter.length === 0) return "Tous les clients";
    if (clientFilter.length === 1) {
      const c = clients.find((cl) => cl.id === clientFilter[0]);
      return c?.name || `${c?.firstName || ""} ${c?.lastName || ""}`.trim() || "Client";
    }
    return `${clientFilter.length} clients`;
  }, [clientFilter, clients]);

  const toggleClient = (clientId) => {
    setClientFilter((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const toggleStatus = (status) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 sm:pt-6 mb-6 px-4 sm:px-6 gap-4">
        <h1 className="text-2xl font-medium">Tableau de bord</h1>
        <div className="flex flex-wrap items-center gap-2">
          {/* Client filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {selectedClientLabel}
                {clientFilter.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-xs font-medium">
                    {clientFilter.length}
                  </span>
                )}
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[280px] max-h-72 overflow-auto">
              <DropdownMenuLabel>Client</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {clients.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleClient(c.id);
                  }}
                  className="gap-2"
                >
                  <Checkbox
                    checked={clientFilter.includes(c.id)}
                    className="pointer-events-none"
                  />
                  <span className="truncate">
                    {c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim()}
                  </span>
                </DropdownMenuItem>
              ))}
              {clientFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setClientFilter([])} className="gap-2 text-muted-foreground">
                    <X className="h-4 w-4" />
                    Réinitialiser
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Statut
                {statusFilter.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-xs font-medium">
                    {statusFilter.length}
                  </span>
                )}
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Statut facture</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {STATUS_OPTIONS.map((s) => (
                <DropdownMenuItem
                  key={s.value}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleStatus(s.value);
                  }}
                  className="gap-2"
                >
                  <Checkbox
                    checked={statusFilter.includes(s.value)}
                    className="pointer-events-none"
                  />
                  <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", s.color)} />
                  {s.label}
                </DropdownMenuItem>
              ))}
              {statusFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setStatusFilter([])} className="gap-2 text-muted-foreground">
                    <X className="h-4 w-4" />
                    Réinitialiser
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date filter */}
          <AnalyticsDateFilter
            period={period}
            onPeriodChange={setPeriod}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />

          {/* Export */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setExportOpen(true)}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="pb-8 flex-1">
        <Tabs defaultValue="synthese" className="space-y-6">
          <TabsList className="mx-4 sm:mx-6">
            <TabsTrigger value="synthese">Synthèse</TabsTrigger>
            <TabsTrigger value="rentabilite">Rentabilité</TabsTrigger>
            <TabsTrigger value="tresorerie">Trésorerie</TabsTrigger>
            <TabsTrigger value="commercial">Commercial</TabsTrigger>
            <TabsTrigger value="detail">Détail & Export</TabsTrigger>
          </TabsList>

          {/* ===== Tab 1 — SYNTHESE ===== */}
          <TabsContent value="synthese" className="space-y-6">
            {/* Alert Banner */}
            <div className="px-4 sm:px-6">
              <AnalyticsAlertBanner alerts={analyticsData?.alerts} />
            </div>

            {/* KPI */}
            <div className="px-4 sm:px-6">
              <AnalyticsKpiRow
                config={SYNTHESE_KPI}
                kpi={analyticsData?.kpi}
                previousPeriod={analyticsData?.previousPeriod}
                loading={loading}
              />
            </div>

            <Separator />

            {/* 2 Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-6">
              <AnalyticsRevenueChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                loading={loading}
              />
              <AnalyticsMarginChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                loading={loading}
              />
            </div>
          </TabsContent>

          {/* ===== Tab 2 — RENTABILITE ===== */}
          <TabsContent value="rentabilite" className="space-y-8">
            {/* KPI Cards */}
            <div className="px-4 sm:px-6">
              <AnalyticsKpiRow
                config={RENTABILITE_KPI}
                kpi={analyticsData?.kpi}
                previousPeriod={analyticsData?.previousPeriod}
                loading={loading}

              />
            </div>

            <Separator />

            {/* Revenue Chart */}
            <div className="px-4 sm:px-6">
              <AnalyticsRevenueChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                loading={loading}
              />
            </div>

            <Separator />

            {/* Cumulative + Expense Category */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-6">
              <AnalyticsCumulativeRevenueChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                loading={loading}
              />
              <AnalyticsExpenseCategoryChart
                expenseByCategory={analyticsData?.expenseByCategory}
                loading={loading}
              />
            </div>

            <Separator />

            {/* Revenue vs Expense */}
            <div className="px-4 sm:px-6">
              <AnalyticsRevenueVsExpenseChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                loading={loading}
              />
            </div>

            <Separator />

            {/* Product Chart + Table */}
            <div className="px-4 sm:px-6">
              <AnalyticsProductChart
                revenueByProduct={analyticsData?.revenueByProduct}
                loading={loading}
              />
            </div>
            <AnalyticsProductTable
              revenueByProduct={analyticsData?.revenueByProduct}
              loading={loading}
            />

            <Separator />

            {/* Expense Detail Table */}
            <AnalyticsExpenseDetailTable
              expenseByCategory={analyticsData?.expenseByCategory}
              totalExpensesHT={analyticsData?.kpi?.totalExpensesHT}
              totalExpensesTTC={analyticsData?.kpi?.totalExpensesTTC}
              loading={loading}
            />
          </TabsContent>

          {/* ===== Tab 3 — TRESORERIE & RECOUVREMENT ===== */}
          <TabsContent value="tresorerie" className="space-y-8">
            {/* KPI Cards */}
            <div className="px-4 sm:px-6">
              <AnalyticsKpiRow
                config={TRESORERIE_KPI}
                kpi={analyticsData?.kpi}
                previousPeriod={analyticsData?.previousPeriod}
                loading={loading}

              />
            </div>

            <Separator />

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

            <Separator />

            {/* Collection Chart */}
            <div className="px-4 sm:px-6">
              <AnalyticsCollectionChart
                monthlyCollection={analyticsData?.collection?.monthlyCollection}
                loading={loading}
              />
            </div>

            <Separator />

            {/* Overdue Table */}
            <AnalyticsOverdueTable
              overdueInvoices={analyticsData?.collection?.overdueInvoices}
              loading={loading}
            />
          </TabsContent>

          {/* ===== Tab 4 — COMMERCIAL ===== */}
          <TabsContent value="commercial" className="space-y-8">
            {/* KPI Cards */}
            <div className="px-4 sm:px-6">
              <AnalyticsKpiRow
                config={COMMERCIAL_KPI}
                kpi={analyticsData?.kpi}
                previousPeriod={analyticsData?.previousPeriod}
                loading={loading}

              />
            </div>

            <Separator />

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

            <Separator />

            {/* Monthly invoice count */}
            <div className="px-4 sm:px-6">
              <AnalyticsCountChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                loading={loading}
              />
            </div>

            <Separator />

            {/* Client Table */}
            <AnalyticsClientTable
              revenueByClient={analyticsData?.revenueByClient}
              loading={loading}
            />

            <Separator />

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
          <TabsContent value="detail" className="space-y-8">
            {/* VAT Chart */}
            <div className="px-4 sm:px-6">
              <AnalyticsVatChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                loading={loading}
              />
            </div>

            <Separator />

            {/* Payment Method */}
            <div className="px-4 sm:px-6">
              <AnalyticsPaymentMethodChart
                paymentMethodStats={analyticsData?.paymentMethodStats}
                loading={loading}
              />
            </div>

            <Separator />

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

            <Separator />

            {/* Export Section */}
            <div className="px-4 sm:px-6">
              <div className="rounded-lg border p-6 text-center space-y-4">
                <h3 className="text-lg font-medium">Exporter les données</h3>
                <p className="text-sm text-muted-foreground">
                  Téléchargez vos données analytiques dans le format de votre choix.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button onClick={() => setExportOpen(true)} className="gap-2">
                    <Download className="h-4 w-4" />
                    Exporter
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Export dialog */}
      <AnalyticsExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        analyticsData={analyticsData}
        dateRange={dateRange}
      />
    </div>
  );
}
