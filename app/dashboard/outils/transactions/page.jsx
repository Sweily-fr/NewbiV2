"use client";
import { Suspense, useMemo, useState } from "react";
import TransactionTable from "./components/table";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
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
import { getTransactionCategory } from "@/lib/bank-categories-config";

// Mapping des noms de catégories (bank-categories-config) vers les clés (category-icons-config)
const categoryNameToKey = {
  // Alimentation
  "Alimentation": "MEALS",
  "Restaurants": "MEALS",
  "Courses": "MEALS",

  // Transport
  "Transport": "TRAVEL",
  "Carburant": "TRAVEL",
  "Transports en commun": "TRAVEL",
  "Taxi/VTC": "TRAVEL",
  "Parking": "TRAVEL",

  // Logement
  "Logement": "ACCOMMODATION",
  "Loyer": "RENT",
  "Charges": "UTILITIES",
  "Assurance habitation": "INSURANCE",

  // Loisirs
  "Loisirs": "OTHER",
  "Sorties": "OTHER",
  "Voyages": "TRAVEL",
  "Sport": "OTHER",

  // Santé
  "Santé": "SERVICES",
  "Médecin": "SERVICES",
  "Pharmacie": "SERVICES",
  "Mutuelle": "INSURANCE",

  // Shopping
  "Shopping": "OFFICE_SUPPLIES",
  "Vêtements": "OTHER",
  "High-tech": "HARDWARE",
  "Maison": "OFFICE_SUPPLIES",

  // Services
  "Services": "SERVICES",
  "Téléphone/Internet": "SUBSCRIPTIONS",
  "Abonnements": "SUBSCRIPTIONS",
  "Banque": "SERVICES",

  // Impôts
  "Impôts & Taxes": "TAXES",
  "Impôt sur le revenu": "TAXES",
  "Taxe foncière": "TAXES",

  // Éducation
  "Éducation": "TRAINING",
  "Formation": "TRAINING",
  "Livres": "TRAINING",

  // Revenus (pour les transactions positives)
  "Salaire": "OTHER",
  "Prime": "OTHER",
  "Remboursement": "OTHER",
  "Revenus professionnels": "SERVICES",
  "Facturation": "SERVICES",
  "Honoraires": "SERVICES",
  "Aides & Allocations": "OTHER",
  "CAF": "OTHER",
  "Pôle Emploi": "OTHER",
  "Investissements": "OTHER",
  "Dividendes": "OTHER",
  "Intérêts": "OTHER",
  "Virements reçus": "OTHER",
  "Virement interne": "OTHER",
  "Autre revenu": "OTHER",

  // Autre
  "Autre": "OTHER",
  "Non catégorisé": "OTHER",
};

// Clés de catégories valides (hors "OTHER")
const SPECIFIC_CATEGORY_KEYS = [
  "OFFICE_SUPPLIES", "TRAVEL", "MEALS", "ACCOMMODATION",
  "SOFTWARE", "HARDWARE", "SERVICES", "MARKETING",
  "TAXES", "RENT", "UTILITIES", "SALARIES",
  "INSURANCE", "MAINTENANCE", "TRAINING", "SUBSCRIPTIONS"
];

// Fonction pour obtenir la catégorie compatible avec category-icons-config
const getSmartCategory = (transaction) => {
  // Vérifier si on a une catégorie SPÉCIFIQUE (pas "OTHER")
  if (transaction.category && SPECIFIC_CATEGORY_KEYS.includes(transaction.category)) {
    return transaction.category;
  }
  if (transaction.expenseCategory && SPECIFIC_CATEGORY_KEYS.includes(transaction.expenseCategory)) {
    return transaction.expenseCategory;
  }
  if (transaction.metadata?.bridgeCategoryMapped && SPECIFIC_CATEGORY_KEYS.includes(transaction.metadata.bridgeCategoryMapped)) {
    return transaction.metadata.bridgeCategoryMapped;
  }

  // Si category est "OTHER" ou null, utiliser l'analyse intelligente basée sur la description
  const categoryInfo = getTransactionCategory(transaction);
  const categoryName = categoryInfo?.name || "Autre";
  return categoryNameToKey[categoryName] || "OTHER";
};

function GestionDepensesContent() {
  const searchParams = useSearchParams();
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [triggerAddManual, setTriggerAddManual] = useState(false);
  const [triggerAddOcr, setTriggerAddOcr] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Récupération des transactions (bancaires + manuelles) depuis la collection transactions
  const {
    transactions,
    bankBalance,
    isLoading: bankLoading,
    refreshData,
  } = useDashboardData();

  // Transformer les transactions pour le format attendu par le tableau (mémorisé)
  const expenses = useMemo(() => {
    return (transactions || []).map((tx) => ({
      id: tx.id,
      type: tx.amount > 0 ? "INCOME" : "BANK_TRANSACTION",
      source: tx.provider === "manual" ? "MANUAL" : "BANK",
      title: tx.description,
      description: tx.description,
      amount: tx.amount,
      currency: tx.currency,
      date: tx.processedAt || tx.date || tx.createdAt,
      category: getSmartCategory(tx),
      vendor: tx.metadata?.vendor || null,
      hasReceipt: !!tx.receiptFile?.url || !!tx.linkedInvoice?.id,
      receiptFile: tx.receiptFile,
      receiptRequired: tx.amount < 0 && !tx.receiptFile?.url && !tx.linkedInvoice?.id,
      status: tx.status === "completed" ? "PAID" : tx.status?.toUpperCase(),
      paymentMethod: tx.type === "debit" ? "CARD" : "BANK_TRANSFER",
      bankName: tx.metadata?.bankName || null,
      provider: tx.provider,
      originalTransaction: {
        id: tx.id,
        externalId: tx.externalId,
        provider: tx.provider,
        fromAccount: tx.fromAccount,
      },
      linkedInvoiceId: tx.linkedInvoiceId || null,
      linkedInvoice: tx.linkedInvoice || null,
      reconciliationStatus: tx.reconciliationStatus || null,
      reconciliationDate: tx.reconciliationDate || null,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
    }));
  }, [transactions]);

  const loading = bankLoading;
  const error = null;
  const refetchExpenses = refreshData;

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
