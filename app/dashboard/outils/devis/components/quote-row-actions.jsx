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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import {
  useChangeQuoteStatus,
  useDeleteQuote,
  useConvertQuoteToInvoice,
  QUOTE_STATUS,
} from "@/src/graphql/quoteQueries";
import { toast } from "@/src/components/ui/sonner";
import QuoteSidebar from "./quote-sidebar";
import QuoteMobileFullscreen from "./quote-mobile-fullscreen";

export default function QuoteRowActions({ row, onRefetch }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileFullscreenOpen, setIsMobileFullscreenOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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
  const { changeStatus, loading: changingStatus } = useChangeQuoteStatus();
  const { deleteQuote, loading: isDeleting } = useDeleteQuote();
  const { convertToInvoice, loading: converting } = useConvertQuoteToInvoice();

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
      const result = await convertToInvoice(quote.id);
      // toast.success("Devis converti en facture avec succès");
      if (onRefetch) onRefetch();
      // Optionnel: rediriger vers la facture créée
      if (result?.data?.convertQuoteToInvoice?.id) {
        router.push(
          `/dashboard/outils/factures/${result.data.convertQuoteToInvoice.id}`
        );
      }
    } catch (error) {
      toast.error("Erreur lors de la conversion en facture");
    }
  };

  const isLoading = changingStatus || isDeleting || converting;

  // Logique pour déterminer quelles actions sont disponibles
  const hasStatusActions =
    quote.status === QUOTE_STATUS.DRAFT || // Envoyer le devis
    quote.status === QUOTE_STATUS.PENDING || // Accepter/Rejeter
    (quote.status === QUOTE_STATUS.COMPLETED &&
      (!quote.linkedInvoices || quote.linkedInvoices.length === 0)); // Convertir en facture

  const hasDeleteAction = quote.status === QUOTE_STATUS.DRAFT;

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
            {quote.status === QUOTE_STATUS.DRAFT && (
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

            {quote.status === QUOTE_STATUS.COMPLETED &&
              (!quote.linkedInvoices || quote.linkedInvoices.length === 0) && (
                <DropdownMenuItem
                  onClick={handleConvertToInvoice}
                  disabled={isLoading}
                >
                  <FileCheck className="mr-2 h-4 w-4" />
                  Convertir en facture
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
    </>
  );
}
