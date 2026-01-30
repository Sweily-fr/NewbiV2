"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { Input } from "@/src/components/ui/input";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  Crown,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { findBank, getBankLogo } from "@/lib/banks-config";
import { Callout } from "@/src/components/ui/callout";

/**
 * Récupère le token JWT depuis localStorage
 */
const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bearer_token");
};

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
  const [selectedBank, setSelectedBank] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // État pour afficher/masquer les IBAN
  const [visibleIbans, setVisibleIbans] = useState({});

  // État pour la déconnexion (stocke l'ID du compte en cours de déconnexion)
  const [disconnectingAccountId, setDisconnectingAccountId] = useState(null);

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

  // Récupérer les comptes bancaires
  const fetchAccounts = async () => {
    if (!workspaceId) return;

    try {
      setIsLoading(true);
      await checkConnectionStatus();

      const token = getAuthToken();
      const response = await fetch("/api/banking/accounts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": workspaceId,
          ...(token && { Authorization: `Bearer ${token}` }),
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
      const token = getAuthToken();
      const response = await fetch(
        "/api/banking-connect/bridge/institutions?country=FR",
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
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

  // Charger les institutions quand le modal s'ouvre
  useEffect(() => {
    if (isModalOpen && institutions.length === 0) {
      fetchInstitutions();
    }
  }, [isModalOpen]);

  // Filtrer les institutions par recherche
  const filteredInstitutions = useMemo(() => {
    if (!searchQuery) return institutions;
    const query = searchQuery.toLowerCase();
    return institutions.filter(
      (inst) =>
        inst.name.toLowerCase().includes(query) ||
        inst.groupName?.toLowerCase().includes(query),
    );
  }, [institutions, searchQuery]);

  // Ouvrir le modal de sélection
  const handleOpenModal = () => {
    if (!canManageOrgSettings) {
      toast.error("Vous n'avez pas la permission d'ajouter un compte bancaire");
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

      const token = getAuthToken();
      const response = await fetch(
        `/api/banking-connect/bridge/connect?providerId=${bank.id}`,
        {
          headers: {
            "x-workspace-id": workspaceId,
            ...(token && { Authorization: `Bearer ${token}` }),
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
      const token = getAuthToken();
      const response = await fetch("/api/banking-connect/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": workspaceId,
          ...(token && { Authorization: `Bearer ${token}` }),
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
      return { label: "Actif", variant: "success", icon: CheckCircle2 };
    }
    if (status === "error" || status === "disconnected") {
      return { label: "Erreur", variant: "destructive", icon: XCircle };
    }
    return { label: "En attente", variant: "secondary", icon: LoaderCircle };
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-medium mb-1">Comptes bancaires</h2>
        <Separator className="hidden md:block" />
        {!canManageOrgSettings && (
          <div className="mt-4">
            <Callout type="warning" noMargin>
              <p>
                Vous n'avez pas la permission de gérer les comptes bancaires.
                Seuls les <strong>owners</strong> et <strong>admins</strong>{" "}
                peuvent effectuer ces modifications.
              </p>
            </Callout>
          </div>
        )}
      </div>

      {/* En-tête avec compteur et actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {connectedBanksCount}/{bankConnectionLimit} connexion
              {bankConnectionLimit > 1 ? "s" : ""} utilisée
              {connectedBanksCount > 1 ? "s" : ""}
            </span>
          </div>
          {subscription?.plan && (
            <Badge variant="outline" className="text-xs">
              {subscription.plan}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {accounts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="font-normal"
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
              />
              Synchroniser
            </Button>
          )}
          {canAddBankAccount ? (
            <Button
              size="sm"
              onClick={handleOpenModal}
              disabled={!canManageOrgSettings || isConnecting}
              className="font-normal"
            >
              {isConnecting ? (
                <LoaderCircle className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Ajouter un compte
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled
              className="font-normal"
            >
              <Crown className="h-4 w-4 mr-1 text-amber-500" />
              Limite atteinte
            </Button>
          )}
        </div>
      </div>

      {/* État de chargement */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Chargement des comptes...
          </span>
        </div>
      ) : accounts.length === 0 ? (
        /* État vide */
        <div className="border border-dashed rounded-lg p-8 text-center">
          <Landmark className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-sm font-medium mb-2">
            Aucun compte bancaire connecté
          </h3>
          <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
            Connectez votre compte bancaire pour synchroniser automatiquement
            vos transactions et suivre vos finances en temps réel.
          </p>
          <Button
            onClick={handleOpenModal}
            disabled={!canManageOrgSettings}
            className="font-normal bg-[#5b4eff] hover:bg-[#4a3ecc]"
          >
            <Landmark className="h-4 w-4 mr-2" />
            Connecter un compte bancaire
          </Button>
        </div>
      ) : (
        /* Liste des comptes - Style Qonto */
        <div className="space-y-3">
          {accounts.map((account, index) => {
            const bankLogo = getAccountBankLogo(account);
            const bankName = getAccountBankName(account);
            const status = getAccountStatus(account);
            const StatusIcon = status.icon;
            const accountId = account._id || account.id || `account-${index}`;
            const isIbanVisible = visibleIbans[accountId];
            const balance =
              typeof account.balance === "object"
                ? account.balance?.current || account.balance?.available || 0
                : account.balance || 0;

            return (
              <div
                key={accountId}
                className="group border rounded-xl p-4 hover:border-[#5b4eff]/30 hover:bg-accent/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Logo de la banque */}
                  <div className="flex-shrink-0">
                    {bankLogo ? (
                      <img
                        src={bankLogo}
                        alt={bankName}
                        className="h-12 w-12 rounded-lg object-contain bg-white border p-1"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="h-12 w-12 rounded-lg bg-muted items-center justify-center border"
                      style={{ display: bankLogo ? "none" : "flex" }}
                    >
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Informations du compte */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium truncate">
                        {bankName}
                      </h4>
                      <Badge
                        variant={
                          status.variant === "success"
                            ? "default"
                            : status.variant
                        }
                        className={`text-[10px] px-1.5 py-0 ${
                          status.variant === "success"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : ""
                        }`}
                      >
                        <StatusIcon className="h-3 w-3 mr-0.5" />
                        {status.label}
                      </Badge>
                    </div>

                    {/* Nom du compte */}
                    <p className="text-xs text-muted-foreground mb-2">
                      {account.name || account.bankName || "Compte courant"}
                    </p>

                    {/* IBAN avec toggle */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        IBAN:{" "}
                        {formatIban(
                          account.iban || account.raw?.iban,
                          isIbanVisible,
                        )}
                      </span>
                      <button
                        onClick={() => toggleIbanVisibility(accountId)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isIbanVisible ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Solde et actions */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {formatCurrency(balance, account.currency || "EUR")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Solde actuel
                      </p>
                    </div>

                    {/* Bouton de déconnexion */}
                    {canManageOrgSettings && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={disconnectingAccountId === accountId}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            {disconnectingAccountId === accountId ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
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
              </div>
            );
          })}
        </div>
      )}

      {/* Message pour upgrade si limite atteinte */}
      {!canAddBankAccount && accounts.length > 0 && (
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Crown className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Limite de connexions atteinte
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Votre abonnement {subscription?.plan || "actuel"} permet{" "}
                {bankConnectionLimit} connexion
                {bankConnectionLimit > 1 ? "s" : ""} bancaire
                {bankConnectionLimit > 1 ? "s" : ""}. Passez à un plan supérieur
                pour connecter plus de comptes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de sélection de banque */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Connecter votre banque</DialogTitle>
            <DialogDescription>
              Sélectionnez votre banque pour synchroniser vos comptes (
              {connectedBanksCount}/{bankConnectionLimit} connexions utilisées)
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
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent hover:border-[#5b4eff]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}
