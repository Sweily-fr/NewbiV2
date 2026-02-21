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
  FileText,
  XCircle,
  FileCheck,
  Mail,
  ShoppingCart,
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
  useChangeQuoteStatus,
  useDeleteQuote,
  QUOTE_STATUS,
  GET_QUOTE,
} from "@/src/graphql/quoteQueries";
import { useConvertQuoteToPurchaseOrder } from "@/src/graphql/purchaseOrderQueries";
import { useApolloClient } from "@apollo/client";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { toast } from "@/src/components/ui/sonner";
import QuoteSidebar from "./quote-sidebar";
import QuoteMobileFullscreen from "./quote-mobile-fullscreen";

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

export default function QuoteRowActions({ row, onRefetch }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileFullscreenOpen, setIsMobileFullscreenOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const router = useRouter();
  const quote = row.original;

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const apolloClient = useApolloClient();
  const { workspaceId } = useRequiredWorkspace();
  const { changeStatus, loading: changingStatus } = useChangeQuoteStatus();
  const { deleteQuote, loading: isDeleting } = useDeleteQuote();
  const { convertToPurchaseOrder, loading: convertingToPO } = useConvertQuoteToPurchaseOrder();

  const handleView = () => {
    if (isMobile) {
      setIsMobileFullscreenOpen(true);
    } else {
      setIsSidebarOpen(true);
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/outils/devis/${quote.id}/editer`);
  };

  const handleDelete = async () => {
    try {
      await deleteQuote(quote.id);
      toast.success("Devis supprimé avec succès");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors de la suppression du devis");
    }
  };

  const handleSendQuote = async () => {
    try {
      await changeStatus(quote.id, QUOTE_STATUS.PENDING);
      toast.success("Devis envoyé avec succès");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors de l'envoi du devis");
    }
  };

  const handleAccept = async () => {
    try {
      await changeStatus(quote.id, QUOTE_STATUS.COMPLETED);
      toast.success("Devis accepté");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors de l'acceptation du devis");
    }
  };

  const handleReject = async () => {
    try {
      await changeStatus(quote.id, QUOTE_STATUS.CANCELED);
      toast.success("Devis rejeté");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors du rejet du devis");
    }
  };

  const handleConvertToInvoice = async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_QUOTE,
        variables: { workspaceId, id: quote.id },
        fetchPolicy: "network-only",
      });
      const fullQuote = data?.quote;
      if (!fullQuote) {
        toast.error("Impossible de récupérer le devis");
        return;
      }
      sessionStorage.setItem('quoteInvoiceData', JSON.stringify({
        sourceQuoteId: fullQuote.id,
        purchaseOrderNumber: `${fullQuote.prefix || ''}${fullQuote.number || ''}`,
        client: fullQuote.client,
        items: fullQuote.items,
        discount: fullQuote.discount,
        discountType: fullQuote.discountType,
        customFields: fullQuote.customFields,
        shipping: fullQuote.shipping,
        isReverseCharge: fullQuote.isReverseCharge,
        retenueGarantie: fullQuote.retenueGarantie,
        escompte: fullQuote.escompte,
      }));
      router.push('/dashboard/outils/factures/new');
    } catch (error) {
      toast.error("Erreur lors de la conversion en facture");
    }
  };

  const handleConvertToPurchaseOrder = async () => {
    try {
      const result = await convertToPurchaseOrder(quote.id);
      toast.success("Bon de commande créé à partir du devis");
      if (onRefetch) onRefetch();
      if (result?.id) {
        router.push(`/dashboard/outils/bons-commande/${result.id}/editer`);
      }
    } catch (error) {
      toast.error("Erreur lors de la création du bon de commande");
    }
  };

  const isLoading = changingStatus || isDeleting || convertingToPO;

  // Logique pour déterminer quelles actions sont disponibles
  const canConvertToPO = quote.status === QUOTE_STATUS.COMPLETED;
  const canConvertToInvoice = quote.status === QUOTE_STATUS.COMPLETED &&
    (!quote.linkedInvoices || quote.linkedInvoices.length === 0);
  const hasStatusActions =
    quote.status === QUOTE_STATUS.DRAFT || // Envoyer le devis
    quote.status === QUOTE_STATUS.PENDING || // Accepter/Rejeter
    canConvertToInvoice || canConvertToPO;

  const hasDeleteAction = quote.status === QUOTE_STATUS.DRAFT;

  return (
    <>
      <div className="flex items-center justify-end gap-1" data-actions-cell>
        {/* Bouton invisible pour déclencher l'ouverture via le clic sur la ligne */}
        <button
          data-view-quote
          onClick={handleView}
          className="hidden"
          aria-hidden="true"
        />
        <ButtonGroup>
          {/* Icône d'envoi par email */}
          {quote.status !== "DRAFT" && (
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
            {(quote.status === QUOTE_STATUS.DRAFT || quote.status === QUOTE_STATUS.PENDING) && (
              <DropdownMenuItem onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Éditer
              </DropdownMenuItem>
            )}

            {/* Séparateur entre les actions de base et les actions de statut */}
            {hasStatusActions && <DropdownMenuSeparator />}

            {quote.status === QUOTE_STATUS.DRAFT && (
              <DropdownMenuItem onClick={handleSendQuote} disabled={isLoading}>
                <FileText className="mr-2 h-4 w-4" />
                Envoyer le devis
              </DropdownMenuItem>
            )}

            {quote.status === QUOTE_STATUS.PENDING && (
              <>
                <DropdownMenuItem onClick={handleAccept} disabled={isLoading}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accepter le devis
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleReject} disabled={isLoading}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Rejeter le devis
                </DropdownMenuItem>
              </>
            )}

            {canConvertToInvoice && (
                <DropdownMenuItem
                  onClick={handleConvertToInvoice}
                  disabled={isLoading}
                >
                  <FileCheck className="mr-2 h-4 w-4" />
                  Convertir en facture
                </DropdownMenuItem>
              )}

            {canConvertToPO && (
                <DropdownMenuItem
                  onClick={handleConvertToPurchaseOrder}
                  disabled={isLoading}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Convertir en bon de commande
                </DropdownMenuItem>
              )}

            {/* Séparateur avant l'action de suppression */}
            {hasDeleteAction && hasStatusActions && <DropdownMenuSeparator />}

            {hasDeleteAction && (
              <DropdownMenuItem onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      </div>

      {/* Sidebar pour desktop */}
      <QuoteSidebar
        quote={quote}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onRefetch={onRefetch}
        isViewMode={true}
      />

      {/* Fullscreen pour mobile - Ne monter que si ouvert */}
      {isMobileFullscreenOpen && (
        <QuoteMobileFullscreen
          quote={quote}
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
          documentId={quote.id}
          documentType="quote"
          documentNumber={`${quote.prefix || "D"}-${quote.number}`}
          clientName={quote.client?.name}
          clientEmail={quote.client?.email}
          totalAmount={new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(quote.finalTotalTTC || quote.totalTTC || 0)}
          companyName={quote.companyInfo?.name}
          issueDate={formatDateForEmail(quote.issueDate)}
          onSent={() => {
            setShowSendEmailModal(false);
            // La notification est déjà gérée par la modal
          }}
        />
      )}

    </>
  );
}
