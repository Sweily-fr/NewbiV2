"use client";
import { Suspense, useState } from "react";
import PurchaseInvoiceTable from "./components/table";
import { PurchaseInvoiceDetailDrawer } from "./components/detail-drawer";
import { PurchaseInvoiceUploadDrawer } from "./components/upload-drawer";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import {
  usePurchaseInvoices,
  usePurchaseInvoiceStats,
} from "@/src/hooks/usePurchaseInvoices";
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
  Info,
} from "lucide-react";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/src/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

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
              <TooltipContent side="bottom" className="bg-[#202020] text-white border-0">
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
  const { invoices, loading, refetch } = usePurchaseInvoices({ limit: 200 });
  const { stats, loading: statsLoading } = usePurchaseInvoiceStats();

  // Drawer state — managed here so only ONE set of drawers is rendered
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const handleRowClick = (invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailDrawerOpen(true);
  };

  const handleAddManual = () => {
    setSelectedInvoice(null);
    setIsCreateDrawerOpen(true);
  };

  const handleAddOcr = () => {
    setIsUploadDrawerOpen(true);
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
            <DropdownMenu>
              <ButtonGroup>
                <Button
                  onClick={handleAddManual}
                  className="cursor-pointer font-normal bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  Nouvelle facture
                </Button>
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
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

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
                    <span className="text-xs text-muted-foreground">Total à payer</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-[#202020] text-white border-0">
                          <p>Factures à payer + en retard</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-medium tracking-tight">
                      {formatAmount(stats.totalToPay)} €
                    </span>
                    <span className="text-xs text-muted-foreground">TTC</span>
                  </div>
                </div>
                <div className="w-px h-10 bg-border mx-4" />
                <div className="pl-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs text-muted-foreground">Payé ce mois</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-[#202020] text-white border-0">
                          <p>Total des factures payées ce mois</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-medium tracking-tight">
                      {formatAmount(stats.paidThisMonth)} €
                    </span>
                    <span className="text-xs text-muted-foreground">TTC</span>
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
            invoices={invoices}
            loading={loading}
            refetch={refetch}
            onRowClick={handleRowClick}
          />
        </Suspense>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        <div className="px-4 py-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-medium mb-2">Factures d&apos;achat</h1>
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
            invoices={invoices}
            loading={loading}
            refetch={refetch}
            onRowClick={handleRowClick}
          />
        </Suspense>
      </div>

      {/* Drawers — rendered ONCE at page level */}
      <PurchaseInvoiceDetailDrawer
        open={isDetailDrawerOpen || isCreateDrawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDetailDrawerOpen(false);
            setIsCreateDrawerOpen(false);
            setSelectedInvoice(null);
          }
        }}
        invoice={selectedInvoice}
        mode={isCreateDrawerOpen ? "create" : "view"}
        onSaved={() => {
          setIsDetailDrawerOpen(false);
          setIsCreateDrawerOpen(false);
          setSelectedInvoice(null);
          refetch?.();
        }}
        onDeleted={() => {
          setIsDetailDrawerOpen(false);
          setSelectedInvoice(null);
          refetch?.();
        }}
      />
      <PurchaseInvoiceUploadDrawer
        open={isUploadDrawerOpen}
        onOpenChange={setIsUploadDrawerOpen}
        onUploaded={() => {
          setIsUploadDrawerOpen(false);
          refetch?.();
        }}
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
