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
import { useInvoiceEditor } from "../hooks/use-invoice-editor";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import EnhancedInvoiceForm from "./enhanced-invoice-form";
import InvoiceSettingsView from "./invoice-settings-view";
import { toast } from "@/src/components/ui/sonner";
import {
  updateOrganization,
  getActiveOrganization,
} from "@/src/lib/organization-client";
import { QuickEditClientModal } from "@/src/components/invoice/quick-edit-client-modal";
import { QuickEditCompanyModal } from "@/src/components/invoice/quick-edit-company-modal";
import { ErrorAlert } from "@/src/components/invoice/error-alert";

export default function ModernInvoiceEditor({
  mode = "create",
  invoiceId = null,
  initialData = null,
}) {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [organization, setOrganization] = useState(null);
  const [showEditClient, setShowEditClient] = useState(false);
  const [showEditCompany, setShowEditCompany] = useState(false);

  // Récupérer l'organisation au chargement
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const org = await getActiveOrganization();
        setOrganization(org);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération de l'organisation:",
          error
        );
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
    handleSave,
    handleSubmit,
    handleAutoSave,
    isDirty,
    errors,
    validationErrors,
    clearValidationErrors,
    saveSettingsToOrganization,
  } = useInvoiceEditor({
    mode,
    invoiceId,
    initialData,
    organization,
  });

  const isReadOnly = mode === "view";
  const isEditing = mode === "edit";
  const isCreating = mode === "create";

  const handleBack = () => {
    router.push("/dashboard/outils/factures");
  };

  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const handleClientUpdated = (updatedClient) => {
    setFormData({ client: updatedClient });
    toast.success("Client mis à jour");
  };

  const handleCompanyUpdated = async (updatedCompany) => {
    // Mettre à jour les données du formulaire
    setFormData({
      companyInfo: {
        ...formData.companyInfo,
        name: updatedCompany.companyName,
        email: updatedCompany.companyEmail,
        phone: updatedCompany.companyPhone,
        siret: updatedCompany.siret,
        vatNumber: updatedCompany.vatNumber,
        address: {
          street: updatedCompany.addressStreet,
          city: updatedCompany.addressCity,
          postalCode: updatedCompany.addressZipCode,
          country: updatedCompany.addressCountry,
        },
      },
    });
    
    // Rafraîchir l'organisation
    const org = await getActiveOrganization();
    setOrganization(org);
    
    toast.success("Informations de l'entreprise mises à jour");
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
                      "Paramètres de la facture"
                    ) : (
                      <>
                        {isCreating && "Nouvelle facture"}
                        {isEditing && "Modifier la facture"}
                        {isReadOnly && "Détails de la facture"}
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

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSettingsClick}
                      className="h-8 w-8 p-0"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </Button>
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

            {/* Enhanced Form ou Settings View */}
            <div className="flex-1 min-h-0 mr-2">
              {/* Alertes d'erreur intelligentes */}
              {validationErrors?.client && (
                <ErrorAlert
                  title="Erreur client"
                  message={validationErrors.client}
                  onEdit={() => setShowEditClient(true)}
                  editLabel="Modifier le client"
                />
              )}
              {validationErrors?.companyInfo && (
                <ErrorAlert
                  title="Erreur informations entreprise"
                  message={validationErrors.companyInfo}
                  onEdit={() => setShowEditCompany(true)}
                  editLabel="Modifier l'entreprise"
                />
              )}
              
              <FormProvider {...form}>
                {showSettings ? (
                  <InvoiceSettingsView
                    canEdit={!isReadOnly}
                    onCancel={handleCloseSettings}
                    onSave={async () => {
                      try {
                        // Sauvegarder les paramètres dans l'organisation
                        await saveSettingsToOrganization();
                        handleCloseSettings();
                        toast.success(
                          "Paramètres sauvegardés dans l'organisation"
                        );
                      } catch (error) {
                        console.error("Erreur lors de la sauvegarde:", error);
                        toast.error(
                          "Erreur lors de la sauvegarde des paramètres"
                        );
                      }
                    }}
                  />
                ) : (
                  <EnhancedInvoiceForm
                    onSave={handleSave}
                    onSubmit={handleSubmit}
                    loading={loading}
                    canEdit={!isReadOnly}
                    mode={mode}
                    validationErrors={validationErrors}
                  />
                )}
              </FormProvider>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="border-l flex-col h-full overflow-hidden hidden lg:flex">
          {/* <div className="flex-shrink-0 p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Aperçu de la facture</h2>
            </div>
          </div> */}

          <div className="flex-1 overflow-y-auto pl-18 pr-18 pt-22 pb-22 bg-[#F9F9F9] dark:bg-[#1a1a1a] h-full">
            <UniversalPreviewPDF data={formData} type="invoice" />
          </div>
        </div>
      </div>
      
      {/* Modals d'édition rapide */}
      {formData.client && (
        <QuickEditClientModal
          open={showEditClient}
          onOpenChange={setShowEditClient}
          client={formData.client}
          onClientUpdated={handleClientUpdated}
        />
      )}
      
      <QuickEditCompanyModal
        open={showEditCompany}
        onOpenChange={setShowEditCompany}
        onCompanyUpdated={handleCompanyUpdated}
      />
    </div>
  );
}
