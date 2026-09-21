"use client";

import { Suspense, useState, useEffect } from "react";
import { PermissionButton } from "@/src/components/rbac";
import { Plus, Truck, PackageCheck, Clock } from "lucide-react";
import DeliveryNoteTable from "./components/delivery-note-table";
import {
  DeliveryNotePageSkeleton,
  DeliveryNoteTableSkeleton,
} from "./components/delivery-note-page-skeleton";
import { useRouter, useSearchParams } from "next/navigation";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { CompanyInfoGuard } from "@/src/components/company-info-guard";
import { useDeliveryNoteStats } from "@/src/graphql/deliveryNoteQueries";
import { useToastManager } from "@/src/components/ui/toast-manager";
import { SendDocumentModal } from "@/app/dashboard/outils/factures/components/send-document-modal";

function DeliveryNotesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dnIdToOpen, setDnIdToOpen] = useState(null);

  const toastManager = useToastManager();
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [newDnData, setNewDnData] = useState(null);

  // Un bon de livraison vient d'être créé (éditeur) : toast + proposition d'envoi
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedData = sessionStorage.getItem("newDeliveryNoteData");
    if (!storedData) return;
    try {
      const dnData = JSON.parse(storedData);
      setNewDnData(dnData);
      toastManager.add({
        type: "document",
        title: "Bon de livraison créé avec succès",
        description: `Bon de livraison ${dnData.number} créé`,
        timeout: 10000,
        actionProps: dnData.clientEmail
          ? {
              children: "Envoyer au client",
              onClick: () => setShowSendEmailModal(true),
            }
          : undefined,
      });
    } catch {
      // données illisibles : on ignore
    } finally {
      sessionStorage.removeItem("newDeliveryNoteData");
    }
  }, [toastManager]);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setDnIdToOpen(id);
      router.replace("/dashboard/outils/bons-de-livraison", { scroll: false });
    }
  }, [searchParams, router]);

  const handleNewDeliveryNote = () => {
    router.push("/dashboard/outils/bons-de-livraison/new");
  };

  const { stats, loading: statsLoading } = useDeliveryNoteStats();
  const pendingCount = stats?.pendingCount ?? 0;
  const shippedCount = stats?.shippedCount ?? 0;
  const deliveredCount = stats?.deliveredCount ?? 0;

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex md:flex-col md:h-[calc(100vh-64px)] overflow-hidden">
        <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-medium mb-2">Bons de livraison</h1>
          </div>
          <div className="flex gap-2">
            <PermissionButton
              requiresActiveSubscription
              resource="deliveryNotes"
              action="create"
              variant="primary"
              onClick={handleNewDeliveryNote}
              className="cursor-pointer"
              data-testid="new-delivery-note-button"
              tooltipNoAccess="Vous n'avez pas la permission de créer des bons de livraison"
            >
              <Plus size={14} strokeWidth={2} aria-hidden="true" />
              Nouveau bon de livraison
            </PermissionButton>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          <div className="flex flex-col min-h-full">
            {/* Cartes de stats : volumes logistiques, jamais de montant */}
            <div className="flex gap-3 px-4 sm:px-6 py-3">
              <div className="bg-background border rounded-lg px-4 py-3 flex items-center gap-0">
                <div className="pr-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      À expédier
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-medium tracking-tight">
                      {statsLoading ? "..." : pendingCount}
                    </span>
                  </div>
                </div>
                <div className="w-px h-10 bg-border mx-4" />
                <div className="pr-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      En cours de livraison
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-medium tracking-tight">
                      {statsLoading ? "..." : shippedCount}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-background border rounded-lg px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <PackageCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Livrés</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-medium tracking-tight">
                    {statsLoading ? "..." : deliveredCount}
                  </span>
                </div>
              </div>
            </div>

            <Suspense fallback={<DeliveryNoteTableSkeleton />}>
              <DeliveryNoteTable dnIdToOpen={dnIdToOpen} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-medium mb-2">Bons de livraison</h1>
              <p className="text-muted-foreground text-sm">
                Attestez la remise de vos marchandises
              </p>
            </div>
          </div>
        </div>

        <Suspense fallback={<DeliveryNoteTableSkeleton />}>
          <DeliveryNoteTable dnIdToOpen={dnIdToOpen} />
        </Suspense>

        <PermissionButton
          requiresActiveSubscription
          resource="deliveryNotes"
          action="create"
          onClick={handleNewDeliveryNote}
          className="fixed bottom-6 bg-[#5a50ff] right-6 h-14 w-14 rounded-full shadow-lg z-50 md:hidden"
          size="icon"
          hideIfNoAccess={true}
          tooltipNoAccess="Vous n'avez pas la permission de créer des bons de livraison"
        >
          <Plus className="h-6 w-6" />
        </PermissionButton>
      </div>

      {newDnData && (
        <SendDocumentModal
          open={showSendEmailModal}
          onOpenChange={setShowSendEmailModal}
          documentId={newDnData.id}
          documentType="deliveryNote"
          documentNumber={newDnData.number}
          clientName={newDnData.clientName}
          clientEmail={newDnData.clientEmail}
          totalAmount=""
          companyName={newDnData.companyName}
          issueDate={newDnData.issueDate}
          onSent={() => setShowSendEmailModal(false)}
          onClose={() => setShowSendEmailModal(false)}
        />
      )}
    </>
  );
}

export default function DeliveryNotesPage() {
  return (
    <ProRouteGuard
      pageName="Bons de livraison"
      fallback={<DeliveryNotePageSkeleton />}
    >
      <CompanyInfoGuard fallback={<DeliveryNotePageSkeleton />}>
        <DeliveryNotesContent />
      </CompanyInfoGuard>
    </ProRouteGuard>
  );
}
