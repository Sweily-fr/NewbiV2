"use client";

import { TrialAlert } from "@/src/components/trial-alert";
import { ChartAreaInteractive } from "@/src/components/chart-area-interactive";
import { ChartRadarGridCircle } from "@/src/components/chart-radar-grid-circle";
import { ChartBarMultiple } from "@/src/components/ui/bar-charts";
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
import { useState, useEffect } from "react";

export default function Dashboard() {
  const { session } = useUser();
  const { workspaceId } = useWorkspace();

  // Bridge integration removed - using basic expense data
  const { loading: expensesLoading } = useExpenses({ status: "PAID" });
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  const loading = expensesLoading || transactionsLoading;

  // Local formatCurrency function to replace the removed hook
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  // Fetch transactions for charts
  const fetchTransactions = async () => {
    if (!workspaceId) return;

    try {
      setTransactionsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"}/banking/transactions`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-workspace-id": workspaceId,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Structure d'une transaction:", data.transactions?.[0]);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des transactions:", err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [workspaceId]);

  // Process transactions data for charts
  const processTransactionsForCharts = () => {
    const now = new Date();
    const chartData = [];

    // Generate data for the last 90 days
    for (let i = 89; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Filter transactions for this day
      const dayTransactions = transactions.filter((transaction) => {
        // console.log("Transaction date fields:", {
        //   date: transaction.date,
        //   rawTransactionDate: transaction.raw?.transaction_date,
        //   bridgeTransactionDate: transaction.metadata?.bridgeTransactionDate
        // });
        const transactionDate = new Date(
          transaction.raw?.transaction_date || transaction.date
        );
        return transactionDate.toISOString().split("T")[0] === dateStr;
      });

      // Calculate income and expenses for this day
      const dayIncome = dayTransactions
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const dayExpenses = dayTransactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      chartData.push({
        date: dateStr,
        desktop: dayIncome, // Income
        mobile: dayIncome, // Same value for mobile curve
      });
    }

    return chartData;
  };

  const processExpensesForCharts = () => {
    const now = new Date();
    const chartData = [];

    // Generate data for the last 90 days
    for (let i = 89; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Filter transactions for this day
      const dayTransactions = transactions.filter((transaction) => {
        // console.log("Transaction date fields (expenses):", {
        //   date: transaction.date,
        //   rawTransactionDate: transaction.raw?.transaction_date,
        //   bridgeTransactionDate: transaction.metadata?.bridgeTransactionDate
        // });
        const transactionDate = new Date(
          transaction.raw?.transaction_date || transaction.date
        );
        return transactionDate.toISOString().split("T")[0] === dateStr;
      });

      // Calculate expenses for this day
      const dayExpenses = dayTransactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      chartData.push({
        date: dateStr,
        desktop: dayExpenses, // Expenses
        mobile: dayExpenses, // Same value for mobile curve
      });
    }

    return chartData;
  };

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const incomeChartData = processTransactionsForCharts();
  const expenseChartData = processExpensesForCharts();

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
