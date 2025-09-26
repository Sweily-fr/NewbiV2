"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Building2, Landmark } from "lucide-react";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useExpenses } from "@/src/hooks/useExpenses";
import { useInvoices } from "@/src/graphql/invoiceQueries";
import { useState, useEffect, useMemo } from "react";

export default function BankBalanceCard({ className }) {
  const { workspaceId } = useWorkspace();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupérer les dépenses et factures pour calculer le solde total
  const { expenses, loading: expensesLoading } = useExpenses({
    status: "PAID",
    limit: 1000,
  });
  const { invoices, loading: invoicesLoading } = useInvoices();

  const fetchAccounts = async () => {
    if (!workspaceId) return;

    // 🚫 DÉSACTIVÉ TEMPORAIREMENT - Récupération des comptes bancaires
    // Pour éviter les erreurs sur le dashboard
    try {
      setLoading(true);

      // Simulation d'un délai pour l'UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Pas de comptes bancaires pour l'instant
      setAccounts([]);
      setError(null);

      /* CODE ORIGINAL COMMENTÉ :
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"}/banking/accounts`,
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
        setAccounts(data.accounts || []);
      } else {
        throw new Error("Erreur lors de la récupération des comptes");
      }
      */
    } catch (err) {
      // En cas d'erreur, on affiche quand même le dashboard sans comptes
      console.warn("⚠️ Erreur récupération comptes (ignorée):", err.message);
      setAccounts([]);
      setError(null); // On n'affiche plus l'erreur
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [workspaceId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  // Calculer le solde bancaire
  const bankBalance = accounts.reduce(
    (sum, account) => sum + (account.balance || 0),
    0
  );

  // Calculer le solde total incluant toutes les transactions
  const totalBalance = useMemo(() => {
    // Revenus des factures payées
    const paidInvoices = invoices.filter(
      (invoice) => invoice.status === "COMPLETED"
    );
    const invoiceIncome = paidInvoices.reduce(
      (sum, invoice) => sum + (invoice.finalTotalTTC || invoice.totalTTC || 0),
      0
    );

    // Revenus et dépenses des expenses
    const incomeExpenses = expenses.filter(
      (e) => e.notes && e.notes.includes("[INCOME]")
    );
    const regularExpenses = expenses.filter(
      (e) => !e.notes || !e.notes.includes("[INCOME]")
    );

    const manualIncome = incomeExpenses.reduce(
      (sum, expense) => sum + (expense.amount || 0),
      0
    );
    const totalExpenses = regularExpenses.reduce(
      (sum, expense) => sum + (expense.amount || 0),
      0
    );

    // Solde total = Solde bancaire + Revenus - Dépenses
    return bankBalance + invoiceIncome + manualIncome - totalExpenses;
  }, [accounts, expenses, invoices, bankBalance]);

  const isLoading = loading || expensesLoading || invoicesLoading;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="px-6">
          <h3 className="text-lg font-normal text-gray-700 mb-4">Solde</h3>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4 mb-6">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="px-6">
          <h3 className="text-lg font-normal mb-4">Solde</h3>
          <p className="text-sm text-red-500">Erreur: {error}</p>
        </CardContent>
      </Card>
    );
  }

  // Afficher le solde total même sans comptes bancaires
  if (accounts.length === 0) {
    return (
      <Card className={`${className} flex flex-col`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal">Soldes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1">
          {/* Solde total sans comptes bancaires */}
          <div className="mb-6">
            <div className="text-3xl font-medium mb-2">
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Solde global (revenus - dépenses)
            </p>
          </div>

          {/* <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 text-center">
              💳 Intégration bancaire temporairement désactivée
            </p>
            <p className="text-xs text-blue-600 text-center mt-1">
              Le solde est calculé sur vos factures et dépenses
            </p>
          </div> */}

          {/* Spacer pour pousser le bouton vers le bas */}
          <div className="flex-1"></div>

          {/* Bouton de gestion - Désactivé temporairement */}
          <Button
            variant="outline"
            className="w-full font-normal mt-auto"
            disabled
          >
            Connexion bancaire (bientôt disponible)
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} flex flex-col`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-normal">Soldes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        {/* Solde total */}
        <div className="mb-6">
          <div className="text-3xl font-medium mb-2">
            {formatCurrency(totalBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            Solde global (comptes + revenus - dépenses)
          </p>
        </div>

        {/* Solde bancaire si différent */}
        {bankBalance !== totalBalance && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Solde bancaire</span>
              <span className="text-sm font-medium">
                {formatCurrency(bankBalance)}
              </span>
            </div>
          </div>
        )}

        {/* Liste des comptes */}
        <div className="space-y-4 mb-6 flex-1">
          {accounts.slice(0, 4).map((account) => (
            <div
              key={account._id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <Landmark className="h-4 w-4" />
                <span className="text-sm font-normal truncate max-w-[180px]">
                  {account.name}
                </span>
              </div>
              <span className="text-sm font-medium">
                {formatCurrency(account.balance)}
              </span>
            </div>
          ))}
        </div>

        {/* Bouton de gestion - Désactivé temporairement */}
        <Button
          variant="outline"
          className="w-full font-normal mt-auto"
          disabled
        >
          Connexion bancaire (bientôt disponible)
        </Button>
      </CardContent>
    </Card>
  );
}
