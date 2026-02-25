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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { Landmark, LoaderCircle, Search, Building2, Plus } from "lucide-react";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useState, useEffect, useMemo } from "react";
import { toast } from "@/src/components/ui/sonner";
import { findBank } from "@/lib/banks-config";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { usePermissions } from "@/src/hooks/usePermissions";

/**
 * Récupère le token JWT depuis localStorage (même pattern qu'Apollo Client)
 */
const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bearer_token");
};

export default function BankBalanceCard({
  className,
  expenses = [],
  invoices = [],
  totalIncome = 0,
  totalExpenses = 0,
  bankAccounts: propBankAccounts,
  bankBalance: propBankBalance,
  isLoading = false,
}) {
  const { workspaceId } = useWorkspace();
  const { subscription } = useSubscription();
  const { getUserRole } = usePermissions();
  const userRole = getUserRole();

  // Utiliser les props si disponibles, sinon état local
  const [localAccounts, setLocalAccounts] = useState([]);
  const [bankLoading, setBankLoading] = useState(!propBankAccounts);
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Utiliser les comptes passés en props ou les comptes locaux
  const accounts = propBankAccounts || localAccounts;
  const accountsCount = accounts.length;

  // Modal de sélection de banque
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [isLoadingInstitutions, setIsLoadingInstitutions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBank, setSelectedBank] = useState(null);

  // Vérifier le statut de connexion bancaire
  const checkConnectionStatus = async () => {
    if (!workspaceId) return;

    try {
      const token = getAuthToken();
      const response = await fetch("/api/banking-connect/status", {
        headers: {
          "x-workspace-id": workspaceId,
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.isConnected || false);
      }
    } catch (err) {
      console.warn("⚠️ Erreur vérification statut bancaire:", err.message);
    }
  };

  // Récupérer les comptes bancaires (seulement si pas passés en props)
  const fetchAccounts = async () => {
    // Si les comptes sont passés en props, ne pas refetch
    if (propBankAccounts) {
      setBankLoading(false);
      setIsConnected(propBankAccounts.length > 0);
      return;
    }

    if (!workspaceId) return;

    try {
      setBankLoading(true);

      // Vérifier d'abord le statut
      await checkConnectionStatus();

      // Récupérer les comptes depuis la BDD via le proxy Next.js
      const response = await fetch("/api/banking/accounts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": workspaceId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const accountsList = data.accounts || [];
        setLocalAccounts(accountsList);
        setIsConnected(accountsList.length > 0);
      } else {
        setLocalAccounts([]);
      }
    } catch (err) {
      console.warn("⚠️ Erreur récupération comptes:", err.message);
      setLocalAccounts([]);
    } finally {
      setBankLoading(false);
    }
  };

  useEffect(() => {
    // Si les comptes sont passés en props, mettre à jour l'état de connexion
    if (propBankAccounts) {
      setBankLoading(false);
      setIsConnected(propBankAccounts.length > 0);
    } else {
      fetchAccounts();
    }
  }, [workspaceId, propBankAccounts]);

  // Récupérer la liste des banques
  const fetchInstitutions = async () => {
    try {
      setIsLoadingInstitutions(true);
      const token = getAuthToken();
      const response = await fetch(
        "/api/banking-connect/bridge/institutions?country=FR",
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setInstitutions(data.institutions || []);
      } else {
        const errorData = await response.json();
        console.error("Erreur récupération banques:", errorData);
        toast.error("Erreur lors du chargement des banques");
      }
    } catch (err) {
      console.error("Erreur récupération banques:", err);
      toast.error("Erreur lors du chargement des banques");
    } finally {
      setIsLoadingInstitutions(false);
    }
  };

  // Charger les banques quand le modal s'ouvre
  useEffect(() => {
    if (isModalOpen && institutions.length === 0) {
      fetchInstitutions();
    }
  }, [isModalOpen]);

  // Filtrer les banques par recherche
  const filteredInstitutions = useMemo(() => {
    if (!searchQuery) return institutions;
    const query = searchQuery.toLowerCase();
    return institutions.filter(
      (inst) =>
        inst.name.toLowerCase().includes(query) ||
        inst.groupName?.toLowerCase().includes(query)
    );
  }, [institutions, searchQuery]);

  // Ouvrir le modal de sélection
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setSearchQuery("");
    setSelectedBank(null);
  };

  // Connecter avec la banque sélectionnée
  const handleSelectBank = async (bank) => {
    if (!workspaceId) {
      toast.error("Workspace non défini");
      return;
    }

    try {
      setSelectedBank(bank);
      setIsConnecting(true);

      // Passer le provider_id pour pré-sélectionner la banque dans Bridge Connect
      const token = getAuthToken();
      const response = await fetch(
        `/api/banking-connect/bridge/connect?providerId=${bank.id}`,
        {
          headers: {
            "x-workspace-id": workspaceId,
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Rediriger vers Bridge Connect avec la banque pré-sélectionnée
        window.location.href = data.connectUrl;
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erreur de connexion");
        setSelectedBank(null);
      }
    } catch (err) {
      toast.error("Erreur lors de la connexion bancaire");
      console.error("Erreur connexion bancaire:", err);
      setSelectedBank(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  // Calculer le solde bancaire (utiliser la prop si disponible)
  const bankBalance =
    propBankBalance !== undefined
      ? propBankBalance
      : accounts.reduce((sum, account) => sum + (account.balance || 0), 0);

  // Calculer le solde total incluant toutes les transactions
  const totalBalance = useMemo(() => {
    // Utiliser les données pré-calculées du cache
    // Solde total = Solde bancaire + Revenus - Dépenses
    return bankBalance + totalIncome - totalExpenses;
  }, [bankBalance, totalIncome, totalExpenses]);

  // Obtenir les banques uniques à partir des comptes (doit être avant les returns conditionnels)
  const uniqueBanks = useMemo(() => {
    const banksMap = new Map();

    accounts.forEach((account) => {
      const raw = account.raw || {};
      // Utiliser provider_id comme identifiant unique de la banque
      const providerId = raw.provider_id || raw.item_id || account._id;

      if (!banksMap.has(providerId)) {
        // Utiliser les informations de la banque stockées dans le compte
        // ou chercher via banks-config comme fallback
        let bankName = account.institutionName;
        let bankLogo = account.institutionLogo;

        // Si pas d'info stockée, chercher via banks-config
        if (!bankName) {
          const bankConfig = findBank(account.name);
          bankName = bankConfig?.name || "Banque";
          bankLogo = bankConfig?.logo || null;
        }

        banksMap.set(providerId, {
          id: providerId,
          name: bankName,
          logo: bankLogo,
        });
      }
    });
    return Array.from(banksMap.values());
  }, [accounts]);

  // Limites de connexions bancaires selon l'abonnement (1 connexion = 1 banque)
  const bankConnectionLimit = useMemo(() => {
    const plan = subscription?.plan?.toLowerCase();
    if (plan === "entreprise") return 5;
    if (plan === "pme") return 3;
    return 1; // freelance ou par défaut
  }, [subscription?.plan]);

  // Compter le nombre de connexions bancaires uniques (banques différentes)
  const connectedBanksCount = uniqueBanks.length;
  const canAddBankAccount = connectedBanksCount < bankConnectionLimit;

  const finalLoading = isLoading || bankLoading;

  if (finalLoading) {
    return (
      <Card className={`${className} flex flex-col`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-normal">Soldes</CardTitle>
          </div>
          {/* Avatar banques placeholder */}
          <div className="-space-x-2 flex">
            <div className="h-9 w-9 rounded-full bg-accent animate-pulse ring-2 ring-background" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 animate-pulse">
          {/* Solde principal */}
          <div className="mb-6">
            <div className="h-8 w-36 bg-accent rounded mb-2" />
            <div className="h-3 w-28 bg-accent rounded" />
          </div>
          {/* Liste des comptes */}
          <div className="space-y-4 flex-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-4 w-4 bg-accent rounded" />
                  <div className="h-4 w-28 bg-accent rounded" />
                </div>
                <div className="h-4 w-16 bg-accent rounded" />
              </div>
            ))}
          </div>
          {/* Bouton connecter */}
          <div className="h-9 w-full bg-accent rounded-md mt-4" />
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

          {/* Bouton de connexion bancaire via Bridge (masqué pour le comptable) */}
          {userRole !== "accountant" && (
            <Button
              className="w-full font-normal mt-auto"
              onClick={handleOpenModal}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Landmark className="h-4 w-4 mr-2" />
              )}
              {isConnecting
                ? "Connexion en cours..."
                : "Connecter un compte bancaire"}
            </Button>
          )}
        </CardContent>

        {/* Modal de sélection de banque */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md max-h-[80vh]">
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
            <ScrollArea className="h-[350px] pr-4">
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
                  {filteredInstitutions.map((bank) => (
                    <button
                      key={bank.id}
                      onClick={() => handleSelectBank(bank)}
                      disabled={isConnecting}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {bank.logo ? (
                        <img
                          src={bank.logo}
                          alt={bank.name}
                          className="h-8 w-8 object-contain rounded"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="h-8 w-8 rounded bg-muted items-center justify-center"
                        style={{ display: bank.logo ? "none" : "flex" }}
                      >
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{bank.name}</p>
                        {bank.groupName && bank.groupName !== bank.name && (
                          <p className="text-xs text-muted-foreground">
                            {bank.groupName}
                          </p>
                        )}
                      </div>
                      {isConnecting && selectedBank?.id === bank.id && (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  return (
    <Card className={`${className} flex flex-col`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-normal">Soldes</CardTitle>
          {uniqueBanks.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {connectedBanksCount}/{bankConnectionLimit}
            </span>
          )}
        </div>
        {/* Avatars des banques connectées */}
        {uniqueBanks.length > 0 && (
          <div className="-space-x-2 flex">
            {uniqueBanks.slice(0, 4).map((bank, index) => (
              <Avatar
                key={bank.id || `bank-${index}`}
                className="h-9 w-9 ring-2 ring-background bg-white"
              >
                {bank.logo ? (
                  <AvatarImage
                    alt={bank.name}
                    src={bank.logo}
                    className="object-contain p-0.5"
                  />
                ) : null}
                <AvatarFallback className="text-sm bg-gray-100">
                  {bank.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {uniqueBanks.length > 4 && (
              <Avatar className="h-9 w-9 ring-2 ring-background">
                <AvatarFallback className="text-sm bg-gray-200">
                  +{uniqueBanks.length - 4}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        {/* Solde bancaire (mode bancaire pur) */}
        <div className="mb-6">
          <div className="text-3xl font-medium mb-2">
            {formatCurrency(bankBalance)}
          </div>
          <p className="text-xs text-muted-foreground">Solde bancaire total</p>
        </div>

        {/* Liste des comptes */}
        <div className="space-y-4 flex-1">
          {accounts.slice(0, 4).map((account, index) => (
            <div
              key={account.id || account._id || `account-${index}`}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <Landmark className="h-4 w-4" />
                <span className="text-sm font-normal truncate max-w-[180px]">
                  {account.bankName || account.name || "Compte bancaire"}
                </span>
              </div>
              <span className="text-sm font-medium">
                {formatCurrency(
                  typeof account.balance === "object"
                    ? account.balance?.current ||
                        account.balance?.available ||
                        0
                    : account.balance || 0
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Bouton ajouter un compte bancaire (masqué pour le comptable) */}
        {canAddBankAccount && userRole !== "accountant" && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={handleOpenModal}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Connecter une banque ({bankConnectionLimit - connectedBanksCount}{" "}
            restante{bankConnectionLimit - connectedBanksCount > 1 ? "s" : ""})
          </Button>
        )}

        {/* Modal de sélection de banque */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Connecter votre banque</DialogTitle>
              <DialogDescription>
                Sélectionnez votre banque pour synchroniser vos comptes (
                {connectedBanksCount}/{bankConnectionLimit} connexions
                utilisées)
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
            <ScrollArea className="h-[350px] pr-4">
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
                  {filteredInstitutions.map((bank) => (
                    <button
                      key={bank.id}
                      onClick={() => handleSelectBank(bank)}
                      disabled={isConnecting}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {bank.logo ? (
                        <img
                          src={bank.logo}
                          alt={bank.name}
                          className="h-8 w-8 object-contain rounded"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="h-8 w-8 rounded bg-muted items-center justify-center"
                        style={{ display: bank.logo ? "none" : "flex" }}
                      >
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{bank.name}</p>
                        {bank.groupName && bank.groupName !== bank.name && (
                          <p className="text-xs text-muted-foreground">
                            {bank.groupName}
                          </p>
                        )}
                      </div>
                      {isConnecting && selectedBank?.id === bank.id && (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
