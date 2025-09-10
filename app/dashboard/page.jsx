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

function DashboardContent() {
  const { session } = useUser();
  const { workspaceId } = useWorkspace();

  // Utilisation des données de dépenses et factures existantes
  const { expenses, loading: expensesLoading, refetch: refetchExpenses } = useExpenses({ status: 'PAID', limit: 1000 });
  const { invoices, loading: invoicesLoading } = useInvoices();
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  // Filtrer les factures payées
  const paidInvoices = useMemo(() => {
    return invoices.filter((invoice) => invoice.status === "COMPLETED");
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

  // Process invoices data for income charts
  const processInvoicesForCharts = () => {
    console.log(" Traitement des revenus pour graphiques - Factures:", paidInvoices.length, "Dépenses type INCOME:", expenses.filter(e => e.notes && e.notes.startsWith('[INCOME]')).length);
    console.log(" Revenus totaux calculés:", totalIncome);
    console.log(" Dépenses totales calculées:", totalExpenses);
    console.log(" Toutes les expenses:", expenses.map(e => ({id: e.id, notes: e.notes, amount: e.amount, isVatDeductible: e.isVatDeductible})));
    console.log("🔍 Expenses filtrées pour revenus:", expenses.filter(e => e.notes && e.notes.startsWith('[INCOME]')));
  
  // Debug: Vérifier si les données sont récentes
  const today = new Date().toISOString().split("T")[0];
  const todayIncomes = expenses.filter(e => {
    if (!e.date) return false;
    const expenseDate = new Date(e.date);
    if (isNaN(expenseDate.getTime())) return false;
    const expenseDateStr = expenseDate.toISOString().split("T")[0];
    return expenseDateStr === today && e.notes && e.notes.startsWith('[INCOME]');
  });
  console.log("🗓️ Revenus d'aujourd'hui:", todayIncomes);
  
  // Debug: Forcer la vérification de TOUTES les expenses avec [INCOME]
  const allIncomes = expenses.filter(e => e.notes && e.notes.includes('[INCOME]'));
  console.log("💰 TOUTES les expenses avec [INCOME]:", allIncomes.map(e => ({
    id: e.id, 
    notes: e.notes, 
    amount: e.amount, 
    date: e.date,
    isVatDeductible: e.isVatDeductible
  })));
    const now = new Date();
    const chartData = [];

    // Generate data for the last 90 days
    for (let i = 89; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Filter invoices for this day
      const dayInvoices = paidInvoices.filter((invoice) => {
        let invoiceDate;
        if (typeof invoice.issueDate === 'string') {
          invoiceDate = new Date(invoice.issueDate);
        } else if (typeof invoice.issueDate === 'number') {
          invoiceDate = new Date(invoice.issueDate);
        } else {
          invoiceDate = new Date(invoice.issueDate);
        }
        
        return invoiceDate.toISOString().split("T")[0] === dateStr;
      });

      // Filter income expenses for this day (using isVatDeductible as indicator)
      const dayIncomeExpenses = expenses.filter((expense) => {
        if (!expense.date) return false;
        
        let expenseDate;
        if (typeof expense.date === 'string') {
          expenseDate = new Date(expense.date);
        } else if (typeof expense.date === 'number') {
          expenseDate = new Date(expense.date);
        } else {
          expenseDate = new Date(expense.date);
        }
        
        // Vérifier si la date est valide
        if (isNaN(expenseDate.getTime())) return false;
        
        const isCorrectDate = expenseDate.toISOString().split("T")[0] === dateStr;
        // Utiliser UNIQUEMENT les notes pour identifier les revenus (ignorer isVatDeductible)
        const isIncome = expense.notes && expense.notes.includes('[INCOME]');
        
        console.log(`🟢 Income check - Expense ${expense.id}: notes="${expense.notes}", isVatDeductible=${expense.isVatDeductible}, isIncome=${isIncome}, amount=${expense.amount}, date=${expense.date}`);
        
        return isCorrectDate && isIncome;
      });

      // Calculate income for this day (invoices + income expenses)
      const dayInvoiceIncome = dayInvoices.reduce((sum, invoice) => sum + (invoice.finalTotalTTC || 0), 0);
      const dayExpenseIncome = dayIncomeExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      const dayIncome = dayInvoiceIncome + dayExpenseIncome;

      if (dayIncome > 0) {
        console.log(`📅 Date ${dateStr}: Revenus=${dayIncome} (Factures=${dayInvoiceIncome}, Revenus manuels=${dayExpenseIncome})`);
        console.log(`📝 Détail revenus manuels pour ${dateStr}:`, dayIncomeExpenses.map(e => ({id: e.id, amount: e.amount, notes: e.notes})));
      }

      chartData.push({
        date: dateStr,
        desktop: dayIncome,
        mobile: dayIncome,
      });
    }

    console.log("📊 Données graphique revenus générées:", chartData.filter(d => d.desktop > 0).length, "jours avec revenus");
    console.log("📈 Sample données revenus:", chartData.slice(-7).map(d => ({date: d.date, amount: d.desktop})));
    return chartData;
  };

  const processExpensesForCharts = () => {
    console.log("Traitement des dépenses pour graphiques - Nombre total:", expenses.length);
    const now = new Date();
    const chartData = [];

    // Generate data for the last 90 days
    for (let i = 89; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Filter expenses for this day - only real expenses (isVatDeductible: true or undefined)
      const dayExpenses = expenses.filter((expense) => {
        if (!expense.date) return false;
        
        let expenseDate;
        if (typeof expense.date === 'string') {
          expenseDate = new Date(expense.date);
        } else if (typeof expense.date === 'number') {
          expenseDate = new Date(expense.date);
        } else {
          expenseDate = new Date(expense.date);
        }
        
        // Vérifier si la date est valide
        if (isNaN(expenseDate.getTime())) return false;
        
        const isCorrectDate = expenseDate.toISOString().split("T")[0] === dateStr;
        // Filtrer seulement les vraies dépenses (exclure les revenus identifiés par [INCOME])
        const isExpense = !expense.notes || !expense.notes.includes('[INCOME]');
        
        console.log(`🔴 Expense check - Expense ${expense.id}: notes="${expense.notes}", isVatDeductible=${expense.isVatDeductible}, isExpense=${isExpense}, amount=${expense.amount}`);
        
        return isCorrectDate && isExpense;
      });

      // Calculate expenses for this day
      const dayExpenseAmount = dayExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

      if (dayExpenseAmount > 0) {
        console.log(`Date ${dateStr}: Dépenses=${dayExpenseAmount}, Dépenses du jour=${dayExpenses.length}`);
      }

      chartData.push({
        date: dateStr,
        desktop: dayExpenseAmount,
        mobile: dayExpenseAmount,
      });
    }

    console.log("Données graphique dépenses générées:", chartData.filter(d => d.desktop > 0).length, "jours avec dépenses");
    return chartData;
  };

  // Calculate totals from real data - utiliser includes au lieu de startsWith pour plus de robustesse
  const incomeExpenses = expenses.filter(e => e.notes && e.notes.includes('[INCOME]'));
  const regularExpenses = expenses.filter(e => !e.notes || !e.notes.includes('[INCOME]'));
  
  const totalIncome = paidInvoices.reduce((sum, invoice) => sum + (invoice.finalTotalTTC || 0), 0) + 
                     incomeExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const totalExpenses = regularExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  
  console.log("🧮 Calcul totaux - Revenus expenses:", incomeExpenses.length, "Dépenses normales:", regularExpenses.length);

  // Force recalculation when expenses change
  const incomeChartData = useMemo(() => processInvoicesForCharts(), [expenses, paidInvoices]);
  const expenseChartData = useMemo(() => processExpensesForCharts(), [expenses]);

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

export default function Dashboard() {
  return (
    <ProRouteGuard pageName="Tableau de bord">
      <DashboardContent />
    </ProRouteGuard>
  );
}
