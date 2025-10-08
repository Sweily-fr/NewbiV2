"use client";

import { useState, useEffect } from "react";
import {
  X,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  FileText,
  XCircle,
  Download,
  Loader2,
  Clock,
  Building,
  Tag,
  Package,
  Percent,
  Receipt,
  Plus,
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
  useMarkInvoiceAsPaid,
  useChangeInvoiceStatus,
  useInvoice,
  INVOICE_STATUS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from "@/src/graphql/invoiceQueries";
import { useCreditNotesByInvoice } from "@/src/graphql/creditNoteQueries";
import { hasReachedCreditNoteLimit } from "@/src/utils/creditNoteUtils";
import { toast } from "@/src/components/ui/sonner";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import UniversalPDFDownloader from "@/src/components/pdf/UniversalPDFDownloader";
import CreditNoteMobileFullscreen from "./credit-note-mobile-fullscreen";

export default function InvoiceSidebar({
  isOpen,
  onClose,
  invoice: initialInvoice,
  onRefetch,
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState(null);
  const [isCreditNotePreviewOpen, setIsCreditNotePreviewOpen] = useState(false);
  const [isCreditNoteMobileFullscreen, setIsCreditNoteMobileFullscreen] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const router = useRouter();
  const { markAsPaid, loading: markingAsPaid } = useMarkInvoiceAsPaid();
  const { changeStatus, loading: changingStatus } = useChangeInvoiceStatus();

  // Fetch credit notes for this invoice
  const {
    creditNotes,
    loading: loadingCreditNotes,
    error: creditNotesError,
  } = useCreditNotesByInvoice(initialInvoice?.id);

  // Récupérer les données complètes de la facture
  const {
    invoice: fullInvoice,
    loading: loadingFullInvoice,
    error: invoiceError,
  } = useInvoice(initialInvoice?.id);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Réinitialiser showMobileDetails quand la sidebar se ferme
  useEffect(() => {
    if (!isOpen) {
      setShowMobileDetails(false);
    }
  }, [isOpen]);

  if (!isOpen || !initialInvoice) return null;

  // Utiliser les données complètes si disponibles, sinon les données initiales
  const invoice = fullInvoice || initialInvoice;

  // Debug: Vérifier si les données complètes sont récupérées
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non définie";

    let date;
    // Gérer les timestamps en millisecondes (string ou number)
    if (typeof dateString === "string" && /^\d+$/.test(dateString)) {
      date = new Date(parseInt(dateString, 10));
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
    onClose();
  };

  const handleViewCreditNote = (creditNote) => {
    setSelectedCreditNote(creditNote);
    if (isMobile) {
      setIsCreditNoteMobileFullscreen(true);
    } else {
      setIsCreditNotePreviewOpen(true);
    }
  };

  // Vérifier si la facture a atteint sa limite d'avoirs
  const creditNoteLimitReached = hasReachedCreditNoteLimit(
    invoice,
    creditNotes
  );

  const isLoading = markingAsPaid || changingStatus;

  return (
    <>
      {/* Semi-transparent overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* PDF Preview Section */}
      <div
        className={`fixed inset-y-0 left-0 md:right-[35%] right-0 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute inset-0 bg-black/80 p-0 flex items-start justify-center overflow-y-auto py-4 md:py-12 px-2 md:px-24">
          <div className="w-[210mm] max-w-full min-h-[calc(100%-4rem)] bg-white">
            <UniversalPreviewPDF data={invoice} type="invoice" />
          </div>
        </div>
        
        {/* Bouton flottant pour ouvrir les détails sur mobile */}
        <Button
          onClick={() => setShowMobileDetails(true)}
          className="md:hidden fixed bottom-6 right-6 z-[60] rounded-full h-14 w-14 shadow-lg"
          size="icon"
        >
          <Eye className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Sidebar - Hidden on mobile by default, shown in modal */}
      <div
        className={`fixed inset-y-0 right-0 z-50 md:w-[35%] w-full bg-background border-l shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? (showMobileDetails ? "translate-x-0" : "md:translate-x-0 translate-x-full") : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-medium">Détails de la facture</h2>
          <div className="flex items-center gap-2">
            {/* Bouton PDF - masqué pour les brouillons */}
            {invoice.status !== INVOICE_STATUS.DRAFT && (
              <UniversalPDFDownloader
                data={invoice}
                type="invoice"
                variant="default"
                size="sm"
                className="flex items-center gap-2"
              >
                Télécharger en PDF
              </UniversalPDFDownloader>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                // Sur mobile, fermer d'abord les détails, puis la sidebar
                if (window.innerWidth < 768 && showMobileDetails) {
                  setShowMobileDetails(false);
                } else {
                  setShowMobileDetails(false);
                  onClose();
                }
              }}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status and Number */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-normal">Numéro</span>
              <span className="font-mono text-sm">
                {invoice.number || "Brouillon"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-normal">Statut</span>
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
            <h3 className="font-normal">Dates importantes</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-normal">Émission</span>
                <span>{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-normal">Échéance</span>
                <span>{formatDate(invoice.dueDate)}</span>
              </div>
              {invoice.paymentDate && (
                <div className="flex justify-between">
                  <span className="font-normal">Paiement</span>
                  <span>{formatDate(invoice.paymentDate)}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Client Info */}
          <div className="space-y-3">
            <h3 className="font-normal">Client</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-normal">Nom</span>
                <span>
                  {invoice.client?.type === "COMPANY"
                    ? String(invoice.client?.name || "")
                    : `${String(invoice.client?.firstName || "")} ${String(invoice.client?.lastName || "")}`.trim() ||
                      String(invoice.client?.name || "")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-normal">Email</span>
                <span>{String(invoice.client?.email || "")}</span>
              </div>
              {invoice.client?.address && (
                <div className="flex justify-between">
                  <span className="font-normal">Adresse</span>
                  <div className="text-right">
                    {invoice.client.address.street && (
                      <div>{String(invoice.client.address.street)}</div>
                    )}
                    {(invoice.client.address.postalCode ||
                      invoice.client.address.city) && (
                      <div>
                        {String(invoice.client.address.postalCode || "")}{" "}
                        {String(invoice.client.address.city || "")}
                      </div>
                    )}
                    {invoice.client.address.country && (
                      <div>{String(invoice.client.address.country)}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Financial Info */}
          <div className="space-y-3">
            <h3 className="font-normal">Montants</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-normal">Total HT</span>
                <span>
                  {formatCurrency(
                    invoice.finalTotalHT !== undefined && invoice.finalTotalHT !== null
                      ? invoice.finalTotalHT
                      : invoice.totalHT !== undefined && invoice.totalHT !== null
                        ? invoice.totalHT
                        : 0
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-normal">TVA</span>
                <span>
                  {formatCurrency(
                    invoice.finalTotalVAT !== undefined && invoice.finalTotalVAT !== null
                      ? invoice.finalTotalVAT
                      : invoice.totalVAT !== undefined && invoice.totalVAT !== null
                        ? invoice.totalVAT
                        : 0
                  )}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="font-normal">Total TTC</span>
                <span>
                  {formatCurrency(
                    invoice.finalTotalTTC !== undefined && invoice.finalTotalTTC !== null
                      ? invoice.finalTotalTTC
                      : invoice.totalTTC !== undefined && invoice.totalTTC !== null
                        ? invoice.totalTTC
                        : 0
                  )}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Credit Notes Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-normal">Avoirs</h3>
              {(invoice.status === INVOICE_STATUS.PENDING ||
                invoice.status === INVOICE_STATUS.COMPLETED ||
                invoice.status === INVOICE_STATUS.CANCELED) &&
                !creditNoteLimitReached && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateCreditNote}
                    className="h-7 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Créer un avoir
                  </Button>
                )}
            </div>

            {loadingCreditNotes ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : creditNotesError ? (
              <div className="text-sm text-red-500 py-2">
                Erreur lors du chargement des avoirs: {creditNotesError.message}
              </div>
            ) : creditNotes && creditNotes.length > 0 ? (
              <div className="space-y-2">
                {creditNotes.map((creditNote) => (
                  <div
                    key={creditNote.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="flex flex-col cursor-pointer flex-1 min-w-0"
                        onClick={() => handleViewCreditNote(creditNote)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Receipt className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {creditNote.number}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground ml-9">
                          {formatDate(creditNote.issueDate)} •{" "}
                          {formatCurrency(creditNote.finalTotalTTC || 0)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <UniversalPDFDownloader
                          data={creditNote}
                          type="creditNote"
                          filename={`avoir-${creditNote.number}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                {invoice.status === INVOICE_STATUS.PENDING ||
                invoice.status === INVOICE_STATUS.COMPLETED ||
                invoice.status === INVOICE_STATUS.CANCELED ? (
                  <div>
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    {creditNoteLimitReached ? (
                      <>
                        <p>Limite d'avoirs atteinte</p>
                        <p className="text-xs mt-1">
                          La somme des avoirs a atteint le montant de la facture
                        </p>
                      </>
                    ) : (
                      <>
                        <p>Aucun avoir créé</p>
                        <p className="text-xs mt-1">
                          Cliquez sur "Créer" pour ajouter un avoir
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun avoir</p>
                    <p className="text-xs mt-1">
                      Les avoirs ne peuvent être créés que pour les factures en
                      attente, terminées ou annulées
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* <Separator /> */}

          {/* Preview Thumbnail */}
          {/* <div className="space-y-3">
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
          </div> */}
        </div>

        {/* Action Buttons */}
        <div className="border-t pl-6 pr-6 pt-4 pb-4 space-y-3">
          {/* Primary Actions */}
          <div className="flex gap-2">
            {invoice.status === INVOICE_STATUS.DRAFT && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex-1 font-normal"
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
              className="w-full font-normal"
            >
              <FileText className="h-4 w-4 mr-2" />
              Créer la facture
            </Button>
          )}

          {invoice.status === INVOICE_STATUS.PENDING && (
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleMarkAsPaid}
                disabled={isLoading}
                className="w-full font-normal"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marquer comme payée
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full font-normal"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Annuler la facture
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="w-full max-w-6xl h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">
              Aperçu de la facture {invoice.number || "Brouillon"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-[#F9F9F9] dark:bg-[#1a1a1a] p-8">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
              <UniversalPreviewPDF data={invoice} type="invoice" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credit Note Preview Modal - Desktop only */}
      {isCreditNotePreviewOpen && !isMobile && (
        <div className="fixed inset-0 z-[100]">
          {/* Fixed Backdrop */}
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => setIsCreditNotePreviewOpen(false)}
          />

          {/* Fixed Close Button */}
          <button
            onClick={() => setIsCreditNotePreviewOpen(false)}
            className="fixed top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Scrollable Content Area */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="w-[210mm] mx-auto bg-white my-12">
              {/* Credit Note Content */}
              {selectedCreditNote && (
                <UniversalPreviewPDF
                  data={selectedCreditNote}
                  type="creditNote"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Credit Note Fullscreen - Mobile only - Ne monter que si ouvert */}
      {isCreditNoteMobileFullscreen && selectedCreditNote && (
        <CreditNoteMobileFullscreen
          creditNote={selectedCreditNote}
          isOpen={isCreditNoteMobileFullscreen}
          onClose={() => {
            setIsCreditNoteMobileFullscreen(false);
            setSelectedCreditNote(null);
          }}
        />
      )}
    </>
  );
}
