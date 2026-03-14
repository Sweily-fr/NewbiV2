"use client";

import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
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
  CalendarSync,
  Mail,
  FileUp,
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
  useMarkInvoiceAsPaid,
  useChangeInvoiceStatus,
  useDeleteInvoice,
  INVOICE_STATUS,
} from "@/src/graphql/invoiceQueries";
import { toast } from "@/src/components/ui/sonner";
import { usePermissions } from "@/src/hooks/usePermissions";
// InvoiceSidebar est maintenant géré au niveau du tableau (InvoiceTable) pour éviter les re-renders
import InvoiceMobileFullscreen from "./invoice-mobile-fullscreen";
import { formatLocalDate } from "@/src/utils/dateFormatter";

export default function InvoiceRowActions({
  row,
  onRefetch,
  showReminderIcon = false,
  isClientExcluded = false,
  onOpenReminderSettings,
  onOpenSidebar, // Callback pour ouvrir la sidebar au niveau du tableau
  onSendEmail, // Callback pour ouvrir la modal d'envoi au niveau du tableau
  onSaveAsTemplate, // Callback pour ouvrir le dialog de template au niveau du tableau
}) {
  // OPTIMISÉ: Suppression de isSidebarOpen - géré au niveau du tableau pour éviter les re-renders
  const [isMobileFullscreenOpen, setIsMobileFullscreenOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [canCreateCreditNote, setCanCreateCreditNote] = useState(false);
  const router = useRouter();
  const invoice = row.original;
  const { canCreate } = usePermissions();

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Vérifier les permissions pour créer un avoir
  useEffect(() => {
    const checkPermission = async () => {
      const allowed = await canCreate("creditNotes");
      setCanCreateCreditNote(allowed);
    };
    checkPermission();
  }, [canCreate]);

  // Ne pas récupérer les détails pour les factures importées
  const isImportedInvoice = invoice._type === "imported";

  // OPTIMISÉ: Suppression de useInvoice et useCreditNotesByInvoice pour éviter les re-renders
  // Ces données sont récupérées dans la sidebar elle-même
  const { markAsPaid, loading: markingAsPaid } = useMarkInvoiceAsPaid();
  const { changeStatus, loading: changingStatus } = useChangeInvoiceStatus();
  const { deleteInvoice, loading: isDeleting } = useDeleteInvoice();

  const handleView = () => {
    if (isMobile) {
      setIsMobileFullscreenOpen(true);
    } else {
      // Utiliser la callback du tableau pour ouvrir la sidebar
      if (onOpenSidebar) {
        onOpenSidebar(invoice);
      }
    }
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
      toast.success("Facture créée avec succès");
      if (onRefetch) onRefetch();
    } catch (error) {
      // L'erreur est gérée par errorLink dans apolloClient.js
      console.error("Erreur lors du changement de statut:", error);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      const today = formatLocalDate();
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

  const isLoading = markingAsPaid || changingStatus || isDeleting;

  // Afficher un badge Import pour les factures importées
  if (isImportedInvoice) {
    return (
      <div className="flex items-center justify-end gap-1" data-actions-cell>
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-[#5a50ff]/10 text-[#5a50ff] dark:bg-[#5a50ff]/20 dark:text-[#5a50ff]">
          <FileUp className="w-3 h-3" />
          Import
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1" data-actions-cell>
        {/* Bouton invisible pour déclencher l'ouverture via le clic sur la ligne */}
        <button
          data-view-invoice
          onClick={handleView}
          className="hidden"
          aria-hidden="true"
        />
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
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onSaveAsTemplate?.(invoice);
              }}
            >
              <BookTemplate className="mr-2 h-4 w-4" />
              Sauv. modèle
            </DropdownMenuItem>
            {invoice.status === INVOICE_STATUS.DRAFT && (
              <DropdownMenuItem onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Éditer
              </DropdownMenuItem>
            )}

            {invoice.status === INVOICE_STATUS.PENDING && (
              <>
                <DropdownMenuItem onClick={handleMarkAsPaid}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marquer comme payée
                </DropdownMenuItem>
                {canCreateCreditNote && (
                  <DropdownMenuItem onClick={handleCreateCreditNote}>
                    <Receipt className="mr-2 h-4 w-4" />
                    Créer un avoir
                  </DropdownMenuItem>
                )}
              </>
            )}

            {invoice.status === INVOICE_STATUS.COMPLETED &&
              canCreateCreditNote && (
                <DropdownMenuItem onClick={handleCreateCreditNote}>
                  <Receipt className="mr-2 h-4 w-4" />
                  Créer un avoir
                </DropdownMenuItem>
              )}

            {invoice.status === INVOICE_STATUS.CANCELED &&
              canCreateCreditNote && (
                <DropdownMenuItem onClick={handleCreateCreditNote}>
                  <Receipt className="mr-2 h-4 w-4" />
                  Créer un avoir
                </DropdownMenuItem>
              )}

            {/* Envoyer par email - visible pour les factures non brouillon */}
            {invoice.status !== "DRAFT" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendEmail?.(invoice);
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Envoyer par email
                </DropdownMenuItem>
              </>
            )}

            {/* Annuler - pour les factures en attente */}
            {invoice.status === INVOICE_STATUS.PENDING && (
              <>
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

            {/* Créer la facture et Supprimer - pour les brouillons */}
            {invoice.status === INVOICE_STATUS.DRAFT && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleCreateInvoice}
                  disabled={isLoading}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Créer la facture
                </DropdownMenuItem>
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

      {/* Sidebar pour desktop - DÉPLACÉE AU NIVEAU DU TABLEAU pour éviter les re-renders */}

      {/* Fullscreen pour mobile - Ne monter que si ouvert */}
      {isMobileFullscreenOpen && (
        <InvoiceMobileFullscreen
          invoice={invoice}
          isOpen={isMobileFullscreenOpen}
          onClose={() => setIsMobileFullscreenOpen(false)}
          onRefetch={onRefetch}
        />
      )}

    </>
  );
}
