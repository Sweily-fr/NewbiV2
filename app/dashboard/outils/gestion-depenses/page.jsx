"use client";
import { ChartAreaInteractive } from "@/src/components/chart-area-interactive";
import { ChartRadarGridCircle } from "@/src/components/chart-radar-grid-circle";
import { ChartBarMultiple } from "@/src/components/ui/bar-charts";
import TransactionTable from "./components/table";
import { useState, useMemo } from "react";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { useExpenses } from "@/src/hooks/useExpenses";
import { useInvoices } from "@/src/graphql/invoiceQueries";

function GestionDepensesContent() {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Récupération des dépenses depuis l'API
  const {
    expenses,
    loading: expensesLoading,
    error: expensesError,
  } = useExpenses({
    status: "PAID",
    page: 1,
    limit: 100,
  });

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

  // Calcul des statistiques réelles
  const { totalIncome, totalExpenses, incomeTransactionCount, expenseTransactionCount, incomeChartData, expenseChartData } = useMemo(() => {
    // Calcul des dépenses
    const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expenseCount = expenses.length;

    // Calcul des revenus (factures payées)
    const incomeTotal = paidInvoices.reduce((sum, invoice) => sum + invoice.finalTotalTTC, 0);
    const incomeCount = paidInvoices.length;

    // Génération des données de graphique par mois (derniers 6 mois)
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString("fr-FR", { month: "short" }),
        fullDate: date
      });
    }

    // Données pour le graphique des dépenses
    const expenseChartData = months.map(({ month, fullDate }) => {
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === fullDate.getMonth() && 
               expenseDate.getFullYear() === fullDate.getFullYear();
      });
      
      const monthTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      return {
        month,
        desktop: monthTotal,
        mobile: monthExpenses.length
      };
    });

    // Données pour le graphique des revenus
    const incomeChartData = months.map(({ month, fullDate }) => {
      const monthInvoices = paidInvoices.filter(invoice => {
        const invoiceDate = new Date(invoice.issueDate);
        return invoiceDate.getMonth() === fullDate.getMonth() && 
               invoiceDate.getFullYear() === fullDate.getFullYear();
      });
      
      const monthTotal = monthInvoices.reduce((sum, invoice) => sum + invoice.finalTotalTTC, 0);
      
      return {
        month,
        desktop: monthTotal,
        mobile: monthInvoices.length
      };
    });

    return {
      totalIncome: incomeTotal,
      totalExpenses: expenseTotal,
      incomeTransactionCount: incomeCount,
      expenseTransactionCount: expenseCount,
      incomeChartData,
      expenseChartData
    };
  }, [expenses, paidInvoices]);

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
    // <ProRouteGuard pageName="Gestion des dépenses"> {/* Commenté pour le développement */}
      <GestionDepensesContent />
    // </ProRouteGuard>
  );
}
