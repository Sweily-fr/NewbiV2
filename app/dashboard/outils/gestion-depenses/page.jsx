"use client";
import { ChartAreaInteractive } from "@/src/components/chart-area-interactive";
import TransactionTable from "./components/table";
import { ExpenseCategoryChart } from "./components/expense-category-chart";
import { useMemo } from "react";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { useExpenses } from "@/src/hooks/useExpenses";
import { useUnifiedExpenses } from "@/src/hooks/useUnifiedExpenses";
import {
  processExpensesWithBankForCharts,
  getExpenseChartConfig,
} from "@/src/utils/chartDataProcessors";
import { Building2, PenLine, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/src/components/ui/badge";
import { useDashboardData } from "@/src/hooks/useDashboardData";

function GestionDepensesContent() {
  const searchParams = useSearchParams();

  // Récupération des transactions bancaires pour les graphiques
  const { transactions: bankTransactions, isLoading: bankLoading } =
    useDashboardData();

  // Récupération des dépenses unifiées (bancaires + manuelles)
  const {
    expenses: unifiedExpenses,
    stats: unifiedStats,
    loading: unifiedLoading,
    error: unifiedError,
    refetch: refetchUnified,
  } = useUnifiedExpenses();

  // Fallback sur les dépenses classiques si pas de données unifiées
  const {
    expenses: legacyExpenses,
    loading: legacyLoading,
    error: legacyError,
    refetch: refetchLegacy,
  } = useExpenses();

  // Utiliser les dépenses unifiées si disponibles, sinon les dépenses classiques
  const expenses =
    unifiedExpenses.length > 0 ? unifiedExpenses : legacyExpenses;
  const loading = unifiedLoading || legacyLoading || bankLoading;
  const error = unifiedError || legacyError;
  const refetchExpenses = async () => {
    await Promise.all([refetchUnified(), refetchLegacy()]);
  };

  // Local formatCurrency function
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  // Filtrer les dépenses payées (exclure les DRAFT) - MÉMORISÉ
  const paidExpenses = useMemo(() => {
    if (!expenses || !Array.isArray(expenses)) return [];
    return expenses.filter((expense) => expense.status === "PAID");
  }, [expenses]);

  // Calcul du total des dépenses - Utiliser les transactions bancaires négatives
  const totalExpenses = useMemo(() => {
    // Priorité aux transactions bancaires si disponibles
    if (bankTransactions && bankTransactions.length > 0) {
      return bankTransactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    }
    // Fallback sur les dépenses manuelles
    return paidExpenses.reduce(
      (sum, expense) => sum + (expense.amount || 0),
      0
    );
  }, [bankTransactions, paidExpenses]);

  // Utiliser les fonctions utilitaires pour les données de graphique (MODE BANCAIRE PUR)
  const expenseChartData = useMemo(
    () =>
      processExpensesWithBankForCharts(paidExpenses, bankTransactions || []),
    [paidExpenses, bankTransactions]
  );

  // Configuration du graphique
  const expenseChartConfig = getExpenseChartConfig();

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:block space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="w-full flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-medium mb-2">Gestion des dépenses</h1>
            <p className="text-muted-foreground text-sm">
              Gérer vos dépenses en toute simplicité avec la lecture OCR de vos
              reçus
            </p>
            {/* Statistiques unifiées */}
            {unifiedStats && (
              <div className="flex items-center gap-3 mt-3">
                <Badge
                  variant="outline"
                  className="flex items-center gap-1.5 text-xs font-normal"
                >
                  <Building2 size={12} className="text-blue-500" />
                  {unifiedStats.bankTransactionsCount} bancaires
                </Badge>
                <Badge
                  variant="outline"
                  className="flex items-center gap-1.5 text-xs font-normal"
                >
                  <PenLine size={12} className="text-orange-500" />
                  {unifiedStats.manualExpensesCount} manuelles
                </Badge>
                {unifiedStats.withoutReceiptCount > 0 && (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1.5 text-xs font-normal text-amber-600 border-amber-300"
                  >
                    <AlertCircle size={12} className="text-amber-500" />
                    {unifiedStats.withoutReceiptCount} sans justificatif
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Graphiques des dépenses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Graphique des dépenses avec vraies données */}
          <ChartAreaInteractive
            title="Dépenses"
            description={
              loading ? "Chargement..." : formatCurrency(totalExpenses)
            }
            height="220px"
            className="shadow-xs"
            config={expenseChartConfig}
            data={expenseChartData}
            hideMobileCurve={true}
          />

          {/* Graphique en donut - Répartition par catégorie (MODE BANCAIRE PUR) */}
          <ExpenseCategoryChart
            expenses={expenses}
            bankTransactions={bankTransactions || []}
            className="shadow-xs"
          />
        </div>

        {/* Tableau */}
        <div className="mt-4">
          <TransactionTable
            expenses={expenses}
            loading={loading}
            refetchExpenses={refetchExpenses}
            initialTransactionId={searchParams.get("transactionId")}
            openOcr={searchParams.get("openOcr") === "true"}
          />
        </div>
      </div>

      {/* Mobile Layout - Style Notion */}
      <div className="md:hidden">
        {/* Header - Style Notion sur mobile */}
        <div className="px-4 py-6">
          <div>
            <h1 className="text-2xl font-medium mb-2">Gestion des dépenses</h1>
            <p className="text-muted-foreground text-sm">
              Gérer vos dépenses en toute simplicité avec la lecture OCR de vos
              reçus
            </p>
          </div>
        </div>

        {/* Table */}
        <TransactionTable
          expenses={expenses}
          loading={loading}
          refetchExpenses={refetchExpenses}
          initialTransactionId={searchParams.get("transactionId")}
          openOcr={searchParams.get("openOcr") === "true"}
        />
      </div>
    </>
  );
}

export default function GestionDepenses() {
  // Page gestion des dépenses - accessible en Pro
  return (
    <ProRouteGuard pageName="Gestion des dépenses">
      <GestionDepensesContent />
    </ProRouteGuard>
  );
}
