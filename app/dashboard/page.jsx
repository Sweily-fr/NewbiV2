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
import { useState, useEffect, useMemo } from "react";
import { useInvoices } from "@/src/graphql/invoiceQueries";
import { processInvoicesForCharts, processExpensesForCharts, getIncomeChartConfig, getExpenseChartConfig } from "@/src/utils/chartDataProcessors";

function DashboardContent() {
  const { session } = useUser();
  const { workspaceId } = useWorkspace();

  // Utilisation des données de dépenses et factures existantes - sans paramètres pour éviter les problèmes
  const { expenses, loading: expensesLoading, refetch: refetchExpenses } = useExpenses();
  const { invoices, loading: invoicesLoading } = useInvoices();
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  // Debug logs pour comprendre les données
  console.log("🔍 Debug données dashboard:");
  console.log("- Expenses:", expenses?.length || 0, expenses);
  console.log("- Invoices:", invoices?.length || 0, invoices);
  console.log("- ExpensesLoading:", expensesLoading);
  console.log("- InvoicesLoading:", invoicesLoading);
  console.log("- WorkspaceId:", workspaceId);

  // Filtrer les factures payées
  const paidInvoices = useMemo(() => {
    const paid = invoices.filter((invoice) => invoice.status === "COMPLETED");
    console.log("📋 Factures payées filtrées:", paid.length, paid);
    // Debug des dates de factures
    paid.forEach(invoice => {
      console.log(`📅 Facture ${invoice.id}: issueDate=${invoice.issueDate}, finalTotalTTC=${invoice.finalTotalTTC}`);
      const date = new Date(parseInt(invoice.issueDate));
      console.log(`📅 Date convertie:`, date, date.toISOString());
    });
    return paid;
  }, [invoices]);

  const loading = expensesLoading || invoicesLoading || transactionsLoading;

  // Local formatCurrency function to replace the removed hook
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  // Désactiver le chargement des transactions bancaires pour l'instant
  useEffect(() => {
    setTransactionsLoading(false);
  }, []);

  // Utiliser les fonctions utilitaires importées

  // Calculate totals from real data - uniquement factures payées et toutes les dépenses
  const totalIncome = paidInvoices.reduce((sum, invoice) => sum + (invoice.finalTotalTTC || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  
  console.log("🧮 Calcul totaux - Revenus factures:", paidInvoices.length, "Dépenses totales:", expenses.length);

  // Force recalculation when expenses change
  const incomeChartData = useMemo(() => processInvoicesForCharts(paidInvoices), [expenses, paidInvoices]);
  const expenseChartData = useMemo(() => processExpensesForCharts(expenses), [expenses]);

  // Si les données sont en cours de chargement, afficher le skeleton
  if (loading) {
    return <LoadingSkeleton />;
  }

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
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
      <div className="flex items-center justify-between w-full mb-6">
        <p className="text-2xl font-medium">Bonjour {session?.user?.name},</p>
        {/* <BankingConnectButton /> */}
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
        <BankBalanceCard className="shadow-xs w-1/2" />
        <UnifiedTransactions limit={5} className="shadow-xs w-1/2" />
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
