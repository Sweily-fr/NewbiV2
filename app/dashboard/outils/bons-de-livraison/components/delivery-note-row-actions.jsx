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
  PackageCheck,
  RotateCcw,
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
  useChangeDeliveryNoteStatus,
  useDeleteDeliveryNote,
  useCreateInvoiceFromDeliveryNote,
  DELIVERY_NOTE_STATUS,
} from "@/src/graphql/deliveryNoteQueries";
import { toast } from "@/src/components/ui/sonner";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import DeliveryReceptionDialog from "./delivery-reception-dialog";

export default function DeliveryNoteRowActions({
  row,
  onRefetch,
  onSendEmail,
  onOpenSidebar,
}) {
  const router = useRouter();
  const deliveryNote = row.original;
  const [showReception, setShowReception] = useState(false);

  const { isReadOnly, isOwner } = useSubscriptionAccess();
  const { changeStatus, loading: changingStatus } =
    useChangeDeliveryNoteStatus();
  const { deleteDeliveryNote, loading: isDeleting } = useDeleteDeliveryNote();
  const { createInvoice, loading: creatingInvoice } =
    useCreateInvoiceFromDeliveryNote();

  const handleView = () => {
    onOpenSidebar?.(deliveryNote);
  };

  const handleEdit = () => {
    router.push(
      `/dashboard/outils/bons-de-livraison/${deliveryNote.id}/editer`,
    );
  };

  const handleDelete = async () => {
    try {
      await deleteDeliveryNote(deliveryNote.id);
      toast.success("Bon de livraison supprimé");
      onRefetch?.();
    } catch {
      toast.error("Erreur lors de la suppression du bon de livraison");
    }
  };

  const changeTo = async (status, successMessage) => {
    try {
      await changeStatus(deliveryNote.id, status);
      toast.success(successMessage);
      onRefetch?.();
    } catch (error) {
      toast.error(error?.message || "Erreur lors du changement de statut");
    }
  };

  const handleInvoice = async () => {
    try {
      const invoice = await createInvoice(deliveryNote.id);
      if (!invoice?.id) throw new Error("Facture non créée");
      toast.success("Facture brouillon créée à partir du bon de livraison");
      router.push(`/dashboard/outils/factures/${invoice.id}/editer`);
    } catch (error) {
      toast.error(error?.message || "Erreur lors de la création de la facture");
    }
  };

  const isLoading = changingStatus || isDeleting || creatingInvoice;

  const isDraft = deliveryNote.status === DELIVERY_NOTE_STATUS.DRAFT;
  const isPending = deliveryNote.status === DELIVERY_NOTE_STATUS.PENDING;
  const isShipped = deliveryNote.status === DELIVERY_NOTE_STATUS.SHIPPED;
  const isDelivered = deliveryNote.status === DELIVERY_NOTE_STATUS.DELIVERED;

  const hasLinkedInvoices =
    !!deliveryNote.linkedInvoices && deliveryNote.linkedInvoices.length > 0;
  // Facturable dès l'émission ; un BL issu d'une facture ne se refacture pas
  const canInvoice =
    (isPending || isShipped || isDelivered) &&
    !hasLinkedInvoices &&
    !deliveryNote.sourceInvoice;
  const canCancel = (isDraft || isPending || isShipped) && !hasLinkedInvoices;

  return (
    <>
      <div className="flex items-center justify-end gap-1" data-actions-cell>
        {/* Bouton invisible déclenché par le clic sur la ligne */}
        <button
          data-view-delivery-note
          onClick={handleView}
          className="hidden"
          aria-hidden="true"
        />
        <ButtonGroup>
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
                      onSendEmail?.(deliveryNote);
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
              {/* Un BL émis reste modifiable tant qu'il n'est pas livré */}
              {(isDraft || isPending || isShipped) && (
                <DropdownMenuItem onClick={handleEdit} disabled={isReadOnly}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
              )}

              {(isDraft || isPending || isShipped || canInvoice) && (
                <DropdownMenuSeparator />
              )}

              {isDraft && (
                <DropdownMenuItem
                  onClick={handleView}
                  disabled={isLoading || isReadOnly}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Émettre le bon de livraison
                </DropdownMenuItem>
              )}

              {isPending && (
                <>
                  <DropdownMenuItem
                    onClick={() =>
                      changeTo(
                        DELIVERY_NOTE_STATUS.SHIPPED,
                        "Bon de livraison marqué comme expédié",
                      )
                    }
                    disabled={isLoading || isReadOnly}
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    Marquer comme expédié
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowReception(true)}
                    disabled={isLoading || isReadOnly}
                  >
                    <PackageCheck className="mr-2 h-4 w-4" />
                    Marquer comme livré
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      changeTo(
                        DELIVERY_NOTE_STATUS.DRAFT,
                        "Bon de livraison repassé en brouillon",
                      )
                    }
                    disabled={isLoading || isReadOnly}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Repasser en brouillon
                  </DropdownMenuItem>
                </>
              )}

              {isShipped && (
                <DropdownMenuItem
                  onClick={() => setShowReception(true)}
                  disabled={isLoading || isReadOnly}
                >
                  <PackageCheck className="mr-2 h-4 w-4" />
                  Marquer comme livré
                </DropdownMenuItem>
              )}

              {canInvoice && (
                <DropdownMenuItem
                  onClick={handleInvoice}
                  disabled={isLoading || isReadOnly}
                >
                  <FileCheck className="mr-2 h-4 w-4" />
                  Facturer
                </DropdownMenuItem>
              )}

              {canCancel && !isDraft && (
                <DropdownMenuItem
                  onClick={() =>
                    changeTo(
                      DELIVERY_NOTE_STATUS.CANCELED,
                      "Bon de livraison annulé",
                    )
                  }
                  disabled={isLoading || isReadOnly}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Annuler
                </DropdownMenuItem>
              )}

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

      <DeliveryReceptionDialog
        open={showReception}
        onOpenChange={setShowReception}
        deliveryNote={deliveryNote}
        onDelivered={() => onRefetch?.()}
      />
    </>
  );
}
