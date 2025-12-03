"use client";

import { useState, useEffect } from "react";
import { FormProvider } from "react-hook-form";
import {
  ArrowLeft,
  Receipt,
  Send,
  FileText,
  Settings,
  X,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useRouter } from "next/navigation";
import { useCreditNoteEditor } from "../hooks/use-credit-note-editor";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import EnhancedCreditNoteForm from "./enhanced-credit-note-form";
import { toast } from "@/src/components/ui/sonner";
import { getActiveOrganization } from "@/src/lib/organization-client";
import { SendDocumentModal } from "./send-document-modal";

export default function ModernCreditNoteEditor({
  mode = "create",
  creditNoteId = null,
  invoiceId = null,
  initialData = null,
}) {
  const router = useRouter();
  const [organization, setOrganization] = useState(null);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [createdCreditNoteData, setCreatedCreditNoteData] = useState(null);

  // Récupérer l'organisation au chargement
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const org = await getActiveOrganization();
        setOrganization(org);
      } catch (error) {
        // Error silently ignored
      }
    };
    fetchOrganization();
  }, []);

  const {
    form,
    formData,
    originalInvoice,
    existingCreditNote,
    loading,
    isDirty,
    errors,
    createCreditNoteAction,
    finalize,
  } = useCreditNoteEditor({
    mode,
    creditNoteId,
    invoiceId,
    initialData,
    organization,
  });

  const isReadOnly = mode === "view";
  const isEditing = mode === "edit";
  const isCreating = mode === "create";

  const handleBack = () => {
    if (invoiceId) {
      router.push(`/dashboard/outils/factures/${invoiceId}`);
    } else {
      router.push("/dashboard/outils/factures");
    }
  };

  const handleSaveAsDraft = async () => {
    try {
      await saveAsDraft(false);
      toast.success("Avoir sauvegardé en brouillon");
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  // Fonction helper pour formater les dates
  const formatDate = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString("fr-FR");
  };

  const handleFinalize = async () => {
    try {
      const result = await finalize(false); // Ne pas rediriger automatiquement
      
      if (result?.success && result?.creditNote) {
        // Stocker les données de l'avoir créé
        // Le montant doit être négatif pour un avoir - utiliser formData ou result
        const amount = formData.finalTotalTTC || result.creditNote.finalTotalTTC || 0;
        
        // Formater le numéro de facture associée avec préfixe
        const invoiceNum = originalInvoice 
          ? `${originalInvoice.prefix || "F"}-${originalInvoice.number}`
          : result.creditNote.originalInvoiceNumber;
        
        // Formater la date de l'avoir - utiliser formData en priorité
        const creditNoteDate = formData.issueDate 
          ? formatDate(formData.issueDate)
          : formatDate(result.creditNote.issueDate);
        
        setCreatedCreditNoteData({
          id: result.creditNote.id,
          number: `${result.creditNote.prefix || "AV"}-${result.creditNote.number}`,
          clientName: result.creditNote.client?.name,
          clientEmail: result.creditNote.client?.email,
          totalAmount: new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount),
          companyName: result.creditNote.companyInfo?.name,
          issueDate: creditNoteDate,
          invoiceNumber: invoiceNum,
          redirectUrl: result.redirectUrl,
        });
        // Afficher la modal d'envoi
        setShowSendEmailModal(true);
      }
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  // Handler pour fermer la modal et rediriger
  const handleEmailModalClose = () => {
    setShowSendEmailModal(false);
    if (createdCreditNoteData?.redirectUrl) {
      router.push(createdCreditNoteData.redirectUrl);
    }
  };

  const getStatusBadge = () => {
    const status = formData?.status || "DRAFT";
    const statusConfig = {
      DRAFT: { label: "Brouillon", variant: "secondary" },
      PENDING: { label: "En attente", variant: "default" },
      COMPLETED: { label: "Terminé", variant: "success" },
      CANCELED: { label: "Annulé", variant: "destructive" },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Vérifier si la facture originale existe en mode création
  if (mode === "create" && invoiceId && !originalInvoice && !loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <X className="h-12 w-12 text-destructive mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Facture introuvable</h2>
          <p className="text-muted-foreground mb-6">
            La facture originale n'existe pas ou a été supprimée. Impossible de créer un avoir.
          </p>
          <Button onClick={handleBack} variant="default">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux factures
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] h-full">
        {/* Left Panel - Enhanced Form */}
        <div className="pl-4 pt-18 pr-2 pb-4 md:pl-6 md:pt-6 md:pr-6 flex flex-col h-full overflow-hidden">
          <div className="max-w-2xl mx-auto flex flex-col w-full h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 md:mb-6 md:pb-6 border-b">
              <div className="flex items-center gap-2">
                <div>
                  <h1 className="text-xl md:text-2xl font-medium mb-1">
                    {isCreating ? "Créer un avoir" : isEditing ? "Modifier l'avoir" : "Voir l'avoir"}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    {formData?.number && (
                      <span className="text-xs md:text-sm text-muted-foreground">
                        {formData.number}
                      </span>
                    )}
                    {getStatusBadge()}
                    {originalInvoice && (
                      <span className="text-xs md:text-sm text-muted-foreground">
                        • Facture {originalInvoice.number}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-4">
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 min-h-0">
              <FormProvider {...form}>
                <EnhancedCreditNoteForm
                  mode={mode}
                  originalInvoice={originalInvoice}
                  organization={organization}
                  onSubmit={handleFinalize}
                />
              </FormProvider>
            </div>
          </div>
        </div>

        {/* Right Panel - PDF Preview */}
        <div className="hidden lg:flex bg-muted/30 border-l flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto pl-4 pr-4 pt-6 pb-6 md:pl-18 md:pr-18 md:pt-22 md:pb-22 bg-[#F9F9F9] dark:bg-[#1a1a1a]">
            <UniversalPreviewPDF data={{...formData, originalInvoice}} type="creditNote" />
          </div>
        </div>
      </div>
      
      {/* Modal d'envoi par email */}
      {createdCreditNoteData && (
        <SendDocumentModal
          open={showSendEmailModal}
          onOpenChange={setShowSendEmailModal}
          documentId={createdCreditNoteData.id}
          documentType="creditNote"
          documentNumber={createdCreditNoteData.number}
          clientName={createdCreditNoteData.clientName}
          clientEmail={createdCreditNoteData.clientEmail}
          totalAmount={createdCreditNoteData.totalAmount}
          companyName={createdCreditNoteData.companyName}
          issueDate={createdCreditNoteData.issueDate}
          invoiceNumber={createdCreditNoteData.invoiceNumber}
          onSent={handleEmailModalClose}
          onClose={() => router.push(createdCreditNoteData.redirectUrl || "/dashboard/outils/factures")}
        />
      )}
    </div>
  );
}
