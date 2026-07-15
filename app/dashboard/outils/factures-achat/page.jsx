"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import PurchaseInvoiceTable from "./components/table";
import { PurchaseInvoiceDetailDrawer } from "./components/detail-drawer";
import { PurchaseInvoiceCreateDrawer } from "./components/create-drawer";
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
  Check,
} from "lucide-react";
import { GoogleIcon } from "./components/google-icon";
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

  const refetchAll = () => {
    refetch?.();
    refetchStats?.();
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
            {/* Bouton Gmail (affiché si connecté) — à gauche d'Exporter */}
            {gmailConnection && gmailConnection.status !== "disconnected" && (
              <Button
                variant="outline"
                className="gap-1.5 cursor-pointer"
                onClick={handleOpenGmailDialog}
              >
                <GoogleIcon className="size-3.5" />
                <span className="text-sm">Gmail connecté</span>
                <Check
                  className="size-3 text-muted-foreground/60"
                  strokeWidth={2.5}
                />
              </Button>
            )}
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
                invoices={invoices || []}
                loading={loading}
                refetch={refetch}
                refetchStats={refetchStats}
                onRowClick={handleRowClick}
                importedInvoices={importedInvoices}
                importedLoading={importedLoading}
                onImportedConverted={handleImportedConverted}
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
            invoices={invoices || []}
            loading={loading}
            refetch={refetch}
            refetchStats={refetchStats}
            onRowClick={handleRowClick}
            importedInvoices={importedInvoices}
            importedLoading={importedLoading}
            onImportedConverted={handleImportedConverted}
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
        invoices={invoices || []}
      />
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
