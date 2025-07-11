"use client";

import { useState } from "react";
import { X, Eye, Pencil, Trash2, CheckCircle, FileText, XCircle, Download, Send, Copy, Clock, Building, Tag, Package, Percent } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useMarkInvoiceAsPaid, useChangeInvoiceStatus, useInvoice, INVOICE_STATUS, INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from "@/src/graphql/invoiceQueries";
import { toast } from "sonner";
import InvoicePreview from "./InvoicePreview";

export default function InvoiceSidebar({ isOpen, onClose, invoice: initialInvoice }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const router = useRouter();
  const { markAsPaid, loading: markingAsPaid } = useMarkInvoiceAsPaid();
  const { changeStatus, loading: changingStatus } = useChangeInvoiceStatus();
  
  // Récupérer les données complètes de la facture
  const { invoice: fullInvoice, loading: loadingFullInvoice, error: invoiceError } = useInvoice(initialInvoice?.id);
  
  if (!isOpen || !initialInvoice) return null;
  
  // Utiliser les données complètes si disponibles, sinon les données initiales
  const invoice = fullInvoice || initialInvoice;
  
  // Debug: Vérifier si les données complètes sont récupérées
  console.log('Loading full invoice:', loadingFullInvoice);
  console.log('Invoice error:', invoiceError);
  console.log('Full invoice:', fullInvoice);
  console.log('Final invoice used:', invoice);
  console.log('Client address:', invoice.client?.address);
  console.log('Financial details:', {
    totalHT: invoice.totalHT,
    finalTotalHT: invoice.finalTotalHT,
    totalVAT: invoice.totalVAT,
    finalTotalTTC: invoice.finalTotalTTC
  });

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

  const handleEdit = () => {
    router.push(`/dashboard/outils/factures/${invoice.id}/editer`);
    onClose();
  };

  const handleView = () => {
    router.push(`/dashboard/outils/factures/${invoice.id}`);
    onClose();
  };

  const handleCreateInvoice = async () => {
    try {
      await changeStatus(invoice.id, INVOICE_STATUS.PENDING);
      toast.success('Facture créée avec succès');
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error('Erreur lors de la création de la facture');
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await markAsPaid(invoice.id, today);
      toast.success('Facture marquée comme payée');
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error('Erreur lors du marquage comme payée');
    }
  };

  const handleCancel = async () => {
    try {
      await changeStatus(invoice.id, INVOICE_STATUS.CANCELED);
      toast.success('Facture annulée');
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error('Erreur lors de l\'annulation de la facture');
    }
  };

  const isLoading = markingAsPaid || changingStatus;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        style={{
          right: isOpen ? '600px' : '0',
          transition: 'right 0.2s ease-in-out'
        }}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-[600px] bg-card border-l shadow-lg z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Détails de la facture</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status and Number */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Numéro</span>
              <span className="font-mono text-sm">{invoice.number || 'Brouillon'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Statut</span>
              <Badge 
                variant="secondary"
                className={`${INVOICE_STATUS_COLORS[invoice.status]}`}
              >
                {INVOICE_STATUS_LABELS[invoice.status]}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="space-y-3">
            <h3 className="font-medium">Dates importantes</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Émission</span>
                <span>{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Échéance</span>
                <span>{formatDate(invoice.dueDate)}</span>
              </div>
              {invoice.paymentDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paiement</span>
                  <span>{formatDate(invoice.paymentDate)}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Client Info */}
          <div className="space-y-3">
            <h3 className="font-medium">Client</h3>
            <div className="text-sm space-y-1">
              <div className="font-medium">
                {invoice.client?.type === 'COMPANY' ? invoice.client?.name : 
                 `${invoice.client?.firstName || ''} ${invoice.client?.lastName || ''}`.trim() || invoice.client?.name}
              </div>
              <div className="text-muted-foreground">{invoice.client?.email}</div>
              {invoice.client?.address && (
                <div className="text-muted-foreground text-xs">
                  {invoice.client.address.street && (
                    <>{invoice.client.address.street}<br /></>
                  )}
                  {(invoice.client.address.postalCode || invoice.client.address.city) && (
                    <>{invoice.client.address.postalCode} {invoice.client.address.city}</>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Financial Info */}
          <div className="space-y-3">
            <h3 className="font-medium">Montants</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total HT</span>
                <span>{formatCurrency(invoice.finalTotalHT || invoice.totalHT || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA</span>
                <span>{formatCurrency(invoice.totalVAT || 0)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total TTC</span>
                <span>{formatCurrency(invoice.finalTotalTTC || invoice.totalTTC || 0)}</span>
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
            {invoice.status === INVOICE_STATUS.DRAFT && (
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
          {invoice.status === INVOICE_STATUS.DRAFT && (
            <Button
              onClick={handleCreateInvoice}
              disabled={isLoading}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              Créer la facture
            </Button>
          )}

          {invoice.status === INVOICE_STATUS.PENDING && (
            <div className="space-y-2">
              <Button
                onClick={handleMarkAsPaid}
                disabled={isLoading}
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marquer comme payée
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Annuler la facture
              </Button>
            </div>
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
            <Button variant="ghost" size="sm" className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Dupliquer
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader>
            <DialogTitle className="pl-6 pt-6">Aperçu de la facture {invoice.number || 'Brouillon'}</DialogTitle>
          </DialogHeader>
          <div className="mt-0">
            <InvoicePreview data={invoice} enablePDF={false} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
