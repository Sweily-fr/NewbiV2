"use client";

import Head from "next/head";
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
  Check,
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
import BankingConnectButton from "@/src/components/banking/BankingConnectButton";
import BankBalanceCard from "@/src/components/banking/BankBalanceCard";
import RecentTransactionsCard from "@/src/components/banking/RecentTransactionsCard";
import { TreasuryChart } from "@/src/components/treasury-chart";
import { ExpenseCategoryChart } from "@/app/dashboard/outils/transactions/components/expense-category-chart";
import { IncomeCategoryChart } from "@/app/dashboard/components/income-category-chart";

import { DashboardSkeleton } from "@/src/components/dashboard-skeleton";
import { useDashboardData } from "@/src/hooks/useDashboardData";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useInvoices } from "@/src/graphql/invoiceQueries";
import { ProSubscriptionOverlay } from "@/src/components/pro-subscription-overlay";
import { BankSyncOverlay } from "@/src/components/bank-sync-overlay";
import {
  processIncomeForCharts,
  processExpensesWithBankForCharts,
  getIncomeChartConfig,
  getExpenseChartConfig,
} from "@/src/utils/chartDataProcessors";
import { useStripeConnect } from "@/src/hooks/useStripeConnect";

function DashboardContent() {
  const { session } = useUser();
  const { checkAndUpdateAccountStatus, refetchStatus } = useStripeConnect(
    session?.user?.id
  );

  // Utilisation du hook de cache intelligent pour les données du dashboard
  const {
    expenses,
    invoices,
    paidInvoices,
    paidExpenses,
    totalIncome,
    totalExpenses,
    transactions,
    bankAccounts,
    bankBalance,
    isLoading,
    isInitialized,
    formatCurrency,
    refreshData,
    cacheInfo,
  } = useDashboardData();

  const { workspaceId } = useWorkspace();

  // État pour le filtre de compte bancaire
  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [accountPopoverOpen, setAccountPopoverOpen] = useState(false);

  // État pour l'overlay de synchronisation bancaire
  const [isBankSyncing, setIsBankSyncing] = useState(false);

  // Gérer le retour de Bridge Connect (sync automatique des comptes bancaires)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isFromBridge = urlParams.has("item_id") || urlParams.has("status");

    if (isFromBridge && workspaceId) {
      console.log(
        "🏦 Retour de Bridge détecté, synchronisation des comptes..."
      );

      // Afficher l'overlay de chargement immédiatement
      setIsBankSyncing(true);

      const syncBankAccounts = async () => {
        try {
          // Récupérer le JWT depuis localStorage (même pattern qu'Apollo Client)
          const token = localStorage.getItem("bearer_token");

          // Lancer la sync complète (comptes + transactions) via le proxy Next.js
          const response = await fetch("/api/banking-sync/full", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-workspace-id": workspaceId,
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ limit: 100 }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log("✅ Sync bancaire terminée:", data);
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
    const urlParams = new URLSearchParams(window.location.search);
    const isFromStripe = urlParams.get("stripe_success") === "true";
    const shouldOpenSettings = urlParams.get("open_settings") === "securite";

    if (isFromStripe && session?.user?.id) {
      console.log(
        "🔄 Retour de Stripe détecté sur dashboard, vérification du statut..."
      );

      const timer = setTimeout(async () => {
        try {
          // Vérifier et mettre à jour le statut du compte Stripe Connect
          await checkAndUpdateAccountStatus();
          await refetchStatus();

          console.log("✅ Statut Stripe Connect mis à jour");

          // Ouvrir le modal settings sur la section sécurité
          if (shouldOpenSettings) {
            // Déclencher l'ouverture du modal settings
            console.log(
              "🔧 Ouverture du modal settings sur la section sécurité"
            );

            // Dispatch d'un event pour ouvrir le modal settings
            window.dispatchEvent(
              new CustomEvent("openSettingsModal", {
                detail: { section: "securite" },
              })
            );
          }

          // Nettoyer l'URL
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

  // Filtrage des données par compte bancaire sélectionné
  const filteredTransactions = useMemo(() => {
    if (selectedAccountId === "all") return transactions || [];
    const account = (bankAccounts || []).find(
      (a) => a.id === selectedAccountId || a.externalId === selectedAccountId
    );
    if (!account) return transactions || [];
    return (transactions || []).filter(
      (tx) =>
        tx.fromAccount === account.externalId ||
        tx.fromAccount === account.id
    );
  }, [transactions, selectedAccountId, bankAccounts]);

  const filteredBankAccounts = useMemo(() => {
    if (selectedAccountId === "all") return bankAccounts || [];
    return (bankAccounts || []).filter(
      (a) => a.id === selectedAccountId || a.externalId === selectedAccountId
    );
  }, [bankAccounts, selectedAccountId]);

  const filteredBalance = useMemo(() => {
    if (selectedAccountId === "all") return bankBalance;
    const account = (bankAccounts || []).find(
      (a) => a.id === selectedAccountId || a.externalId === selectedAccountId
    );
    return account?.balance?.current ?? 0;
  }, [selectedAccountId, bankAccounts, bankBalance]);

  const filteredTotalIncome = useMemo(() => {
    if (selectedAccountId === "all") return totalIncome;
    return filteredTransactions
      .filter((tx) => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [selectedAccountId, totalIncome, filteredTransactions]);

  const filteredTotalExpenses = useMemo(() => {
    if (selectedAccountId === "all") return totalExpenses;
    return Math.abs(
      filteredTransactions
        .filter((tx) => tx.amount < 0)
        .reduce((sum, tx) => sum + tx.amount, 0)
    );
  }, [selectedAccountId, totalExpenses, filteredTransactions]);

  const filteredPaidExpenses = useMemo(() => {
    if (selectedAccountId === "all") return paidExpenses || [];
    // Les paidExpenses n'ont pas de fromAccount, on les retourne telles quelles
    // Le filtrage principal se fait via filteredTransactions pour les graphiques
    return paidExpenses || [];
  }, [selectedAccountId, paidExpenses]);

  const selectedAccountLabel = useMemo(() => {
    if (selectedAccountId === "all") return "Tous les comptes";
    const account = (bankAccounts || []).find(
      (a) => a.id === selectedAccountId || a.externalId === selectedAccountId
    );
    if (!account) return "Tous les comptes";
    const name = account.name || account.institutionName || account.bankName || "Compte";
    const lastIban = account.iban ? ` ···${account.iban.slice(-4)}` : "";
    return `${name}${lastIban}`;
  }, [selectedAccountId, bankAccounts]);

  // Données pour les graphiques (incluant les transactions bancaires filtrées)
  const incomeChartData = useMemo(
    () => processIncomeForCharts(paidInvoices || [], filteredTransactions),
    [paidInvoices, filteredTransactions]
  );
  const expenseChartData = useMemo(
    () =>
      processExpensesWithBankForCharts(filteredPaidExpenses, filteredTransactions),
    [filteredPaidExpenses, filteredTransactions]
  );

  // Debug pour vérifier l'état du cache
  console.log("🔍 Dashboard render:", {
    isLoading,
    isInitialized,
    hasCache: !!cacheInfo?.isFromCache,
    lastUpdate: cacheInfo?.lastUpdate,
  });

  // Si les données sont en cours de chargement, afficher le skeleton
  if (isLoading || !isInitialized) {
    console.log("📊 Dashboard: Affichage du skeleton");
    return <DashboardSkeleton />;
  }

  console.log("📊 Dashboard: Affichage du contenu réel");

  // Note: Les transactions sont maintenant gérées par le composant BridgeTransactions

  // Utiliser les configurations importées
  const incomeChartConfig = getIncomeChartConfig();
  const expenseChartConfig = getExpenseChartConfig();

  const balanceChartConfig = {
    visitors: {
      label: "Visitors",
    },
    desktop: {
      label: "Montant",
      color: "#3b82f6", // Bleu pour le solde
    },
    mobile: {
      label: "Nombre de transactions",
      color: "#2563eb", // Bleu plus foncé
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
        <div className="flex items-center justify-between w-full mb-2">
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold">
              Bonjour {session?.user?.name},
            </h1>
            {/* Filtre de compte bancaire */}
            {(bankAccounts || []).length > 0 && (
              <Popover open={accountPopoverOpen} onOpenChange={setAccountPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={accountPopoverOpen}
                    className="h-7 px-2 text-sm font-normal text-muted-foreground hover:text-foreground gap-1 w-fit mt-1"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    {selectedAccountLabel}
                    <ChevronsUpDown className="h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <Command>
                    <CommandList>
                      <CommandEmpty>Aucun compte trouvé.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedAccountId("all");
                            setAccountPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedAccountId === "all" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>Tous les comptes</span>
                          </div>
                        </CommandItem>
                        {(bankAccounts || []).map((account) => {
                          const accountName = account.name || account.institutionName || account.bankName || "Compte";
                          const lastIban = account.iban ? ` ···${account.iban.slice(-4)}` : "";
                          const isSelected = selectedAccountId === account.id || selectedAccountId === account.externalId;
                          return (
                            <CommandItem
                              key={account.id}
                              value={account.id}
                              onSelect={() => {
                                setSelectedAccountId(account.id);
                                setAccountPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex items-center gap-2 min-w-0">
                                {account.institutionLogo ? (
                                  <img
                                    src={account.institutionLogo}
                                    alt=""
                                    className="h-4 w-4 rounded-sm object-contain flex-shrink-0"
                                  />
                                ) : (
                                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                )}
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate text-sm">{accountName}{lastIban}</span>
                                  {account.balance?.current != null && (
                                    <span className="text-xs text-muted-foreground">
                                      {formatCurrency(account.balance.current)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
            {process.env.NODE_ENV === "development" &&
              cacheInfo?.lastUpdate && (
                <p className="text-xs text-gray-500 mt-1">
                  Données mises à jour :{" "}
                  {cacheInfo.lastUpdate.toLocaleTimeString()}
                  {cacheInfo.isFromCache && " (cache)"}
                </p>
              )}
          </div>
          {/* <BankingConnectButton /> */}
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
            className="shadow-xs w-full md:w-1/2"
            expenses={paidExpenses}
            invoices={paidInvoices}
            totalIncome={filteredTotalIncome}
            totalExpenses={filteredTotalExpenses}
            bankAccounts={filteredBankAccounts}
            bankBalance={filteredBalance}
            isLoading={isLoading}
          />
          <RecentTransactionsCard
            className="shadow-xs w-full md:w-1/2"
            transactions={filteredTransactions}
            limit={5}
            isLoading={isLoading}
          />
        </div>
        {/* Graphique de trésorerie - Pleine largeur (MODE BANCAIRE PUR) */}
        <div className="w-full">
          <TreasuryChart
            bankTransactions={filteredTransactions}
            className="shadow-xs"
            initialBalance={filteredBalance || 0}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
          <ChartAreaInteractive
            title="Entrées"
            description={formatCurrency(filteredTotalIncome)}
            height="200px"
            className="shadow-xs w-full md:w-1/2"
            config={incomeChartConfig}
            data={incomeChartData}
            hideMobileCurve={true}
          />
          <ChartAreaInteractive
            title="Sorties"
            description={formatCurrency(filteredTotalExpenses)}
            height="200px"
            className="shadow-xs w-full md:w-1/2"
            config={expenseChartConfig}
            data={expenseChartData}
            hideMobileCurve={true}
          />
        </div>

        {/* Graphiques de répartition par catégorie (MODE BANCAIRE PUR) */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
          <IncomeCategoryChart
            invoices={paidInvoices}
            bankTransactions={filteredTransactions}
            className="shadow-xs w-full md:w-1/2"
          />
          <ExpenseCategoryChart
            expenses={paidExpenses}
            bankTransactions={filteredTransactions}
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
      console.log("🎉 Paiement réussi détecté, affichage de l'animation Pro");
      setShowProAnimation(true);
      // Nettoyer l'URL des paramètres
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [searchParams]);

  const handleProAnimationComplete = () => {
    setShowProAnimation(false);
    console.log("✅ Animation Pro terminée, dashboard accessible");
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
