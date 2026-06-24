"use client";

import Head from "next/head";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/src/components/ui/avatar";
import { ChartAreaInteractive } from "@/src/components/chart-area-interactive";
import { ChartRadarGridCircle } from "@/src/components/chart-radar-grid-circle";
import { ChartBarMultiple } from "@/src/components/ui/bar-charts";
import Comp333 from "@/src/components/comp-333";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
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
  Send,
  Landmark,
  Zap,
  Monitor,
  Target,
  Scale,
  Receipt,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Building2,
  ChevronsUpDown,
  Bell,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import { cn } from "@/src/lib/utils";
// Bridge components removed
import { useUser } from "@/src/lib/auth/hooks";
import { authClient } from "@/src/lib/auth-client";
import { redirect } from "next/navigation";
// Financial stats and bridge hooks removed
import { useWorkspace } from "@/src/hooks/useWorkspace";
import BankBalanceCard from "@/src/components/banking/BankBalanceCard";
import RecentTransactionsCard from "@/src/components/banking/RecentTransactionsCard";
import { TreasuryChart } from "@/src/components/treasury-chart";
import { ExpenseCategoryChart } from "@/app/dashboard/outils/transactions/components/expense-category-chart";
import { IncomeCategoryChart } from "@/app/dashboard/components/income-category-chart";

import { DashboardSkeleton } from "@/src/components/dashboard-skeleton";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useDashboardData } from "@/src/hooks/useDashboardData";
import { useQuery } from "@apollo/client";
import { GET_TREASURY_CHART } from "@/src/graphql/queries/dashboardAggregation";
import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { useInvoices } from "@/src/graphql/invoiceQueries";
import { ProSubscriptionOverlay } from "@/src/components/pro-subscription-overlay";
import { BankSyncOverlay } from "@/src/components/bank-sync-overlay";
import {
  getIncomeChartConfig,
  getExpenseChartConfig,
} from "@/src/utils/chartDataProcessors";
import { useChartColors } from "@/src/hooks/useChartColors";
import {
  ClipboardTickIcon,
  DocumentText2Icon,
  ClipboardImportIcon,
  SendIcon,
  TrendUpIcon,
  TrendDownIcon,
  AddCircleIcon,
  ChartBarIcon,
  ReceiptItemIcon,
  CardCoinIcon,
  ReceiptSearchIcon,
  NotificationIcon,
  BankIcon,
} from "@/src/components/icons";
import { TableEmptyState } from "@/src/components/ui/table-empty-state";
import { useInvoiceBalances } from "@/src/graphql/invoiceQueries";
import { usePurchaseInvoiceStats } from "@/src/hooks/usePurchaseInvoices";
import { useQuoteBalances } from "@/src/graphql/quoteQueries";
import { useActivityNotifications } from "@/src/hooks/useActivityNotifications";
import { GET_RECONCILIATION_SUGGESTIONS } from "@/src/graphql/queries/reconciliation";
import { useStripeConnect } from "@/src/hooks/useStripeConnect";
import { InvoicesToCollectCard } from "@/app/dashboard/components/invoices-to-collect-card";
import { PurchaseInvoicesStatsCard } from "@/app/dashboard/components/purchase-invoices-stats-card";
import { PendingQuotesCard } from "@/app/dashboard/components/pending-quotes-card";
import { OverdueInvoicesCard } from "@/app/dashboard/components/overdue-invoices-card";
import { MonthlyRevenueCard } from "@/app/dashboard/components/monthly-revenue-card";
import { TopClientsCard } from "@/app/dashboard/components/top-clients-card";
import { WeekCalendarCard } from "@/app/dashboard/components/week-calendar-card";

