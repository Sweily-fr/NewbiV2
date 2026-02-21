"use client";

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
  Download,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useRouter } from "next/navigation";
import {
  useChangeQuoteStatus,
  useQuote,
  useConvertQuoteToInvoice,
  QUOTE_STATUS,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_COLORS,
} from "@/src/graphql/quoteQueries";
import { useCreateLinkedInvoice } from "@/src/graphql/invoiceQueries";
import { useConvertQuoteToPurchaseOrder } from "@/src/graphql/purchaseOrderQueries";
import { toast } from "@/src/components/ui/sonner";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import UniversalPDFDownloader from "@/src/components/pdf/UniversalPDFDownloader";

import CreateLinkedInvoicePopover from "./create-linked-invoice-popover";
import LinkedInvoicesList from "./linked-invoices-list";

export default function QuoteSidebar({
  isOpen,
  onClose,
  quote: initialQuote,
  onRefetch,
  isViewMode = false,
}) {
  const router = useRouter();
  const { changeStatus, loading: changingStatus } = useChangeQuoteStatus();
  const { convertToInvoice, loading: converting } = useConvertQuoteToInvoice();
  const { createLinkedInvoice, loading: creatingLinkedInvoice } =
    useCreateLinkedInvoice();
  const { convertToPurchaseOrder, loading: convertingToPO } =
    useConvertQuoteToPurchaseOrder();

  // Récupérer les données complètes du devis
  const {
    quote: fullQuote,
    loading: loadingFullQuote,
    error: quoteError,
  } = useQuote(initialQuote?.id);

  if (!isOpen || !initialQuote) return null;

  // Utiliser les données complètes si disponibles, sinon les données initiales
  const quote = fullQuote || initialQuote;

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

  const handleConvertToPurchaseOrder = async () => {
    try {
      const result = await convertToPurchaseOrder(quote.id);
      toast.success("Bon de commande créé à partir du devis");
      if (onRefetch) onRefetch();
      if (result?.id) {
        router.push(`/dashboard/outils/bons-commande/${result.id}/editer`);
      }
      onClose();
    } catch (error) {
      toast.error("Erreur lors de la création du bon de commande");
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
        router.push(`/dashboard/outils/factures/${result.id}/editer`);
      } else {
        router.push("/dashboard/outils/factures");
      }
      if (onRefetch) onRefetch();
      onClose(); // Fermer la sidebar après la conversion
    } catch (error) {
      toast.error("Erreur lors de la conversion en facture");
    }
  };

  const handleCreateLinkedInvoice = async ({ quoteId, amount, isDeposit }) => {
    try {
      const result = await createLinkedInvoice(quoteId, amount, isDeposit);

      // Naviguer vers l'éditeur de facture brouillon
      if (result?.invoice?.id) {
        router.push(`/dashboard/outils/factures/${result.invoice.id}/editer`);
        onClose(); // Fermer la sidebar
      }

      if (onRefetch) onRefetch();
      return result;
    } catch (error) {
      throw error;
    }
  };

  const isLoading = changingStatus || converting || creatingLinkedInvoice || convertingToPO;

  return (
    <>
      {/* Semi-transparent overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* PDF Preview Panel */}
      <div
        className={`fixed inset-y-0 left-0 right-[35%] z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute inset-0 bg-black/80 p-0 flex items-start justify-center overflow-y-auto py-12 px-24">
          <div className="w-[210mm] max-w-full min-h-[calc(100%-4rem)] bg-white">
            <UniversalPreviewPDF data={quote} type="quote" />
          </div>
        </div>
      </div>


      {/* Main Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-[35%] bg-background border-l shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex flex-col gap-2">
              <h2 className="font-normal text-lg">
                Devis {quote.prefix && quote.number ? `${quote.prefix}-${quote.number}` : quote.number || "Brouillon"}
              </h2>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    quote.status === 'DRAFT'
                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                      : quote.status === 'PENDING'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                      : quote.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                  }`}
                >
                  {QUOTE_STATUS_LABELS[quote.status] || quote.status}
                </span>
                {isValidUntilExpired() && (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                    Expiré
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Bouton PDF - masqué pour les brouillons */}
              {quote.status !== QUOTE_STATUS.DRAFT && (
                <UniversalPDFDownloader data={quote} type="quote" />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="h-8 w-8 p-0 relative z-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Client Info */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Client</h3>
              {quote.client ? (
                <div className="space-y-1.5">
                  <div>
                    <p className="font-medium">{quote.client.name}</p>
                    {quote.client.email && (
                      <p className="text-sm text-muted-foreground">
                        {quote.client.email}
                      </p>
                    )}
                  </div>
                  {quote.client.address && (
                    <div className="text-sm text-muted-foreground">
                      {quote.client.address.street && (
                        <p>{quote.client.address.street}</p>
                      )}
                      {(quote.client.address.postalCode ||
                        quote.client.address.city) && (
                        <p>
                          {quote.client.address.postalCode &&
                            quote.client.address.postalCode}
                          {quote.client.address.postalCode &&
                            quote.client.address.city &&
                            " "}
                          {quote.client.address.city &&
                            quote.client.address.city}
                        </p>
                      )}
                      {quote.client.address.country && (
                        <p>{quote.client.address.country}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Aucun client sélectionné
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dates</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date d'émission</span>
                  <span>{formatDate(quote.issueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valide jusqu'au</span>
                  <span
                    className={
                      isValidUntilExpired() ? "text-red-600 font-medium" : ""
                    }
                  >
                    {formatDate(quote.validUntil)}
                    {isValidUntilExpired() && (
                      <span className="text-xs block text-red-500">Expiré</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Articles */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Articles</h3>
              <div className="space-y-1.5">
                {quote.items && quote.items.length > 0 ? (
                  quote.items.map((item, index) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium">
                        {item.description || "Article sans description"}
                      </div>
                      <div className="text-muted-foreground">
                        {item.quantity || 0} ×{" "}
                        {formatCurrency(item.unitPrice || 0)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Aucun article</p>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Totaux</h3>
              <div className="space-y-1.5">
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
                  <span>
                    {formatCurrency(
                      quote.finalTotalHT !== undefined && quote.finalTotalHT !== null
                        ? quote.finalTotalHT
                        : quote.totalHT !== undefined && quote.totalHT !== null
                          ? quote.totalHT
                          : 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVA</span>
                  <span>
                    {formatCurrency(
                      quote.finalTotalVAT !== undefined && quote.finalTotalVAT !== null
                        ? quote.finalTotalVAT
                        : quote.totalVAT !== undefined && quote.totalVAT !== null
                          ? quote.totalVAT
                          : 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total TTC</span>
                  <span>
                    {formatCurrency(
                      quote.finalTotalTTC !== undefined && quote.finalTotalTTC !== null
                        ? quote.finalTotalTTC
                        : quote.totalTTC !== undefined && quote.totalTTC !== null
                          ? quote.totalTTC
                          : 0
                    )}
                  </span>
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
              {(quote.status === QUOTE_STATUS.DRAFT || quote.status === QUOTE_STATUS.PENDING) && (
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
              return quote.status === QUOTE_STATUS.COMPLETED;
            })() && (
              <div className="space-y-3">
                {/* Boutons de création de factures liées */}
                <div className="space-y-2">
                  {/* Afficher le popover seulement s'il y a moins de 2 factures liées */}
                  {(!quote.linkedInvoices ||
                    quote.linkedInvoices.length < 2) && (
                    <CreateLinkedInvoicePopover
                      quote={quote}
                      onCreateLinkedInvoice={handleCreateLinkedInvoice}
                      isLoading={isLoading}
                    />
                  )}

                  {/* Bouton pour créer la facture finale quand il y a exactement 2 factures liées */}
                  {quote.linkedInvoices &&
                    quote.linkedInvoices.length === 2 &&
                    (() => {
                      const totalInvoiced = quote.linkedInvoices.reduce(
                        (sum, invoice) => sum + (invoice.finalTotalTTC || 0),
                        0
                      );
                      const remainingAmount =
                        (quote.finalTotalTTC || 0) - totalInvoiced;
                      return (
                        remainingAmount > 0 && (
                          <Button
                            onClick={() =>
                              handleCreateLinkedInvoice({
                                quoteId: quote.id,
                                amount: remainingAmount,
                                isDeposit: false,
                              })
                            }
                            disabled={isLoading}
                            className="w-full"
                          >
                            <FileCheck className="h-4 w-4 mr-2" />
                            Créer la facture finale (
                            {formatCurrency(remainingAmount)})
                          </Button>
                        )
                      );
                    })()}
                </div>

                {/* Bouton de conversion complète - séparé et en dessous */}
                {(!quote.linkedInvoices ||
                  quote.linkedInvoices.length === 0) && (
                  <Button
                    variant="outline"
                    onClick={handleConvertToInvoice}
                    disabled={isLoading}
                    className="w-full font-normal text-sm"
                  >
                    <FileCheck className="h-4 w-4 mr-2" />
                    Conversion complète
                  </Button>
                )}

                {/* Bouton de conversion en bon de commande */}
                <Button
                  variant="outline"
                  onClick={handleConvertToPurchaseOrder}
                  disabled={isLoading}
                  className="w-full font-normal text-sm"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Convertir en bon de commande
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
