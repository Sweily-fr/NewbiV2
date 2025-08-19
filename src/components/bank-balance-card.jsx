"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";
import { useBridge } from "@/src/hooks/useBridge";
import { Landmark, Download, Plus, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export default function BankBalanceCard({ className }) {
  const {
    accounts,
    loadingAccounts: accountsLoading,
    accountsError,
    isConnected: bridgeConnected,
  } = useBridge();

  // Calculer le solde total de tous les comptes
  const totalBalance =
    accounts?.reduce((total, account) => {
      return total + (account.balance || 0);
    }, 0) || 0;

  // Formater le montant en euros
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Si les données sont en cours de chargement, laisser le loading global s'occuper de l'affichage
  if (accountsLoading) {
    return null;
  }

  if (!bridgeConnected || accountsError) {
    return (
      <Card className={`border-1 shadow-xs backdrop-blur-sm ${className}`}>
        <CardContent className="px-2 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-normal text-gray-900">Solde</h3>
            {/* <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Download className="h-4 w-4" />
            </Button> */}
          </div>
          <div className="space-y-4">
            <div className="text-4xl font-medium text-gray-900">0,00 €</div>
            <div className="flex items-center gap-2 text-gray-500">
              <Landmark className="h-4 w-4" />
              <span className="text-sm">Aucun compte connecté</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowAccounts(!showAccounts)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un compte
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-1 shadow-xs backdrop-blur-sm ${className}`}>
      <CardHeader>
        <CardTitle className="text-base font-normal">Solde</CardTitle>
        <CardDescription className="text-2xl font-medium text-foreground">
          {formatCurrency(totalBalance)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Liste des comptes (max 4) */}
        <div className="mb-4">
          {accounts?.slice(0, 4).map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-full p-2 border">
                  <Landmark className="h-4 w-4" />
                </div>
                <span className="text-sm font-normal">
                  {account.name.length > 15
                    ? `${account.name.slice(0, 15)}...`
                    : account.name}
                </span>
              </div>
              <span className="text-sm font-normal">
                {formatCurrency(account.balance)}
              </span>
            </div>
          ))}
        </div>

        {/* Bouton gérer les comptes */}
        <Button
          variant="outline"
          size="lg"
          className="w-full font-normal cursor-pointer"
          onClick={() => {
            // Navigation vers la page de gestion des comptes
            window.location.href = "/dashboard/settings#security";
          }}
        >
          Gérer ses comptes bancaires
        </Button>
      </CardContent>
    </Card>
  );
}
