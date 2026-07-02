"use client";

import { useState } from "react";
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
  RotateCcw,
  BookTemplate,
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
import {
  useChangePurchaseOrderStatus,
  useDeletePurchaseOrder,
  PURCHASE_ORDER_STATUS,
} from "@/src/graphql/purchaseOrderQueries";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { toast } from "@/src/components/ui/sonner";
import PurchaseOrderSidebar from "./purchase-order-sidebar";
import { AnimatePresence } from "framer-motion";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";

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

export default function PurchaseOrderRowActions({
  row,
  onRefetch,
  onSendEmail,
  onSaveAsTemplate,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const purchaseOrder = row.original;

  const { isReadOnly, isOwner } = useSubscriptionAccess();
  const { workspaceId } = useRequiredWorkspace();
  const { changeStatus, loading: changingStatus } =
    useChangePurchaseOrderStatus();
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
      toast.success("Bon de commande mis en attente");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error(error?.message || "Erreur lors de la confirmation");
    }
  };

  const handleValidate = async () => {
    try {
      await changeStatus(purchaseOrder.id, PURCHASE_ORDER_STATUS.VALIDATED);
      toast.success("Bon de commande validé par le client");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error(error?.message || "Erreur lors de la validation");
    }
  };

  const handleStartProgress = async () => {
    try {
      await changeStatus(purchaseOrder.id, PURCHASE_ORDER_STATUS.IN_PROGRESS);
      toast.success("Bon de commande en cours de traitement");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error(error?.message || "Erreur lors du changement de statut");
    }
  };

  const handleDeliver = async () => {
    try {
      await changeStatus(purchaseOrder.id, PURCHASE_ORDER_STATUS.DELIVERED);
      toast.success("Bon de commande marqué comme livré");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error(error?.message || "Erreur lors du changement de statut");
    }
  };

  const handleCancel = async () => {
    try {
      await changeStatus(purchaseOrder.id, PURCHASE_ORDER_STATUS.CANCELED);
      toast.success("Bon de commande annulé");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error(error?.message || "Erreur lors de l'annulation");
    }
  };

  const handleRevertToDraft = async () => {
    try {
      await changeStatus(purchaseOrder.id, PURCHASE_ORDER_STATUS.DRAFT);
      toast.success("Bon de commande repassé en brouillon");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error(error?.message || "Erreur lors du passage en brouillon");
    }
  };

  const handleConvertToInvoice = () => {
    try {
      const po = purchaseOrder;
      sessionStorage.setItem(
        "purchaseOrderInvoiceData",
        JSON.stringify({
          sourcePurchaseOrderId: po.id,
          purchaseOrderNumber: `${po.prefix || ""}-${po.number || ""}`,
          client: po.client,
          items: po.items,
          discount: po.discount,
          discountType: po.discountType,
          customFields: po.customFields,
          shipping: po.shipping,
          isReverseCharge: po.isReverseCharge,
          retenueGarantie: po.retenueGarantie,
          escompte: po.escompte,
        }),
      );
      router.push("/dashboard/outils/factures/new");
    } catch (error) {
      console.error("Erreur conversion BC → Facture:", error);
      toast.error("Erreur lors de la conversion en facture");
    }
  };

  const isLoading = changingStatus || isDeleting;

  // Déterminer les actions disponibles selon le statut
  const isDraft = purchaseOrder.status === PURCHASE_ORDER_STATUS.DRAFT;
  const isConfirmed = purchaseOrder.status === PURCHASE_ORDER_STATUS.CONFIRMED;
  const isValidated = purchaseOrder.status === PURCHASE_ORDER_STATUS.VALIDATED;
  const isInProgress =
    purchaseOrder.status === PURCHASE_ORDER_STATUS.IN_PROGRESS;
  const isDelivered = purchaseOrder.status === PURCHASE_ORDER_STATUS.DELIVERED;

  const hasStatusActions =
    isDraft || isConfirmed || isValidated || isInProgress;
  const hasLinkedInvoices =
    !!purchaseOrder.linkedInvoices && purchaseOrder.linkedInvoices.length > 0;
  const canConvertToInvoice =
    (isValidated || isInProgress || isDelivered) && !hasLinkedInvoices;
  // Annulation possible uniquement avant validation client
  const canCancel = (isDraft || isConfirmed) && !hasLinkedInvoices;

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
                    disabled={isReadOnly}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendEmail?.(purchaseOrder);
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
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveAsTemplate?.(purchaseOrder);
                }}
                disabled={isReadOnly}
              >
                <BookTemplate className="mr-2 h-4 w-4" />
                Sauv. modèle
              </DropdownMenuItem>
              {isDraft && (
                <DropdownMenuItem onClick={handleEdit} disabled={isReadOnly}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
              )}

              {/* Actions de statut */}
              {(hasStatusActions || canConvertToInvoice) && (
                <DropdownMenuSeparator />
              )}

              {isDraft && (
                <DropdownMenuItem
                  onClick={handleConfirm}
                  disabled={isLoading || isReadOnly}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmer
                </DropdownMenuItem>
              )}

              {isConfirmed && (
                <>
                  <DropdownMenuItem
                    onClick={handleValidate}
                    disabled={isLoading || isReadOnly}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marquer comme validé
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleRevertToDraft}
                    disabled={isLoading || isReadOnly}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Repasser en brouillon
                  </DropdownMenuItem>
                  {canCancel && (
                    <DropdownMenuItem
                      onClick={handleCancel}
                      disabled={isLoading || isReadOnly}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Annuler
                    </DropdownMenuItem>
                  )}
                </>
              )}

              {isValidated && (
                <DropdownMenuItem
                  onClick={handleStartProgress}
                  disabled={isLoading || isReadOnly}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Démarrer le traitement
                </DropdownMenuItem>
              )}

              {isInProgress && (
                <DropdownMenuItem
                  onClick={handleDeliver}
                  disabled={isLoading || isReadOnly}
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Marquer comme livré
                </DropdownMenuItem>
              )}

              {canConvertToInvoice && (
                <DropdownMenuItem
                  onClick={handleConvertToInvoice}
                  disabled={isLoading || isReadOnly}
                >
                  <FileCheck className="mr-2 h-4 w-4" />
                  Convertir en facture
                </DropdownMenuItem>
              )}

              {/* Suppression */}
              {isDraft && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isReadOnly}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </>
              )}
              {isReadOnly && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {isOwner
                      ? "Mode lecture seule · Renouvelez votre abonnement"
                      : "Mode lecture seule · Contactez l'administrateur"}
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      </div>

      {/* Sidebar pour desktop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <PurchaseOrderSidebar
            purchaseOrder={purchaseOrder}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onRefetch={onRefetch}
          />
        )}
      </AnimatePresence>
    </>
  );
}
