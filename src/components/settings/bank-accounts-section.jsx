"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { Input } from "@/src/components/ui/input";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import {
  Landmark,
  Plus,
  Search,
  Building2,
  LoaderCircle,
  Trash2,
  RefreshCw,
  Crown,
  Eye,
  EyeOff,
  MailWarning,
} from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { findBank, getBankLogo } from "@/lib/banks-config";
import { Callout } from "@/src/components/ui/callout";
import { authClient } from "@/src/lib/auth-client";


/**
 * Formate un IBAN pour l'affichage (groupes de 4)
 */
const formatIban = (iban, showFull = false) => {
  if (!iban) return "Non renseigné";
  const cleanIban = iban.replace(/\s/g, "").toUpperCase();
  if (showFull) {
    return cleanIban.replace(/(.{4})/g, "$1 ").trim();
  }
  // Masquer partiellement l'IBAN
  const visible = cleanIban.slice(0, 4) + " •••• •••• " + cleanIban.slice(-4);
  return visible;
};

/**
 * Formate un montant en devise
 */
const formatCurrency = (amount, currency = "EUR") => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency,
  }).format(amount || 0);
};

export function BankAccountsSection({ canManageOrgSettings = true }) {
  const { workspaceId } = useWorkspace();
  const { subscription } = useSubscription();

  // États pour les comptes bancaires
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // États pour le modal de sélection de banque
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [isLoadingInstitutions, setIsLoadingInstitutions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const [selectedBank, setSelectedBank] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // État pour afficher/masquer les IBAN
  const [visibleIbans, setVisibleIbans] = useState({});

  // État pour la déconnexion (stocke l'ID du compte en cours de déconnexion)
  const [disconnectingAccountId, setDisconnectingAccountId] = useState(null);

  // État pour la vérification email
  const [isEmailVerified, setIsEmailVerified] = useState(true);

  // Limites de connexions bancaires selon l'abonnement
  const bankConnectionLimit = useMemo(() => {
    const plan = subscription?.plan?.toLowerCase();
    if (plan === "entreprise") return 5;
    if (plan === "pme") return 3;
    return 1; // freelance ou par défaut
  }, [subscription?.plan]);

  // Obtenir les banques uniques à partir des comptes
  const uniqueBanks = useMemo(() => {
    const banksMap = new Map();

    accounts.forEach((account) => {
      const raw = account.raw || {};
      const providerId = raw.provider_id || raw.item_id || account._id;

      if (!banksMap.has(providerId)) {
        let bankName = account.institutionName;
        let bankLogo = account.institutionLogo;

        if (!bankName) {
          const bankConfig = findBank(account.name || account.bankName);
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

  const connectedBanksCount = uniqueBanks.length;
  const canAddBankAccount = connectedBanksCount < bankConnectionLimit;

  // Vérifier le statut de connexion bancaire
  const checkConnectionStatus = async () => {
    if (!workspaceId) return;

    try {
      const response = await fetch("/api/banking-connect/status", {
        headers: {
          "x-workspace-id": workspaceId,
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

  // Récupérer les comptes bancaires
  const fetchAccounts = async () => {
    if (!workspaceId) return;

    try {
      setIsLoading(true);
      await checkConnectionStatus();

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
        setAccounts(accountsList);
        setIsConnected(accountsList.length > 0);
      } else {
        setAccounts([]);
      }
    } catch (err) {
      console.warn("⚠️ Erreur récupération comptes:", err.message);
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer la liste des institutions bancaires
  const fetchInstitutions = async () => {
    try {
      setIsLoadingInstitutions(true);
      const response = await fetch(
        "/api/banking-connect/bridge/institutions?country=FR",
        {
          headers: {
            },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setInstitutions(data.institutions || []);
      } else {
        toast.error("Erreur lors du chargement des banques");
      }
    } catch (err) {
      console.error("Erreur récupération banques:", err);
      toast.error("Erreur lors du chargement des banques");
    } finally {
      setIsLoadingInstitutions(false);
    }
  };

  // Charger les comptes au montage
  useEffect(() => {
    fetchAccounts();
  }, [workspaceId]);

  // Vérifier le statut de vérification email
  useEffect(() => {
    const checkEmailVerification = async () => {
      try {
        const { data: session } = await authClient.getSession();
        setIsEmailVerified(session?.user?.emailVerified ?? true);
      } catch (error) {
        console.warn("Erreur vérification email:", error);
      }
    };
    checkEmailVerification();
  }, []);

  // Charger les institutions quand le modal s'ouvre
  useEffect(() => {
    if (isModalOpen && institutions.length === 0) {
      fetchInstitutions();
    }
  }, [isModalOpen]);

  // Filtrer les institutions par recherche
  const filteredInstitutions = useMemo(() => {
    if (!debouncedSearchQuery) return institutions;
    const query = debouncedSearchQuery.toLowerCase();
    return institutions.filter(
      (inst) =>
        inst.name.toLowerCase().includes(query) ||
        inst.groupName?.toLowerCase().includes(query),
    );
  }, [institutions, debouncedSearchQuery]);

  // Ouvrir le modal de sélection
  const handleOpenModal = () => {
    if (!canManageOrgSettings) {
      toast.error("Vous n'avez pas la permission d'ajouter un compte bancaire");
      return;
    }
    if (!isEmailVerified) {
      toast.error("Veuillez vérifier votre adresse email avant de connecter un compte bancaire");
      return;
    }
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

      const response = await fetch(
        `/api/banking-connect/bridge/connect?providerId=${bank.id}`,
        {
          headers: {
            "x-workspace-id": workspaceId,
            },
        },
      );

      if (response.ok) {
        const data = await response.json();
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

  // Déconnecter un compte bancaire spécifique
  const handleDisconnect = async (account) => {
    if (!workspaceId || !account) return;

    const accountId = account._id || account.id;
    const itemId = account.raw?.item_id || account.raw?.provider_id;

    try {
      setDisconnectingAccountId(accountId);
      const response = await fetch("/api/banking-connect/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": workspaceId,
        },
        body: JSON.stringify({
          accountId: accountId,
          itemId: itemId,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Calculer les nouveaux comptes en filtrant ceux déconnectés
        let newAccounts;
        let disconnectedCount = 0;

        if (
          data.disconnectedAccountIds &&
          data.disconnectedAccountIds.length > 0
        ) {
          newAccounts = accounts.filter(
            (acc) => !data.disconnectedAccountIds.includes(acc._id || acc.id),
          );
          disconnectedCount = data.disconnectedAccountIds.length;
        } else if (itemId) {
          // Fallback: retirer par itemId
          newAccounts = accounts.filter(
            (acc) =>
              acc.raw?.item_id !== itemId && acc.raw?.provider_id !== itemId,
          );
          disconnectedCount = accounts.length - newAccounts.length;
        } else {
          // Fallback: retirer par accountId uniquement
          newAccounts = accounts.filter(
            (acc) => (acc._id || acc.id) !== accountId,
          );
          disconnectedCount = 1;
        }

        // Mettre à jour le state
        setAccounts(newAccounts);

        // Mettre à jour isConnected
        if (newAccounts.length === 0) {
          setIsConnected(false);
        }

        // Afficher le message de succès
        toast.success(
          disconnectedCount > 1
            ? `${disconnectedCount} comptes bancaires déconnectés`
            : "Compte bancaire déconnecté",
        );
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erreur de déconnexion");
      }
    } catch (err) {
      toast.error("Erreur lors de la déconnexion");
      console.error("Erreur déconnexion:", err);
    } finally {
      setDisconnectingAccountId(null);
    }
  };

  // Toggle visibilité IBAN
  const toggleIbanVisibility = (accountId) => {
    setVisibleIbans((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  // Rafraîchir les comptes
  const handleRefresh = async () => {
    toast.info("Synchronisation en cours...");
    await fetchAccounts();
    toast.success("Comptes synchronisés");
  };

  // Obtenir le logo d'une banque pour un compte
  const getAccountBankLogo = (account) => {
    if (account.institutionLogo) return account.institutionLogo;
    const bankConfig = findBank(
      account.name || account.bankName || account.institutionName,
    );
    return bankConfig?.logo || null;
  };

  // Obtenir le nom de la banque pour un compte
  const getAccountBankName = (account) => {
    if (account.institutionName) return account.institutionName;
    const bankConfig = findBank(account.name || account.bankName);
    return (
      bankConfig?.name || account.bankName || account.name || "Compte bancaire"
    );
  };

  // Obtenir le statut du compte
  const getAccountStatus = (account) => {
    const status = account.status?.toLowerCase() || "active";
    if (status === "active" || status === "ok") {
      return { label: "Actif", variant: "success" };
    }
    if (status === "error" || status === "disconnected") {
      return { label: "Erreur", variant: "destructive" };
    }
    return { label: "En attente", variant: "secondary" };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium mb-1 hidden md:block">
          Comptes bancaires
        </h2>
        <p className="text-sm text-gray-400 mb-3 hidden md:block">
          Gérez vos connexions bancaires et synchronisez vos transactions.
        </p>
        <Separator className="hidden md:block bg-[#eeeff1] dark:bg-[#232323]" />
      </div>

      {/* Alertes */}
      {!canManageOrgSettings && (
        <Callout type="warning" noMargin>
          <p className="text-xs">
            Seuls les <strong>owners</strong> et <strong>admins</strong> peuvent gérer les comptes bancaires.
          </p>
        </Callout>
      )}
      {!isEmailVerified && (
        <Callout type="warning" noMargin>
          <p className="text-xs">
            Veuillez vérifier votre adresse email avant de connecter un compte bancaire.
          </p>
        </Callout>
      )}

      {/* Bloc comptes connectés */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoaderCircle className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-6">
          <div className="w-10 h-10 rounded-xl bg-[#fbfbfb] dark:bg-[#1a1a1a] border border-[#eeeff1] dark:border-[#232323] flex items-center justify-center mb-4">
            <Landmark className="h-5 w-5 text-gray-400" />
          </div>
          <h3 className="text-sm font-medium mb-1">
            Aucun compte connecté
          </h3>
          <p className="text-xs text-gray-400 mb-4 text-center max-w-xs">
            Connectez votre banque pour synchroniser automatiquement vos transactions.
          </p>
          <Button
            size="sm"
            onClick={handleOpenModal}
            disabled={!canManageOrgSettings || !isEmailVerified}
            className="bg-[#5b4eff] hover:bg-[#4a3ecc] text-white cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Connecter une banque
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section comptes — même style que le bloc "Installées" des apps */}
          <div className="flex flex-col gap-3 p-3 w-full bg-[#fbfbfb] dark:bg-[#141414] border border-[#eeeff1] dark:border-[#232323] rounded-2xl">
            <div className="flex items-center justify-between w-full px-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium">Comptes connectés</h3>
                <span className="text-xs text-gray-400">
                  {connectedBanksCount}/{bankConnectionLimit}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 h-7 px-2 cursor-pointer"
                >
                  <RefreshCw
                    className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Synchroniser
                </Button>
                {canAddBankAccount ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenModal}
                    disabled={!canManageOrgSettings || isConnecting || !isEmailVerified}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 h-7 px-2 cursor-pointer"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter
                  </Button>
                ) : (
                  <span className="text-[10px] text-amber-500 flex items-center gap-1 px-2">
                    <Crown className="h-3 w-3" />
                    Limite
                  </span>
                )}
              </div>
            </div>

            {/* Liste des comptes */}
            <div className="space-y-2">
              {accounts.map((account, index) => {
                const bankLogo = getAccountBankLogo(account);
                const bankName = getAccountBankName(account);
                const status = getAccountStatus(account);
                const accountId = account._id || account.id || `account-${index}`;
                const isIbanVisible = visibleIbans[accountId];
                const balance =
                  typeof account.balance === "object"
                    ? account.balance?.current || account.balance?.available || 0
                    : account.balance || 0;

                return (
                  <div
                    key={accountId}
                    className="group flex items-center justify-between gap-3 bg-white dark:bg-[#141414] border border-[#eeeff1] dark:border-[#232323] hover:bg-[#f9f9f9] dark:hover:bg-[#1a1a1a] rounded-2xl w-full transition-colors duration-75"
                    style={{ padding: "12px 18px 12px 12px" }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Logo banque */}
                      <div className="relative flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white dark:bg-[#1a1a1a] border border-[#eeeff1] dark:border-[#232323]">
                        {bankLogo ? (
                          <img
                            src={bankLogo}
                            alt={bankName}
                            className="w-full h-full object-contain p-0.5"
                            onError={(e) => {
                              e.target.style.display = "none";
                              if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className="w-full h-full items-center justify-center"
                          style={{ display: bankLogo ? "none" : "flex" }}
                        >
                          <Landmark className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>

                      {/* Infos */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-medium truncate">{bankName}</h4>
                          {status.variant === "success" ? (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-green-50 border border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 rounded-md">
                              Actif
                            </span>
                          ) : status.variant === "destructive" ? (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-red-50 border border-red-200 text-red-500 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 rounded-md">
                              Erreur
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 border border-gray-200 text-gray-500 dark:bg-[#2c2c2c] dark:border-[#3c3c3c] dark:text-gray-400 rounded-md">
                              En attente
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-400 truncate">
                            {account.name || account.bankName || "Compte courant"}
                          </p>
                          <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
                          <span className="text-xs text-gray-400 font-mono">
                            {formatIban(account.iban || account.raw?.iban, isIbanVisible)}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleIbanVisibility(accountId)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            {isIbanVisible ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Droite : solde + delete */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(balance, account.currency || "EUR")}
                        </p>
                      </div>

                      {canManageOrgSettings && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              type="button"
                              disabled={disconnectingAccountId === accountId}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                            >
                              {disconnectingAccountId === accountId ? (
                                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Déconnecter ce compte ?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action supprimera la connexion avec{" "}
                                <strong>{bankName}</strong>. Vos données de
                                transactions seront conservées mais ne seront plus
                                synchronisées.
                                {account.raw?.item_id && (
                                  <span className="block mt-2 text-amber-600 dark:text-amber-400">
                                    Note : Si plusieurs comptes sont liés à cette
                                    connexion bancaire, ils seront tous
                                    déconnectés.
                                  </span>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDisconnect(account)}
                                disabled={disconnectingAccountId !== null}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                {disconnectingAccountId === accountId
                                  ? "Déconnexion..."
                                  : "Déconnecter"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Limite atteinte */}
          {!canAddBankAccount && (
            <div className="flex items-center gap-3 bg-[#f8f9fa] dark:bg-[#141414] border border-[#eeeff1] dark:border-[#232323] rounded-xl px-3 py-2.5">
              <Crown className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-gray-400">
                Limite de {bankConnectionLimit} connexion{bankConnectionLimit > 1 ? "s" : ""} atteinte ({subscription?.plan}). Passez à un plan supérieur pour en ajouter.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal de sélection de banque */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
          <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
            <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
              <DialogTitle className="text-sm font-medium flex items-center gap-2">
                <Landmark className="size-4" />
                Connecter votre banque
              </DialogTitle>
            </DialogHeader>

            <div className="px-5 pt-3 pb-3 space-y-3">
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
              <ScrollArea className="h-[350px]">
                {isLoadingInstitutions ? (
                  <div className="flex items-center justify-center py-10">
                    <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground/50" />
                  </div>
                ) : filteredInstitutions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {searchQuery
                      ? "Aucune banque trouvée"
                      : "Aucune banque disponible"}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredInstitutions.map((bank) => (
                      <button
                        type="button"
                        key={bank.id}
                        onClick={() => handleSelectBank(bank)}
                        disabled={isConnecting}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
