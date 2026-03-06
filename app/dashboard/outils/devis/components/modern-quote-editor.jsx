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
  BookTemplate,
  Trash2,
  SlidersHorizontal,
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
import { SaveQuoteTemplateDialog } from "./SaveQuoteTemplateDialog";
import { useQuoteTemplates, GET_QUOTE_TEMPLATES, DELETE_QUOTE_TEMPLATE, useCheckQuoteNumber } from "@/src/graphql/quoteQueries";
import { useMutation } from "@apollo/client";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";

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
  const [organization, setOrganization] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [debouncedFormData, setDebouncedFormData] = useState(null);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [createdQuoteData, setCreatedQuoteData] = useState(null);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showManageTemplates, setShowManageTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("none");
  const pdfRef = useRef(null);

  // Template selector (create mode only)
  const { workspaceId } = useWorkspace();
  const { templates, loading: templatesLoading } = useQuoteTemplates();
  const [deleteTemplateMutation] = useMutation(DELETE_QUOTE_TEMPLATE, {
    refetchQueries: [{ query: GET_QUOTE_TEMPLATES, variables: { workspaceId } }],
  });

  // Récupérer l'organisation au chargement (pour les valeurs par défaut des templates)
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

  // Champs préservés lors d'un changement de modèle
  const getPreservedFields = () => {
    const v = form.getValues();
    return {
      client: v.client,
      companyInfo: v.companyInfo,
      number: v.number,
      issueDate: v.issueDate,
      validUntil: v.validUntil,
      status: v.status,
      prefix: v.prefix,
    };
  };

  // Valeurs par défaut d'un devis vierge — réutilise les paramètres globaux de l'organisation
  const getBlankQuoteFields = () => ({
    items: [],
    headerNotes: organization?.quoteHeaderNotes || organization?.documentHeaderNotes || "",
    footerNotes: organization?.quoteFooterNotes || organization?.documentFooterNotes || "",
    termsAndConditions: organization?.quoteTermsAndConditions || organization?.documentTermsAndConditions || "",
    termsAndConditionsLink: "",
    termsAndConditionsLinkTitle: "",
    customFields: [],
    discount: 0,
    discountType: "PERCENTAGE",
    appearance: {
      textColor: organization?.quoteTextColor || organization?.documentTextColor || "#000000",
      headerTextColor: organization?.quoteHeaderTextColor || organization?.documentHeaderTextColor || "#ffffff",
      headerBgColor: organization?.quoteHeaderBgColor || organization?.documentHeaderBgColor || "#5b50FF",
    },
    clientPositionRight: organization?.quoteClientPositionRight || false,
    isReverseCharge: false,
    showBankDetails: organization?.showBankDetails || false,
    shipping: { billShipping: false, shippingAddress: null, shippingAmountHT: 0, shippingVatRate: 20 },
    retenueGarantie: 0,
    escompte: 0,
  });

  // Handler pour appliquer un modèle au formulaire
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    const preserved = getPreservedFields();

    if (!templateId || templateId === "none") {
      form.reset({ ...preserved, ...getBlankQuoteFields() }, { keepDefaultValues: false });
      toast.success("Modèle retiré — devis remis à zéro");
      return;
    }

    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    form.reset({
      ...preserved,
      items: template.items?.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        unit: item.unit || '',
        discount: item.discount || 0,
        discountType: item.discountType || 'PERCENTAGE',
        details: item.details || '',
        vatExemptionText: item.vatExemptionText || '',
        progressPercentage: item.progressPercentage != null ? item.progressPercentage : 100,
      })) || [],
      headerNotes: template.headerNotes ?? "",
      footerNotes: template.footerNotes ?? "",
      termsAndConditions: template.termsAndConditions ?? "",
      termsAndConditionsLink: template.termsAndConditionsLink ?? "",
      termsAndConditionsLinkTitle: template.termsAndConditionsLinkTitle ?? "",
      customFields: template.customFields?.length ? template.customFields : [],
      discount: template.discount ?? 0,
      discountType: template.discountType ?? "PERCENTAGE",
      appearance: template.appearance ?? { textColor: "#000000", headerTextColor: "#ffffff", headerBgColor: "#5b50FF" },
      clientPositionRight: template.clientPositionRight ?? false,
      isReverseCharge: template.isReverseCharge ?? false,
      showBankDetails: template.showBankDetails ?? false,
      shipping: template.shipping ?? { billShipping: false, shippingAddress: null, shippingAmountHT: 0, shippingVatRate: 20 },
      retenueGarantie: template.retenueGarantie ?? 0,
      escompte: template.escompte ?? 0,
    }, { keepDefaultValues: false });

    toast.success(`Modèle "${template.name}" appliqué`);
  };

  const handleDeleteTemplate = async (templateId) => {
    await deleteTemplateMutation({ variables: { id: templateId, workspaceId } });
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

                    {/* Bouton Sauv. modèle */}
                    {!isCreating && quoteId && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowSaveTemplateDialog(true)}
                        title="Sauvegarder comme modèle"
                      >
                        <BookTemplate className="w-4 h-4" />
                      </Button>
                    )}

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

            {/* Template selector (create mode only) */}
            {isCreating && templates.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Appliquer un modèle..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun modèle</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.items?.length || 0} article{(t.items?.length || 0) > 1 ? 's' : ''})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Popover open={showManageTemplates} onOpenChange={setShowManageTemplates}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 font-normal">
                      <SlidersHorizontal className="w-4 h-4" />
                      Gérer les modèles
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72" align="end">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Gérer les modèles</h4>
                      {templates.length === 0 && (
                        <p className="text-sm text-muted-foreground">Aucun modèle</p>
                      )}
                      {templates.map((t) => (
                        <div key={t.id} className="flex items-center justify-between gap-2 py-1">
                          <span className="text-sm truncate flex-1">{t.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteTemplate(t.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

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
                      onSave={() => {
                        setShowSettings(false);
                        toast.success("Paramètres appliqués à ce devis");
                      }}
                      canEdit={!isReadOnly}
                      saveLabel="Appliquer à ce devis"
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

      {/* Dialog de sauvegarde comme modèle */}
      {quoteId && (
        <SaveQuoteTemplateDialog
          quoteId={quoteId}
          quoteNumber={`${formData?.prefix || "D"}-${formData?.number || ""}`}
          open={showSaveTemplateDialog}
          onOpenChange={setShowSaveTemplateDialog}
        />
      )}
    </div>
  );
}
