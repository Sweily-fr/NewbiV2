"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
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
import ClientsModal from "@/app/dashboard/clients/components/clients-modal";
import { SendDocumentModal } from "@/app/dashboard/outils/factures/components/send-document-modal";
import { SaveQuoteTemplateDialog } from "./SaveQuoteTemplateDialog";
import {
  useQuoteTemplates,
  GET_QUOTE_TEMPLATES,
  DELETE_QUOTE_TEMPLATE,
  useCheckQuoteNumber,
} from "@/src/graphql/quoteQueries";
import { useMutation } from "@apollo/client";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { updateOrganization as updateOrganizationSettings } from "@/src/lib/organization-client";
import {
  getOrganizationCompanyExtras,
  buildCompanyOrganizationUpdate,
} from "@/src/utils/organizationCompanyInfo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";

export default function ModernQuoteEditor({
  mode = "create",
  quoteId = null,
  initialData = null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdFromUrl =
    mode === "create" ? searchParams.get("clientId") : null;
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
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const bypassGuardRef = useRef(false);
  const sentinelPushedRef = useRef(false);
  const pdfRef = useRef(null);

  // Template selector (create mode only)
  const { workspaceId } = useWorkspace();
  const { templates, loading: templatesLoading } = useQuoteTemplates();
  const [deleteTemplateMutation] = useMutation(DELETE_QUOTE_TEMPLATE, {
    refetchQueries: [
      { query: GET_QUOTE_TEMPLATES, variables: { workspaceId } },
    ],
    onCompleted: () => toast.success("Modèle supprimé"),
    onError: () => toast.error("Erreur lors de la suppression du modèle"),
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
    markFieldAsEditing,
    unmarkFieldAsEditing,
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
  // Stabiliser par contenu pour éviter les re-renders inutiles (trackpad scroll, etc.)
  const formDataKey = useMemo(() => {
    try {
      return JSON.stringify(formData);
    } catch {
      return "";
    }
  }, [formData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFormData(formData);
    }, 300);

    return () => clearTimeout(timer);
  }, [formDataKey]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // La modal de confirmation ne s'affiche que si le devis est "draftable" :
  // un client sélectionné ET au moins un article.
  const watchedFormItems = form.watch("items");
  const watchedClient = form.watch("client");
  const hasItems =
    Array.isArray(watchedFormItems) && watchedFormItems.length > 0;
  const hasClient = !!(watchedClient && watchedClient.id);
  const hasUserChanges = hasClient && hasItems;
  const guardActive = hasUserChanges && !isReadOnly;

  useEffect(() => {
    if (!guardActive) return;

    if (!sentinelPushedRef.current) {
      window.history.pushState({ quoteEditorGuard: true }, "");
      sentinelPushedRef.current = true;
    }

    const handlePopState = () => {
      if (bypassGuardRef.current) {
        bypassGuardRef.current = false;
        return;
      }
      window.history.pushState({ quoteEditorGuard: true }, "");
      setShowUnsavedDialog(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [guardActive]);

  const leaveEditor = () => {
    bypassGuardRef.current = true;
    router.push("/dashboard/outils/devis");
  };

  const handleSaveDraftAndLeave = async () => {
    setSavingDraft(true);
    const ok = await onSave(formData);
    setSavingDraft(false);
    if (ok) {
      setShowUnsavedDialog(false);
    }
  };

  const handleLeaveWithoutSaving = () => {
    setShowUnsavedDialog(false);
    leaveEditor();
  };

  const handleBack = () => {
    if (!isReadOnly && hasUserChanges) {
      setShowUnsavedDialog(true);
      return;
    }
    leaveEditor();
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
      companyInfo: {
        ...getOrganizationCompanyExtras(organization),
        name: organization?.companyName || "",
        address: {
          street: organization?.addressStreet || "",
          city: organization?.addressCity || "",
          postalCode: organization?.addressZipCode || "",
          country: organization?.addressCountry || "",
        },
        email: organization?.companyEmail || "",
        phone: organization?.companyPhone || "",
        siret: organization?.siret || "",
        vatNumber: organization?.vatNumber || "",
        rcs: organization?.rcs || "",
        legalForm: organization?.legalForm || "",
        capitalSocial: organization?.capitalSocial || "",
        fiscalRegime: organization?.fiscalRegime || "",
        website: organization?.website || "",
        logo: organization?.logo || "",
        bankDetails: {
          iban: organization?.bankIban || "",
          bic: organization?.bankBic || "",
          bankName: organization?.bankName || "",
        },
      },
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
    headerNotes:
      organization?.quoteHeaderNotes || organization?.documentHeaderNotes || "",
    footerNotes:
      organization?.quoteFooterNotes || organization?.documentFooterNotes || "",
    termsAndConditions:
      organization?.quoteTermsAndConditions ||
      organization?.documentTermsAndConditions ||
      "",
    termsAndConditionsLink: "",
    termsAndConditionsLinkTitle: "",
    customFields: [],
    discount: 0,
    discountType: "PERCENTAGE",
    appearance: {
      textColor:
        organization?.quoteTextColor ||
        organization?.documentTextColor ||
        "#000000",
      headerTextColor:
        organization?.quoteHeaderTextColor ||
        organization?.documentHeaderTextColor ||
        "#ffffff",
      headerBgColor:
        organization?.quoteHeaderBgColor ||
        organization?.documentHeaderBgColor ||
        "#5b50FF",
    },
    clientPositionRight: organization?.quoteClientPositionRight || false,
    isReverseCharge: false,
    isVatExempt: false,
    showBankDetails: organization?.showBankDetails || false,
    shipping: {
      billShipping: false,
      shippingAddress: null,
      shippingAmountHT: 0,
      shippingVatRate: 20,
    },
    retenueGarantie: 0,
    escompte: 0,
    operationType: null,
  });

  // Handler pour appliquer un modèle au formulaire
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    const preserved = getPreservedFields();

    if (!templateId || templateId === "none") {
      form.reset(
        { ...preserved, ...getBlankQuoteFields() },
        { keepDefaultValues: false },
      );
      toast.success("Modèle retiré — devis remis à zéro");
      return;
    }

    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    form.reset(
      {
        ...preserved,
        items:
          template.items?.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            unit: item.unit || "",
            discount: item.discount || 0,
            discountType: item.discountType || "PERCENTAGE",
            details: item.details || "",
            vatExemptionText: item.vatExemptionText || "",
            progressPercentage:
              item.progressPercentage != null ? item.progressPercentage : 100,
          })) || [],
        headerNotes: template.headerNotes ?? "",
        footerNotes: template.footerNotes ?? "",
        termsAndConditions: template.termsAndConditions ?? "",
        termsAndConditionsLink: template.termsAndConditionsLink ?? "",
        termsAndConditionsLinkTitle: template.termsAndConditionsLinkTitle ?? "",
        customFields: template.customFields?.length
          ? template.customFields
          : [],
        discount: template.discount ?? 0,
        discountType: template.discountType ?? "PERCENTAGE",
        appearance: template.appearance ?? {
          textColor: "#000000",
          headerTextColor: "#ffffff",
          headerBgColor: "#5b50FF",
        },
        clientPositionRight: template.clientPositionRight ?? false,
        isReverseCharge: template.isReverseCharge ?? false,
        isVatExempt: template.isVatExempt ?? false,
        showBankDetails: template.showBankDetails ?? false,
        shipping: template.shipping ?? {
          billShipping: false,
          shippingAddress: null,
          shippingAmountHT: 0,
          shippingVatRate: 20,
        },
        retenueGarantie: template.retenueGarantie ?? 0,
        escompte: template.escompte ?? 0,
        operationType: template.operationType ?? null,
      },
      { keepDefaultValues: false },
    );

    toast.success(`Modèle "${template.name}" appliqué`);
  };

  const handleDeleteTemplate = async (templateId) => {
    await deleteTemplateMutation({
      variables: { id: templateId, workspaceId },
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] h-full">
        {/* Left Panel - Enhanced Form */}
        <div className="px-4 pt-6 pb-4 md:px-6 md:pt-6 flex flex-col h-full overflow-hidden">
          <div className="max-w-2xl mx-auto flex flex-col w-full h-full">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 md:pb-6 border-b">
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
                  {/* Sous-texte "Modifications non sauvegardées" masqué à la demande */}
                  {/*
                  {!showSettings && hasUserChanges && !isReadOnly && (
                    <p className="text-sm text-muted-foreground">
                      {saving
                        ? "Sauvegarde en cours..."
                        : "Modifications non sauvegardées"}
                    </p>
                  )}
                  */}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!showSettings && (
                  <>
                    {/* Croix pour fermer sur mobile */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBack}
                      className="h-8 w-8 p-0 md:hidden"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    {((isCreating && templates.length > 0) ||
                      (!isCreating && quoteId)) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" title="Modèles">
                            <BookTemplate className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-72">
                          {/* Liste des modèles à appliquer (mode création) */}
                          {isCreating && templates.length > 0 && (
                            <>
                              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                                Appliquer un modèle
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onSelect={() => handleTemplateSelect("none")}
                                className="gap-2"
                              >
                                {selectedTemplateId === "none" ? (
                                  <Check className="h-4 w-4 shrink-0" />
                                ) : (
                                  <span className="w-4 shrink-0" />
                                )}
                                <span className="text-sm">Aucun modèle</span>
                              </DropdownMenuItem>
                              {templates.map((t) => (
                                <DropdownMenuItem
                                  key={t.id}
                                  onSelect={() => handleTemplateSelect(t.id)}
                                  className="gap-2"
                                >
                                  {selectedTemplateId === t.id ? (
                                    <Check className="h-4 w-4 shrink-0" />
                                  ) : (
                                    <span className="w-4 shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm truncate">
                                      {t.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {t.items?.length || 0} article
                                      {(t.items?.length || 0) > 1 ? "s" : ""}
                                    </div>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => setShowManageTemplates(true)}
                                className="gap-2"
                              >
                                <SlidersHorizontal className="h-4 w-4 shrink-0" />
                                <span className="text-sm">
                                  Gérer les modèles
                                </span>
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* Sauvegarder comme modèle (mode édition) */}
                          {!isCreating && quoteId && (
                            <DropdownMenuItem
                              onSelect={() => setShowSaveTemplateDialog(true)}
                              className="gap-2"
                            >
                              <BookTemplate className="h-4 w-4 shrink-0" />
                              <span className="text-sm">
                                Sauvegarder comme modèle
                              </span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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

            {/* Enhanced Form or Settings */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0">
                <FormProvider {...form}>
                  {showSettings ? (
                    <QuoteSettingsView
                      formData={formData}
                      setFormData={setFormData}
                      onCancel={() => setShowSettings(false)}
                      onCloseAttempt={setCloseSettingsHandler}
                      onSave={async () => {
                        setShowSettings(false);
                        // Les champs généraux (infos entreprise, nom commercial,
                        // activité réglementée, logo) sont propagés à
                        // l'organisation pour changer partout — la numérotation
                        // et l'apparence restent locales à ce devis.
                        try {
                          if (organization?.id) {
                            await updateOrganizationSettings(
                              organization.id,
                              buildCompanyOrganizationUpdate(
                                form.getValues(),
                                organization,
                              ),
                            );
                          }
                          toast.success("Paramètres appliqués");
                        } catch {
                          toast.success("Paramètres appliqués à ce devis");
                        }
                      }}
                      canEdit={!isReadOnly}
                      saveLabel="Appliquer à ce devis"
                      validateNumberExists={checkQuoteNumber}
                      organization={organization}
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
                      onLeave={leaveEditor}
                      hasUserChanges={hasUserChanges}
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
                      markFieldAsEditing={markFieldAsEditing}
                      unmarkFieldAsEditing={unmarkFieldAsEditing}
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
            {/* Dès que l'aperçu est disponible, on le garde affiché : on ne le
                remplace jamais par un loader pendant l'édition (le loader ne
                sert qu'au tout premier chargement). Même schéma que l'éditeur
                bons de commande. */}
            {debouncedFormData ? (
              <div ref={pdfRef}>
                <UniversalPreviewPDF data={debouncedFormData} type="quote" />
              </div>
            ) : loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#F9F9F9] dark:bg-[#1a1a1a]">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
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

      {/* Modal de confirmation avant de quitter avec des changements non sauvegardés */}
      <AlertDialog
        open={showUnsavedDialog}
        onOpenChange={(open) => {
          if (!savingDraft) setShowUnsavedDialog(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enregistrer en brouillon&nbsp;?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des modifications non sauvegardées. Voulez-vous
              enregistrer ce devis en brouillon avant de quitter&nbsp;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingDraft}>
              Annuler
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handleLeaveWithoutSaving}
              disabled={savingDraft}
            >
              Quitter sans enregistrer
            </Button>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSaveDraftAndLeave();
              }}
              disabled={savingDraft}
            >
              {savingDraft ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer en brouillon"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              createdQuoteData.redirectUrl || "/dashboard/outils/devis",
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

      {/* Dialog gestion des modèles */}
      <Dialog open={showManageTemplates} onOpenChange={setShowManageTemplates}>
        <DialogContent className="sm:max-w-[520px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
          <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
            <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
              <DialogTitle className="text-sm font-medium flex items-center gap-2">
                <SlidersHorizontal className="size-4" />
                Gérer les modèles
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 px-5 pt-3 pb-4">
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Aucun modèle enregistré
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {templates.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/50"
                    >
                      <BookTemplate className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {t.items?.length || 0}
                          </span>{" "}
                          article{(t.items?.length || 0) > 1 ? "s" : ""}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                        onClick={() => handleDeleteTemplate(t.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
