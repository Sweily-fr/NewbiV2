"use client";
import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import PurchaseInvoiceTable from "./components/table";
import { PurchaseInvoiceDetailDrawer } from "./components/detail-drawer";
import { PurchaseInvoiceCreateDrawer } from "./components/create-drawer";
import { TransactionDetailDrawer } from "../transactions/components/transaction-detail-drawer";
import { mapPaymentMethodToEnum } from "../transactions/components/transactions/utils/mappers";
import {
  GET_TRANSACTIONS,
  UPLOAD_TRANSACTION_RECEIPT,
} from "@/src/graphql/queries/banking";
import {
  useUpdateTransaction,
  useDeleteTransaction,
} from "@/src/hooks/useTransactions";
import { ExportDialog } from "./components/export-dialog";
import { GmailConnectionDialog } from "./components/gmail-connection";
// GmailStatusBanner remplacé par un bouton inline dans la toolbar
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import {
  usePurchaseInvoices,
  usePurchaseInvoiceStats,
} from "@/src/hooks/usePurchaseInvoices";
import { useGmailConnection } from "@/src/hooks/useGmailConnection";
import {
  useImportedInvoices,
  useImportedInvoiceStats,
} from "@/src/graphql/importedInvoiceQueries";
import { useWorkspace } from "@/src/hooks/useWorkspace";
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
  ChevronDown,
  Edit3,
  Upload,
  Download,
  Info,
  Mail,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { toast } from "@/src/components/ui/sonner";

const formatAmount = (amount) => {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

function StatsCard({ label, tooltip, amount, count, alert }) {
  return (
    <div className="bg-background border rounded-lg px-4 py-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        {alert && count > 0 && (
          <span className="h-4 w-4 flex items-center justify-center rounded-full bg-red-100 text-red-500 text-[10px] font-medium">
            {count}
          </span>
        )}
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-[#202020] text-white border-0"
              >
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-medium tracking-tight">
          {formatAmount(amount)} €
        </span>
        <span className="text-xs text-muted-foreground">TTC</span>
      </div>
    </div>
  );
}

