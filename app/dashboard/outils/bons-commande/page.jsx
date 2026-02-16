"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { Button } from "@/src/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/src/components/ui/button-group";
import { PermissionButton } from "@/src/components/rbac";
import { Plus, Settings, Download, ArrowRightFromLine } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { Skeleton } from "@/src/components/ui/skeleton";
import PurchaseOrderTable from "./components/purchase-order-table";
import PurchaseOrderExportButton from "./components/purchase-order-export-button";
import { useRouter, useSearchParams } from "next/navigation";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { CompanyInfoGuard } from "@/src/components/company-info-guard";
import { usePurchaseOrders, PURCHASE_ORDER_STATUS } from "@/src/graphql/purchaseOrderQueries";
import { useToastManager } from "@/src/components/ui/toast-manager";
import { SendDocumentModal } from "@/app/dashboard/outils/factures/components/send-document-modal";

function PurchaseOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [poIdToOpen, setPoIdToOpen] = useState(null);

  // Ref pour déclencher l'import depuis le header
  const [triggerImport, setTriggerImport] = useState(false);

  // Toast manager et modal d'envoi
  const toastManager = useToastManager();
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [newPoData, setNewPoData] = useState(null);

  // Vérifier si un nouveau BC vient d'être créé
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = sessionStorage.getItem("newPurchaseOrderData");
      if (storedData) {
        try {
          const poData = JSON.parse(storedData);
          setNewPoData(poData);

          toastManager.add({
            type: "document",
            title: "Bon de commande créé avec succès",
            description: `BC ${poData.number} créé`,
            timeout: 10000,
            actionProps: poData.clientEmail ? {
              children: "Envoyer au client",
              onClick: () => {
                setShowSendEmailModal(true);
              },
            } : undefined,
          });

          sessionStorage.removeItem("newPurchaseOrderData");
        } catch (e) {
          sessionStorage.removeItem("newPurchaseOrderData");
        }
      }
    }
  }, [toastManager]);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setPoIdToOpen(id);
      router.replace("/dashboard/outils/bons-commande", { scroll: false });
    }
  }, [searchParams, router]);

  const handleNewPurchaseOrder = () => {
    router.push("/dashboard/outils/bons-commande/new");
  };

  // Récupérer les BC pour les stats
  const { purchaseOrders, loading: poLoading } = usePurchaseOrders();

  // Calculer les statistiques
  const poStats = useMemo(() => {
    if (!purchaseOrders || purchaseOrders.length === 0) {
      return {
        totalAmount: 0,
        confirmedAmount: 0,
        inProgressAmount: 0,
        inProgressCount: 0,
      };
    }

    let totalAmount = 0;
    let confirmedAmount = 0;
    let inProgressAmount = 0;
    let inProgressCount = 0;

    purchaseOrders.forEach((po) => {
      if (po.status !== PURCHASE_ORDER_STATUS.DRAFT) {
        totalAmount += po.totalHT || 0;
      }

      if (po.status === PURCHASE_ORDER_STATUS.CONFIRMED) {
        confirmedAmount += po.totalHT || 0;
      }

      if (po.status === PURCHASE_ORDER_STATUS.IN_PROGRESS) {
        inProgressAmount += po.totalHT || 0;
        inProgressCount++;
      }
    });

    return {
      totalAmount,
      confirmedAmount,
      inProgressAmount,
      inProgressCount,
    };
  }, [purchaseOrders]);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex md:flex-col md:h-[calc(100vh-64px)] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6">
          <div>
            <h1 className="text-2xl font-medium mb-2">Bons de commande</h1>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setTriggerImport(true)}
                  >
                    <Download className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-[#202020] text-white border-0"
                >
                  <p>Importer des bons de commande</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <PurchaseOrderExportButton purchaseOrders={purchaseOrders} iconOnly />
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-[#202020] text-white border-0"
                >
                  <p>Exporter des bons de commande</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <ButtonGroup>
              <Button
                onClick={handleNewPurchaseOrder}
                className="cursor-pointer font-normal bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                Nouveau bon de commande
              </Button>
              <ButtonGroupSeparator />
              <Button
                onClick={handleNewPurchaseOrder}
                size="icon"
                className="cursor-pointer bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                <Plus size={16} aria-hidden="true" />
              </Button>
            </ButtonGroup>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex gap-3 px-4 sm:px-6 py-3">
          <div className="bg-background border rounded-lg px-4 py-3 flex items-center gap-0">
            <div className="pr-4">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs text-muted-foreground">
                  Total commandé
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-medium tracking-tight">
                  {poLoading
                    ? "..."
                    : `${formatAmount(poStats.totalAmount)} €`}
                </span>
                <span className="text-xs text-muted-foreground">HT</span>
              </div>
            </div>

            <div className="w-px h-10 bg-border mx-4" />

            <div className="pl-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs text-muted-foreground">
                  Total confirmé
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-medium tracking-tight">
                  {poLoading
                    ? "..."
                    : `${formatAmount(poStats.confirmedAmount)} €`}
                </span>
                <span className="text-xs text-muted-foreground">HT</span>
              </div>
            </div>
          </div>

          <div className="bg-background border rounded-lg px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs text-muted-foreground">
                En cours de traitement
              </span>
              {poStats.inProgressCount > 0 && (
                <span className="h-4 w-4 flex items-center justify-center rounded-full bg-orange-100 text-orange-500 text-[10px] font-medium">
                  {poStats.inProgressCount}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-medium tracking-tight">
                {poLoading
                  ? "..."
                  : `${formatAmount(poStats.inProgressAmount)} €`}
              </span>
              <span className="text-xs text-muted-foreground">HT</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <Suspense fallback={<PurchaseOrderTableSkeleton />}>
          <PurchaseOrderTable
            handleNewPurchaseOrder={handleNewPurchaseOrder}
            poIdToOpen={poIdToOpen}
            triggerImport={triggerImport}
            onImportTriggered={() => setTriggerImport(false)}
          />
        </Suspense>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-medium mb-2">Bons de commande</h1>
              <p className="text-muted-foreground text-sm">
                Gérez vos bons de commande clients
              </p>
            </div>
          </div>
        </div>

        <Suspense fallback={<PurchaseOrderTableSkeleton />}>
          <PurchaseOrderTable />
        </Suspense>

        <PermissionButton
          resource="purchaseOrders"
          action="create"
          onClick={handleNewPurchaseOrder}
          className="fixed bottom-6 bg-[#5a50ff] right-6 h-14 w-14 rounded-full shadow-lg z-50 md:hidden"
          size="icon"
          hideIfNoAccess={true}
          tooltipNoAccess="Vous n'avez pas la permission de créer des bons de commande"
        >
          <Plus className="h-6 w-6" />
        </PermissionButton>
      </div>

      {/* Modal d'envoi par email */}
      {newPoData && (
        <SendDocumentModal
          open={showSendEmailModal}
          onOpenChange={setShowSendEmailModal}
          documentId={newPoData.id}
          documentType="purchaseOrder"
          documentNumber={newPoData.number}
          clientName={newPoData.clientName}
          clientEmail={newPoData.clientEmail}
          totalAmount={newPoData.totalAmount}
          companyName={newPoData.companyName}
          issueDate={newPoData.issueDate}
          onSent={() => setShowSendEmailModal(false)}
          onClose={() => setShowSendEmailModal(false)}
        />
      )}
    </>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <ProRouteGuard pageName="Bons de commande">
      <CompanyInfoGuard>
        <PurchaseOrdersContent />
      </CompanyInfoGuard>
    </ProRouteGuard>
  );
}

function PurchaseOrderTableSkeleton() {
  return (
    <>
      {/* Desktop Skeleton */}
      <div className="hidden md:block space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-16" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        <div className="bg-background overflow-hidden rounded-md border">
          <div className="table-fixed w-full">
            <div className="border-b">
              <div className="flex hover:bg-transparent">
                <div className="h-11 w-7 p-4 flex items-center">
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
                <div className="h-11 w-[150px] p-4 flex items-center">
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="h-11 w-[200px] p-4 flex items-center">
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="h-11 w-[100px] p-4 flex items-center">
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="h-11 w-[80px] p-4 flex items-center">
                  <Skeleton className="h-4 w-14" />
                </div>
                <div className="h-11 w-[120px] p-4 flex items-center">
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="h-11 w-[60px]"></div>
              </div>
            </div>
            <div>
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="flex border-b">
                  <div className="p-4 w-7">
                    <Skeleton className="h-4 w-4 rounded" />
                  </div>
                  <div className="p-4 w-[150px]">
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="p-4 w-[200px]">
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <div className="p-4 w-[100px]">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="p-4 w-[80px]">
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="p-4 w-[120px]">
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="p-4 w-[60px]">
                    <div className="flex justify-end">
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-16" />
          </div>
          <div className="text-muted-foreground flex grow justify-end text-sm whitespace-nowrap">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      </div>

      {/* Mobile Skeleton */}
      <div className="md:hidden">
        <div className="px-4 py-6 space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="px-4 py-3">
          <Skeleton className="h-10 w-full" />
        </div>
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
