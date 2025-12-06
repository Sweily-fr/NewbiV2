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
} from "lucide-react";
import { SendDocumentModal } from "./send-document-modal";
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
  useInvoice,
  INVOICE_STATUS,
} from "@/src/graphql/invoiceQueries";
import { useCreditNotesByInvoice } from "@/src/graphql/creditNoteQueries";
import { hasReachedCreditNoteLimit } from "@/src/utils/creditNoteUtils";
import { toast } from "@/src/components/ui/sonner";
import { usePermissions } from "@/src/hooks/usePermissions";
import InvoiceSidebar from "./invoice-sidebar";
import InvoiceMobileFullscreen from "./invoice-mobile-fullscreen";

// Fonction utilitaire pour formater les dates
const formatDateForEmail = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    let date;
    // Si c'est un timestamp en millisecondes (nombre ou string de chiffres)
    if (typeof dateValue === "number") {
      date = new Date(dateValue);
    } else if (typeof dateValue === "string") {
      // Si c'est un timestamp en string
      if (/^\d+$/.test(dateValue)) {
        date = new Date(parseInt(dateValue, 10));
      } else {
        // Sinon c'est une date ISO ou autre format string
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

export default function InvoiceRowActions({ row, onRefetch, showReminderIcon = false, isClientExcluded = false, onOpenReminderSettings }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileFullscreenOpen, setIsMobileFullscreenOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [canCreateCreditNote, setCanCreateCreditNote] = useState(false);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const router = useRouter();
  const invoice = row.original;
  const { canCreate } = usePermissions();

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
  const isImportedInvoice = invoice._type === 'imported';

  // Récupération de la facture complète avec tous ses détails (seulement pour les factures normales)
  const { invoice: fullInvoice, loading: loadingFullInvoice } = useInvoice(
    isImportedInvoice ? null : invoice.id
  );

  // Récupération des avoirs pour cette facture (seulement pour les factures normales)
  const { creditNotes, loading: loadingCreditNotes } = useCreditNotesByInvoice(
    isImportedInvoice ? null : invoice.id
  );

  const { markAsPaid, loading: markingAsPaid } = useMarkInvoiceAsPaid();
  const { changeStatus, loading: changingStatus } = useChangeInvoiceStatus();
  const { deleteInvoice, loading: isDeleting } = useDeleteInvoice();

  const handleView = () => {
    if (isMobile) {
      setIsMobileFullscreenOpen(true);
    } else {
      setIsSidebarOpen(true);
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
      console.error('Erreur lors du changement de statut:', error);
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

  // Afficher un badge Import pour les factures importées
  if (isImportedInvoice) {
    return (
      <div className="flex items-center justify-end gap-1" data-actions-cell>
        <Badge variant="outline" className="text-xs">
          Import
        </Badge>
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
        <ButtonGroup>
          {/* Icône d'envoi par email */}
          {invoice.status !== "DRAFT" && (
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
          {/* Icône de relance automatique */}
          {showReminderIcon && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 p-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenReminderSettings?.();
                    }}
                  >
                    <CalendarSync 
                      className={`h-4 w-4 ${
                        isClientExcluded 
                          ? "opacity-30" 
                          : ""
                      }`} 
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isClientExcluded ? "Client exclu des relances" : "Relance automatique activée"}</p>
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
                {!creditNoteLimitReached && canCreateCreditNote && (
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

            {invoice.status === INVOICE_STATUS.COMPLETED && !creditNoteLimitReached && canCreateCreditNote && (
              <DropdownMenuItem onClick={handleCreateCreditNote}>
                <Receipt className="mr-2 h-4 w-4" />
                Créer un avoir
              </DropdownMenuItem>
            )}

            {invoice.status === INVOICE_STATUS.CANCELED && !creditNoteLimitReached && canCreateCreditNote && (
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
        </ButtonGroup>
      </div>

      {/* Sidebar pour desktop */}
      <InvoiceSidebar
        invoice={invoice}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onRefetch={onRefetch}
      />

      {/* Fullscreen pour mobile - Ne monter que si ouvert */}
      {isMobileFullscreenOpen && (
        <InvoiceMobileFullscreen
          invoice={invoice}
          isOpen={isMobileFullscreenOpen}
          onClose={() => setIsMobileFullscreenOpen(false)}
          onRefetch={onRefetch}
        />
      )}

      {/* Modal d'envoi par email */}
      {showSendEmailModal && (
        <SendDocumentModal
          open={showSendEmailModal}
          onOpenChange={setShowSendEmailModal}
          documentId={invoice.id}
          documentType="invoice"
          documentNumber={`${invoice.prefix || "F"}-${invoice.number}`}
          clientName={invoice.client?.name}
          clientEmail={invoice.client?.email}
          totalAmount={new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(invoice.finalTotalTTC || invoice.totalTTC || 0)}
          companyName={invoice.companyInfo?.name}
          issueDate={formatDateForEmail(invoice.issueDate)}
          dueDate={formatDateForEmail(invoice.dueDate)}
          onSent={() => {
            setShowSendEmailModal(false);
            // La notification est déjà gérée par la modal
          }}
        />
      )}
    </>
  );
}
