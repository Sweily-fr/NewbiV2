"use client";

import { useState } from "react";
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
import { toast } from "@/src/components/ui/sonner";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import UniversalPDFGenerator from "@/src/components/pdf/UniversalPDFGenerator";

export default function InvoiceSidebar({
  isOpen,
  onClose,
  invoice: initialInvoice,
  onRefetch,
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const router = useRouter();
  const { markAsPaid, loading: markingAsPaid } = useMarkInvoiceAsPaid();
  const { changeStatus, loading: changingStatus } = useChangeInvoiceStatus();

  // Récupérer les données complètes de la facture
  const {
    invoice: fullInvoice,
    loading: loadingFullInvoice,
    error: invoiceError,
  } = useInvoice(initialInvoice?.id);

  if (!isOpen || !initialInvoice) return null;

  // Utiliser les données complètes si disponibles, sinon les données initiales
  const invoice = fullInvoice || initialInvoice;

  // Debug: Vérifier si les données complètes sont récupérées
  if (loadingFullInvoice) {
    console.log("Loading full invoice...");
  }
  if (invoiceError) {
    console.log("Invoice error:", invoiceError);
  }

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
      toast.success("Facture créée avec succès");
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

  const isLoading = markingAsPaid || changingStatus;

  return (
    <>
      {/* Semi-transparent overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* PDF Preview Panel */}
      <div 
        className={`fixed inset-y-0 left-0 right-[35%] z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute inset-0 bg-black/80 p-0 flex items-start justify-center overflow-y-auto py-12 px-24">
          <div className="w-[210mm] max-w-full min-h-[calc(100%-4rem)] bg-white">
            <UniversalPreviewPDF data={invoice} type="invoice" />
          </div>
        </div>
      </div>
      
      {/* Main Sidebar */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-[35%] bg-background border-l shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-medium">Détails de la facture</h2>
          <div className="flex items-center gap-2">
            {/* Bouton PDF - masqué pour les brouillons */}
            {invoice.status !== INVOICE_STATUS.DRAFT && (
              <UniversalPDFGenerator 
                data={invoice} 
                type="invoice"
                variant="default"
                size="sm"
                className="flex items-center gap-2"
              >
                Télécharger en PDF
              </UniversalPDFGenerator>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
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
                  {formatCurrency(invoice.finalTotalHT || invoice.totalHT || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-normal">TVA</span>
                <span>{formatCurrency(invoice.totalVAT || 0)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="font-normal">Total TTC</span>
                <span>
                  {formatCurrency(
                    invoice.finalTotalTTC || invoice.totalTTC || 0
                  )}
                </span>
              </div>
            </div>
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
    </>
  );
}
