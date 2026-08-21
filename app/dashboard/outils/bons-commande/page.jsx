"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { Button } from "@/src/components/ui/button";
import { PermissionButton } from "@/src/components/rbac";
import { Plus } from "lucide-react";
import {
  SettingIcon as Settings,
  ExportIcon as Download,
} from "@/src/components/icons";
import PurchaseOrderTable from "./components/purchase-order-table";
import {
  PurchaseOrderPageSkeleton,
  PurchaseOrderTableSkeleton,
} from "./components/purchase-order-page-skeleton";
import PurchaseOrderExportButton from "./components/purchase-order-export-button";
import { PurchaseOrderSettingsModal } from "./components/purchase-order-settings-modal";
import { useRouter, useSearchParams } from "next/navigation";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { CompanyInfoGuard } from "@/src/components/company-info-guard";
import {
  usePurchaseOrders,
  PURCHASE_ORDER_STATUS,
} from "@/src/graphql/purchaseOrderQueries";
import { useToastManager } from "@/src/components/ui/toast-manager";
import { SendDocumentModal } from "@/app/dashboard/outils/factures/components/send-document-modal";

function PurchaseOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [poIdToOpen, setPoIdToOpen] = useState(null);

  // Ref pour déclencher l'import depuis le header
  const [triggerImport, setTriggerImport] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
            description: `Bon de commande ${poData.number} créé`,
            timeout: 10000,
            actionProps: poData.clientEmail
              ? {
                  children: "Envoyer au client",
                  onClick: () => {
                    setShowSendEmailModal(true);
                  },
                }
              : undefined,
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
  const {
    purchaseOrders,
    loading: poLoading,
    refetch: refetchPurchaseOrders,
  } = usePurchaseOrders();

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
      if (po.status === PURCHASE_ORDER_STATUS.CANCELED) {
        return;
      }

      // finalTotalHT inclut la remise globale du document, contrairement à totalHT
      const poAmount = po.finalTotalHT ?? po.totalHT ?? 0;

      totalAmount += poAmount;

      if (po.status !== PURCHASE_ORDER_STATUS.DRAFT) {
        confirmedAmount += poAmount;
      }

      if (po.status === PURCHASE_ORDER_STATUS.IN_PROGRESS) {
        inProgressAmount += poAmount;
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
        {/* Header - Fixe */}
        <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-medium mb-2">Bons de commande</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
            <Button variant="outline" onClick={() => setTriggerImport(true)}>
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Importer
            </Button>
            <PurchaseOrderExportButton
              purchaseOrders={purchaseOrders}
              iconOnly={false}
            />
            <PermissionButton
              requiresActiveSubscription
              resource="purchaseOrders"
              action="create"
              variant="primary"
              onClick={handleNewPurchaseOrder}
              className="cursor-pointer"
              data-testid="new-purchase-order-button"
              tooltipNoAccess="Vous n'avez pas la permission de créer des bons de commande"
            >
              <Plus size={14} strokeWidth={2} aria-hidden="true" />
              Nouveau bon de commande
            </PermissionButton>
          </div>
        </div>

        {/* Zone scrollable */}
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="flex flex-col min-h-full">
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
                onBalancesRefetch={refetchPurchaseOrders}
              />
            </Suspense>
          </div>
          {/* Fin min-h-full */}
        </div>
        {/* Fin zone scrollable */}
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSettingsOpen(true)}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Suspense fallback={<PurchaseOrderTableSkeleton />}>
          <PurchaseOrderTable />
        </Suspense>

        <PermissionButton
          requiresActiveSubscription
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

      {/* Modal des paramètres */}
      <PurchaseOrderSettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <ProRouteGuard
      pageName="Bons de commande"
      fallback={<PurchaseOrderPageSkeleton />}
    >
      <CompanyInfoGuard fallback={<PurchaseOrderPageSkeleton />}>
        <PurchaseOrdersContent />
      </CompanyInfoGuard>
    </ProRouteGuard>
  );
}
