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
  Building2,
  ChevronsUpDown,
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
import { useDashboardData } from "@/src/hooks/useDashboardData";
import { useQuery } from "@apollo/client";
import { GET_TREASURY_CHART } from "@/src/graphql/queries/dashboardAggregation";
import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useInvoices } from "@/src/graphql/invoiceQueries";
import { ProSubscriptionOverlay } from "@/src/components/pro-subscription-overlay";
import { BankSyncOverlay } from "@/src/components/bank-sync-overlay";
import {
  getIncomeChartConfig,
  getExpenseChartConfig,
} from "@/src/utils/chartDataProcessors";
import { useChartColors } from "@/src/hooks/useChartColors";
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
  const { checkAndUpdateAccountStatus, refetchStatus } = useStripeConnect(
    session?.user?.id,
  );

  const { workspaceId } = useWorkspace();

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
            // Rafraîchir les données du dashboard
            refreshData();
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
          setIsBankSyncing(false);
        }
      };

      // Attendre un peu pour que Bridge finalise
      const timer = setTimeout(syncBankAccounts, 1500);
      return () => clearTimeout(timer);
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
              onClick={() => bankBalanceRef.current?.openConnectModal()}
            >
              <Landmark className="size-3.5" />
              Connecter un compte bancaire
            </Button>
          )}
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
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
          <BankBalanceCard
            ref={bankBalanceRef}
            className="shadow-xs w-full md:w-1/2"
            expenses={paidExpenses}
            invoices={paidInvoices}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            bankAccounts={filteredBankAccounts}
            bankBalance={bankBalance}
            isLoading={cardsLoading}
          />
          <RecentTransactionsCard
            className="shadow-xs w-full md:w-1/2"
            workspaceId={workspaceId}
            accountId={selectedAccountId}
            limit={5}
            isLoading={transactionsLoading}
          />
        </div>
        {/* Graphique de trésorerie - Pleine largeur (MODE BANCAIRE PUR) */}
        <div className="w-full">
          <TreasuryChart
            workspaceId={workspaceId}
            accountId={selectedAccountId}
            className="shadow-xs"
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

        {/* Stats principales - 5 cards sur une ligne */}
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

        {/* Top 3 clients + Calendrier de la semaine */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
          <TopClientsCard
            className="shadow-xs w-full md:w-1/3"
            paidInvoices={paidInvoices}
            isLoading={invoicesLoading}
          />
          <WeekCalendarCard className="shadow-xs w-full md:w-2/3" />
        </div>

        {/* Graphiques de répartition par catégorie (MODE BANCAIRE PUR) */}
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
