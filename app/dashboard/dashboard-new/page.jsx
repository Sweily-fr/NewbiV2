"use client";

import Head from "next/head";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/src/components/ui/avatar";
import { ChartAreaInteractive } from "@/src/components/chart-area-interactive";
import { Button } from "@/src/components/ui/button";
import {
  Landmark,
  ChevronsUpDown,
  Settings2,
  Eye,
  EyeOff,
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
import { useUser } from "@/src/lib/auth/hooks";
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
import { useState, useEffect, useMemo, useRef, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ProSubscriptionOverlay } from "@/src/components/pro-subscription-overlay";
import { BankSyncOverlay } from "@/src/components/bank-sync-overlay";
import {
  getIncomeChartConfig,
  getExpenseChartConfig,
} from "@/src/utils/chartDataProcessors";
import { useStripeConnect } from "@/src/hooks/useStripeConnect";
import { InvoicesToCollectCard } from "@/app/dashboard/components/invoices-to-collect-card";
import { InvoicesToPayCard } from "@/app/dashboard/components/invoices-to-pay-card";

// ─── Configuration des widgets ────────────────────────────────────────────────
const WIDGET_DEFINITIONS = [
  { id: "bank-balance", label: "Solde bancaire", defaultVisible: true },
  { id: "recent-transactions", label: "Transactions récentes", defaultVisible: true },
  { id: "treasury-chart", label: "Trésorerie", defaultVisible: true },
  { id: "income-chart", label: "Entrées", defaultVisible: true },
  { id: "expense-chart", label: "Sorties", defaultVisible: true },
  { id: "invoices-to-collect", label: "Factures à encaisser", defaultVisible: true },
  { id: "invoices-to-pay", label: "Factures à payer", defaultVisible: true },
  { id: "income-category", label: "Répartition revenus", defaultVisible: true },
  { id: "expense-category", label: "Répartition dépenses", defaultVisible: true },
];

const STORAGE_KEY = "dashboard-new-widgets";

function getInitialVisibility() {
  if (typeof window === "undefined") {
    return Object.fromEntries(
      WIDGET_DEFINITIONS.map((w) => [w.id, w.defaultVisible])
    );
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return Object.fromEntries(
    WIDGET_DEFINITIONS.map((w) => [w.id, w.defaultVisible])
  );
}

// ─── Widget wrapper ───────────────────────────────────────────────────────────
function Widget({ id, visible, children }) {
  if (!visible) return null;
  return children;
}

// ─── Panneau de configuration des widgets ─────────────────────────────────────
function WidgetConfigurator({ visibility, onToggle, onReset }) {
  return (
    <div className="w-72 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Widgets</span>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onReset}>
          Réinitialiser
        </Button>
      </div>
      <div className="space-y-1">
        {WIDGET_DEFINITIONS.map((widget) => (
          <button
            key={widget.id}
            onClick={() => onToggle(widget.id)}
            className={cn(
              "flex items-center gap-3 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
              !visibility[widget.id] && "opacity-50"
            )}
          >
            {visibility[widget.id] ? (
              <Eye className="size-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <EyeOff className="size-4 text-muted-foreground flex-shrink-0" />
            )}
            <span className="flex-1">{widget.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Contenu principal ────────────────────────────────────────────────────────
function DashboardNewContent() {
  const { session } = useUser();
  const { checkAndUpdateAccountStatus, refetchStatus } = useStripeConnect(
    session?.user?.id
  );

  const { workspaceId } = useWorkspace();

  const [selectedAccountId, setSelectedAccountId] = useState("all");

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
    }
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
  const [isBankSyncing, setIsBankSyncing] = useState(false);
  const bankBalanceRef = useRef(null);
  const hasHandledBridgeReturn = useRef(false);
  const hasHandledStripeReturn = useRef(false);

  // ─── Widget visibility state ──────────────────────────────────────────────
  const [widgetVisibility, setWidgetVisibility] = useState(getInitialVisibility);
  const [configOpen, setConfigOpen] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgetVisibility));
    } catch {}
  }, [widgetVisibility]);

  const toggleWidget = useCallback((widgetId) => {
    setWidgetVisibility((prev) => ({
      ...prev,
      [widgetId]: !prev[widgetId],
    }));
  }, []);

  const resetWidgets = useCallback(() => {
    const defaults = Object.fromEntries(
      WIDGET_DEFINITIONS.map((w) => [w.id, w.defaultVisible])
    );
    setWidgetVisibility(defaults);
  }, []);

  // ─── Bridge return handler ────────────────────────────────────────────────
  useEffect(() => {
    if (hasHandledBridgeReturn.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const isFromBridge = urlParams.has("item_id") || urlParams.has("status");

    if (isFromBridge && workspaceId) {
      hasHandledBridgeReturn.current = true;
      setIsBankSyncing(true);

      const syncBankAccounts = async () => {
        try {
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
            refreshData();
          } else {
            console.error("❌ Erreur sync bancaire:", await response.text());
          }

          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, "", cleanUrl);
        } catch (error) {
          console.error("❌ Erreur lors de la sync bancaire:", error);
        } finally {
          setIsBankSyncing(false);
        }
      };

      const timer = setTimeout(syncBankAccounts, 1500);
      return () => clearTimeout(timer);
    }
  }, [workspaceId, refreshData]);

  // ─── Stripe Connect return handler ────────────────────────────────────────
  useEffect(() => {
    if (hasHandledStripeReturn.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const isFromStripe = urlParams.get("stripe_success") === "true";
    const shouldOpenSettings = urlParams.get("open_settings") === "securite";

    if (isFromStripe && session?.user?.id) {
      hasHandledStripeReturn.current = true;
      const timer = setTimeout(async () => {
        try {
          await checkAndUpdateAccountStatus();
          await refetchStatus();

          if (shouldOpenSettings) {
            window.dispatchEvent(
              new CustomEvent("openSettingsModal", {
                detail: { section: "securite" },
              })
            );
          }

          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, "", cleanUrl);
        } catch (error) {
          console.error(
            "❌ Erreur lors de la vérification automatique:",
            error
          );
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [session?.user?.id, checkAndUpdateAccountStatus, refetchStatus]);

  // ─── Derived state ────────────────────────────────────────────────────────
  const filteredBankAccounts = useMemo(() => {
    if (selectedAccountId === "all") return bankAccounts || [];
    return (bankAccounts || []).filter(
      (a) => a.id === selectedAccountId || a.externalId === selectedAccountId
    );
  }, [bankAccounts, selectedAccountId]);

  const selectedAccountLabel = useMemo(() => {
    if (selectedAccountId === "all") return "Tous les comptes";
    const account = (bankAccounts || []).find(
      (a) => a.id === selectedAccountId || a.externalId === selectedAccountId
    );
    if (!account) return "Tous les comptes";
    const name =
      account.name || account.institutionName || account.bankName || "Compte";
    const lastIban = account.iban ? ` ···${account.iban.slice(-4)}` : "";
    return `${name}${lastIban}`;
  }, [selectedAccountId, bankAccounts]);

  const incomeChartConfig = getIncomeChartConfig();
  const expenseChartConfig = getExpenseChartConfig();

  const cardsLoading = accountsLoading || transactionsLoading;
  const chartsLoading = flowChartLoading;

  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow,noarchive" />
      </Head>

      <BankSyncOverlay isVisible={isBankSyncing} />

      <div className="flex flex-col gap-4 py-8 sm:p-6 md:gap-5 md:py-6 p-4 md:p-6">
        {/* ─── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-1 md:gap-0">
          <h1 className="text-2xl font-semibold">
            Bonjour {session?.user?.name},
          </h1>
          <div className="flex items-center gap-2">
            {process.env.NODE_ENV === "development" && cacheInfo?.lastUpdate && (
              <p className="text-xs text-gray-500">
                Données mises à jour :{" "}
                {cacheInfo.lastUpdate.toLocaleTimeString()}
                {cacheInfo.isFromCache && " (cache)"}
              </p>
            )}

            {/* Bouton de configuration des widgets */}
            <Popover open={configOpen} onOpenChange={setConfigOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings2 className="size-4" />
                  <span className="hidden sm:inline">Personnaliser</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xl" align="end" sideOffset={8}>
                <WidgetConfigurator
                  visibility={widgetVisibility}
                  onToggle={toggleWidget}
                  onReset={resetWidgets}
                />
              </PopoverContent>
            </Popover>

            {/* Filtre de compte bancaire */}
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
                            selectedAccountId === "all" && "bg-accent"
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
                                isSelected && "bg-accent"
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
        </div>

        {/* ─── Bento Grid ──────────────────────────────────────────── */}
        {/*
          Hiérarchie visuelle pensée par zones :

          ZONE 1 — Vue d'ensemble (le plus important d'abord)
          ┌───────────────────┬──────────┬──────────┐
          │  Solde bancaire    │ Factures │ Transac. │
          │  (2 col)           │ encaiss. │ récentes │
          │                    │ (1 col)  │ (1 col)  │
          └───────────────────┴──────────┴──────────┘

          ZONE 2 — Tendances (lire l'évolution)
          ┌────────────────────────────────────────┐
          │  Trésorerie (pleine largeur)           │
          │  = Série temporelle lisible             │
          ├────────────────────┬────────────────────┤
          │  Entrées (2 col)   │  Sorties (2 col)   │
          │  = Comparaison     │  = symétrique      │
          └────────────────────┴────────────────────┘

          ZONE 3 — Opérationnel + Analyse
          ┌──────────┬─────────────────────────────┐
          │ Factures │  Répartition revenus (3 col) │
          │ à payer  │  = Donut large + légende     │
          │ (1 col)  │                              │
          ├──────────┴─────────────────────────────┤
          │  Répartition dépenses (pleine largeur)  │
          │  = Donut extra-large                    │
          └─────────────────────────────────────────┘

          Mobile : 1 colonne, empilage naturel
        */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-5 auto-rows-auto">

          {/* ━━━ ZONE 1 — Vue d'ensemble ━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

          {/* Solde bancaire — 2 col, card héro */}
          <Widget id="bank-balance" visible={widgetVisibility["bank-balance"]}>
            <div className="md:col-span-2">
              <BankBalanceCard
                ref={bankBalanceRef}
                className="shadow-xs w-full h-full"
                expenses={paidExpenses}
                invoices={paidInvoices}
                totalIncome={totalIncome}
                totalExpenses={totalExpenses}
                bankAccounts={filteredBankAccounts}
                bankBalance={bankBalance}
                isLoading={cardsLoading}
              />
            </div>
          </Widget>

          {/* Factures à encaisser — 2 col */}
          <Widget
            id="invoices-to-collect"
            visible={widgetVisibility["invoices-to-collect"]}
          >
            <div className="md:col-span-2">
              <InvoicesToCollectCard
                className="shadow-xs w-full h-full"
                invoices={invoices}
                isLoading={invoicesLoading}
              />
            </div>
          </Widget>

          {/* Transactions récentes — 2 col, 2 rows (s'étend sur la zone tendances) */}
          <Widget
            id="recent-transactions"
            visible={widgetVisibility["recent-transactions"]}
          >
            <div className="md:col-span-2 md:row-span-2">
              <RecentTransactionsCard
                className="shadow-xs w-full h-full"
                workspaceId={workspaceId}
                accountId={selectedAccountId}
                limit={8}
                isLoading={transactionsLoading}
              />
            </div>
          </Widget>

          {/* ━━━ ZONE 2 — Tendances ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

          {/* Trésorerie — 4 col (à côté des transactions qui débordent) */}
          <Widget id="treasury-chart" visible={widgetVisibility["treasury-chart"]}>
            <div className="md:col-span-4">
              <TreasuryChart
                workspaceId={workspaceId}
                accountId={selectedAccountId}
                className="shadow-xs w-full"
                isLoading={cardsLoading}
              />
            </div>
          </Widget>

          {/* Entrées — moitié gauche */}
          <Widget id="income-chart" visible={widgetVisibility["income-chart"]}>
            <div className="md:col-span-3">
              <ChartAreaInteractive
                title="Entrées"
                computeDescription={(filtered) =>
                  formatCurrency(
                    filtered.reduce((sum, d) => sum + (d.desktop || 0), 0)
                  )
                }
                height="200px"
                className="shadow-xs w-full h-full"
                config={incomeChartConfig}
                data={incomeChartData}
                hideMobileCurve={true}
                isLoading={chartsLoading}
              />
            </div>
          </Widget>

          {/* Sorties — moitié droite */}
          <Widget id="expense-chart" visible={widgetVisibility["expense-chart"]}>
            <div className="md:col-span-3">
              <ChartAreaInteractive
                title="Sorties"
                computeDescription={(filtered) =>
                  formatCurrency(
                    filtered.reduce((sum, d) => sum + (d.desktop || 0), 0)
                  )
                }
                height="200px"
                className="shadow-xs w-full h-full"
                config={expenseChartConfig}
                data={expenseChartData}
                hideMobileCurve={true}
                isLoading={chartsLoading}
              />
            </div>
          </Widget>

          {/* ━━━ ZONE 3 — Opérationnel + Analyse ━━━━━━━━━━━━━━━━━━ */}

          {/* Factures à payer — 2 col gauche */}
          <Widget
            id="invoices-to-pay"
            visible={widgetVisibility["invoices-to-pay"]}
          >
            <div className="md:col-span-2">
              <InvoicesToPayCard className="shadow-xs w-full h-full" />
            </div>
          </Widget>

          {/* Répartition revenus — 4 col droite */}
          <Widget
            id="income-category"
            visible={widgetVisibility["income-category"]}
          >
            <div className="md:col-span-4">
              <IncomeCategoryChart
                workspaceId={workspaceId}
                accountId={selectedAccountId}
                className="shadow-xs w-full h-full"
              />
            </div>
          </Widget>

          {/* Répartition dépenses — pleine largeur */}
          <Widget
            id="expense-category"
            visible={widgetVisibility["expense-category"]}
          >
            <div className="md:col-span-6">
              <ExpenseCategoryChart
                workspaceId={workspaceId}
                accountId={selectedAccountId}
                className="shadow-xs w-full h-full"
              />
            </div>
          </Widget>
        </div>
      </div>
    </>
  );
}

function DashboardNewWithSearchParams() {
  const searchParams = useSearchParams();
  const [showProAnimation, setShowProAnimation] = useState(false);

  useEffect(() => {
    const paymentSuccess = searchParams.get("payment_success") === "true";
    const subscriptionSuccess =
      searchParams.get("subscription_success") === "true";

    if (paymentSuccess || subscriptionSuccess) {
      setShowProAnimation(true);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [searchParams]);

  const handleProAnimationComplete = () => {
    setShowProAnimation(false);
  };

  return (
    <>
      <DashboardNewContent />
      <ProSubscriptionOverlay
        isVisible={showProAnimation}
        onComplete={handleProAnimationComplete}
      />
    </>
  );
}

export default function DashboardNew() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardNewWithSearchParams />
    </Suspense>
  );
}
