"use client";
import { Suspense, useMemo, useState } from "react";
import TransactionTable from "./components/table";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { useSearchParams } from "next/navigation";
import { useDashboardData } from "@/src/hooks/useDashboardData";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Plus,
  Settings,
  Download,
  Eye,
  EyeOff,
  Edit3,
  Upload,
  Building2,
  Landmark,
  ChevronsUpDown,
  Check,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Repeat2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
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
// Supporte les catégories larges API (TRAVEL) ET les sous-catégories fines (parking, carburant, etc.)
const getSmartCategory = (transaction) => {
  // Si la catégorie est une valeur spécifique (pas "OTHER"/"other"/null)
  // getCategoryConfig supporte les deux formats (large et fine)
  if (transaction.category && transaction.category !== "OTHER" && transaction.category !== "other") {
    return transaction.category;
  }

  // Fallback: utiliser expenseCategory si spécifique
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
  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [accountPopoverOpen, setAccountPopoverOpen] = useState(false);

  // Récupération des transactions (bancaires + manuelles) depuis la collection transactions
  const {
    transactions,
    bankBalance,
    bankAccounts,
    isLoading: bankLoading,
    refreshData,
  } = useDashboardData();

  // Solde affiché selon le compte sélectionné
  const displayedBalance = useMemo(() => {
    if (selectedAccountId === "all") return bankBalance || 0;
    const account = (bankAccounts || []).find(
      (a) => a.id === selectedAccountId || a.externalId === selectedAccountId
    );
    return account?.balance?.current ?? 0;
  }, [selectedAccountId, bankAccounts, bankBalance]);

  // Label du compte sélectionné
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

  // Transformer les transactions pour le format attendu par le tableau (mémorisé)
  const expenses = useMemo(() => {
    let txList = transactions || [];

    // Filtrer par compte bancaire si un compte est sélectionné
    if (selectedAccountId !== "all") {
      const account = (bankAccounts || []).find(
        (a) => a.id === selectedAccountId || a.externalId === selectedAccountId
      );
      if (account) {
        txList = txList.filter(
          (tx) =>
            tx.fromAccount === account.externalId ||
            tx.fromAccount === account.id
        );
      }
    }

    return txList.map((tx) => ({
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
      paymentMethod: tx.metadata?.paymentMethod || (tx.type === "debit" ? "CARD" : "BANK_TRANSFER"),
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
  }, [transactions, selectedAccountId, bankAccounts]);

  const loading = bankLoading;
  const error = null;
  const refetchExpenses = refreshData;

  // Export Excel
  const exportToExcel = () => {
    const data = expenses.map((t) => ({
      Date: t.date ? (typeof t.date === "string" && t.date.match(/^\d{4}-\d{2}-\d{2}/) ? t.date.split("T")[0].split("-").reverse().join("/") : format(new Date(t.date), "dd/MM/yyyy", { locale: fr })) : "",
      Description: t.description || t.title || "",
      Catégorie: t.category || "",
      Montant: t.amount,
      Devise: t.currency || "EUR",
      Type: t.amount > 0 ? "Revenu" : "Dépense",
      Fournisseur: t.vendor || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `transactions_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`);
  };

  // Export CSV
  const exportToCSV = () => {
    const data = expenses.map((t) => ({
      Date: t.date ? (typeof t.date === "string" && t.date.match(/^\d{4}-\d{2}-\d{2}/) ? t.date.split("T")[0].split("-").reverse().join("/") : format(new Date(t.date), "dd/MM/yyyy", { locale: fr })) : "",
      Description: t.description || t.title || "",
      Catégorie: t.category || "",
      Montant: t.amount,
      Devise: t.currency || "EUR",
      Type: t.amount > 0 ? "Revenu" : "Dépense",
      Fournisseur: t.vendor || "",
    }));
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(";"),
      ...data.map((row) => headers.map((h) => {
        const v = row[h];
        return typeof v === "string" && (v.includes(";") || v.includes('"') || v.includes("\n")) ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(";")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                  `${formatAmount(displayedBalance)} €`
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
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="cursor-pointer">
                  <Landmark size={14} aria-hidden="true" />
                  {selectedAccountLabel}
                  <ChevronDown size={12} className="ml-0.5 opacity-70" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Sélectionner un compte
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setSelectedAccountId("all")}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Landmark size={14} className="text-muted-foreground" />
                  <span className="flex-1 text-xs truncate">Tous les comptes</span>
                  <Check
                    className={cn(
                      "h-4 w-4 text-[#5b4fff]",
                      selectedAccountId === "all" ? "opacity-100" : "opacity-0"
                    )}
                  />
                </DropdownMenuItem>
                {(bankAccounts || []).map((account) => {
                  const accountName = account.name || account.institutionName || account.bankName || "Compte";
                  const lastIban = account.iban ? ` ···${account.iban.slice(-4)}` : "";
                  const isSelected = selectedAccountId === account.id || selectedAccountId === account.externalId;
                  return (
                    <DropdownMenuItem
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {account.institutionLogo ? (
                          <img
                            src={account.institutionLogo}
                            alt=""
                            className="h-5 w-5 rounded-sm object-contain flex-shrink-0"
                          />
                        ) : (
                          <Landmark className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="truncate text-xs">{accountName}{lastIban}</span>
                          {account.balance?.current != null && (
                            <span className="text-[10px] text-muted-foreground">
                              {formatAmount(account.balance.current)} €
                            </span>
                          )}
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4 text-[#5b4fff]",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="cursor-pointer">
                  <Download size={14} strokeWidth={1.5} aria-hidden="true" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Format d'export
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
                  <FileSpreadsheet size={16} className="text-green-600" />
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
                  <FileText size={16} className="text-blue-600" />
                  CSV (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              <DropdownMenuTrigger asChild>
                <Button
                  variant="primary"
                  className="self-start cursor-pointer"
                >
                  <Repeat2 size={14} strokeWidth={2} aria-hidden="true" />
                  Nouvelle transaction
                  <ChevronDown size={12} className="ml-0.5 opacity-70" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
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
      <div className="md:hidden flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {/* Header - Style Notion sur mobile */}
        <div className="px-4 py-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className={`text-3xl font-semibold tracking-tight transition-all duration-200 ${isBalanceHidden ? "blur-md select-none" : ""}`}
                >
                  {loading ? (
                    <Skeleton className="h-9 w-40" />
                  ) : (
                    `${formatAmount(displayedBalance)} €`
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
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-2 mt-1 cursor-pointer">
                    <Landmark className="size-3.5 text-[#707070]" />
                    <span className="text-[13px] font-normal truncate max-w-[150px]">
                      {selectedAccountLabel}
                    </span>
                    <button className="p-1 rounded-md hover:bg-accent transition-colors cursor-pointer outline-none">
                      <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80 rounded-lg p-0" align="start" sideOffset={8}>
                  <Command>
                    <CommandList>
                      <CommandEmpty>Aucun compte trouvé.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => setSelectedAccountId("all")}
                          className="flex items-center gap-2 px-2 py-2 cursor-pointer"
                        >
                          <span className="flex-1 text-xs truncate">Tous les comptes</span>
                          <Check
                            className={cn(
                              "h-4 w-4 text-[#5b4fff]",
                              selectedAccountId === "all" ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                        {(bankAccounts || []).map((account) => {
                          const accountName = account.name || account.institutionName || account.bankName || "Compte";
                          const lastIban = account.iban ? ` ···${account.iban.slice(-4)}` : "";
                          const isSelected = selectedAccountId === account.id || selectedAccountId === account.externalId;
                          return (
                            <CommandItem
                              key={account.id}
                              value={account.id}
                              onSelect={() => setSelectedAccountId(account.id)}
                              className="flex items-center gap-2 px-2 py-2 cursor-pointer"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {account.institutionLogo ? (
                                  <img
                                    src={account.institutionLogo}
                                    alt=""
                                    className="h-5 w-5 rounded-sm object-contain flex-shrink-0"
                                  />
                                ) : (
                                  <Landmark className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                )}
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate text-xs">{accountName}{lastIban}</span>
                                  {account.balance?.current != null && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {formatAmount(account.balance.current)} €
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Check
                                className={cn(
                                  "h-4 w-4 text-[#5b4fff]",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    className="cursor-pointer rounded-full bg-[#0A0A0A] text-white hover:bg-[#0A0A0A]/90"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
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