function DashboardContent() {
  const { session } = useUser();
  const router = useRouter();
  const { isReadOnly, isOwner } = useSubscriptionAccess();
  const { checkAndUpdateAccountStatus, refetchStatus } = useStripeConnect(
    session?.user?.id,
  );

  const { workspaceId } = useWorkspace();

  const readOnlyTooltip = isReadOnly
    ? isOwner
      ? "Mode lecture seule · Renouvelez votre abonnement"
      : "Mode lecture seule · Contactez l'administrateur"
    : undefined;

  // Données factures et achats pour les KPIs
  const { balances: invoiceBalances } = useInvoiceBalances();
  const { stats: purchaseStats } = usePurchaseInvoiceStats();
  const { balances: quoteBalances } = useQuoteBalances();
  const { unreadCount: notifUnreadCount } = useActivityNotifications();

  // Reconciliation data
  const { data: reconData } = useQuery(GET_RECONCILIATION_SUGGESTIONS, {
    variables: { workspaceId },
    fetchPolicy: "cache-and-network",
    skip: !workspaceId,
  });

  // État pour le filtre de compte bancaire
  const [selectedAccountId, setSelectedAccountId] = useState("all");

  // Dashboard utilise skipTransactions=true : les graphiques font leurs propres queries backend.
  // Le summary (totalIncome, totalExpenses, bankBalance) est pré-calculé côté serveur.
  const {
    invoices,
    paidInvoices,
    paidExpenses,
    totalIncome,
    totalExpenses,
    bankAccounts,
    bankBalance,
    isLoading,
    invoicesLoading,
    accountsLoading,
    transactionsLoading,
    formatCurrency,
    refreshData,
    cacheInfo,
  } = useDashboardData({
    skipTransactions: true,
    accountId: selectedAccountId,
  });

  // Query pour les graphiques Entrées/Sorties (courbes d'aire sur 365 jours)
  const { data: flowChartData, loading: flowChartLoading } = useQuery(
    GET_TREASURY_CHART,
    {
      variables: {
        workspaceId,
        period: { preset: "365d" },
        accountId: selectedAccountId === "all" ? null : selectedAccountId,
      },
      fetchPolicy: "cache-and-network",
      skip: !workspaceId,
    },
  );

  const incomeChartData = useMemo(() => {
    const points = flowChartData?.dashboardTreasuryChart?.dataPoints || [];
    return points.map((d) => ({ date: d.date, desktop: d.income, mobile: 0 }));
  }, [flowChartData]);

  const expenseChartData = useMemo(() => {
    const points = flowChartData?.dashboardTreasuryChart?.dataPoints || [];
    return points.map((d) => ({
      date: d.date,
      desktop: d.expenses,
      mobile: 0,
    }));
  }, [flowChartData]);

  // Compteurs "À traiter"
  const actionCounts = useMemo(() => {
    const allInvoices = invoices || [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Card Comptabilité
    const unmatchedCount =
      reconData?.reconciliationSuggestions?.unmatchedCount || 0;

    // Card Facturation
    const overdueInvoices = allInvoices.filter((inv) => {
      if (inv.status !== "PENDING") return false;
      if (!inv.dueDate) return false;
      const due = new Date(
        Number(inv.dueDate) < 1e12
          ? Number(inv.dueDate) * 1000
          : Number(inv.dueDate),
      );
      return !isNaN(due.getTime()) && due < now;
    });
    const unsentInvoices = allInvoices.filter(
      (inv) => inv.status === "PENDING" && !inv.emailTracking?.emailSentAt,
    );

    return {
      unmatchedCount,
      overdueCount: overdueInvoices.length,
      overdueAmount: overdueInvoices.reduce(
        (s, i) => s + (i.finalTotalTTC || 0),
        0,
      ),
      unsentCount: unsentInvoices.length,
      pendingQuotesCount: quoteBalances.pendingCount,
      pendingQuotesAmount: quoteBalances.pendingAmount,
      notifCount: notifUnreadCount || 0,
    };
  }, [invoices, reconData, quoteBalances, notifUnreadCount]);

  const [accountPopoverOpen, setAccountPopoverOpen] = useState(false);

  // État pour l'overlay de synchronisation bancaire
  const [isBankSyncing, setIsBankSyncing] = useState(false);

  // Ref pour ouvrir le modal de connexion bancaire
  const bankBalanceRef = useRef(null);

  // Refs pour empêcher les useEffects de se re-déclencher
  const hasHandledBridgeReturn = useRef(false);
  const hasHandledStripeReturn = useRef(false);

  // Gérer le retour de Bridge Connect (sync automatique des comptes bancaires)
  useEffect(() => {
    if (hasHandledBridgeReturn.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const isFromBridge = urlParams.has("item_id") || urlParams.has("status");

    if (isFromBridge && workspaceId) {
      hasHandledBridgeReturn.current = true;
      // Afficher l'overlay de chargement immédiatement
      setIsBankSyncing(true);

      // Filet de sécurité : ne jamais laisser l'overlay tourner indéfiniment
      // (ex: /api/banking-sync/full qui ne répond pas).
      let safetyTimer;

      const syncBankAccounts = async () => {
        try {
          // Lancer la sync complète (comptes + transactions) via le proxy Next.js
          const response = await fetch("/api/banking-sync/full", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "x-workspace-id": workspaceId,
            },
            body: JSON.stringify({ limit: 100 }),
          });

          if (response.ok) {
            const data = await response.json();
            // Rafraîchir les données du dashboard. Bridge (et son webhook)
            // peut finaliser la connexion avec un léger décalage, donc on
            // rafraîchit plusieurs fois pendant que l'overlay est affiché
            // pour éviter d'avoir à recharger la page manuellement.
            await refreshData();
            await new Promise((r) => setTimeout(r, 2500));
            await refreshData();
            await new Promise((r) => setTimeout(r, 3000));
            await refreshData();
          } else {
            console.error("❌ Erreur sync bancaire:", await response.text());
          }

          // Nettoyer l'URL des paramètres Bridge
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, "", cleanUrl);
        } catch (error) {
          console.error("❌ Erreur lors de la sync bancaire:", error);
        } finally {
          // Masquer l'overlay après la sync
          clearTimeout(safetyTimer);
          setIsBankSyncing(false);
        }
      };

      // Attendre un peu pour que Bridge finalise, puis lancer la sync.
      // Pas de cleanup qui annule ce timer : un re-render (changement
      // d'identité de refreshData) ne doit pas laisser l'overlay bloqué —
      // le garde hasHandledBridgeReturn empêche déjà tout double-déclenchement.
      setTimeout(syncBankAccounts, 1500);
      safetyTimer = setTimeout(() => setIsBankSyncing(false), 30000);
    }
  }, [workspaceId, refreshData]);

  // Gérer le retour de Stripe Connect
  useEffect(() => {
    if (hasHandledStripeReturn.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const isFromStripe = urlParams.get("stripe_success") === "true";
    const shouldOpenSettings = urlParams.get("open_settings") === "securite";

    if (isFromStripe && session?.user?.id) {
      hasHandledStripeReturn.current = true;
      const timer = setTimeout(async () => {
        try {
          // Vérifier et mettre à jour le statut du compte Stripe Connect
          await checkAndUpdateAccountStatus();
          await refetchStatus();

          // Ouvrir le modal settings sur la section sécurité
          if (shouldOpenSettings) {
            // Dispatch d'un event pour ouvrir le modal settings
            window.dispatchEvent(
              new CustomEvent("openSettingsModal", {
                detail: { section: "securite" },
              }),
            );
          }

          // Nettoyer l'URL
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, "", cleanUrl);
        } catch (error) {
          console.error(
            "❌ Erreur lors de la vérification automatique:",
            error,
          );
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [session?.user?.id, checkAndUpdateAccountStatus, refetchStatus]);

  // Filtrage local des comptes bancaires pour l'affichage
  const filteredBankAccounts = useMemo(() => {
    if (selectedAccountId === "all") return bankAccounts || [];
    return (bankAccounts || []).filter(
      (a) => a.id === selectedAccountId || a.externalId === selectedAccountId,
    );
  }, [bankAccounts, selectedAccountId]);

  const selectedAccountLabel = useMemo(() => {
    if (selectedAccountId === "all") return "Tous les comptes";
    const account = (bankAccounts || []).find(
      (a) => a.id === selectedAccountId || a.externalId === selectedAccountId,
    );
    if (!account) return "Tous les comptes";
    const name =
      account.name || account.institutionName || account.bankName || "Compte";
    const lastIban = account.iban ? ` ···${account.iban.slice(-4)}` : "";
    return `${name}${lastIban}`;
  }, [selectedAccountId, bankAccounts]);

  // Utiliser les configurations importées
  const { remap } = useChartColors();
  const incomeChartConfig = getIncomeChartConfig(remap);
  const expenseChartConfig = getExpenseChartConfig(remap);

  // Loading states par section
  const cardsLoading = accountsLoading || transactionsLoading;
  const chartsLoading = flowChartLoading;

  const balanceChartConfig = {
    visitors: {
      label: "Visitors",
    },
    desktop: {
      label: "Montant",
      color: remap("#3b82f6"),
    },
    mobile: {
      label: "Nombre de transactions",
      color: remap("#2563eb"),
    },
  };

  // Utiliser les vraies données financières

  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow,noarchive" />
      </Head>

      {/* Overlay de synchronisation bancaire */}
      <BankSyncOverlay isVisible={isBankSyncing} />

      {/* BankBalanceCard caché — sert uniquement pour le dialog de connexion */}
      <div className="hidden">
        <BankBalanceCard ref={bankBalanceRef} />
      </div>

      <div className="flex flex-col gap-4 py-8 sm:p-6 md:gap-6 md:py-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full mb-2 gap-1 md:gap-0">
          <h1 className="text-2xl font-semibold">
            Bonjour {session?.user?.name},
          </h1>
          {process.env.NODE_ENV === "development" && cacheInfo?.lastUpdate && (
            <p className="text-xs text-gray-500 mt-1">
              Données mises à jour : {cacheInfo.lastUpdate.toLocaleTimeString()}
              {cacheInfo.isFromCache && " (cache)"}
            </p>
          )}
          {/* Filtre de compte bancaire ou bouton connecter */}
          {(bankAccounts || []).length > 0 ? (
            <Popover
              open={accountPopoverOpen}
              onOpenChange={setAccountPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 font-medium"
                >
                  <Landmark className="size-3.5" />
                  <span className="truncate max-w-[150px]">
                    {selectedAccountLabel}
                  </span>
                  <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 rounded-xl border shadow-md p-1"
                align="end"
                sideOffset={8}
              >
                <Command>
                  <CommandList>
                    <CommandEmpty>Aucun compte trouvé.</CommandEmpty>
                    <CommandGroup className="space-y-0.5">
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setSelectedAccountId("all");
                          setAccountPopoverOpen(false);
                        }}
                        className={cn(
                          "gap-2 p-2 rounded-lg cursor-pointer",
                          selectedAccountId === "all" && "bg-accent",
                        )}
                      >
                        <Landmark className="size-4 text-muted-foreground flex-shrink-0" />
                        <span className="flex-1 text-[13px] font-normal truncate">
                          Tous les comptes
                        </span>
                      </CommandItem>
                      {(bankAccounts || []).map((account) => {
                        const accountName =
                          account.name ||
                          account.institutionName ||
                          account.bankName ||
                          "Compte";
                        const lastIban = account.iban
                          ? ` ···${account.iban.slice(-4)}`
                          : "";
                        const isSelected =
                          selectedAccountId === account.id ||
                          selectedAccountId === account.externalId;
                        return (
                          <CommandItem
                            key={account.id}
                            value={account.id}
                            onSelect={() => {
                              setSelectedAccountId(account.id);
                              setAccountPopoverOpen(false);
                            }}
                            className={cn(
                              "gap-2 p-2 rounded-lg cursor-pointer",
                              isSelected && "bg-accent",
                            )}
                          >
                            {account.institutionLogo ? (
                              <Avatar className="h-7 w-7 ring-1 ring-border bg-white flex-shrink-0">
                                <AvatarImage
                                  src={account.institutionLogo}
                                  alt={accountName}
                                  className="object-contain p-0.5"
                                />
                                <AvatarFallback className="text-xs bg-white">
                                  <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="h-7 w-7 rounded-full border border-border flex items-center justify-center flex-shrink-0">
                                <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="truncate text-[13px] font-normal">
                                {accountName}
                                {lastIban}
                              </span>
                              {account.balance?.current != null && (
                                <span className="text-[10px] text-muted-foreground">
                                  {formatCurrency(account.balance.current)}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 font-medium"
              disabled={isReadOnly}
              title={readOnlyTooltip}
              onClick={() => bankBalanceRef.current?.openConnectModal()}
            >
              <Landmark className="size-3.5" />
              Connecter un compte bancaire
            </Button>
          )}
        </div>

        {/* Actions rapides */}
        <div className="flex items-center gap-2 flex-wrap -mt-2">
          <Button
            variant="primary"
            className="cursor-pointer"
            size="sm"
            disabled={isReadOnly}
            title={readOnlyTooltip}
            onClick={() =>
              !isReadOnly && router.push("/dashboard/outils/devis/new")
            }
          >
            <ClipboardTickIcon className="w-4 h-4" />
            Créer un devis
          </Button>
          <Button
            variant="primary"
            className="cursor-pointer"
            size="sm"
            disabled={isReadOnly}
            title={readOnlyTooltip}
            onClick={() =>
              !isReadOnly && router.push("/dashboard/outils/factures/new")
            }
          >
            <DocumentText2Icon className="w-4 h-4" />
            Créer une facture
          </Button>
          <Button
            variant="filter"
            className="cursor-pointer"
            size="sm"
            disabled={isReadOnly}
            title={readOnlyTooltip}
            onClick={() =>
              !isReadOnly &&
              router.push("/dashboard/outils/factures-achat?action=create")
            }
          >
            <ClipboardImportIcon className="w-4 h-4" />
            Ajouter une facture d&apos;achat
          </Button>
          <Button
            variant="filter"
            className="cursor-pointer"
            size="sm"
            disabled={isReadOnly}
            title={readOnlyTooltip}
            onClick={() =>
              !isReadOnly &&
              router.push("/dashboard/outils/transferts-fichiers?new=1")
            }
          >
            <SendIcon className="w-4 h-4" />
            Transférer un fichier
          </Button>
        </div>

        {/* Barre de recherche et actions rapides temporairement désactivées */}
        {/* <div className="flex flex-col gap-3 w-full">
          <Comp333
            className="w-full h-11 flex items-center text-sm md:text-sm placeholder:text-sm md:placeholder:text-sm"
            placeholder="Rechercher des transactions ou lancer une action"
          />
          <div className="overflow-x-auto lg:overflow-x-visible w-full scrollbar-hide">
            <div className="flex gap-2 lg:gap-3 lg:flex-wrap w-max lg:w-full">
              <Button
                className="cursor-pointer normal whitespace-nowrap lg:flex-1 lg:min-w-0"
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href="/dashboard/outils/transactions"
                  className="flex items-center gap-1 lg:gap-2 justify-center"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span className="text-xs lg:text-xs">
                    Créer une transaction
                  </span>
                </a>
              </Button>
              <Button
                className="cursor-pointer normal whitespace-nowrap lg:flex-1 lg:min-w-0"
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href="/dashboard/outils/factures/new"
                  className="flex items-center gap-1 lg:gap-2 justify-center"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span className="text-xs lg:text-xs">Créer une facture</span>
                </a>
              </Button>
              <Button
                className="cursor-pointer normal whitespace-nowrap lg:flex-1 lg:min-w-0"
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href="/dashboard/outils/transactions"
                  className="flex items-center gap-1 lg:gap-2 justify-center"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-xs lg:text-xs">Importer des reçus</span>
                </a>
              </Button>
              <Button
                className="cursor-pointer normal whitespace-nowrap lg:flex-1 lg:min-w-0"
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href="/dashboard/outils/devis/new"
                  className="flex items-center gap-1 lg:gap-2 justify-center"
                >
                  <FileClock className="w-4 h-4" />
                  <span className="text-xs lg:text-xs">Créer un devis</span>
                </a>
              </Button>
              <Button
                className="cursor-pointer normal whitespace-nowrap lg:flex-1 lg:min-w-0"
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href="/dashboard/outils/transferts-fichiers/new"
                  className="flex items-center gap-1 lg:gap-2 justify-center"
                >
                  <Send className="w-4 h-4" />
                  <span className="text-xs lg:text-xs">
                    Transférer un fichier
                  </span>
                </a>
              </Button>
            </div>
          </div>
        </div> */}
        {/* Deux cards KPI */}
        <div className="flex items-center justify-between mt-6">
          <h2 className="text-sm font-medium text-foreground">
            En un coup d&apos;oeil —{" "}
            {new Date().toLocaleDateString("fr-FR", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs font-medium"
            style={{ color: "#5A50FF" }}
            asChild
          >
            <a href="/dashboard/outils/analytiques/vue-densemble">
              <ChartBarIcon
                className="w-3.5 h-3.5"
                style={{ color: "#5A50FF" }}
              />
              Vue d&apos;ensemble
            </a>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full -mt-2">
          {accountsLoading ? (
            <>
              <Card className="shadow-xs">
                <CardHeader>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-36" />
                  <div className="flex gap-4 mt-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </CardHeader>
              </Card>
              <Card className="shadow-xs">
                <CardHeader>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <div>
                      <Skeleton className="h-3 w-16 mb-2" />
                      <Skeleton className="h-7 w-24" />
                      <Skeleton className="h-3 w-20 mt-2" />
                    </div>
                    <div>
                      <Skeleton className="h-3 w-16 mb-2" />
                      <Skeleton className="h-7 w-24" />
                      <Skeleton className="h-3 w-20 mt-2" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </>
          ) : (
            <>
              <Card className="shadow-xs">
                {(filteredBankAccounts || []).length === 0 ? (
                  <CardContent className="p-0">
                    <TableEmptyState
                      icon={BankIcon}
                      title="Aucun compte bancaire"
                      description="Connectez votre compte bancaire pour suivre votre solde et vos transactions en temps réel."
                      size="compact"
                      action={
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() =>
                              bankBalanceRef.current?.openConnectModal()
                            }
                            disabled={isReadOnly}
                            title={readOnlyTooltip}
                            className="bg-[#5b50fe] hover:bg-[#4a3fe8] cursor-pointer"
                          >
                            <BankIcon className="h-4 w-4 mr-2" />
                            Connecter un compte
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              window.open("https://docs.newbi.fr", "_blank")
                            }
                            className="cursor-pointer"
                          >
                            Documentation
                          </Button>
                        </div>
                      }
                    />
                  </CardContent>
                ) : (
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-normal">
                        {(bankAccounts || []).length > 1
                          ? "Solde des comptes"
                          : "Solde du compte"}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          bankBalanceRef.current?.openConnectModal()
                        }
                      >
                        <AddCircleIcon className="w-4 h-4 text-muted-foreground/60" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-medium">
                        {formatCurrency(bankBalance)}
                      </span>
                      <div className="flex items-center -space-x-2">
                        {(filteredBankAccounts || [])
                          .slice(0, 3)
                          .map((account) => (
                            <Avatar
                              key={account.id}
                              className="size-7 ring-2 ring-background bg-muted"
                            >
                              {account.institutionLogo ? (
                                <AvatarImage
                                  src={account.institutionLogo}
                                  alt={
                                    account.institutionName ||
                                    account.bankName ||
                                    account.name
                                  }
                                  className="object-contain p-0.5"
                                />
                              ) : null}
                              <AvatarFallback className="text-[10px] bg-muted">
                                {(
                                  account.institutionName ||
                                  account.bankName ||
                                  account.name ||
                                  "B"
                                )
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        {(filteredBankAccounts || []).length > 3 && (
                          <div className="size-7 ring-2 ring-background rounded-full flex items-center justify-center text-[10px] font-medium text-foreground bg-muted">
                            +{(filteredBankAccounts || []).length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5">
                        <TrendUpIcon className="size-4 text-emerald-500" />
                        <span className="text-xs text-muted-foreground">
                          Encaissement
                        </span>
                        <span className="text-xs font-medium">
                          {formatCurrency(totalIncome)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendDownIcon className="size-4 text-red-500" />
                        <span className="text-xs text-muted-foreground">
                          Décaissement
                        </span>
                        <span className="text-xs font-medium">
                          {formatCurrency(totalExpenses)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                )}
              </Card>
              <Card className="shadow-xs">
                {(filteredBankAccounts || []).length === 0 ? (
                  <CardContent className="p-0">
                    <TableEmptyState
                      icon={DocumentText2Icon}
                      title="Aucune donnée de facturation"
                      description="Connectez un compte bancaire pour voir vos données de facturation."
                      size="compact"
                      action={
                        <Button
                          asChild
                          className="bg-[#5b50fe] hover:bg-[#4a3fe8] cursor-pointer"
                        >
                          <a href="/dashboard/outils/factures/new">
                            <DocumentText2Icon className="h-4 w-4 mr-2" />
                            Créer une facture
                          </a>
                        </Button>
                      }
                    />
                  </CardContent>
                ) : (
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-normal">
                        Facturation
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 text-xs text-muted-foreground font-normal"
                        asChild
                      >
                        <a href="/dashboard/outils/factures">
                          <DocumentText2Icon className="w-3.5 h-3.5" />
                          Voir les factures
                        </a>
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 divide-x mt-1">
                      <div className="pr-4">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                          Ventes (TTC)
                        </p>
                        <p className="text-2xl font-medium mt-1">
                          {formatCurrency(invoiceBalances.totalBilled)}
                        </p>
                        <a
                          href="/dashboard/outils/factures?status=PENDING"
                          className="flex items-center gap-1.5 mt-2 group cursor-pointer"
                        >
                          <span className="text-xs text-muted-foreground group-hover:text-amber-600 transition-colors">
                            En cours
                          </span>
                          <span className="text-xs font-medium text-amber-600 group-hover:underline">
                            {formatCurrency(
                              invoiceBalances.totalBilled -
                                invoiceBalances.totalPaid,
                            )}
                          </span>
                        </a>
                      </div>
                      <div className="pl-4">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                          Achats (TTC)
                        </p>
                        <p className="text-2xl font-medium mt-1">
                          {formatCurrency(purchaseStats.totalThisMonth)}
                        </p>
                        <a
                          href="/dashboard/outils/factures-achat"
                          className="flex items-center gap-1.5 mt-2 group cursor-pointer"
                        >
                          <span className="text-xs text-muted-foreground group-hover:text-red-500 transition-colors">
                            À payer
                          </span>
                          <span className="text-xs font-medium text-red-500 group-hover:underline">
                            {formatCurrency(purchaseStats.totalToPay)}
                          </span>
                        </a>
                      </div>
                    </div>
                  </CardHeader>
                )}
              </Card>
            </>
          )}
        </div>

        {/* Section : À traiter */}
        <h2 className="text-sm font-medium text-foreground mt-4">À traiter</h2>
        {invoicesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full -mt-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="shadow-xs">
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardHeader>
                <CardContent className="space-y-2.5 pt-0">
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full -mt-2">
            {/* Card Comptabilité */}
            <Card className="shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-normal">
                    Comptabilité
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-[#5b50FF] hover:text-[#5b50FF] font-normal"
                    asChild
                  >
                    <a href="/dashboard/outils/transactions">
                      Voir les transactions
                    </a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <a
                  href="/dashboard/outils/transactions?filter=unmatched"
                  className="flex items-center justify-between group cursor-pointer py-1.5 px-2 -mx-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <CardCoinIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                      Rapprochements à faire
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-5 px-1.5 font-medium rounded-md"
                  >
                    {actionCounts.unmatchedCount}
                  </Badge>
                </a>
                <a
                  href="/dashboard/outils/transactions?filter=uncategorized"
                  className="flex items-center justify-between group cursor-pointer py-1.5 px-2 -mx-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ReceiptItemIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                      Transactions à catégoriser
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-5 px-1.5 font-medium rounded-md"
                  >
                    0
                  </Badge>
                </a>
                <a
                  href="/dashboard/outils/transactions?filter=missing_receipts"
                  className="flex items-center justify-between group cursor-pointer py-1.5 px-2 -mx-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ReceiptSearchIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                      Justificatifs manquants
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-5 px-1.5 font-medium rounded-md"
                  >
                    0
                  </Badge>
                </a>
              </CardContent>
            </Card>

            {/* Card Facturation */}
            <Card className="shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-normal">
                    Facturation
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-[#5b50FF] hover:text-[#5b50FF] font-normal"
                    asChild
                  >
                    <a href="/dashboard/outils/factures/new">
                      Créer une facture
                    </a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <a
                  href="/dashboard/outils/factures?status=PENDING"
                  className="flex items-center justify-between group cursor-pointer py-1.5 px-2 -mx-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <TrendDownIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                      Factures en retard
                    </span>
                  </div>
                  {actionCounts.overdueCount > 0 ? (
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 px-1.5 font-medium rounded-md !bg-red-500/15 !text-red-600 dark:!text-red-400"
                    >
                      {actionCounts.overdueCount}
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 px-1.5 font-medium rounded-md"
                    >
                      0
                    </Badge>
                  )}
                </a>
                <a
                  href="/dashboard/outils/factures"
                  className="flex items-center justify-between group cursor-pointer py-1.5 px-2 -mx-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <SendIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                      Factures à envoyer
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-5 px-1.5 font-medium rounded-md"
                  >
                    {actionCounts.unsentCount}
                  </Badge>
                </a>
                <a
                  href="/dashboard/outils/devis"
                  className="flex items-center justify-between group cursor-pointer py-1.5 px-2 -mx-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ClipboardTickIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                      Devis en attente
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-5 px-1.5 font-medium rounded-md"
                  >
                    {actionCounts.pendingQuotesCount}
                  </Badge>
                </a>
              </CardContent>
            </Card>

            {/* Card Tâches & Activité */}
            <Card className="shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-normal">
                    Tâches & Activité
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-[#5b50FF] hover:text-[#5b50FF] font-normal"
                    asChild
                  >
                    <a href="/dashboard/outils/kanban">Voir les tâches</a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    window.dispatchEvent(
                      new CustomEvent("openSettingsModal", {
                        detail: { section: "notifications" },
                      }),
                    );
                  }}
                  className="flex items-center justify-between group cursor-pointer py-1.5 px-2 -mx-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <NotificationIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                      Notifications non lues
                    </span>
                  </div>
                  {actionCounts.notifCount > 0 ? (
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 px-1.5 font-medium rounded-md !bg-red-500/15 !text-red-600 dark:!text-red-400"
                    >
                      {actionCounts.notifCount}
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 px-1.5 font-medium rounded-md"
                    >
                      0
                    </Badge>
                  )}
                </a>
                <a
                  href="/dashboard/outils/factures-achat"
                  className="flex items-center justify-between group cursor-pointer py-1.5 px-2 -mx-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ClipboardImportIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                      Achats à payer
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-5 px-1.5 font-medium rounded-md"
                  >
                    {purchaseStats.totalToPayCount}
                  </Badge>
                </a>
                <a
                  href="/dashboard/outils/transferts-fichiers"
                  className="flex items-center justify-between group cursor-pointer py-1.5 px-2 -mx-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <SendIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                      Transferts en cours
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-5 px-1.5 font-medium rounded-md"
                  >
                    0
                  </Badge>
                </a>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Section : Suivi en temps réel */}
        <h2 className="text-sm font-medium text-foreground mt-4">
          Suivi en temps réel
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full -mt-2">
          <RecentTransactionsCard
            className="shadow-xs w-full"
            workspaceId={workspaceId}
            accountId={selectedAccountId}
            limit={5}
            isLoading={transactionsLoading}
          />
          <Card className="shadow-xs flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-normal">
                Factures de vente (HT)
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#5b50FF] hover:text-[#5b50FF]"
                asChild
              >
                <a href="/dashboard/outils/factures">
                  Voir tout
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              {invoicesLoading ? (
                <div className="space-y-4 flex-1 animate-pulse">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-accent rounded-full" />
                        <div className="flex flex-col gap-1">
                          <div className="h-4 w-28 bg-accent rounded" />
                          <div className="h-3 w-14 bg-accent rounded" />
                        </div>
                      </div>
                      <div className="h-4 w-16 bg-accent rounded" />
                    </div>
                  ))}
                </div>
              ) : invoices.length === 0 ? (
                <TableEmptyState
                  icon={DocumentText2Icon}
                  title="Aucune facture de vente"
                  description="Vos factures de vente apparaîtront ici une fois créées."
                  size="compact"
                  className="flex-1"
                />
              ) : (
                <div className="space-y-4 flex-1">
                  {invoices
                    .filter((inv) => inv.status !== "DRAFT")
                    .slice(0, 5)
                    .map((inv, index) => {
                      const isPaid = inv.status === "COMPLETED";
                      const clientName = inv.client?.name || "Client";
                      const initials =
                        clientName.trim().split(/\s+/).length >= 2
                          ? (
                              clientName.trim().split(/\s+/)[0][0] +
                              clientName.trim().split(/\s+/)[1][0]
                            ).toUpperCase()
                          : clientName.slice(0, 2).toUpperCase();

                      return (
                        <div
                          key={inv.id || `inv-${index}`}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 bg-muted">
                              <span className="text-xs font-medium text-muted-foreground">
                                {initials}
                              </span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-normal truncate max-w-[180px]">
                                {clientName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {inv.prefix}
                                {inv.number}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`text-sm font-medium ${isPaid ? "text-emerald-600" : ""}`}
                          >
                            {formatCurrency(
                              inv.finalTotalHT || inv.totalHT || 0,
                            )}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sections commentées */}
        {/*
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4 md:gap-6 w-full">
          <div className="flex flex-col gap-4 md:gap-6">
            <BankBalanceCard
              ref={bankBalanceRef}
              className="shadow-xs w-full"
              expenses={paidExpenses}
              invoices={paidInvoices}
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              bankAccounts={filteredBankAccounts}
              bankBalance={bankBalance}
              isLoading={cardsLoading}
            />
            <IncomeCategoryChart
              workspaceId={workspaceId}
              accountId={selectedAccountId}
              className="shadow-xs w-full !pb-2 [&_[data-slot=card-content]]:!pb-0"
            />
          </div>
          <RecentTransactionsCard
            className="shadow-xs w-full h-full"
            workspaceId={workspaceId}
            accountId={selectedAccountId}
            limit={13}
            isLoading={transactionsLoading}
          />
        </div>
        <div className="w-full">
          <TreasuryChart
            workspaceId={workspaceId}
            accountId={selectedAccountId}
            className="shadow-xs w-full"
            isLoading={cardsLoading}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
          <ChartAreaInteractive
            title="Entrées"
            computeDescription={(filtered) =>
              formatCurrency(
                filtered.reduce((sum, d) => sum + (d.desktop || 0), 0),
              )
            }
            height="200px"
            className="shadow-xs w-full md:w-1/2"
            config={incomeChartConfig}
            data={incomeChartData}
            hideMobileCurve={true}
            isLoading={chartsLoading}
          />
          <ChartAreaInteractive
            title="Sorties"
            computeDescription={(filtered) =>
              formatCurrency(
                filtered.reduce((sum, d) => sum + (d.desktop || 0), 0),
              )
            }
            height="200px"
            className="shadow-xs w-full md:w-1/2"
            config={expenseChartConfig}
            data={expenseChartData}
            hideMobileCurve={true}
            isLoading={chartsLoading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 w-full">
          <InvoicesToCollectCard
            className="shadow-xs"
            invoices={invoices}
            isLoading={invoicesLoading}
          />
          <PurchaseInvoicesStatsCard className="shadow-xs" />
          <PendingQuotesCard className="shadow-xs" />
          <MonthlyRevenueCard
            className="shadow-xs"
            paidInvoices={paidInvoices}
            isLoading={invoicesLoading}
          />
          <OverdueInvoicesCard
            className="shadow-xs"
            invoices={invoices}
            isLoading={invoicesLoading}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
          <TopClientsCard
            className="shadow-xs w-full md:w-1/3"
            paidInvoices={paidInvoices}
            isLoading={invoicesLoading}
          />
          <WeekCalendarCard className="shadow-xs w-full md:w-2/3" />
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
          <IncomeCategoryChart
            workspaceId={workspaceId}
            accountId={selectedAccountId}
            className="shadow-xs w-full md:w-1/2"
          />
          <ExpenseCategoryChart
            workspaceId={workspaceId}
            accountId={selectedAccountId}
            className="shadow-xs w-full md:w-1/2"
          />
        </div>
        */}
      </div>
    </>
  );
}

function DashboardWithSearchParams() {
  const searchParams = useSearchParams();
  const [showProAnimation, setShowProAnimation] = useState(false);

  // Détecter le succès de paiement Stripe et afficher l'animation Pro
  useEffect(() => {
    const paymentSuccess = searchParams.get("payment_success") === "true";
    const subscriptionSuccess =
      searchParams.get("subscription_success") === "true";

    if (paymentSuccess || subscriptionSuccess) {
      setShowProAnimation(true);
      // Nettoyer l'URL des paramètres
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [searchParams]);

  const handleProAnimationComplete = () => {
    setShowProAnimation(false);
  };

  return (
    <>
      <DashboardContent />
      <ProSubscriptionOverlay
        isVisible={showProAnimation}
        onComplete={handleProAnimationComplete}
      />
    </>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardWithSearchParams />
    </Suspense>
  );
}
