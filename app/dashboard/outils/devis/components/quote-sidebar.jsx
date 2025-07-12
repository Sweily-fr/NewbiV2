"use client";

import { useState } from "react";
import { X, Eye, Pencil, Trash2, CheckCircle, FileText, XCircle, Download, Send, Copy, Clock, Building, Tag, Package, Percent, FileCheck } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useChangeQuoteStatus, useQuote, useConvertQuoteToInvoice, QUOTE_STATUS, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from "@/src/graphql/quoteQueries";
import { toast } from "sonner";
import QuotePreview from "./QuotePreview";

export default function QuoteSidebar({ isOpen, onClose, quote: initialQuote, onRefetch }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const router = useRouter();
  const { changeStatus, loading: changingStatus } = useChangeQuoteStatus();
  const { convertToInvoice, loading: converting } = useConvertQuoteToInvoice();
  
  // Récupérer les données complètes du devis
  const { quote: fullQuote, loading: loadingFullQuote, error: quoteError } = useQuote(initialQuote?.id);
  
  if (!isOpen || !initialQuote) return null;
  
  // Utiliser les données complètes si disponibles, sinon les données initiales
  const quote = fullQuote || initialQuote;
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    
    let date;
    // Gérer les timestamps en millisecondes (string ou number)
    if (typeof dateString === 'string' && /^\d+$/.test(dateString)) {
      date = new Date(parseInt(dateString, 10));
    } else if (typeof dateString === 'number') {
      date = new Date(dateString);
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      console.warn('Date invalide:', dateString);
      return 'Date invalide';
    }
    
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };

  const isValidUntilExpired = () => {
    if (!quote.validUntil) return false;
    const validDate = new Date(quote.validUntil);
    const today = new Date();
    return validDate < today;
  };

  const handleEdit = () => {
    router.push(`/dashboard/outils/devis/${quote.id}/editer`);
    onClose();
  };

  const handleView = () => {
    router.push(`/dashboard/outils/devis/${quote.id}`);
    onClose();
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
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la conversion en facture');
    }
  };

  const isLoading = changingStatus || converting;

  return (
    <>
      <div className={`fixed inset-y-0 right-0 z-50 w-96 bg-background border-l transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold">
              {quote.number || 'Brouillon'}
            </h2>
            <Badge className={`mt-1 ${QUOTE_STATUS_COLORS[quote.status] || ''}`}>
              {QUOTE_STATUS_LABELS[quote.status] || quote.status}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Client Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Client</h3>
            </div>
            {quote.client ? (
              <div className="space-y-2">
                <div>
                  <p className="font-medium">{quote.client.name}</p>
                  {quote.client.email && (
                    <p className="text-sm text-muted-foreground">{quote.client.email}</p>
                  )}
                </div>
                {quote.client.address && (
                  <div className="text-sm text-muted-foreground">
                    <p>{quote.client.address.street}</p>
                    <p>{quote.client.address.postalCode} {quote.client.address.city}</p>
                    {quote.client.address.country && <p>{quote.client.address.country}</p>}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Aucun client sélectionné</p>
            )}
          </div>

          <Separator />

          {/* Dates */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Dates</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date d'émission</span>
                <span>{formatDate(quote.issueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valide jusqu'au</span>
                <span className={isValidUntilExpired() ? "text-red-600 font-medium" : ""}>
                  {formatDate(quote.validUntil)}
                  {isValidUntilExpired() && (
                    <span className="text-xs block text-red-500">Expiré</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Articles */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Articles</h3>
            </div>
            <div className="space-y-2">
              {quote.items && quote.items.length > 0 ? (
                quote.items.map((item, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium">{item.description}</div>
                    <div className="text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Aucun article</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Totaux</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total HT</span>
                <span>{formatCurrency(quote.totalHT || 0)}</span>
              </div>
              {quote.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remise</span>
                  <span>-{formatCurrency(quote.discountAmount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total HT</span>
                <span>{formatCurrency(quote.finalTotalHT || quote.totalHT || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA</span>
                <span>{formatCurrency(quote.totalVAT || 0)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total TTC</span>
                <span>{formatCurrency(quote.finalTotalTTC || quote.totalTTC || 0)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Preview Thumbnail */}
          <div className="space-y-3">
            <h3 className="font-medium">Aperçu</h3>
            <div 
              className="border w-[200px] rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setIsPreviewOpen(true)}
            >
              <div className="aspect-[3/4] bg-white border rounded shadow-sm flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Eye className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-xs">Cliquer pour voir l'aperçu</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t p-6 space-y-3">
          {/* Primary Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewOpen(true)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </Button>
            {quote.status === QUOTE_STATUS.DRAFT && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex-1"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Éditer
              </Button>
            )}
          </div>

          {/* Status Actions */}
          {quote.status === QUOTE_STATUS.DRAFT && (
            <Button
              onClick={handleSendQuote}
              disabled={isLoading}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              Envoyer le devis
            </Button>
          )}

          {quote.status === QUOTE_STATUS.PENDING && (
            <div className="space-y-2">
              <Button
                onClick={handleAccept}
                disabled={isLoading}
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accepter le devis
              </Button>
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isLoading}
                className="w-full"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter le devis
              </Button>
            </div>
          )}

          {quote.status === QUOTE_STATUS.ACCEPTED && (
            <Button
              onClick={handleConvertToInvoice}
              disabled={isLoading}
              className="w-full"
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Convertir en facture
            </Button>
          )}

          {/* Additional Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" size="sm" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="ghost" size="sm" className="flex-1">
              <Send className="h-4 w-4 mr-2" />
              Envoyer
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader>
            <DialogTitle className="pl-6 pt-6">Aperçu du devis {quote.number || 'Brouillon'}</DialogTitle>
          </DialogHeader>
          <div className="mt-0">
            <QuotePreview data={quote} enablePDF={false} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
