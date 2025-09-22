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
  FileText,
  XCircle,
  Receipt,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import {
  useMarkInvoiceAsPaid,
  useChangeInvoiceStatus,
  useDeleteInvoice,
  useInvoice,
  INVOICE_STATUS,
} from "@/src/graphql/invoiceQueries";
import { useCreditNotesByInvoice } from "@/src/graphql/creditNoteQueries";
import { hasReachedCreditNoteLimit } from "@/src/utils/creditNoteUtils";
import { toast } from "@/src/components/ui/sonner";
import InvoiceSidebar from "./invoice-sidebar";

export default function InvoiceRowActions({ row, onRefetch }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const invoice = row.original;

  // Récupération de la facture complète avec tous ses détails
  const { invoice: fullInvoice, loading: loadingFullInvoice } = useInvoice(
    invoice.id
  );

  // Récupération des avoirs pour cette facture
  const { creditNotes, loading: loadingCreditNotes } = useCreditNotesByInvoice(invoice.id);

  const { markAsPaid, loading: markingAsPaid } = useMarkInvoiceAsPaid();
  const { changeStatus, loading: changingStatus } = useChangeInvoiceStatus();
  const { deleteInvoice, loading: isDeleting } = useDeleteInvoice();

  const handleView = () => {
    setIsSidebarOpen(true);
  };

  const handleEdit = () => {
    router.push(`/dashboard/outils/factures/${invoice.id}/editer`);
  };

  const handleDelete = async () => {
    try {
      await deleteInvoice(invoice.id);
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors de la suppression de la facture");
    }
  };

  const handleCreateInvoice = async () => {
    try {
      await changeStatus(invoice.id, INVOICE_STATUS.PENDING);
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors de la création de la facture");
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      await markAsPaid(invoice.id, today);
      toast.success("Facture marquée comme payée");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors du marquage comme payée");
    }
  };

  const handleCancel = async () => {
    try {
      await changeStatus(invoice.id, INVOICE_STATUS.CANCELED);
      toast.success("Facture annulée");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors de l'annulation de la facture");
    }
  };

  const handleCreateCreditNote = () => {
    router.push(`/dashboard/outils/factures/${invoice.id}/avoir/nouveau`);
  };

  // Vérifier si la facture a atteint sa limite d'avoirs
  const currentInvoice = fullInvoice || invoice;
  const creditNoteLimitReached = hasReachedCreditNoteLimit(currentInvoice, creditNotes);

  const isLoading = markingAsPaid || changingStatus || isDeleting;

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
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
            {invoice.status === INVOICE_STATUS.DRAFT && (
              <DropdownMenuItem onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Éditer
              </DropdownMenuItem>
            )}

            {/* Séparateur seulement pour les brouillons qui ont des actions supplémentaires */}
            {invoice.status === INVOICE_STATUS.DRAFT && (
              <DropdownMenuSeparator />
            )}

            {invoice.status === INVOICE_STATUS.DRAFT && (
              <DropdownMenuItem
                onClick={handleCreateInvoice}
                disabled={isLoading}
              >
                <FileText className="mr-2 h-4 w-4" />
                Créer la facture
              </DropdownMenuItem>
            )}

            {invoice.status === INVOICE_STATUS.PENDING && (
              <>
                <DropdownMenuItem onClick={handleMarkAsPaid}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marquer comme payée
                </DropdownMenuItem>
                {!creditNoteLimitReached && (
                  <DropdownMenuItem onClick={handleCreateCreditNote}>
                    <Receipt className="mr-2 h-4 w-4" />
                    Créer un avoir
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleCancel}
                  className="text-red-600 focus:text-red-600"
                >
                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                  Annuler
                </DropdownMenuItem>
              </>
            )}

            {invoice.status === INVOICE_STATUS.COMPLETED && !creditNoteLimitReached && (
              <DropdownMenuItem onClick={handleCreateCreditNote}>
                <Receipt className="mr-2 h-4 w-4" />
                Créer un avoir
              </DropdownMenuItem>
            )}

            {invoice.status === INVOICE_STATUS.CANCELED && !creditNoteLimitReached && (
              <DropdownMenuItem onClick={handleCreateCreditNote}>
                <Receipt className="mr-2 h-4 w-4" />
                Créer un avoir
              </DropdownMenuItem>
            )}

            {/* Séparateur seulement s'il y a l'action supprimer (factures brouillon uniquement) */}
            {invoice.status === INVOICE_STATUS.DRAFT && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                  Supprimer
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Sidebar */}
      <InvoiceSidebar
        invoice={invoice}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onRefetch={onRefetch}
      />
    </>
  );
}