function PurchaseInvoicesContent() {
  const searchParams = useSearchParams();
  const { invoices, loading, refetch } = usePurchaseInvoices({ limit: 200 });
  const {
    stats,
    loading: statsLoading,
    refetch: refetchStats,
  } = usePurchaseInvoiceStats();
  const { connection: gmailConnection } = useGmailConnection();
  const { isReadOnly, isOwner } = useSubscriptionAccess();
  const readOnlyTooltip = isReadOnly
    ? isOwner
      ? "Mode lecture seule · Renouvelez votre abonnement"
      : "Mode lecture seule · Contactez l'administrateur"
    : undefined;
  const { workspaceId } = useWorkspace();
  const {
    importedInvoices,
    loading: importedLoading,
    refetch: refetchImported,
  } = useImportedInvoices(workspaceId, {
    filters: { status: "PENDING_REVIEW" },
  });

  // ── Affichage unifié : dépenses (page Transactions) ────────────────────
  // On récupère toutes les transactions de type dépense (montant < 0, manuelles
  // ET bancaires) et on les affiche aussi dans la liste des factures d'achat,
  // sauf celles déjà rapprochées à une facture (présentes dans linkedTransactionIds).
  const { updateTransaction } = useUpdateTransaction();
  const { deleteTransaction } = useDeleteTransaction();
  const [uploadReceiptMutation] = useMutation(UPLOAD_TRANSACTION_RECEIPT);
  const { data: txData, refetch: refetchTransactions } = useQuery(
    GET_TRANSACTIONS,
    {
      variables: { workspaceId, limit: 0 },
      skip: !workspaceId,
      fetchPolicy: "cache-and-network",
    },
  );

  const expenseTransactionRows = useMemo(() => {
    const linkedIds = new Set();
    (invoices || []).forEach((pi) => {
      (pi.linkedTransactionIds || []).forEach((tid) =>
        linkedIds.add(String(tid)),
      );
    });
    return (txData?.transactions || [])
      .filter((tx) => tx.amount < 0 && !linkedIds.has(String(tx.id)))
      .map((tx) => ({
        id: `tx-${tx.id}`,
        sourceKind: "TRANSACTION",
        supplierName: tx.metadata?.vendor || tx.description || "Dépense",
        invoiceNumber: null,
        issueDate: tx.date || tx.createdAt,
        dueDate: null,
        amountHT: null,
        amountTVA: null,
        amountTTC: Math.abs(tx.amount || 0),
        currency: tx.currency || "EUR",
        status: tx.status === "completed" ? "PAID" : "PENDING",
        category: tx.expenseCategory || null,
        files: (tx.receiptFiles || []).map((f) => ({
          id: f.id,
          url: f.url,
          originalFilename: f.filename,
        })),
        linkedTransactionIds: [],
        originalTransaction: tx,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      }));
  }, [txData, invoices]);

  const mergedInvoices = useMemo(
    () => [...(invoices || []), ...expenseTransactionRows],
    [invoices, expenseTransactionRows],
  );

  const refetchAll = () => {
    refetch?.();
    refetchStats?.();
    refetchTransactions?.();
  };

  // Mappe une transaction brute vers la shape attendue par TransactionDetailDrawer
  const mapTransactionToDrawer = (tx) => ({
    id: tx.id,
    type: tx.amount > 0 ? "INCOME" : "EXPENSE",
    source: tx.provider === "manual" ? "MANUAL" : "BANK",
    title: tx.description,
    description: tx.description,
    amount: tx.amount,
    currency: tx.currency || "EUR",
    date: tx.processedAt || tx.date || tx.createdAt,
    category: tx.category || tx.expenseCategory || "OTHER",
    vendor: tx.metadata?.vendor || null,
    hasReceipt: Array.isArray(tx.receiptFiles) && tx.receiptFiles.length > 0,
    receiptFiles: tx.receiptFiles || [],
    files: tx.receiptFiles || [],
    status: tx.status === "completed" ? "PAID" : tx.status?.toUpperCase(),
    paymentMethod: tx.metadata?.paymentMethod || null,
    provider: tx.provider,
    originalTransaction: {
      id: tx.id,
      externalId: tx.externalId,
      provider: tx.provider,
      fromAccount: tx.fromAccount,
    },
    pcgAccount: tx.pcgAccount || null,
    metadata: tx.metadata || {},
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
  });

  const handleSaveExpenseTransaction = async (updated) => {
    const txId =
      updated.id ||
      selectedExpenseTx?.originalTransaction?.id ||
      selectedExpenseTx?.id;
    if (!txId) return;
    const isIncome = updated.type === "INCOME";
    const amount = isIncome
      ? Math.abs(parseFloat(updated.amount))
      : -Math.abs(parseFloat(updated.amount));
    const input = {
      description: updated.description || "Transaction modifiée",
      amount,
      currency: "EUR",
      category: updated.category || "OTHER",
      date: updated.date,
      type: isIncome ? "CREDIT" : "DEBIT",
      vendor: updated.vendor,
      paymentMethod: mapPaymentMethodToEnum(updated.paymentMethod),
      notes: updated.description,
    };
    if (updated.status) input.status = updated.status;
    if (updated.pcgAccountNumero)
      input.pcgAccountNumero = updated.pcgAccountNumero;
    const result = await updateTransaction(txId, input);
    if (result?.success) {
      setIsTxDrawerOpen(false);
      refetchAll();
    }
  };

  const handleDeleteExpenseTransaction = async (tx) => {
    setIsTxDrawerOpen(false);
    const txId = tx.originalTransaction?.id || tx.id;
    const result = await deleteTransaction(txId);
    if (result?.success) refetchAll();
  };

  const handleAttachReceiptToTransaction = async (tx, files) => {
    const transactionId = tx.originalTransaction?.id || tx.id;
    const { data } = await uploadReceiptMutation({
      variables: { transactionId, workspaceId, files },
    });
    if (!data?.uploadTransactionReceipt?.success) {
      throw new Error(
        data?.uploadTransactionReceipt?.message || "Erreur lors de l'upload",
      );
    }
    toast.success("Justificatif ajouté avec succès");
    refetchAll();
  };

  const handleImportedConverted = () => {
    refetch?.();
    refetchImported?.();
  };

  // Drawer state — managed here so only ONE set of drawers is rendered
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [createInitialTab, setCreateInitialTab] = useState("manual");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isGmailDialogOpen, setIsGmailDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  // Affichage unifié : drawer transaction (dépense saisie dans Transactions)
  const [isTxDrawerOpen, setIsTxDrawerOpen] = useState(false);
  const [selectedExpenseTx, setSelectedExpenseTx] = useState(null);

  // Handle OAuth callback query params
  useEffect(() => {
    if (searchParams.get("gmail_connected") === "true") {
      toast.success(
        "Gmail connecté ! Le scan initial de vos emails est en cours...",
      );
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (searchParams.get("gmail_error")) {
      toast.error(
        `Erreur connexion Gmail : ${searchParams.get("gmail_error")}`,
      );
      window.history.replaceState({}, "", window.location.pathname);
    }
    // Ouverture directe du drawer de création depuis le dashboard
    // (lien "Ajouter une facture d'achat" → ?action=create).
    if (searchParams.get("action") === "create") {
      setCreateInitialTab("manual");
      setIsCreateDrawerOpen(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  const handleRowClick = (invoice) => {
    // Ligne issue d'une transaction (dépense) : ouvrir le drawer transaction en place
    if (invoice?.sourceKind === "TRANSACTION") {
      setSelectedExpenseTx(mapTransactionToDrawer(invoice.originalTransaction));
      setIsTxDrawerOpen(true);
      return;
    }
    setSelectedInvoice(invoice);
    setIsDetailDrawerOpen(true);
  };

  const handleAddManual = () => {
    setCreateInitialTab("manual");
    setIsCreateDrawerOpen(true);
  };

  const handleAddOcr = () => {
    setCreateInitialTab("ocr");
    setIsCreateDrawerOpen(true);
  };

  const handleOpenGmailDialog = () => {
    setIsGmailDialogOpen(true);
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex md:flex-col md:h-[calc(100vh-64px)] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6">
          <div>
            <h1 className="text-2xl font-medium mb-2">Factures d&apos;achat</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsExportOpen(true)}>
              <Download size={14} strokeWidth={1.5} aria-hidden="true" />
              Exporter
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="primary"
                  disabled={isReadOnly}
                  title={readOnlyTooltip}
                >
                  <Plus size={14} strokeWidth={2} aria-hidden="true" />
                  Nouvelle facture
                  <ChevronDown size={12} aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    Ajouter une facture
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleAddManual}>
                    <Edit3 size={16} />
                    Saisie manuelle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAddOcr}>
                    <Upload size={16} />
                    Importer (scan/OCR)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    Automatisation
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleOpenGmailDialog}>
                    <Mail size={16} />
                    Automatiser (Gmail)
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Zone scrollable : KPIs + tableau */}
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="flex flex-col min-h-full">
            {/* Stats Cards */}
            <div className="flex gap-3 px-4 sm:px-6 py-3">
              {statsLoading ? (
                <>
                  <Skeleton className="h-[60px] w-[200px] rounded-lg" />
                  <Skeleton className="h-[60px] w-[200px] rounded-lg" />
                  <Skeleton className="h-[60px] w-[200px] rounded-lg" />
                  <Skeleton className="h-[60px] w-[200px] rounded-lg" />
                </>
              ) : (
                <>
                  <div className="bg-background border rounded-lg px-4 py-3 flex items-center gap-0">
                    <div className="pr-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs text-muted-foreground">
                          Total à payer
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              className="bg-[#202020] text-white border-0"
                            >
                              <p>Factures à payer + en retard</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-medium tracking-tight">
                          {formatAmount(stats.totalToPay)} €
                        </span>
                        <span className="text-xs text-muted-foreground">
                          TTC
                        </span>
                      </div>
                    </div>
                    <div className="w-px h-10 bg-border mx-4" />
                    <div className="pl-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs text-muted-foreground">
                          Payé ce mois
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              className="bg-[#202020] text-white border-0"
                            >
                              <p>Total des factures payées ce mois</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-medium tracking-tight">
                          {formatAmount(stats.paidThisMonth)} €
                        </span>
                        <span className="text-xs text-muted-foreground">
                          TTC
                        </span>
                      </div>
                    </div>
                  </div>
                  <StatsCard
                    label="Factures en retard"
                    tooltip="Factures dont la date d'échéance est dépassée"
                    amount={stats.totalOverdue}
                    count={stats.totalOverdueCount}
                    alert
                  />
                  <StatsCard
                    label="Total du mois"
                    tooltip="Toutes les factures du mois en cours"
                    amount={stats.totalThisMonth}
                    count={stats.totalThisMonthCount}
                  />
                </>
              )}
            </div>

            {/* Table */}
            <Suspense fallback={<TableSkeleton />}>
              <PurchaseInvoiceTable
                invoices={mergedInvoices}
                loading={loading}
                refetch={refetch}
                refetchStats={refetchStats}
                onRowClick={handleRowClick}
                importedInvoices={importedInvoices}
                importedLoading={importedLoading}
                onImportedConverted={handleImportedConverted}
                gmailConnection={gmailConnection}
                onOpenGmailDialog={handleOpenGmailDialog}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        <div className="px-4 py-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-medium mb-2">
                Factures d&apos;achat
              </h1>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" className="rounded-full">
                    <Plus className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="[--radius:1rem]">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                      Ajouter une facture
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleAddManual}>
                      <Edit3 size={16} />
                      Saisie manuelle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleAddOcr}>
                      <Upload size={16} />
                      Importer (scan/OCR)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                      Automatisation
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleOpenGmailDialog}>
                      <Mail size={16} />
                      Automatiser (Gmail)
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Stats Cards Mobile */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          {!statsLoading && (
            <>
              <StatsCard
                label="Total à payer"
                tooltip="Factures à payer + en retard"
                amount={stats.totalToPay}
              />
              <StatsCard
                label="En retard"
                tooltip="Factures dont la date d'échéance est dépassée"
                amount={stats.totalOverdue}
                count={stats.totalOverdueCount}
                alert
              />
            </>
          )}
        </div>

        {/* Table */}
        <Suspense fallback={<TableSkeleton />}>
          <PurchaseInvoiceTable
            invoices={mergedInvoices}
            loading={loading}
            refetch={refetch}
            refetchStats={refetchStats}
            onRowClick={handleRowClick}
            importedInvoices={importedInvoices}
            importedLoading={importedLoading}
            onImportedConverted={handleImportedConverted}
            gmailConnection={gmailConnection}
            onOpenGmailDialog={handleOpenGmailDialog}
          />
        </Suspense>
      </div>

      {/* Drawers — rendered ONCE at page level */}
      {/* Consultation / édition d'une facture existante */}
      <PurchaseInvoiceDetailDrawer
        open={isDetailDrawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDetailDrawerOpen(false);
            setSelectedInvoice(null);
          }
        }}
        invoice={selectedInvoice}
        mode="view"
        onSaved={() => {
          setIsDetailDrawerOpen(false);
          setSelectedInvoice(null);
          refetch?.();
        }}
        onDeleted={() => {
          setIsDetailDrawerOpen(false);
          setSelectedInvoice(null);
          refetch?.();
          refetchStats?.();
        }}
      />
      {/* Création — drawer unifié (onglets Saisie manuelle / Import OCR) */}
      <PurchaseInvoiceCreateDrawer
        open={isCreateDrawerOpen}
        initialTab={createInitialTab}
        onOpenChange={(open) => {
          setIsCreateDrawerOpen(open);
          if (!open) {
            refetch?.();
            refetchStats?.();
          }
        }}
        onCreated={() => {
          setIsCreateDrawerOpen(false);
          refetch?.();
          refetchStats?.();
        }}
      />
      <ExportDialog
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        invoices={mergedInvoices}
      />
      {/* Drawer transaction (affichage unifié) — dépense saisie dans Transactions */}
      {isTxDrawerOpen && (
        <TransactionDetailDrawer
          transaction={selectedExpenseTx}
          open={isTxDrawerOpen}
          onOpenChange={(open) => {
            setIsTxDrawerOpen(open);
            if (!open) setSelectedExpenseTx(null);
          }}
          onDelete={handleDeleteExpenseTransaction}
          onAttachReceipt={handleAttachReceiptToTransaction}
          onSubmit={handleSaveExpenseTransaction}
          onRefresh={refetchAll}
        />
      )}
      <GmailConnectionDialog
        open={isGmailDialogOpen}
        onOpenChange={setIsGmailDialogOpen}
      />
    </>
  );
}

export default function PurchaseInvoicesPage() {
  return (
    <ProRouteGuard pageName="Factures d'achat">
      <PurchaseInvoicesContent />
    </ProRouteGuard>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[300px]" />
        <div className="flex gap-2">
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
  );
}
