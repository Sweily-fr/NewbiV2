"use client";

import { useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useCreditNote } from "@/src/graphql/creditNoteQueries";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import UniversalPDFGenerator from "@/src/components/pdf/UniversalPDFGenerator";

export default function CreditNoteMobileFullscreen({
  isOpen,
  onClose,
  creditNote: initialCreditNote,
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Récupérer les données complètes de l'avoir
  const {
    creditNote: fullCreditNote,
    loading: loadingFullCreditNote,
  } = useCreditNote(initialCreditNote?.id);

  // Ne rien afficher si pas ouvert ou pas d'avoir
  if (!isOpen || !initialCreditNote) return null;

  // Utiliser les données complètes si disponibles, sinon les données initiales
  const creditNote = fullCreditNote || initialCreditNote;

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

  const handleDownloadPDF = () => {
    setIsPreviewOpen(true);
  };

  return (
    <>
      {/* Fullscreen overlay - Seulement sur mobile */}
      <div className="fixed inset-0 z-50 bg-background md:hidden overflow-hidden">
        {/* Header avec croix */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Avoir {creditNote.number}</h2>
              <Badge variant="default">Créé</Badge>
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
        <div className="overflow-y-auto h-[calc(100vh-64px)] pb-4">
          {loadingFullCreditNote ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {/* Informations principales */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{creditNote.client?.name || "N/A"}</p>
                </div>

                {creditNote.linkedInvoice && (
                  <div>
                    <p className="text-sm text-muted-foreground">Facture liée</p>
                    <p className="font-medium">{creditNote.linkedInvoice.number}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Date d'émission</p>
                  <p className="font-medium">{formatDate(creditNote.issueDate)}</p>
                </div>

                {creditNote.reason && (
                  <div>
                    <p className="text-sm text-muted-foreground">Motif</p>
                    <p className="font-medium">{creditNote.reason}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Montant total TTC</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(creditNote.finalTotalTTC)}
                  </p>
                </div>
              </div>

              {/* Aperçu PDF */}
              <div className="border rounded-lg overflow-hidden">
                <UniversalPreviewPDF
                  data={creditNote}
                  type="creditNote"
                />
              </div>

              {/* Bouton de téléchargement en bas du contenu */}
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Télécharger PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Dialog pour télécharger le PDF */}
      {isPreviewOpen && (
        <UniversalPDFGenerator
          data={creditNote}
          type="creditNote"
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </>
  );
}
