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
import { useState, useEffect } from "react";

export default function BankBalanceCard({ className }) {
  const { workspaceId } = useWorkspace();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAccounts = async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
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
    } catch (err) {
      setError(err.message);
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

  const totalBalance = accounts.reduce(
    (sum, account) => sum + (account.balance || 0),
    0
  );

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
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
        <CardContent className="p-6">
          <h3 className="text-lg font-normal mb-4">Solde</h3>
          <p className="text-sm text-red-500">Erreur: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <h3 className="text-lg font-normal mb-4">Solde</h3>
          <p className="text-sm text-gray-500">Aucun compte connecté</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-normal">Soldes</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Solde total */}
        <div className="text-3xl font-medium mb-6">
          {formatCurrency(totalBalance)}
        </div>

        {/* Liste des comptes */}
        <div className="space-y-4 mb-6">
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

        {/* Bouton de gestion */}
        <Button
          variant="outline"
          className="w-full font-normal"
          onClick={() => {
            // TODO: Naviguer vers la page de gestion des comptes
            console.log("Gérer ses comptes bancaires");
          }}
        >
          Gérer ses comptes bancaires
        </Button>
      </CardContent>
    </Card>
  );
}
