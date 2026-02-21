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
import { Download, Filter, ChevronDown, X } from "lucide-react";
import { cn } from "@/src/lib/utils";

import {
  AnalyticsDateFilter,
  getDateRangeForPreset,
} from "./components/analytics-date-filter";
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
        <h1 className="text-2xl font-medium">Analytiques</h1>
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
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="mx-4 sm:mx-6">
            <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="products">Produits & Services</TabsTrigger>
            <TabsTrigger value="expenses">Dépenses</TabsTrigger>
          </TabsList>

          {/* Tab 1 - Overview */}
          <TabsContent value="overview" className="space-y-8">
            <div className="px-4 sm:px-6">
              <AnalyticsRevenueChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                loading={loading}
              />
            </div>
            <Separator />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-6">
              <AnalyticsCumulativeRevenueChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                loading={loading}
              />
              <AnalyticsMarginChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                loading={loading}
              />
            </div>
            <Separator />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-6">
              <AnalyticsCountChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                loading={loading}
              />
              <AnalyticsVatChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                loading={loading}
              />
            </div>
            <Separator />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-6">
              <AnalyticsStatusChart
                statusBreakdown={analyticsData?.statusBreakdown}
                loading={loading}
              />
              <AnalyticsPaymentMethodChart
                paymentMethodStats={analyticsData?.paymentMethodStats}
                loading={loading}
              />
            </div>
          </TabsContent>

          {/* Tab 2 - Clients */}
          <TabsContent value="clients" className="space-y-8">
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
            <AnalyticsClientTable
              revenueByClient={analyticsData?.revenueByClient}
              loading={loading}
            />
            <Separator />
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

          {/* Tab 3 - Products */}
          <TabsContent value="products" className="space-y-8">
            <div className="px-4 sm:px-6">
              <AnalyticsProductChart
                revenueByProduct={analyticsData?.revenueByProduct}
                loading={loading}
              />
            </div>
            <Separator />
            <AnalyticsProductTable
              revenueByProduct={analyticsData?.revenueByProduct}
              loading={loading}
            />
          </TabsContent>

          {/* Tab 4 - Expenses */}
          <TabsContent value="expenses" className="space-y-8">
            <div className="px-4 sm:px-6">
              <AnalyticsRevenueVsExpenseChart
                monthlyRevenue={analyticsData?.monthlyRevenue}
                loading={loading}
              />
            </div>
            <Separator />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-6">
              <AnalyticsExpenseCategoryChart
                expenseByCategory={analyticsData?.expenseByCategory}
                loading={loading}
              />
              <AnalyticsPaymentMethodChart
                paymentMethodStats={analyticsData?.paymentMethodStats}
                loading={loading}
              />
            </div>
            <Separator />
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
