"use client";

import { ChartAreaInteractive } from "@/src/components/chart-area-interactive";
import { ChartRadarGridCircle } from "@/src/components/chart-radar-grid-circle";
import { ChartBarMultiple } from "@/src/components/ui/bar-charts";
import BankBalanceCard from "@/src/components/bank-balance-card";
import Comp333 from "@/src/components/comp-333";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  CloudUpload,
  FileCheck2,
  Download,
  FileClock,
  Landmark,
  Zap,
  Monitor,
  Target,
  Scale,
  Receipt,
  CreditCard,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import BridgeConnectButton from "@/src/components/bridge-connect-button";
import UnifiedTransactions from "@/src/components/unified-transactions";
import { useUser } from "@/src/lib/auth/hooks";
import { redirect } from "next/navigation";
import { useFinancialStats } from "@/src/hooks/useFinancialStats";
import { useBridge } from "@/src/hooks/useBridge";
import { useExpenses } from "@/src/hooks/useExpenses";

import LoadingSkeleton from "./loading";

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
    loading: statsLoading,
    formatCurrency,
  } = useFinancialStats();

  // Récupération des données Bridge pour BankBalanceCard
  const {
    loadingAccounts: bridgeLoading,
  } = useBridge();

  // Récupération des dépenses pour UnifiedTransactions
  const {
    loading: expensesLoading,
  } = useExpenses({ status: "PAID" });

  // Combinaison de tous les états de loading
  const loading = statsLoading || bridgeLoading || expensesLoading;

  // Si les données sont en cours de chargement, afficher le skeleton
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Note: Les transactions sont maintenant gérées par le composant BridgeTransactions

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
      <div className="flex items-center justify-between w-full mb-6">
        <p className="text-2xl font-medium">Bonjour {session?.user?.name},</p>
        <BridgeConnectButton
          variant="default"
          size="sm"
          onSuccess={(data) => {
            console.log("Connexion bancaire réussie:", data);
            // Ici vous pouvez rafraîchir les données financières
          }}
          onError={(error) => {
            console.error("Erreur connexion bancaire:", error);
          }}
          className="font-polysans font-normal"
        >
          Connecter un compte bancaire
        </BridgeConnectButton>
      </div>
      <div className="flex flex-col gap-3 w-full">
        <Comp333
          className="w-full h-11 flex items-center"
          placeholder="Rechercher des transactions ou lancer une action"
          commandPlaceholder="Rechercher des transactions ou lancer une action"
        />
        <div className="flex gap-3 w-full">
          <Button
            className="cursor-pointer font-polysans font-normal"
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
            className="cursor-pointer font-polysans font-normal"
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
            className="cursor-pointer font-polysans font-normal"
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
            className="cursor-pointer font-polysans font-normal"
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
            className="cursor-pointer font-polysans font-normal"
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
        <BankBalanceCard className="w-1/2" />
        <UnifiedTransactions limit={5} className="w-1/2" />
      </div>
      <div className="flex gap-6 w-full">
        <ChartAreaInteractive
          title="Entrées"
          description={formatCurrency(totalIncome)}
          height="250px"
          className="shadow-xs w-1/2"
          config={incomeChartConfig}
          data={incomeChartData}
          hideMobileCurve={true}
        />
        <ChartAreaInteractive
          title="Sorties"
          description={formatCurrency(totalExpenses)}
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
