"use client";

import { TrialAlert } from "@/src/components/trial-alert";
import { ChartAreaInteractive } from "@/src/components/chart-area-interactive";
import { ChartRadarGridCircle } from "@/src/components/chart-radar-grid-circle";
import { ChartBarMultiple } from "@/src/components/ui/bar-charts";
import Comp333 from "@/src/components/comp-333";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
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
  Send,
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
// Bridge components removed
import { useUser } from "@/src/lib/auth/hooks";
import { redirect } from "next/navigation";
// Financial stats and bridge hooks removed
import { useExpenses } from "@/src/hooks/useExpenses";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import BankingConnectButton from "@/src/components/banking/BankingConnectButton";
import BankBalanceCard from "@/src/components/banking/BankBalanceCard";
import UnifiedTransactions from "@/src/components/banking/UnifiedTransactions";

import LoadingSkeleton from "./loading";
import { DashboardSkeleton } from "@/src/components/dashboard-skeleton";
import { useDashboardData } from "@/src/hooks/useDashboardData";
import { useState, useEffect, useMemo } from "react";
import { useInvoices } from "@/src/graphql/invoiceQueries";
import {
  processInvoicesForCharts,
  processExpensesForCharts,
  getIncomeChartConfig,
  getExpenseChartConfig,
} from "@/src/utils/chartDataProcessors";

function DashboardContent() {
  const { session } = useUser();
  
  // Utilisation du hook de cache intelligent pour les données du dashboard
  const {
    expenses,
    invoices,
    paidInvoices,
    paidExpenses,
    totalIncome,
    totalExpenses,
    transactions,
    isLoading,
    isInitialized,
    formatCurrency,
    refreshData,
    cacheInfo,
  } = useDashboardData();

  // Données pour les graphiques
  const incomeChartData = useMemo(
    () => paidInvoices ? processInvoicesForCharts(paidInvoices) : [],
    [paidInvoices]
  );
  const expenseChartData = useMemo(
    () => paidExpenses ? processExpensesForCharts(paidExpenses) : [],
    [paidExpenses]
  );

  // Debug pour vérifier l'état du cache
  console.log('🔍 Dashboard render:', { 
    isLoading, 
    isInitialized, 
    hasCache: !!cacheInfo?.isFromCache,
    lastUpdate: cacheInfo?.lastUpdate 
  });

  // Si les données sont en cours de chargement, afficher le skeleton
  if (isLoading || !isInitialized) {
    console.log('📊 Dashboard: Affichage du skeleton');
    return <DashboardSkeleton />;
  }

  console.log('📊 Dashboard: Affichage du contenu réel');

  // Note: Les transactions sont maintenant gérées par le composant BridgeTransactions

  // Utiliser les configurations importées
  const incomeChartConfig = getIncomeChartConfig();
  const expenseChartConfig = getExpenseChartConfig();

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

  return (
    <div className="flex flex-col gap-4 py-8 sm:p-6 md:gap-6 md:py-6 p-4 md:p-6">
      <div className="flex items-center justify-between w-full mb-4 md:mb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-medium">Bonjour {session?.user?.name},</h1>
          {process.env.NODE_ENV === 'development' && cacheInfo?.lastUpdate && (
            <p className="text-xs text-gray-500 mt-1">
              📊 Données mises à jour : {cacheInfo.lastUpdate.toLocaleTimeString()}
              {cacheInfo.isFromCache && " (cache)"}
            </p>
          )}
        </div>
        {/* <BankingConnectButton /> */}
      </div>
      <div className="flex flex-col gap-3 w-full">
        <Comp333
          className="w-full h-11 flex items-center text-sm md:text-sm placeholder:text-sm md:placeholder:text-sm"
          placeholder="Rechercher des transactions ou lancer une action"
          commandPlaceholder="Rechercher des transactions ou lancer une action"
        />
        {/* Conteneur avec scroll horizontal sur mobile, flex-wrap sur desktop */}
        <div className="overflow-x-auto md:overflow-x-visible w-full scrollbar-hide">
          <div className="flex gap-2 md:gap-3 md:flex-wrap w-max md:w-full">
            <Button
              className="cursor-pointer font-polysans font-normal whitespace-nowrap md:flex-1 md:min-w-0"
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href="/dashboard/outils/gestion-depenses"
                className="flex items-center gap-1 md:gap-2 justify-center"
              >
                <CloudUpload className="w-4 h-4" />
                <span className="text-xs md:text-xs">
                  Créer une transaction
                </span>
              </a>
            </Button>
            <Button
              className="cursor-pointer font-polysans font-normal whitespace-nowrap md:flex-1 md:min-w-0"
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href="/dashboard/outils/factures/new"
                className="flex items-center gap-1 md:gap-2 justify-center"
              >
                <FileCheck2 className="w-4 h-4" />
                <span className="text-xs md:text-xs">Créer une facture</span>
              </a>
            </Button>
            <Button
              className="cursor-pointer font-polysans font-normal whitespace-nowrap md:flex-1 md:min-w-0"
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href="/dashboard/outils/gestion-depenses"
                className="flex items-center gap-1 md:gap-2 justify-center"
              >
                <Download className="w-4 h-4" />
                <span className="text-xs md:text-xs">Importer des reçus</span>
              </a>
            </Button>
            <Button
              className="cursor-pointer font-polysans font-normal whitespace-nowrap md:flex-1 md:min-w-0"
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href="/dashboard/outils/devis/new"
                className="flex items-center gap-1 md:gap-2 justify-center"
              >
                <FileClock className="w-4 h-4" />
                <span className="text-xs md:text-xs">Créer un devis</span>
              </a>
            </Button>
            <Button
              className="cursor-pointer font-polysans font-normal whitespace-nowrap md:flex-1 md:min-w-0"
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href="/dashboard/outils/transferts-fichiers/new"
                className="flex items-center gap-1 md:gap-2 justify-center"
              >
                <Send className="w-4 h-4" />
                <span className="text-xs md:text-xs">
                  Transférer un fichier
                </span>
              </a>
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full mt-4">
        <BankBalanceCard className="shadow-xs w-full md:w-1/2" />
        <UnifiedTransactions limit={5} className="shadow-xs w-full md:w-1/2" />
      </div>
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
        <ChartAreaInteractive
          title="Entrées"
          description={formatCurrency(totalIncome)}
          height="200px"
          className="shadow-xs w-full md:w-1/2"
          config={incomeChartConfig}
          data={incomeChartData}
          hideMobileCurve={true}
        />
        <ChartAreaInteractive
          title="Sorties"
          description={formatCurrency(totalExpenses)}
          height="200px"
          className="shadow-xs w-full md:w-1/2"
          config={expenseChartConfig}
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

export default function Dashboard() {
  return (
    <ProRouteGuard pageName="Tableau de bord">
      <DashboardContent />
    </ProRouteGuard>
  );
}
