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
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useRouter } from "next/navigation";
import { useQuoteEditor } from "../hooks/use-quote-editor";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import EnhancedQuoteForm from "./enhanced-quote-form";
import QuoteSettingsView from "./quote-settings-view";
import { toast } from "@/src/components/ui/sonner";
import { updateOrganization, getActiveOrganization } from "@/src/lib/organization-client";

export default function ModernQuoteEditor({
  mode = "create",
  quoteId = null,
  initialData = null,
}) {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
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
  } = useQuoteEditor({
    mode,
    quoteId,
    initialData,
  });

  const isReadOnly = mode === "view";
  const isEditing = mode === "edit";
  const isCreating = mode === "create";

  const handleBack = () => {
    router.push("/dashboard/outils/devis");
  };

  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] h-full">
        {/* Left Panel - Enhanced Form */}
        <div className="pl-6 pt-6 pr-6 pb-4 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
          <div className="max-w-2xl mx-auto flex flex-col w-full h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b">
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
                  <h1 className="text-2xl font-medium mb-1">
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

              <div className="flex items-center gap-2">
                {!isReadOnly && (
                  <>
                    {!showSettings ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSettingsClick}
                        className="gap-2"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCloseSettings}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </>
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
            <div className="flex-1 min-h-0">
              <FormProvider {...form}>
                {showSettings ? (
                  <QuoteSettingsView
                    formData={formData}
                    setFormData={setFormData}
                    onCancel={handleCloseSettings}
                    onSave={async () => {
                      try {
                        // Sauvegarder les paramètres dans l'organisation
                        await saveSettingsToOrganization();
                        handleCloseSettings();
                        toast.success("Paramètres sauvegardés dans l'organisation");
                      } catch (error) {
                        console.error("Erreur lors de la sauvegarde:", error);
                        toast.error("Erreur lors de la sauvegarde des paramètres");
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
                  />
                )}
              </FormProvider>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="border-l flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#F9F9F9] dark:bg-[#1a1a1a]">
          <div className="flex-1 overflow-y-auto pl-18 pr-18 pt-22 pb-22 bg-[#F9F9F9] dark:bg-[#1a1a1a] h-[calc(100vh-64px)]">
            <UniversalPreviewPDF data={formData} type="quote" />
          </div>
        </div>
      </div>
    </div>
  );
}
