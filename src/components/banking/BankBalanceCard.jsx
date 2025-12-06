"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Building2, Landmark, Search, LoaderCircle } from "lucide-react";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useBankingConnection } from "@/src/hooks/useBankingConnection";
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
  const {
    isConnected,
    accountsCount,
    hasAccounts,
    isLoading: bankingLoading,
    isLoadingInstitutions,
    institutions,
    error: bankingError,
    connectBank,
    fetchInstitutions,
  } = useBankingConnection(workspaceId);

  const [accounts, setAccounts] = useState([]);
  const [bankLoading, setBankLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal de sélection de banque
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Charger les institutions quand le modal s'ouvre
  useEffect(() => {
    if (isModalOpen && institutions.length === 0) {
      fetchInstitutions("FR");
    }
  }, [isModalOpen]);

  // Filtrer les institutions par recherche
  const filteredInstitutions = institutions.filter((inst) =>
    inst.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleSelectInstitution = async (institution) => {
    setSelectedInstitution(institution);
    setIsConnecting(true);
    await connectBank(institution.id);
    setIsConnecting(false);
  };

  const fetchAccounts = async () => {
    if (!workspaceId) return;

    try {
      setBankLoading(true);

      // Si pas connecté, pas de comptes à récupérer
      if (!isConnected) {
        setAccounts([]);
        setError(null);
        setBankLoading(false);
        return;
      }

      // Récupérer les comptes depuis l'API
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
        setAccounts([]);
      }
    } catch (err) {
      console.warn("⚠️ Erreur récupération comptes:", err.message);
      setAccounts([]);
      setError(null);
    } finally {
      setBankLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [workspaceId, isConnected]);

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

          {/* Bouton de connexion bancaire */}
          <Button
            variant="outline"
            className="w-full font-normal mt-auto"
            onClick={handleOpenModal}
            disabled={bankingLoading}
          >
            {bankingLoading ? (
              <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Landmark className="h-4 w-4 mr-2" />
            )}
            Connecter un compte bancaire
          </Button>
        </CardContent>

        {/* Modal de sélection de banque */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Connecter votre banque</DialogTitle>
              <DialogDescription>
                Sélectionnez votre banque pour synchroniser vos comptes
              </DialogDescription>
            </DialogHeader>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une banque..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Liste des banques */}
            <ScrollArea className="h-[300px] pr-4">
              {isLoadingInstitutions ? (
                <div className="flex items-center justify-center py-8">
                  <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Chargement des banques...
                  </span>
                </div>
              ) : filteredInstitutions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery
                    ? "Aucune banque trouvée"
                    : "Aucune banque disponible"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredInstitutions.map((institution) => (
                    <button
                      key={institution.id}
                      onClick={() => handleSelectInstitution(institution)}
                      disabled={isConnecting}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {institution.logo ? (
                        <img
                          src={institution.logo}
                          alt={institution.name}
                          className="h-8 w-8 object-contain rounded"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">
                          {institution.name}
                        </p>
                        {institution.bic && (
                          <p className="text-xs text-muted-foreground">
                            {institution.bic}
                          </p>
                        )}
                      </div>
                      {isConnecting &&
                        selectedInstitution?.id === institution.id && (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>

            {bankingError && (
              <p className="text-sm text-destructive text-center">
                {bankingError}
              </p>
            )}
          </DialogContent>
        </Dialog>
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
