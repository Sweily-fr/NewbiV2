"use client";
import { ChartAreaInteractive } from "@/src/components/chart-area-interactive";
import { ChartRadarGridCircle } from "@/src/components/chart-radar-grid-circle";
import { ChartBarMultiple } from "@/src/components/ui/bar-charts";
import TransactionTable from "./components/table";
import { ExpenseCategoryChart } from "./components/expense-category-chart";
import { useState, useMemo, useEffect } from "react";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { useExpenses } from "@/src/hooks/useExpenses";
import {
  processExpensesForCharts,
  getExpenseChartConfig,
} from "@/src/utils/chartDataProcessors";
import { useApolloClient } from "@apollo/client";
import { Button } from "@/src/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";

function GestionDepensesContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const client = useApolloClient();
  const searchParams = useSearchParams();

  // Récupération des dépenses depuis l'API
  const {
    expenses,
    loading: expensesLoading,
    error: expensesError,
    refetch: refetchExpenses,
  } = useExpenses();

  const loading = expensesLoading;
  const error = expensesError;

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

  // Calcul du total des dépenses - MÉMORISÉ
  const totalExpenses = useMemo(() => {
    return paidExpenses.reduce(
      (sum, expense) => sum + (expense.amount || 0),
      0
    );
  }, [paidExpenses]);

  // Utiliser les fonctions utilitaires pour les données de graphique
  const expenseChartData = useMemo(
    () => processExpensesForCharts(paidExpenses),
    [paidExpenses]
  );

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
      console.error("Erreur lors du rafraîchissement:", error);
    }
  };

  // Utiliser la configuration importée
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
          {/* <Button 
            onClick={handleRefreshData}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 font-normal"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser les données
          </Button> */}
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

          {/* Graphique en donut - Répartition par catégorie */}
          <ExpenseCategoryChart expenses={expenses} className="shadow-xs" />
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
