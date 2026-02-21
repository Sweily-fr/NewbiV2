"use client";

import { useState, useEffect, useRef } from "react";
import { FormProvider } from "react-hook-form";
import {
  ArrowLeft,
  FileText,
  Send,
  CreditCard,
  Settings,
  X,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuoteEditor } from "../hooks/use-quote-editor";
import { useClient } from "@/src/graphql/clientQueries";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import EnhancedQuoteForm from "./enhanced-quote-form";
import QuoteSettingsView from "./quote-settings-view";
import { toast } from "@/src/components/ui/sonner";
import {
  updateOrganization,
  getActiveOrganization,
} from "@/src/lib/organization-client";
import { useOrganizationChange } from "@/src/hooks/useOrganizationChange";
import { ResourceNotFound } from "@/src/components/resource-not-found";
import { ValidationCallout } from "@/app/dashboard/outils/factures/components/validation-callout";
import ClientsModal from "@/app/dashboard/clients/components/clients-modal";
import { SendDocumentModal } from "@/app/dashboard/outils/factures/components/send-document-modal";
import { useCheckQuoteNumber } from "@/src/graphql/quoteQueries";

export default function ModernQuoteEditor({
  mode = "create",
  quoteId = null,
  initialData = null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdFromUrl = mode === "create" ? searchParams.get("clientId") : null;
  const { client: preselectedClient } = useClient(clientIdFromUrl);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [debouncedFormData, setDebouncedFormData] = useState(null);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [createdQuoteData, setCreatedQuoteData] = useState(null);
  const pdfRef = useRef(null);

  const {
    form,
    formData,
    setFormData,
    loading,
    saving,
    onSave,
    onSubmit,
    handleAutoSave,
    isDirty,
    errors,
    nextQuoteNumber,
    validateQuoteNumber,
    hasExistingQuotes,
    saveSettingsToOrganization,
    quote: loadedQuote,
    error: quoteError,
    validationErrors,
    setValidationErrors,
  } = useQuoteEditor({
    mode,
    quoteId,
    initialData,
  });

  const { checkQuoteNumber } = useCheckQuoteNumber();

  // Pré-remplir le client si clientId est dans l'URL
  useEffect(() => {
    if (preselectedClient && mode === "create" && !formData?.client) {
      form.setValue("client", preselectedClient, { shouldDirty: true });
    }
  }, [preselectedClient, mode, form]);

  // Debounce pour la preview (évite les saccades)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFormData(formData);
    }, 300); // Attendre 300ms après la dernière modification

    return () => clearTimeout(timer);
  }, [formData]);

  // Détecter les changements d'organisation pour les modes edit/view
  useOrganizationChange({
    resourceId: quoteId,
    resourceExists: mode === "create" ? true : !!loadedQuote && !quoteError,
    listUrl: "/dashboard/outils/devis",
    enabled: mode !== "create" && !loading,
  });

  // Afficher un message si le devis n'existe pas (après changement d'organisation)
  if (mode !== "create" && !loading && !loadedQuote && quoteError) {
    return (
      <ResourceNotFound
        resourceType="devis"
        resourceName="Ce devis"
        listUrl="/dashboard/outils/devis"
        homeUrl="/dashboard"
      />
    );
  }

  const isReadOnly = mode === "view";
  const isEditing = mode === "edit";
  const isCreating = mode === "create";

  const handleBack = () => {
    router.push("/dashboard/outils/devis");
  };

  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
  };

  const [closeSettingsHandler, setCloseSettingsHandler] = useState(null);

  const handleCloseSettings = () => {
    // Si un handler personnalisé existe (avec vérification des changements), l'utiliser
    if (closeSettingsHandler) {
      closeSettingsHandler();
    } else {
      // Sinon, fermer directement
      setShowSettings(false);
    }
  };

  const handleClientUpdated = (updatedClient) => {
    setFormData((prev) => ({ ...prev, client: updatedClient }));
    // Notification déjà affichée par le modal
  };

  // Fonction helper pour formater les dates
  const formatDate = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString("fr-FR");
  };

  // Handler personnalisé pour créer le devis et proposer l'envoi par email
  const handleSubmitWithEmail = async () => {
    const result = await onSubmit();

    if (result?.success && result?.quote) {
      // Stocker les données du devis créé pour la modal d'envoi
      const quoteData = {
        id: result.quote.id,
        number: `${result.quote.prefix || "D"}-${result.quote.number}`,
        clientName: result.quote.client?.name,
        clientEmail: result.quote.client?.email,
        totalAmount: new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
        }).format(result.quote.finalTotalTTC || 0),
        companyName: result.quote.companyInfo?.name,
        issueDate: formatDate(result.quote.issueDate),
        redirectUrl: result.redirectUrl,
      };
      setCreatedQuoteData(quoteData);

      // Stocker les données dans sessionStorage pour afficher le toast sur la page de liste
      if (typeof window !== "undefined") {
        sessionStorage.setItem("newQuoteData", JSON.stringify(quoteData));
      }

      // Rediriger vers la liste des devis
      router.push("/dashboard/outils/devis");
    }
  };

  // Handler pour fermer la modal après envoi d'email
  const handleEmailModalClose = () => {
    setShowSendEmailModal(false);
    // Rediriger vers la liste des devis après envoi ou fermeture
    router.push("/dashboard/outils/devis");
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] h-full">
        {/* Left Panel - Enhanced Form */}
        <div className="px-4 pt-6 pb-4 md:px-6 md:pt-6 flex flex-col h-full overflow-hidden">
          <div className="max-w-2xl mx-auto flex flex-col w-full h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 md:mb-6 md:pb-6 border-b">
              <div className="flex items-center gap-2">
                {/* <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button> */}
                <div>
                  <h1 className="text-xl md:text-2xl font-medium mb-1">
                    {showSettings ? (
                      "Paramètres du devis"
                    ) : (
                      <>
                        {isCreating && "Nouveau devis"}
                        {isEditing && "Modifier le devis"}
                        {isReadOnly && "Détails du devis"}
                      </>
                    )}
                  </h1>
                  {!showSettings && isDirty && !isReadOnly && (
                    <p className="text-sm text-muted-foreground">
                      {saving
                        ? "Sauvegarde en cours..."
                        : "Modifications non sauvegardées"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-6">
                {!showSettings && (
                  <>
                    {/* Croix pour fermer sur mobile */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.history.back()}
                      className="h-8 w-8 p-0 md:hidden"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    {/* Bouton Paramètres */}
                    {!isReadOnly && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleSettingsClick}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}

                {showSettings && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseSettings}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
                {/* {formData.status && (
                  <Badge
                    variant={
                      formData.status === "DRAFT" ? "secondary" : "default"
                    }
                  >
                    {formData.status}
                  </Badge>
                )} */}
              </div>
            </div>

            {/* Enhanced Form or Settings */}
            <div className="flex-1 min-h-0 flex flex-col">
              {/* Bannière de validation globale */}
              {Object.keys(validationErrors || {}).length > 0 && (
                <div className="flex-shrink-0 mb-4">
                  <ValidationCallout errors={validationErrors} />
                </div>
              )}

              <div className="flex-1 min-h-0">
                <FormProvider {...form}>
                  {showSettings ? (
                    <QuoteSettingsView
                      formData={formData}
                      setFormData={setFormData}
                      onCancel={() => setShowSettings(false)}
                      onCloseAttempt={setCloseSettingsHandler}
                      onSave={async () => {
                        try {
                          // Sauvegarder les paramètres dans l'organisation
                          await saveSettingsToOrganization();
                          setShowSettings(false);
                          toast.success(
                            "Paramètres sauvegardés dans l'organisation"
                          );
                        } catch (error) {
                          toast.error(
                            "Erreur lors de la sauvegarde des paramètres"
                          );
                        }
                      }}
                      canEdit={!isReadOnly}
                      validateNumberExists={checkQuoteNumber}
                    />
                  ) : (
                    <EnhancedQuoteForm
                      mode={mode}
                      quoteId={quoteId}
                      formData={formData}
                      loading={loading}
                      saving={saving}
                      onSave={onSave}
                      onSubmit={handleSubmitWithEmail}
                      setFormData={setFormData}
                      canEdit={!isReadOnly}
                      nextQuoteNumber={nextQuoteNumber}
                      validateQuoteNumber={validateQuoteNumber}
                      hasExistingQuotes={hasExistingQuotes}
                      validationErrors={validationErrors}
                      setValidationErrors={setValidationErrors}
                      currentStep={currentStep}
                      onStepChange={setCurrentStep}
                      onEditClient={() => setShowEditClient(true)}
                    />
                  )}
                </FormProvider>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="border-l flex-col h-full overflow-hidden hidden lg:flex">
          <div className="flex-1 overflow-y-auto pl-18 pr-18 pt-22 pb-22 bg-[#F9F9F9] dark:bg-[#1a1a1a] h-full relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#F9F9F9] dark:bg-[#1a1a1a]">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : debouncedFormData ? (
              <div ref={pdfRef}>
                <UniversalPreviewPDF data={debouncedFormData} type="quote" />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Modal d'édition du client */}
      {formData.client && (
        <ClientsModal
          open={showEditClient}
          onOpenChange={setShowEditClient}
          client={formData.client}
          onSave={handleClientUpdated}
        />
      )}

      {/* Modal d'envoi par email */}
      {createdQuoteData && (
        <SendDocumentModal
          open={showSendEmailModal}
          onOpenChange={setShowSendEmailModal}
          documentId={createdQuoteData.id}
          documentType="quote"
          documentNumber={createdQuoteData.number}
          clientName={createdQuoteData.clientName}
          clientEmail={createdQuoteData.clientEmail}
          totalAmount={createdQuoteData.totalAmount}
          companyName={createdQuoteData.companyName}
          issueDate={createdQuoteData.issueDate}
          onSent={handleEmailModalClose}
          onClose={() =>
            router.push(
              createdQuoteData.redirectUrl || "/dashboard/outils/devis"
            )
          }
          pdfRef={pdfRef}
        />
      )}
    </div>
  );
}
