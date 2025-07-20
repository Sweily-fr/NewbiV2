"use client";
import { ChartAreaInteractive } from "@/src/components/chart-area-interactive";
import { ChartRadarGridCircle } from "@/src/components/chart-radar-grid-circle";
import { ChartBarMultiple } from "@/src/components/ui/bar-charts";
import TransactionTable from "./components/table";
import { useState } from "react";

export default function GestionDepenses() {
  const [dialogOpen, setDialogOpen] = useState(false);

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
        {/* Graphique par défaut */}
        <ChartAreaInteractive
          title="Entrées"
          description=""
          height="150px"
          className="shadow-xs"
          config={incomeChartConfig}
          hideMobileCurve={true}
        />
        <ChartAreaInteractive
          title="Sorties"
          description=""
          height="150px"
          className="shadow-xs"
          config={expenseChartConfig}
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
