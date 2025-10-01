"use client";

import { useState } from "react";
import {
  X,
  CheckCircle,
  FileText,
  XCircle,
  Download,
  Loader2,
  Receipt,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
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
import { useRouter } from "next/navigation";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import UniversalPDFGenerator from "@/src/components/pdf/UniversalPDFGenerator";

export default function InvoiceMobileFullscreen({
  isOpen,
  onClose,
  invoice: initialInvoice,
  onRefetch,
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const router = useRouter();
  const { markAsPaid, loading: markingAsPaid } = useMarkInvoiceAsPaid();
  const { changeStatus, loading: changingStatus } = useChangeInvoiceStatus();

  // Fetch credit notes for this invoice
  const {
    creditNotes,
    loading: loadingCreditNotes,
  } = useCreditNotesByInvoice(initialInvoice?.id);

  // Récupérer les données complètes de la facture
  const {
    invoice: fullInvoice,
    loading: loadingFullInvoice,
  } = useInvoice(initialInvoice?.id);

  if (!isOpen || !initialInvoice) return null;

  // Utiliser les données complètes si disponibles, sinon les données initiales
  const invoice = fullInvoice || initialInvoice;

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

  const handleMarkAsPaid = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      await markAsPaid(invoice.id, today);
      toast.success("Facture marquée comme payée");
      if (onRefetch) onRefetch();
      onClose();
    } catch (error) {
      toast.error("Erreur lors du marquage comme payée");
    }
  };

  const handleCreateInvoice = async () => {
    try {
      await changeStatus(invoice.id, INVOICE_STATUS.PENDING);
      toast.success("Facture créée avec succès");
      if (onRefetch) onRefetch();
      onClose();
    } catch (error) {
      toast.error("Erreur lors de la création de la facture");
    }
  };

  const handleCancel = async () => {
    try {
      await changeStatus(invoice.id, INVOICE_STATUS.CANCELED);
      toast.success("Facture annulée");
      if (onRefetch) onRefetch();
      onClose();
    } catch (error) {
      toast.error("Erreur lors de l'annulation de la facture");
    }
  };

  const handleCreateCreditNote = () => {
    router.push(`/dashboard/outils/factures/${invoice.id}/avoir/nouveau`);
    onClose();
  };

  const handleDownloadPDF = () => {
    setIsPreviewOpen(true);
  };

  // Vérifier si la facture a atteint sa limite d'avoirs
  const creditNoteLimitReached = hasReachedCreditNoteLimit(invoice, creditNotes);

  const isLoading = markingAsPaid || changingStatus || loadingFullInvoice;

  const statusColor = INVOICE_STATUS_COLORS[invoice.status] || "gray";
  const statusLabel = INVOICE_STATUS_LABELS[invoice.status] || invoice.status;

  return (
    <>
      {/* Fullscreen overlay */}
      <div className="fixed inset-0 z-50 bg-background md:hidden">
        {/* Header avec croix */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Facture {invoice.number}</h2>
              <Badge variant={statusColor}>{statusLabel}</Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="overflow-y-auto h-[calc(100vh-64px-72px)] pb-4">
          {loadingFullInvoice ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {/* Informations principales */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{invoice.client?.name || "N/A"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date d'émission</p>
                    <p className="font-medium">{formatDate(invoice.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date d'échéance</p>
                    <p className="font-medium">{formatDate(invoice.dueDate)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Montant total TTC</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(invoice.finalTotalTTC)}
                  </p>
                </div>

                {invoice.status === INVOICE_STATUS.COMPLETED && invoice.paymentDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Date de paiement</p>
                    <p className="font-medium">{formatDate(invoice.paymentDate)}</p>
                  </div>
                )}
              </div>

              {/* Aperçu PDF */}
              <div className="border rounded-lg overflow-hidden">
                <UniversalPreviewPDF
                  documentData={invoice}
                  documentType="invoice"
                  showToolbar={false}
                />
              </div>

              {/* Avoirs liés */}
              {creditNotes && creditNotes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Avoirs créés ({creditNotes.length})</p>
                  <div className="space-y-2">
                    {creditNotes.map((cn) => (
                      <div
                        key={cn.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{cn.number}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(cn.issueDate)}
                          </p>
                        </div>
                        <p className="font-semibold text-red-600">
                          {formatCurrency(cn.finalTotalTTC)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer avec actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 space-y-2">
          {invoice.status === INVOICE_STATUS.DRAFT && (
            <>
              <Button
                onClick={handleCreateInvoice}
                disabled={isLoading}
                className="w-full"
              >
                {changingStatus ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Créer la facture
              </Button>
            </>
          )}

          {invoice.status === INVOICE_STATUS.PENDING && (
            <>
              <Button
                onClick={handleMarkAsPaid}
                disabled={isLoading}
                className="w-full"
              >
                {markingAsPaid ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Marquer comme payée
              </Button>
              {!creditNoteLimitReached && (
                <Button
                  onClick={handleCreateCreditNote}
                  variant="outline"
                  className="w-full"
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Créer un avoir
                </Button>
              )}
              <Button
                onClick={handleCancel}
                variant="destructive"
                className="w-full"
                disabled={isLoading}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Annuler
              </Button>
            </>
          )}

          {invoice.status === INVOICE_STATUS.COMPLETED && !creditNoteLimitReached && (
            <Button
              onClick={handleCreateCreditNote}
              variant="outline"
              className="w-full"
            >
              <Receipt className="mr-2 h-4 w-4" />
              Créer un avoir
            </Button>
          )}

          {invoice.status === INVOICE_STATUS.CANCELED && !creditNoteLimitReached && (
            <Button
              onClick={handleCreateCreditNote}
              variant="outline"
              className="w-full"
            >
              <Receipt className="mr-2 h-4 w-4" />
              Créer un avoir
            </Button>
          )}

          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Télécharger PDF
          </Button>
        </div>
      </div>

      {/* Dialog pour télécharger le PDF */}
      {isPreviewOpen && (
        <UniversalPDFGenerator
          documentData={invoice}
          documentType="invoice"
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </>
  );
}
