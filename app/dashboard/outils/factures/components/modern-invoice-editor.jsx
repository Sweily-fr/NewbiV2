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
  ChevronDown,
  ChevronUp,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";
import { useInvoiceEditor } from "../hooks/use-invoice-editor";
import { useClient } from "@/src/graphql/clientQueries";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import EnhancedInvoiceForm from "./enhanced-invoice-form";
import InvoiceSettingsView from "./invoice-settings-view";
import { toast } from "@/src/components/ui/sonner";
import {
  updateOrganization,
  getActiveOrganization,
} from "@/src/lib/organization-client";
import ClientsModal from "@/app/dashboard/clients/components/clients-modal";
import { QuickEditCompanyModal } from "@/src/components/invoice/quick-edit-company-modal";
import { useOrganizationChange } from "@/src/hooks/useOrganizationChange";
import { ResourceNotFound } from "@/src/components/resource-not-found";
import { SendDocumentModal } from "./send-document-modal";

export default function ModernInvoiceEditor({
  mode = "create",
  invoiceId = null,
  initialData = null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdFromUrl = mode === "create" ? searchParams.get("clientId") : null;
  const { client: preselectedClient } = useClient(clientIdFromUrl);
  const [showSettings, setShowSettings] = useState(false);
  const [organization, setOrganization] = useState(null);
  const [showEditClient, setShowEditClient] = useState(false);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [debouncedFormData, setDebouncedFormData] = useState(null);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [createdInvoiceData, setCreatedInvoiceData] = useState(null);
  const [previousSituationInvoices, setPreviousSituationInvoices] = useState(
    []
  );
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
    handleSave,
    handleSubmit,
    handleAutoSave,
    isDirty,
    errors,
    validationErrors,
    setValidationErrors,
    clearValidationErrors,
    validateInvoiceNumber,
    saveSettingsToOrganization,
    invoice: loadedInvoice,
    error: invoiceError,
    markFieldAsEditing,
    unmarkFieldAsEditing,
  } = useInvoiceEditor({
    mode,
    invoiceId,
    initialData,
    organization,
  });

  // Pré-remplir le client si clientId est dans l'URL
  useEffect(() => {
    if (preselectedClient && mode === "create" && !formData?.client) {
      form.setValue("client", preselectedClient, { shouldDirty: true });
    }
  }, [preselectedClient, mode, form]);

  // Déterminer si la facture est en lecture seule
  const readOnly =
    loadedInvoice?.status === "SENT" || loadedInvoice?.status === "PAID";

  // Debounce pour la preview (évite les saccades)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFormData(formData);
    }, 300); // Attendre 300ms après la dernière modification

    return () => clearTimeout(timer);
  }, [formData]);

  // Détecter les changements d'organisation pour les modes edit/view
  useOrganizationChange({
    resourceId: invoiceId,
    resourceExists: mode === "create" ? true : !!loadedInvoice && !invoiceError,
    listUrl: "/dashboard/outils/factures",
    enabled: mode !== "create" && !loading,
  });

  const [closeSettingsHandler, setCloseSettingsHandler] = useState(null);

  // Afficher un message si la facture n'existe pas (après changement d'organisation)
  if (mode !== "create" && !loading && !loadedInvoice && invoiceError) {
    return (
      <ResourceNotFound
        resourceType="facture"
        resourceName="Cette facture"
        listUrl="/dashboard/outils/factures"
        homeUrl="/dashboard"
      />
    );
  }

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

  // Fonction helper pour formater les dates
  const formatDate = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString("fr-FR");
  };

  // Handler personnalisé pour créer la facture et proposer l'envoi par email
  const handleSubmitWithEmail = async () => {
    const result = await handleSubmit();

    if (result?.success && result?.invoice) {
      // Stocker les données de la facture créée pour la modal d'envoi
      const invoiceData = {
        id: result.invoice.id,
        number: `${result.invoice.prefix || "F"}-${result.invoice.number}`,
        clientName: result.invoice.client?.name,
        clientEmail: result.invoice.client?.email,
        totalAmount: new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
        }).format(result.invoice.finalTotalTTC || 0),
        companyName: result.invoice.companyInfo?.name,
        issueDate:
          formatDate(result.invoice.issueDate) ||
          formatDate(formData.issueDate),
        dueDate:
          formatDate(result.invoice.dueDate) || formatDate(formData.dueDate),
        redirectUrl: result.redirectUrl,
      };
      setCreatedInvoiceData(invoiceData);

      // Stocker les données dans sessionStorage pour afficher le toast sur la page de liste
      if (typeof window !== "undefined") {
        sessionStorage.setItem("newInvoiceData", JSON.stringify(invoiceData));
      }

      // Rediriger vers la liste des factures
      router.push("/dashboard/outils/factures");
    }
  };

  // Handler pour fermer la modal après envoi d'email
  const handleEmailModalClose = () => {
    setShowSendEmailModal(false);
    // Rediriger vers la liste des factures après envoi ou fermeture
    router.push("/dashboard/outils/factures");
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
                      variant="outline"
                      size="icon"
                      onClick={handleSettingsClick}
                    >
                      <Settings className="w-4 h-4" />
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
            <div className="flex-1 min-h-0 md:mr-2 flex flex-col">
              <div className="flex-1 min-h-0">
                <FormProvider {...form}>
                  {showSettings ? (
                    <InvoiceSettingsView
                      canEdit={!isReadOnly}
                      onCancel={() => setShowSettings(false)}
                      onCloseAttempt={setCloseSettingsHandler}
                      validateInvoiceNumberExists={validateInvoiceNumber}
                      validationErrors={validationErrors}
                      setValidationErrors={setValidationErrors}
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
                    />
                  ) : (
                    <EnhancedInvoiceForm
                      onSave={handleSave}
                      onSubmit={handleSubmitWithEmail}
                      loading={loading}
                      saving={saving}
                      readOnly={readOnly}
                      errors={errors}
                      validationErrors={validationErrors}
                      setValidationErrors={setValidationErrors}
                      validateInvoiceNumber={validateInvoiceNumber}
                      currentStep={currentStep}
                      onStepChange={setCurrentStep}
                      onEditClient={() => setShowEditClient(true)}
                      markFieldAsEditing={markFieldAsEditing}
                      unmarkFieldAsEditing={unmarkFieldAsEditing}
                      onPreviousSituationInvoicesChange={
                        setPreviousSituationInvoices
                      }
                    />
                  )}
                </FormProvider>
              </div>
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

          <div className="flex-1 overflow-y-auto pl-18 pr-18 pt-22 pb-22 bg-[#F9F9F9] dark:bg-[#1a1a1a] h-full relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#F9F9F9] dark:bg-[#1a1a1a]">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : debouncedFormData ? (
              <div ref={pdfRef}>
                <UniversalPreviewPDF
                  data={debouncedFormData}
                  type="invoice"
                  previousSituationInvoices={previousSituationInvoices}
                />
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

      <QuickEditCompanyModal
        open={showEditCompany}
        onOpenChange={setShowEditCompany}
        onCompanyUpdated={handleCompanyUpdated}
      />

      {/* Modal d'envoi par email */}
      {createdInvoiceData && (
        <SendDocumentModal
          open={showSendEmailModal}
          onOpenChange={setShowSendEmailModal}
          documentId={createdInvoiceData.id}
          documentType="invoice"
          documentNumber={createdInvoiceData.number}
          clientName={createdInvoiceData.clientName}
          clientEmail={createdInvoiceData.clientEmail}
          totalAmount={createdInvoiceData.totalAmount}
          companyName={createdInvoiceData.companyName}
          issueDate={createdInvoiceData.issueDate}
          dueDate={createdInvoiceData.dueDate}
          onSent={handleEmailModalClose}
          onClose={() =>
            router.push(
              createdInvoiceData.redirectUrl || "/dashboard/outils/factures"
            )
          }
          pdfRef={pdfRef}
        />
      )}
    </div>
  );
}
