"use client";

import { useState } from "react";
import { 
  X, 
  FileText, 
  Building, 
  Clock, 
  Package, 
  Percent, 
  Eye, 
  Pencil, 
  CheckCircle, 
  XCircle, 
  FileCheck, 
  Send,
  Download
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useChangeQuoteStatus, useQuote, useConvertQuoteToInvoice, QUOTE_STATUS, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from "@/src/graphql/quoteQueries";
import { useCreateLinkedInvoice } from "@/src/graphql/invoiceQueries";
import { toast } from "sonner";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import UniversalPDFGenerator from "@/src/components/pdf/UniversalPDFGenerator";

import CreateLinkedInvoicePopover from "./create-linked-invoice-popover";
import LinkedInvoicesList from "./linked-invoices-list";


export default function QuoteSidebar({ isOpen, onClose, quote: initialQuote, onRefetch }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const router = useRouter();
  const { changeStatus, loading: changingStatus } = useChangeQuoteStatus();
  const { convertToInvoice, loading: converting } = useConvertQuoteToInvoice();
  const { createLinkedInvoice, loading: creatingLinkedInvoice } = useCreateLinkedInvoice();

  
  // Récupérer les données complètes du devis
  const { quote: fullQuote, loading: loadingFullQuote, error: quoteError } = useQuote(initialQuote?.id);
  
  if (!isOpen || !initialQuote) return null;
  
  // Utiliser les données complètes si disponibles, sinon les données initiales
  const quote = fullQuote || initialQuote;
  
  // Debug: Vérifier si les données complètes sont récupérées
  console.log("Loading full quote:", loadingFullQuote);
  console.log("Quote error:", quoteError);
  console.log("Full quote:", fullQuote);
  console.log("Final quote used:", quote);
  console.log("Client address:", quote.client?.address);
  console.log("Client address type:", typeof quote.client?.address);
  console.log("Client address keys:", quote.client?.address ? Object.keys(quote.client.address) : "No address");
  console.log("Items:", quote.items);
  console.log("Financial details:", {
    totalHT: quote.totalHT,
    finalTotalHT: quote.finalTotalHT,
    totalVAT: quote.totalVAT,
    finalTotalTTC: quote.finalTotalTTC
  });
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non définie";
    
    let date;
    // Gérer différents formats de date
    if (typeof dateString === "string" && /^\d+$/.test(dateString)) {
      date = new Date(parseInt(dateString));
    } else if (typeof dateString === "number") {
      date = new Date(dateString);
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      console.warn("Date invalide:", dateString);
      return "Date invalide";
    }
    
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return date.toLocaleDateString("fr-FR", options);
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

  const handleCancel = async () => {
    try {
      await changeStatus(quote.id, QUOTE_STATUS.CANCELED);
      toast.success("Devis annulé");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors de l'annulation du devis");
    }
  };

  const handleConvertToInvoice = async () => {
    try {
      const result = await convertToInvoice(quote.id);
      toast.success("Devis converti en facture avec succès");
      if (result?.id) {
        router.push(`/dashboard/outils/factures/${result.id}`);
      } else {
        router.push("/dashboard/outils/factures");
      }
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors de la conversion en facture");
    }
  };

  const handleCreateLinkedInvoice = async ({ quoteId, amount, isDeposit }) => {
    console.log('handleCreateLinkedInvoice appelé avec:', { quoteId, amount, isDeposit });
    try {
      console.log('Appel du hook createLinkedInvoice...');
      const result = await createLinkedInvoice(quoteId, amount, isDeposit);
      console.log('Résultat de createLinkedInvoice:', result);
      if (onRefetch) onRefetch();
      return result;
    } catch (error) {
      console.error('Erreur lors de la création de la facture liée:', error);
      throw error;
    }
  };

  const isLoading = changingStatus || converting || creatingLinkedInvoice;



  return (
    <>
      <div className={`fixed inset-y-0 right-0 z-50 w-[600px] bg-background border-l shadow-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">
                  Devis {quote.number || "Brouillon"}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={QUOTE_STATUS_COLORS[quote.status] || "secondary"}
                    className="text-xs"
                  >
                    {QUOTE_STATUS_LABELS[quote.status] || quote.status}
                  </Badge>
                  {isValidUntilExpired() && (
                    <Badge variant="destructive" className="text-xs">
                      Expiré
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Bouton PDF - masqué pour les brouillons */}
              {quote.status !== QUOTE_STATUS.DRAFT && (
                <UniversalPDFGenerator
                  data={quote}
                  type="quote"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    title="Télécharger en PDF"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger le PDF
                  </Button>
                </UniversalPDFGenerator>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
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
                      {quote.client.address.street && <p>{quote.client.address.street}</p>}
                      {(quote.client.address.postalCode || quote.client.address.city) && (
                        <p>
                          {quote.client.address.postalCode && quote.client.address.postalCode}
                          {quote.client.address.postalCode && quote.client.address.city && " "}
                          {quote.client.address.city && quote.client.address.city}
                        </p>
                      )}
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
                      <div className="font-medium">{item.description || "Article sans description"}</div>
                      <div className="text-muted-foreground">
                        {item.quantity || 0} × {formatCurrency(item.unitPrice || 0)}
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

            {/* Liste des factures liées */}
            {quote.status === QUOTE_STATUS.COMPLETED && (
              <div className="space-y-3">
                <LinkedInvoicesList 
                  quote={quote} 
                  onCreateLinkedInvoice={handleCreateLinkedInvoice}
                  isLoading={isLoading}
                />
              </div>
            )}
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
            
            {/* Bouton PDF avec UniversalPDFGenerator - masqué pour les brouillons */}
            {quote.status !== QUOTE_STATUS.DRAFT && (
              <UniversalPDFGenerator
                data={quote}
                type="quote"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  title="Télécharger en PDF"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </UniversalPDFGenerator>
            )}
            
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
              <Send className="h-4 w-4 mr-2" />
              Envoyer le devis
            </Button>
          )}

          {quote.status === QUOTE_STATUS.PENDING && (
            <div className="flex flex-col space-y-2">
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
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Annuler le devis
              </Button>
            </div>
          )}

          {(() => {
            console.log('Vérification statut devis:', {
              currentStatus: quote.status,
              expectedStatus: QUOTE_STATUS.COMPLETED,
              isCompleted: quote.status === QUOTE_STATUS.COMPLETED,
              allStatuses: QUOTE_STATUS,
              hasLinkedInvoices: quote.linkedInvoices && quote.linkedInvoices.length > 0,
              linkedInvoicesCount: quote.linkedInvoices?.length || 0
            });
            return quote.status === QUOTE_STATUS.COMPLETED;
          })() && (
            <div className="space-y-3">
              {/* Boutons de création de factures liées */}
              <div className="space-y-2">
                {/* Afficher le popover seulement s'il y a moins de 2 factures liées */}
                {(!quote.linkedInvoices || quote.linkedInvoices.length < 2) && (
                  <CreateLinkedInvoicePopover
                    quote={quote}
                    onCreateLinkedInvoice={handleCreateLinkedInvoice}
                    isLoading={isLoading}
                  />
                )}
                
                {/* Bouton pour créer la facture finale quand il y a exactement 2 factures liées */}
                {quote.linkedInvoices && quote.linkedInvoices.length === 2 && (() => {
                  const totalInvoiced = quote.linkedInvoices.reduce((sum, invoice) => sum + (invoice.finalTotalTTC || 0), 0);
                  const remainingAmount = (quote.finalTotalTTC || 0) - totalInvoiced;
                  return remainingAmount > 0 && (
                    <Button
                      onClick={() => handleCreateLinkedInvoice({ quoteId: quote.id, amount: remainingAmount, isDeposit: false })}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <FileCheck className="h-4 w-4 mr-2" />
                      Créer la facture finale ({formatCurrency(remainingAmount)})
                    </Button>
                  );
                })()}
              </div>
              
              {/* Bouton de conversion complète - séparé et en dessous */}
              {(!quote.linkedInvoices || quote.linkedInvoices.length === 0) && (
                <Button
                  variant="outline"
                  onClick={handleConvertToInvoice}
                  disabled={isLoading}
                  className="w-full"
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Conversion complète
                </Button>
              )}
            </div>
          )}


        </div>
        </div>
      </div>



      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader>
            <DialogTitle className="pl-6 pt-6">Aperçu du devis {quote.number || "Brouillon"}</DialogTitle>
          </DialogHeader>
          <div className="mt-0">
            <UniversalPreviewPDF 
              data={quote} 
              type="quote"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
