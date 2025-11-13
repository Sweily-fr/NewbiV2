"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useRouter } from "next/navigation";
import { useQuoteEditor } from "../hooks/use-quote-editor";
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
import { ErrorAlert } from "@/src/components/invoice/error-alert";

export default function ModernQuoteEditor({
  mode = "create",
  quoteId = null,
  initialData = null,
}) {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [errorsExpanded, setErrorsExpanded] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
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
  } = useQuoteEditor({
    mode,
    quoteId,
    initialData,
  });

  // Détecter les changements d'organisation pour les modes edit/view
  useOrganizationChange({
    resourceId: quoteId,
    resourceExists: mode === "create" ? true : (!!loadedQuote && !quoteError),
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
        homeUrl="/dashboard/outils"
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

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] h-full">
        {/* Left Panel - Enhanced Form */}
        <div className="pl-4 pt-18 pr-2 pb-4 md:pl-6 md:pt-6 md:pr-6 flex flex-col h-full overflow-hidden">
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

                    {/* Bouton Retour sur desktop - visible uniquement à l'étape 2 */}
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

                    {/* Bouton Paramètres */}
                    {!isReadOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSettingsClick}
                        className="h-8 w-8 p-0"
                      >
                        <Settings size={20} style={{ color: '#5b50FF' }} />
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
              {/* Alertes d'erreur intelligentes - Panneau rétractable */}
              {(validationErrors?.client || validationErrors?.companyInfo || validationErrors?.quoteInfo || validationErrors?.items || validationErrors?.shipping || validationErrors?.discount || validationErrors?.customFields) && (
                <div className="flex-shrink-0 mb-4 border border-destructive/20 rounded-md overflow-hidden">
                  {/* Header rétractable avec compteur */}
                  <button
                    onClick={() => setErrorsExpanded(!errorsExpanded)}
                    className="w-full flex items-center justify-between p-3 bg-destructive/10 hover:bg-destructive/15 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">
                        Erreurs de validation
                      </span>
                      <Badge variant="destructive" className="ml-2">
                        {Object.keys(validationErrors || {}).length}
                      </Badge>
                    </div>
                    {errorsExpanded ? (
                      <ChevronUp className="h-4 w-4 text-destructive" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-destructive" />
                    )}
                  </button>
                  
                  {/* Contenu des erreurs */}
                  {errorsExpanded && (
                    <div className="space-y-2 p-3 bg-background border-t border-destructive/20">
                      {/* Afficher toutes les erreurs client */}
                      {validationErrors?.client && (
                        <ErrorAlert
                          title="Erreur client"
                          message={validationErrors.client.message || validationErrors.client}
                          onEdit={undefined}
                          editLabel=""
                        />
                      )}
                      {validationErrors?.companyInfo && (
                        <ErrorAlert
                          title="Erreur informations entreprise"
                          message={validationErrors.companyInfo.message || validationErrors.companyInfo}
                          onEdit={undefined}
                          editLabel=""
                        />
                      )}
                      {validationErrors?.quoteInfo && (
                        <ErrorAlert
                          title="Erreur informations du devis"
                          message={validationErrors.quoteInfo.message || validationErrors.quoteInfo}
                          onEdit={undefined}
                          editLabel=""
                        />
                      )}
                      {validationErrors?.items && (
                        <ErrorAlert
                          title="Erreur articles"
                          message={validationErrors.items.message || validationErrors.items}
                          onEdit={undefined}
                          editLabel=""
                        />
                      )}
                      {validationErrors?.shipping && (
                        <ErrorAlert
                          title="Erreur livraison"
                          message={validationErrors.shipping.message || validationErrors.shipping}
                          onEdit={undefined}
                          editLabel=""
                        />
                      )}
                      {validationErrors?.discount && (
                        <ErrorAlert
                          title="Erreur remise"
                          message={validationErrors.discount.message || validationErrors.discount}
                          onEdit={undefined}
                          editLabel=""
                        />
                      )}
                      {validationErrors?.customFields && (
                        <ErrorAlert
                          title="Erreur champs personnalisés"
                          message={validationErrors.customFields.message || validationErrors.customFields}
                          onEdit={undefined}
                          editLabel=""
                        />
                      )}
                    </div>
                  )}
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
                  />
                ) : (
                  <EnhancedQuoteForm
                    mode={mode}
                    quoteId={quoteId}
                    formData={formData}
                    loading={loading}
                    saving={saving}
                    onSave={onSave}
                    onSubmit={onSubmit}
                    setFormData={setFormData}
                    canEdit={!isReadOnly}
                    nextQuoteNumber={nextQuoteNumber}
                    validateQuoteNumber={validateQuoteNumber}
                    hasExistingQuotes={hasExistingQuotes}
                    validationErrors={validationErrors}
                    currentStep={currentStep}
                    onStepChange={setCurrentStep}
                  />
                )}
              </FormProvider>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="border-l flex-col h-full overflow-hidden hidden lg:flex">
          <div className="flex-1 overflow-y-auto pl-18 pr-18 pt-22 pb-22 bg-[#F9F9F9] dark:bg-[#1a1a1a] h-full">
            <UniversalPreviewPDF data={formData} type="quote" />
          </div>
        </div>
      </div>
    </div>
  );
}
