"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Landmark } from "lucide-react";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useState, useEffect, useMemo } from "react";

export default function BankBalanceCard({
  className,
  expenses = [],
  invoices = [],
  totalIncome = 0,
  totalExpenses = 0,
  isLoading = false,
}) {
  const { workspaceId } = useWorkspace();

  const [accounts, setAccounts] = useState([]);
  const [bankLoading, setBankLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accountsCount, setAccountsCount] = useState(0);

  // Connexion bancaire désactivée temporairement
  useEffect(() => {
    setAccounts([]);
    setBankLoading(false);
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
    // Utiliser les données pré-calculées du cache
    // Solde total = Solde bancaire + Revenus - Dépenses
    return bankBalance + totalIncome - totalExpenses;
  }, [bankBalance, totalIncome, totalExpenses]);

  const finalLoading = isLoading || bankLoading;

  if (finalLoading) {
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

          {/* Bouton de connexion bancaire - Désactivé temporairement */}
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

        {/* Bouton de gestion des comptes */}
        <Button
          variant="outline"
          className="w-full font-normal mt-auto text-green-600 border-green-200 bg-green-50"
          disabled
        >
          <Landmark className="h-4 w-4 mr-2" />
          {accountsCount} compte{accountsCount > 1 ? "s" : ""} connecté
          {accountsCount > 1 ? "s" : ""}
        </Button>
      </CardContent>
    </Card>
  );
}
