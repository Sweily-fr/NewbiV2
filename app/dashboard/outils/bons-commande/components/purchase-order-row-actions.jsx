"use client";

import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  FileCheck,
  Mail,
  XCircle,
  Truck,
  Play,
} from "lucide-react";
import { ButtonGroup } from "@/src/components/ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import { SendDocumentModal } from "../../factures/components/send-document-modal";
import {
  useChangePurchaseOrderStatus,
  useDeletePurchaseOrder,
  PURCHASE_ORDER_STATUS,
  GET_PURCHASE_ORDER,
} from "@/src/graphql/purchaseOrderQueries";
import { useApolloClient } from "@apollo/client";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { toast } from "@/src/components/ui/sonner";
import PurchaseOrderSidebar from "./purchase-order-sidebar";

// Fonction utilitaire pour formater les dates
const formatDateForEmail = (dateValue) => {
  if (!dateValue) return null;

  try {
    let date;
    if (typeof dateValue === "number") {
      date = new Date(dateValue);
    } else if (typeof dateValue === "string") {
      if (/^\d+$/.test(dateValue)) {
        date = new Date(parseInt(dateValue, 10));
      } else {
        date = new Date(dateValue);
      }
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return null;
    }

    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString("fr-FR");
  } catch {
    return null;
  }
};

