"use client";
import { ChartAreaInteractive } from "@/src/components/chart-area-interactive";
import { ChartRadarGridCircle } from "@/src/components/chart-radar-grid-circle";
import { ChartBarMultiple } from "@/src/components/ui/bar-charts";
import TransactionTable from "./components/table";
import { useState, useMemo } from "react";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { useExpenses } from "@/src/hooks/useExpenses";
import { useInvoices } from "@/src/graphql/invoiceQueries";
import { processInvoicesForCharts, processExpensesForCharts, getIncomeChartConfig, getExpenseChartConfig } from "@/src/utils/chartDataProcessors";
import { useApolloClient } from "@apollo/client";
import { Button } from "@/src/components/ui/button";
import { RefreshCw } from "lucide-react";

function GestionDepensesContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const client = useApolloClient();

  // Récupération des dépenses depuis l'API - sans paramètres pour éviter les problèmes
  const {
    expenses,
    loading: expensesLoading,
    error: expensesError,
    refetch: refetchExpenses,
  } = useExpenses();

  // Récupération des factures payées depuis l'API
  const {
    invoices,
    loading: invoicesLoading,
    error: invoicesError,
  } = useInvoices();

  // Filtrer les factures payées
  const paidInvoices = useMemo(() => {
    return invoices.filter((invoice) => invoice.status === "COMPLETED");
  }, [invoices]);

  const loading = expensesLoading || invoicesLoading;
  const error = expensesError || invoicesError;

  // Local formatCurrency function
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  // Filtrer les dépenses payées (exclure les DRAFT)
  const paidExpenses = expenses.filter(expense => expense.status === 'PAID');
  
  // Calcul des statistiques réelles avec les utilitaires
  const totalIncome = paidInvoices.reduce((sum, invoice) => sum + (invoice.finalTotalTTC || 0), 0);
  const totalExpenses = paidExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

  // Utiliser les fonctions utilitaires pour les données de graphique
  const incomeChartData = useMemo(() => processInvoicesForCharts(paidInvoices), [paidInvoices]);
  const expenseChartData = useMemo(() => processExpensesForCharts(paidExpenses), [paidExpenses]);

  // Fonction pour ouvrir le dialogue depuis le bouton dans TableUser
  const handleOpenInviteDialog = () => {
    setDialogOpen(true);
  };

  // Fonction pour rafraîchir les données et vider le cache
  const handleRefreshData = async () => {
    try {
      // Vider le cache Apollo Client
      await client.clearStore();
      // Refetch les données
      await refetchExpenses();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    }
  };

  // Utiliser les configurations importées
  const incomeChartConfig = getIncomeChartConfig();
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
          </div>
          <Button 
            onClick={handleRefreshData}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 font-normal"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser les données
          </Button>
        </div>
        
        {/* Graphiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Graphique des entrées avec vraies données */}
          <ChartAreaInteractive
            title="Entrées"
            description={loading ? "Chargement..." : formatCurrency(totalIncome)}
            height="150px"
            className="shadow-xs"
            config={incomeChartConfig}
            data={incomeChartData}
            hideMobileCurve={true}
          />
          {/* Graphique des sorties avec vraies données */}
          <ChartAreaInteractive
            title="Sorties"
            description={
              loading ? "Chargement..." : formatCurrency(totalExpenses)
            }
            height="150px"
            className="shadow-xs"
            config={expenseChartConfig}
            data={expenseChartData}
            hideMobileCurve={true}
          />
        </div>
        
        {/* Tableau */}
        <div className="mt-4">
          <TransactionTable />
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
        <TransactionTable />
      </div>
    </>
  );
}

export default function GestionDepenses() {
  return (
    <ProRouteGuard pageName="Gestion des dépenses">
      <GestionDepensesContent />
    </ProRouteGuard>
  );
}
