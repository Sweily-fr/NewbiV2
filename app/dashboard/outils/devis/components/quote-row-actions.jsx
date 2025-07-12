"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2, MoreHorizontal, CheckCircle, FileText, XCircle, FileCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import { useChangeQuoteStatus, useDeleteQuote, useConvertQuoteToInvoice, QUOTE_STATUS } from "@/src/graphql/quoteQueries";
import { toast } from "sonner";
import QuoteSidebar from "./quote-sidebar";

export default function QuoteRowActions({ row, onRefetch }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const quote = row.original;
  const { changeStatus, loading: changingStatus } = useChangeQuoteStatus();
  const { deleteQuote, loading: isDeleting } = useDeleteQuote();
  const { convertToInvoice, loading: converting } = useConvertQuoteToInvoice();

  const handleView = () => {
    setIsSidebarOpen(true);
  };

  const handleEdit = () => {
    router.push(`/dashboard/outils/devis/${quote.id}/editer`);
  };

  const handleDelete = async () => {
    try {
      await deleteQuote(quote.id);
      toast.success('Devis supprimé avec succès');
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error('Erreur lors de la suppression du devis');
    }
  };

  const handleSendQuote = async () => {
    try {
      await changeStatus(quote.id, QUOTE_STATUS.PENDING);
      toast.success('Devis envoyé avec succès');
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du devis');
    }
  };

  const handleAccept = async () => {
    try {
      await changeStatus(quote.id, QUOTE_STATUS.ACCEPTED);
      toast.success('Devis accepté');
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error('Erreur lors de l\'acceptation du devis');
    }
  };

  const handleReject = async () => {
    try {
      await changeStatus(quote.id, QUOTE_STATUS.REJECTED);
      toast.success('Devis rejeté');
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error('Erreur lors du rejet du devis');
    }
  };

  const handleConvertToInvoice = async () => {
    try {
      const result = await convertToInvoice(quote.id);
      toast.success('Devis converti en facture avec succès');
      if (onRefetch) onRefetch();
      // Optionnel: rediriger vers la facture créée
      if (result?.data?.convertQuoteToInvoice?.id) {
        router.push(`/dashboard/outils/factures/${result.data.convertQuoteToInvoice.id}`);
      }
    } catch (error) {
      toast.error('Erreur lors de la conversion en facture');
    }
  };

  const isLoading = changingStatus || isDeleting || converting;

  return (
    <>
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0" disabled={isLoading}>
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
            
            {/* Séparateur seulement s'il y a des actions de statut après les actions de base */}
            {(quote.status === QUOTE_STATUS.DRAFT || quote.status === QUOTE_STATUS.PENDING || quote.status === QUOTE_STATUS.ACCEPTED) && (
              <DropdownMenuSeparator />
            )}
            
            {quote.status === QUOTE_STATUS.DRAFT && (
              <DropdownMenuItem 
                onClick={handleSendQuote}
                disabled={isLoading}
              >
                <FileText className="mr-2 h-4 w-4" />
                Envoyer le devis
              </DropdownMenuItem>
            )}
            
            {quote.status === QUOTE_STATUS.PENDING && (
              <>
                <DropdownMenuItem 
                  onClick={handleAccept}
                  disabled={isLoading}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accepter le devis
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleReject}
                  disabled={isLoading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Rejeter le devis
                </DropdownMenuItem>
              </>
            )}

            {quote.status === QUOTE_STATUS.ACCEPTED && (
              <DropdownMenuItem 
                onClick={handleConvertToInvoice}
                disabled={isLoading}
              >
                <FileCheck className="mr-2 h-4 w-4" />
                Convertir en facture
              </DropdownMenuItem>
            )}
            
            {/* Séparateur seulement s'il y a l'action supprimer (devis brouillon uniquement) */}
            {quote.status === QUOTE_STATUS.DRAFT && (
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
      <QuoteSidebar
        quote={quote}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onRefetch={onRefetch}
      />
    </>
  );
}