export default function PurchaseOrderRowActions({ row, onRefetch }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const router = useRouter();
  const purchaseOrder = row.original;

  const apolloClient = useApolloClient();
  const { workspaceId } = useRequiredWorkspace();
  const { changeStatus, loading: changingStatus } = useChangePurchaseOrderStatus();
  const { deletePurchaseOrder, loading: isDeleting } = useDeletePurchaseOrder();

  const handleView = () => {
    setIsSidebarOpen(true);
  };

  const handleEdit = () => {
    router.push(`/dashboard/outils/bons-commande/${purchaseOrder.id}/editer`);
  };

  const handleDelete = async () => {
    try {
      await deletePurchaseOrder(purchaseOrder.id);
      toast.success("Bon de commande supprimé avec succès");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors de la suppression du bon de commande");
    }
  };

  const handleConfirm = async () => {
    try {
      await changeStatus(purchaseOrder.id, PURCHASE_ORDER_STATUS.CONFIRMED);
      toast.success("Bon de commande confirmé");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors de la confirmation");
    }
  };

  const handleStartProgress = async () => {
    try {
      await changeStatus(purchaseOrder.id, PURCHASE_ORDER_STATUS.IN_PROGRESS);
      toast.success("Bon de commande en cours de traitement");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors du changement de statut");
    }
  };

  const handleDeliver = async () => {
    try {
      await changeStatus(purchaseOrder.id, PURCHASE_ORDER_STATUS.DELIVERED);
      toast.success("Bon de commande marqué comme livré");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors du changement de statut");
    }
  };

  const handleCancel = async () => {
    try {
      await changeStatus(purchaseOrder.id, PURCHASE_ORDER_STATUS.CANCELED);
      toast.success("Bon de commande annulé");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors de l'annulation");
    }
  };

  const handleConvertToInvoice = async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_PURCHASE_ORDER,
        variables: { workspaceId, id: purchaseOrder.id },
        fetchPolicy: "network-only",
      });
      const po = data?.purchaseOrder;
      if (!po) {
        toast.error("Impossible de récupérer le bon de commande");
        return;
      }
      sessionStorage.setItem('purchaseOrderInvoiceData', JSON.stringify({
        sourcePurchaseOrderId: po.id,
        purchaseOrderNumber: `${po.prefix || ''}${po.number || ''}`,
        client: po.client,
        items: po.items,
        discount: po.discount,
        discountType: po.discountType,
        customFields: po.customFields,
        shipping: po.shipping,
        isReverseCharge: po.isReverseCharge,
        retenueGarantie: po.retenueGarantie,
        escompte: po.escompte,
      }));
      router.push('/dashboard/outils/factures/new');
    } catch (error) {
      toast.error("Erreur lors de la conversion en facture");
    }
  };

  const isLoading = changingStatus || isDeleting;

  // Déterminer les actions disponibles selon le statut
  const isDraft = purchaseOrder.status === PURCHASE_ORDER_STATUS.DRAFT;
  const isConfirmed = purchaseOrder.status === PURCHASE_ORDER_STATUS.CONFIRMED;
  const isInProgress = purchaseOrder.status === PURCHASE_ORDER_STATUS.IN_PROGRESS;
  const isDelivered = purchaseOrder.status === PURCHASE_ORDER_STATUS.DELIVERED;

  const hasStatusActions = isDraft || isConfirmed || isInProgress;
  const canConvertToInvoice =
    (isConfirmed || isInProgress || isDelivered) &&
    (!purchaseOrder.linkedInvoices || purchaseOrder.linkedInvoices.length === 0);

  return (
    <>
      <div className="flex items-center justify-end gap-1" data-actions-cell>
        {/* Bouton invisible pour déclencher l'ouverture via le clic sur la ligne */}
        <button
          data-view-purchase-order
          onClick={handleView}
          className="hidden"
          aria-hidden="true"
        />
        <ButtonGroup>
          {/* Icône d'envoi par email */}
          {!isDraft && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 p-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSendEmailModal(true);
                    }}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Envoyer par email</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 p-0"
                disabled={isLoading}
              >
                <span className="sr-only">Ouvrir le menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleView}>
                <Eye className="mr-2 h-4 w-4" />
                Voir
              </DropdownMenuItem>
              {isDraft && (
                <DropdownMenuItem onClick={handleEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
              )}

              {/* Actions de statut */}
              {(hasStatusActions || canConvertToInvoice) && <DropdownMenuSeparator />}

              {isDraft && (
                <DropdownMenuItem onClick={handleConfirm} disabled={isLoading}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmer
                </DropdownMenuItem>
              )}

              {isConfirmed && (
                <>
                  <DropdownMenuItem onClick={handleStartProgress} disabled={isLoading}>
                    <Play className="mr-2 h-4 w-4" />
                    Démarrer le traitement
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCancel} disabled={isLoading}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Annuler
                  </DropdownMenuItem>
                </>
              )}

              {isInProgress && (
                <>
                  <DropdownMenuItem onClick={handleDeliver} disabled={isLoading}>
                    <Truck className="mr-2 h-4 w-4" />
                    Marquer comme livré
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCancel} disabled={isLoading}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Annuler
                  </DropdownMenuItem>
                </>
              )}

              {canConvertToInvoice && (
                <DropdownMenuItem onClick={handleConvertToInvoice} disabled={isLoading}>
                  <FileCheck className="mr-2 h-4 w-4" />
                  Convertir en facture
                </DropdownMenuItem>
              )}

              {/* Suppression */}
              {isDraft && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      </div>

      {/* Sidebar pour desktop */}
      <PurchaseOrderSidebar
        purchaseOrder={purchaseOrder}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onRefetch={onRefetch}
      />

      {/* Modal d'envoi par email */}
      {showSendEmailModal && (
        <SendDocumentModal
          open={showSendEmailModal}
          onOpenChange={setShowSendEmailModal}
          documentId={purchaseOrder.id}
          documentType="purchaseOrder"
          documentNumber={`${purchaseOrder.prefix || "BC"}-${purchaseOrder.number}`}
          clientName={purchaseOrder.client?.name}
          clientEmail={purchaseOrder.client?.email}
          totalAmount={new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(purchaseOrder.finalTotalTTC || purchaseOrder.totalTTC || 0)}
          companyName={purchaseOrder.companyInfo?.name}
          issueDate={formatDateForEmail(purchaseOrder.issueDate)}
          onSent={() => setShowSendEmailModal(false)}
        />
      )}
    </>
  );
}
