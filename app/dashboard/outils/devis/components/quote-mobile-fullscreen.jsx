"use client";
import {
  X,
  CheckCircle,
  FileText,
  XCircle,
  Download,
  Loader2,
  FileCheck,
  Send,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  useChangeQuoteStatus,
  useQuote,
  useConvertQuoteToInvoice,
  QUOTE_STATUS,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_COLORS,
} from "@/src/graphql/quoteQueries";
import { toast } from "@/src/components/ui/sonner";
import { useRouter } from "next/navigation";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import UniversalPDFGenerator from "@/src/components/pdf/UniversalPDFGenerator";

export default function QuoteMobileFullscreen({
  isOpen,
  onClose,
  quote: initialQuote,
  onRefetch,
}) {
  const router = useRouter();
  const { changeStatus, loading: changingStatus } = useChangeQuoteStatus();
  const { convertToInvoice, loading: converting } = useConvertQuoteToInvoice();

  // Récupérer les données complètes du devis
  const {
    quote: fullQuote,
    loading: loadingFullQuote,
  } = useQuote(initialQuote?.id);

  // Ne rien afficher si pas ouvert ou pas de devis
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

  const handleSendQuote = async () => {
    try {
      await changeStatus(quote.id, QUOTE_STATUS.PENDING);
      toast.success("Devis envoyé avec succès");
      if (onRefetch) onRefetch();
      onClose();
    } catch (error) {
      toast.error("Erreur lors de l'envoi du devis");
    }
  };

  const handleAccept = async () => {
    try {
      await changeStatus(quote.id, QUOTE_STATUS.COMPLETED);
      toast.success("Devis accepté");
      if (onRefetch) onRefetch();
      onClose();
    } catch (error) {
      toast.error("Erreur lors de l'acceptation du devis");
    }
  };

  const handleReject = async () => {
    try {
      await changeStatus(quote.id, QUOTE_STATUS.CANCELED);
      toast.success("Devis rejeté");
      if (onRefetch) onRefetch();
      onClose();
    } catch (error) {
      toast.error("Erreur lors du rejet du devis");
    }
  };

  const handleConvertToInvoice = async () => {
    try {
      const result = await convertToInvoice(quote.id);
      if (onRefetch) onRefetch();
      onClose();
      if (result?.data?.convertQuoteToInvoice?.id) {
        router.push(
          `/dashboard/outils/factures/${result.data.convertQuoteToInvoice.id}`
        );
      }
    } catch (error) {
      toast.error("Erreur lors de la conversion en facture");
    }
  };

  const isLoading = changingStatus || converting || loadingFullQuote;

  const statusColor = QUOTE_STATUS_COLORS[quote.status] || "gray";
  const statusLabel = QUOTE_STATUS_LABELS[quote.status] || quote.status;

  const isValidUntilExpired = () => {
    if (!quote.validUntil) return false;
    const validUntilDate = new Date(
      typeof quote.validUntil === "number"
        ? quote.validUntil
        : parseInt(quote.validUntil)
    );
    return validUntilDate < new Date();
  };

  return (
    <>
      {/* Fullscreen overlay - Seulement sur mobile */}
      <div className="fixed inset-0 z-[60] bg-background md:hidden overflow-hidden flex flex-col">
        {/* Header avec croix */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Devis {quote.number}</h2>
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
        <div className="flex-1 overflow-y-auto pb-4">
          {loadingFullQuote ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {/* Informations principales */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{quote.client?.name || "N/A"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date d'émission</p>
                    <p className="font-medium">{formatDate(quote.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valide jusqu'au</p>
                    <p className={`font-medium ${isValidUntilExpired() ? "text-red-600" : ""}`}>
                      {formatDate(quote.validUntil)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Montant total TTC</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(quote.finalTotalTTC)}
                  </p>
                </div>
              </div>

              {/* Aperçu PDF - Version mobile avec même design que desktop */}
                <UniversalPreviewPDF
                  data={quote}
                  type="quote"
                  isMobile={true}
                />

              {/* Factures liées */}
              {quote.linkedInvoices && quote.linkedInvoices.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Factures liées ({quote.linkedInvoices.length})
                  </p>
                  <div className="space-y-2">
                    {quote.linkedInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{inv.number}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(inv.issueDate)}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {formatCurrency(inv.finalTotalTTC)}
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
          {quote.status === QUOTE_STATUS.DRAFT && (
            <Button
              onClick={handleSendQuote}
              disabled={isLoading}
              className="w-full"
            >
              {changingStatus ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Envoyer le devis
            </Button>
          )}

          {quote.status === QUOTE_STATUS.PENDING && (
            <>
              <Button
                onClick={handleAccept}
                disabled={isLoading}
                className="w-full"
              >
                {changingStatus ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Accepter le devis
              </Button>
              <Button
                onClick={handleReject}
                variant="destructive"
                className="w-full"
                disabled={isLoading}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Rejeter le devis
              </Button>
            </>
          )}

          {quote.status === QUOTE_STATUS.COMPLETED &&
            (!quote.linkedInvoices || quote.linkedInvoices.length === 0) && (
              <Button
                onClick={handleConvertToInvoice}
                disabled={isLoading}
                className="w-full"
              >
                {converting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileCheck className="mr-2 h-4 w-4" />
                )}
                Convertir en facture
              </Button>
            )}

          <UniversalPDFGenerator
            data={quote}
            type="quote"
            variant="outline"
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Télécharger PDF
          </UniversalPDFGenerator>
        </div>
      </div>

    </>
  );
}
