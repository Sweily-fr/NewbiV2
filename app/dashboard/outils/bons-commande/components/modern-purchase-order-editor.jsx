"use client";

import { useState, useEffect, useRef } from "react";
import { FormProvider } from "react-hook-form";
import {
  ArrowLeft,
  FileText,
  Send,
  Settings,
  X,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/navigation";
import { usePurchaseOrderEditor } from "../hooks/use-purchase-order-editor";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import EnhancedQuoteForm from "@/app/dashboard/outils/devis/components/enhanced-quote-form";
import QuoteSettingsView from "@/app/dashboard/outils/devis/components/quote-settings-view";
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

export default function ModernPurchaseOrderEditor({
  mode = "create",
  purchaseOrderId = null,
  initialData = null,
}) {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [debouncedFormData, setDebouncedFormData] = useState(null);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [createdPurchaseOrderData, setCreatedPurchaseOrderData] = useState(null);
  const [organization, setOrganization] = useState(null);
  const pdfRef = useRef(null);

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
    setFormData,
    loading,
    saving,
    onSave,
    onSubmit,
    handleAutoSave,
    isDirty,
    errors,
    nextPurchaseOrderNumber,
    validatePurchaseOrderNumber,
    hasExistingOrders,
    saveSettingsToOrganization,
    purchaseOrder: loadedPurchaseOrder,
    error: purchaseOrderError,
    validationErrors,
    setValidationErrors,
  } = usePurchaseOrderEditor({
    mode,
    purchaseOrderId,
    initialData,
    organization,
  });

  // Debounce pour la preview
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFormData(formData);
    }, 300);

    return () => clearTimeout(timer);
  }, [formData]);

  // Détecter les changements d'organisation
  useOrganizationChange({
    resourceId: purchaseOrderId,
    resourceExists: mode === "create" ? true : !!loadedPurchaseOrder && !purchaseOrderError,
    listUrl: "/dashboard/outils/bons-commande",
    enabled: mode !== "create" && !loading,
  });

  // Afficher un message si le BC n'existe pas
  if (mode !== "create" && !loading && !loadedPurchaseOrder && purchaseOrderError) {
    return (
      <ResourceNotFound
        resourceType="bon de commande"
        resourceName="Ce bon de commande"
        listUrl="/dashboard/outils/bons-commande"
        homeUrl="/dashboard"
      />
    );
  }

  const isReadOnly = mode === "view";
  const isEditing = mode === "edit";
  const isCreating = mode === "create";

  const handleBack = () => {
    router.push("/dashboard/outils/bons-commande");
  };

  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
  };

  const [closeSettingsHandler, setCloseSettingsHandler] = useState(null);

  const handleCloseSettings = () => {
    if (closeSettingsHandler) {
      closeSettingsHandler();
    } else {
      setShowSettings(false);
    }
  };

  const handleClientUpdated = (updatedClient) => {
    setFormData((prev) => ({ ...prev, client: updatedClient }));
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString("fr-FR");
  };

  // Handler pour créer le BC et proposer l'envoi par email
  const handleSubmitWithEmail = async () => {
    const result = await onSubmit();

    if (result?.success && result?.purchaseOrder) {
      const poData = {
        id: result.purchaseOrder.id,
        number: `${result.purchaseOrder.prefix || "BC"}-${result.purchaseOrder.number}`,
        clientName: result.purchaseOrder.client?.name,
        clientEmail: result.purchaseOrder.client?.email,
        totalAmount: new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
        }).format(result.purchaseOrder.finalTotalTTC || 0),
        companyName: result.purchaseOrder.companyInfo?.name,
        issueDate: formatDate(result.purchaseOrder.issueDate),
        redirectUrl: result.redirectUrl,
      };
      setCreatedPurchaseOrderData(poData);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("newPurchaseOrderData", JSON.stringify(poData));
      }

      router.push("/dashboard/outils/bons-commande");
    }
  };

  const handleEmailModalClose = () => {
    setShowSendEmailModal(false);
    router.push("/dashboard/outils/bons-commande");
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
                <div>
                  <h1 className="text-xl md:text-2xl font-medium mb-1">
                    {showSettings ? (
                      "Paramètres du bon de commande"
                    ) : (
                      <>
                        {isCreating && "Nouveau bon de commande"}
                        {isEditing && "Modifier le bon de commande"}
                        {isReadOnly && "Détails du bon de commande"}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.history.back()}
                      className="h-8 w-8 p-0 md:hidden"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    {currentStep === 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep(1)}
                        className="hidden md:flex gap-2 h-8 px-3"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm">Retour</span>
                      </Button>
                    )}

                    {!isReadOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSettingsClick}
                        className="h-8 w-8 p-0"
                      >
                        <Settings size={20} />
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
              </div>
            </div>

            {/* Enhanced Form or Settings */}
            <div className="flex-1 min-h-0 flex flex-col">
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
                    />
                  ) : (
                    <EnhancedQuoteForm
                      mode={mode}
                      quoteId={purchaseOrderId}
                      formData={formData}
                      loading={loading}
                      saving={saving}
                      onSave={onSave}
                      onSubmit={handleSubmitWithEmail}
                      setFormData={setFormData}
                      canEdit={!isReadOnly}
                      nextQuoteNumber={nextPurchaseOrderNumber}
                      validateQuoteNumber={validatePurchaseOrderNumber}
                      hasExistingQuotes={hasExistingOrders}
                      validationErrors={validationErrors}
                      setValidationErrors={setValidationErrors}
                      currentStep={currentStep}
                      onStepChange={setCurrentStep}
                      onEditClient={() => setShowEditClient(true)}
                      documentType="purchaseOrder"
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
                <UniversalPreviewPDF data={debouncedFormData} type="purchaseOrder" />
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
      {createdPurchaseOrderData && (
        <SendDocumentModal
          open={showSendEmailModal}
          onOpenChange={setShowSendEmailModal}
          documentId={createdPurchaseOrderData.id}
          documentType="purchaseOrder"
          documentNumber={createdPurchaseOrderData.number}
          clientName={createdPurchaseOrderData.clientName}
          clientEmail={createdPurchaseOrderData.clientEmail}
          totalAmount={createdPurchaseOrderData.totalAmount}
          companyName={createdPurchaseOrderData.companyName}
          issueDate={createdPurchaseOrderData.issueDate}
          onSent={handleEmailModalClose}
          onClose={() =>
            router.push(
              createdPurchaseOrderData.redirectUrl || "/dashboard/outils/bons-commande"
            )
          }
          pdfRef={pdfRef}
        />
      )}
    </div>
  );
}
