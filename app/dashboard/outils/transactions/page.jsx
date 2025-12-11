"use client";
import { Suspense, useMemo, useState } from "react";
import TransactionTable from "./components/table";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { useExpenses } from "@/src/hooks/useExpenses";
import { useUnifiedExpenses } from "@/src/hooks/useUnifiedExpenses";
import { useSearchParams } from "next/navigation";
import { useDashboardData } from "@/src/hooks/useDashboardData";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  Plus,
  Settings,
  Download,
  Eye,
  EyeOff,
  ChevronDown,
  Edit3,
  Upload,
} from "lucide-react";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/src/components/ui/button-group";
import { ExportDialog } from "./components/export-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

function GestionDepensesContent() {
  const searchParams = useSearchParams();
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [triggerAddManual, setTriggerAddManual] = useState(false);
  const [triggerAddOcr, setTriggerAddOcr] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Récupération des transactions bancaires et du solde
  const {
    transactions: bankTransactions,
    bankBalance,
    isLoading: bankLoading,
  } = useDashboardData();

  // Récupération des dépenses unifiées (bancaires + manuelles)
  const {
    expenses: unifiedExpenses,
    stats: unifiedStats,
    loading: unifiedLoading,
    error: unifiedError,
    refetch: refetchUnified,
  } = useUnifiedExpenses();

  // Fallback sur les dépenses classiques si pas de données unifiées
  const {
    expenses: legacyExpenses,
    loading: legacyLoading,
    error: legacyError,
    refetch: refetchLegacy,
  } = useExpenses();

  // Utiliser les dépenses unifiées si disponibles, sinon les dépenses classiques
  const expenses =
    unifiedExpenses.length > 0 ? unifiedExpenses : legacyExpenses;
  const loading = unifiedLoading || legacyLoading || bankLoading;
  const error = unifiedError || legacyError;
  const refetchExpenses = async () => {
    await Promise.all([refetchUnified(), refetchLegacy()]);
  };

  // Formater les montants
  const formatAmount = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Calculer les statistiques des transactions
  const transactionStats = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return {
        totalExpenses: 0,
        totalIncome: 0,
        pendingCount: 0,
      };
    }

    let totalExpenses = 0;
    let totalIncome = 0;
    let pendingCount = 0;

    expenses.forEach((expense) => {
      const amount = expense.amount || 0;
      if (expense.type === "INCOME" || amount > 0) {
        totalIncome += Math.abs(amount);
      } else {
        totalExpenses += Math.abs(amount);
      }
      if (expense.status === "PENDING" || expense.status === "DRAFT") {
        pendingCount++;
      }
    });

    return {
      totalExpenses,
      totalIncome,
      pendingCount,
    };
  }, [expenses]);

  return (
    <>
      {/* Desktop Layout - Full height avec scroll uniquement sur le tableau */}
      <div className="hidden md:flex md:flex-col md:h-[calc(100vh-64px)] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6">
          <div>
            <div className="flex items-center gap-3">
              <h1
                className={`text-3xl font-semibold tracking-tight transition-all duration-200 ${isBalanceHidden ? "blur-md select-none" : ""}`}
              >
                {loading ? (
                  <Skeleton className="h-9 w-40" />
                ) : (
                  `${formatAmount(bankBalance || 0)} €`
                )}
              </h1>
              <button
                onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={
                  isBalanceHidden ? "Afficher le solde" : "Masquer le solde"
                }
              >
                {isBalanceHidden ? (
                  <Eye className="h-5 w-5" />
                ) : (
                  <EyeOff className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="text-sm mt-2">Solde disponible</p>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setIsExportDialogOpen(true)}
                  >
                    <Download className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-[#202020] text-white border-0"
                >
                  <p>Exporter les transactions</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {/* <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" size="icon" onClick={() => {}}>
                    <Settings className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-[#202020] text-white border-0"
                >
                  <p>Paramètres</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider> */}
            <DropdownMenu>
              <ButtonGroup>
                <DropdownMenuTrigger asChild>
                  <Button className="cursor-pointer font-normal bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90">
                    Nouvelle transaction
                  </Button>
                </DropdownMenuTrigger>
                <ButtonGroupSeparator />
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    className="cursor-pointer bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  >
                    <ChevronDown size={16} aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
              </ButtonGroup>
              <DropdownMenuContent align="end" className="[--radius:1rem]">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    Créer une transaction
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setTriggerAddManual(true)}>
                    <Edit3 size={16} />
                    Saisie manuelle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTriggerAddOcr(true)}>
                    <Upload size={16} />
                    Scanner un reçu (OCR)
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table */}
        <Suspense fallback={<TransactionTableSkeleton />}>
          <TransactionTable
            expenses={expenses}
            loading={loading}
            refetchExpenses={refetchExpenses}
            initialTransactionId={searchParams.get("transactionId")}
            openOcr={searchParams.get("openOcr") === "true"}
            triggerAddManual={triggerAddManual}
            onAddManualTriggered={() => setTriggerAddManual(false)}
            triggerAddOcr={triggerAddOcr}
            onAddOcrTriggered={() => setTriggerAddOcr(false)}
          />
        </Suspense>
      </div>

      {/* Mobile Layout - Style Notion */}
      <div className="md:hidden">
        {/* Header - Style Notion sur mobile */}
        <div className="px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className={`text-2xl font-semibold tracking-tight transition-all duration-200 ${isBalanceHidden ? "blur-md select-none" : ""}`}
                >
                  {loading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    `${formatAmount(bankBalance || 0)} €`
                  )}
                </h1>
                <button
                  onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={
                    isBalanceHidden ? "Afficher le solde" : "Masquer le solde"
                  }
                >
                  {isBalanceHidden ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-muted-foreground text-sm">Solde disponible</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {}}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <Suspense fallback={<TransactionTableSkeleton />}>
          <TransactionTable
            expenses={expenses}
            loading={loading}
            refetchExpenses={refetchExpenses}
            initialTransactionId={searchParams.get("transactionId")}
            openOcr={searchParams.get("openOcr") === "true"}
          />
        </Suspense>

        {/* Bouton flottant mobile */}
        <Button
          onClick={() => {}}
          className="fixed bottom-6 bg-[#5a50ff] right-6 h-14 w-14 rounded-full shadow-lg z-50 md:hidden"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* Dialog d'export */}
        <ExportDialog
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
          transactions={expenses}
        />
      </div>
    </>
  );
}

export default function GestionDepenses() {
  // Page transactions - accessible en Pro
  return (
    <ProRouteGuard pageName="Transactions">
      <GestionDepensesContent />
    </ProRouteGuard>
  );
}

function TransactionTableSkeleton() {
  return (
    <>
      {/* Desktop Skeleton */}
      <div className="hidden md:block space-y-4 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[300px]" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[100px]" />
          </div>
        </div>
        <div className="rounded-md border">
          <div className="p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Skeleton */}
      <div className="md:hidden">
        {/* Toolbar */}
        <div className="px-4 py-3">
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Table rows */}
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b border-gray-50 px-4 py-3">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
