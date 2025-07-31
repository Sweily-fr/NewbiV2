"use client";

import { ChartAreaInteractive } from "@/src/components/chart-area-interactive";
import { ChartRadarGridCircle } from "@/src/components/chart-radar-grid-circle";
import { ChartBarMultiple } from "@/src/components/ui/bar-charts";
import Comp333 from "@/src/components/comp-333";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  CloudUpload,
  FileCheck2,
  Download,
  FileClock,
  Zap,
  Monitor,
  Target,
  Scale,
  Receipt,
  CreditCard,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useUser } from "@/src/lib/auth/hooks";
import { redirect } from "next/navigation";
import { useFinancialStats } from "@/src/hooks/useFinancialStats";

export default function Dashboard() {
  const { session } = useUser();

  // Récupération des statistiques financières réelles
  const {
    totalIncome,
    totalExpenses,
    netBalance,
    incomeChartData,
    expenseChartData,
    getRecentTransactions,
    loading,
    formatCurrency,
  } = useFinancialStats();

  // Récupérer les dernières transactions réelles
  const recentTransactions = getRecentTransactions(5);

  // Fonction utilitaire pour obtenir l'icône et les couleurs d'une transaction
  const getTransactionDisplay = (transaction) => {
    if (transaction.category === "income") {
      return {
        icon: TrendingUp,
        bgColor: "bg-green-50",
        iconColor: "text-green-600",
      };
    } else {
      // Pour les dépenses, on peut différencier par type
      return {
        icon: TrendingDown,
        bgColor: "bg-red-50",
        iconColor: "text-red-600",
      };
    }
  };

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

  // Configuration des couleurs pour les graphiques
  const expenseChartConfigs = {
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

  const balanceChartConfig = {
    visitors: {
      label: "Visitors",
    },
    desktop: {
      label: "Montant",
      color: "#3b82f6", // Bleu pour le solde
    },
    mobile: {
      label: "Nombre de transactions",
      color: "#2563eb", // Bleu plus foncé
    },
  };

  // Utiliser les vraies données financières
  const totalAmount = netBalance; // Solde net (entrées - sorties)

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
      <div className="w-full mb-6">
        <p className="text-2xl font-semibold">Bonjour {session?.user?.name},</p>
      </div>
      <div className="flex flex-col gap-3 w-full">
        <Comp333
          className="w-full"
          placeholder="Rechercher des transactions ou lancer une action"
          commandPlaceholder="Rechercher des transactions ou lancer une action"
        />
        <div className="flex gap-3 w-full">
          <Button
            className="cursor-pointer"
            variant="outline"
            size="sm"
            asChild
          >
            <a href="/dashboard/outils/gestion-depenses">
              <CloudUpload />
              Créer une transaction
            </a>
          </Button>
          <Button
            className="cursor-pointer"
            variant="outline"
            size="sm"
            asChild
          >
            <a href="/dashboard/outils/factures/new">
              <FileCheck2 />
              Créer une facture
            </a>
          </Button>
          <Button
            className="cursor-pointer"
            variant="outline"
            size="sm"
            asChild
          >
            <a href="/dashboard/outils/gestion-depenses">
              <Download />
              Importer des reçus
            </a>
          </Button>
          <Button
            className="cursor-pointer"
            variant="outline"
            size="sm"
            asChild
          >
            <a href="/dashboard/outils/devis/new">
              <FileClock />
              Créer un devis
            </a>
          </Button>
          <Button
            className="cursor-pointer"
            variant="outline"
            size="sm"
            asChild
          >
            <a href="/dashboard/outils/factures/new">
              <Download />
              Importer des factures
            </a>
          </Button>
        </div>
      </div>
      <div className="flex gap-6 w-full mt-4">
        <ChartAreaInteractive
          className="shadow-xs w-1/2"
          title="Soldes"
          description={loading ? "Chargement..." : formatCurrency(totalAmount)}
          height="250px"
          config={balanceChartConfig}
          data={expenseChartData}
          hideMobileCurve={true}
        />
        <Card className="shadow-xs w-1/2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                Dernières transactions
              </CardTitle>
              <button
                onClick={() => redirect("/dashboard/outils/gestion-depenses")}
                className="text-sm cursor-pointer text-muted-foreground hover:text-foreground border-b border-transparent hover:border-current transition-colors"
              >
                Afficher tout
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center text-muted-foreground py-4">
                Chargement des transactions...
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                Aucune transaction récente
              </div>
            ) : (
              recentTransactions.map((transaction) => {
                const displayConfig = getTransactionDisplay(transaction);
                const IconComponent = displayConfig.icon;
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 ${displayConfig.bgColor} rounded-full flex items-center justify-center`}
                      >
                        <IconComponent
                          className={`h-4 w-4 ${displayConfig.iconColor}`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {transaction.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium text-sm ${
                          transaction.isIncome
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {transaction.isIncome ? "+" : "-"}
                        {transaction.formattedAmount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.formattedDate}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
      <div className="flex gap-6 w-full">
        <ChartAreaInteractive
          title="Entrées"
          description={loading ? "Chargement..." : formatCurrency(totalIncome)}
          height="250px"
          className="shadow-xs w-1/2"
          config={incomeChartConfig}
          data={incomeChartData}
          hideMobileCurve={true}
        />
        <ChartAreaInteractive
          title="Sorties"
          description={
            loading ? "Chargement..." : formatCurrency(totalExpenses)
          }
          height="250px"
          className="shadow-xs w-1/2"
          config={expenseChartConfigs}
          data={expenseChartData}
          hideMobileCurve={true}
        />
        {/* <ChartRadarGridCircle className="shadow-xs" />
        <ChartBarMultiple className="shadow-xs" /> */}
        {/* <ChartRadarGridCircle /> */}
      </div>
    </div>
  );
}
