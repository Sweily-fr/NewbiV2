"use client";
import { ChartAreaInteractive } from "@/src/components/chart-area-interactive";
import { ChartRadarGridCircle } from "@/src/components/chart-radar-grid-circle";
import { ChartBarMultiple } from "@/src/components/ui/bar-charts";
import TransactionTable from "./components/table";
import { useState } from "react";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
// Financial stats hook removed

function GestionDepensesContent() {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Récupération des statistiques financières réelles
  // Bridge integration removed - using basic data
  const loading = false;
  const error = null;
  
  // Local formatCurrency function
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  // Mock data to replace removed financial stats
  const totalIncome = 0;
  const totalExpenses = 0;
  const incomeTransactionCount = 0;
  const expenseTransactionCount = 0;
  const incomeChartData = [];
  const expenseChartData = [];

  // Fonction pour ouvrir le dialogue depuis le bouton dans TableUser
  const handleOpenInviteDialog = () => {
    setDialogOpen(true);
  };

  // Configuration des couleurs pour les graphiques
  const expenseChartConfig = {
    visitors: {
      label: "Visitors",
    },
    desktop: {
      label: "Montant",
      color: "#ef4444", // Rouge pour les dépenses
    },
    mobile: {
      label: "Nombre de transactions",
      color: "#dc2626", // Rouge plus foncé
    },
  };

  const incomeChartConfig = {
    visitors: {
      label: "Visitors",
    },
    desktop: {
      label: "Montant",
      color: "#22c55e", // Vert pour les revenus
    },
    mobile: {
      label: "Nombre de transactions",
      color: "#16a34a", // Vert plus foncé
    },
  };

  return (
    <div className="flex flex-col gap-2 py-4 md:gap-6 md:py-6 p-6">
      <div className="w-full">
        <h1 className="text-xl font-medium">Gestion des dépenses</h1>
      </div>
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
        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartAreaInteractive 
            height="200px"
            title="Vue compacte"
            description="Graphique simplifié"
            shortDescription="Compact"
            showTimeRange={false}
            showGradient={false}
            aspectRatio="[4/3]"
          />
        </div> */}
      </div>
      <div className="mt-4">
        <TransactionTable />
      </div>
    </div>
  );
}

export default function GestionDepenses() {
  return (
    <ProRouteGuard pageName="Gestion des dépenses">
      <GestionDepensesContent />
    </ProRouteGuard>
  );
}
