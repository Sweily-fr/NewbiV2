"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@/src/components/ui/button";
import { X, LoaderCircle } from "lucide-react";
import QuoteSettingsView from "@/app/dashboard/outils/devis/components/quote-settings-view";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import { toast } from "@/src/components/ui/sonner";
import { updateOrganization, getActiveOrganization } from "@/src/lib/organization-client";

// Données de démonstration pour la preview des bons de commande
const getDemoPurchaseOrderData = (formData, organization) => {
  const quoteSettings = formData?.quoteSettings || {};
  const bankDetails = formData?.bankDetails || {};
  const headerNotes = formData?.headerNotes || "";
  const footerNotes = formData?.footerNotes || "";
  const termsAndConditions = formData?.termsAndConditions || "";
  const showBankDetails = formData?.showBankDetails !== undefined ? formData?.showBankDetails : false;
  const headerBgColor = formData?.appearance?.headerBgColor || formData?.primaryColor || "#5b4fff";
  const headerTextColor = formData?.appearance?.headerTextColor || "#FFFFFF";
  const textColor = formData?.appearance?.textColor || "#000000";
  const clientPositionRight = formData?.clientPositionRight || false;

  return {
    quoteNumber: "BD-DEMO-2024-001",
    prefix: "BD",
    number: "001",
    issueDate: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "CONFIRMED",
    client: {
      name: "Client Exemple SARL",
      email: "contact@client-exemple.fr",
      phone: "+33 1 23 45 67 89",
      address: {
        street: "123 Avenue des Champs-Élysées",
        postalCode: "75008",
        city: "Paris",
        country: "France",
      },
      siret: "12345678901234",
      vatNumber: "FR12345678901",
      type: "company",
    },
    companyInfo: {
      name: organization?.name || "Votre Entreprise",
      email: organization?.email || "contact@entreprise.fr",
      phone: organization?.phone || "+33 1 23 45 67 89",
      address: organization?.address || {
        street: "1 Rue de la République",
        postalCode: "75001",
        city: "Paris",
        country: "France",
      },
      siret: organization?.siret || "98765432109876",
      vatNumber: organization?.vatNumber || "FR98765432109",
      logo: organization?.logo || null,
      bankDetails: {
        iban: bankDetails?.iban || "",
        bic: bankDetails?.bic || "",
        bankName: bankDetails?.bankName || "",
      },
    },
    items: [
      {
        description: "Prestation de service - Développement",
        quantity: 10,
        unitPrice: 500,
        vatRate: 20,
        total: 5000,
      },
      {
        description: "Consulting et accompagnement",
        quantity: 5,
        unitPrice: 800,
        vatRate: 20,
        total: 4000,
      },
    ],
    subtotal: 9000,
    totalVAT: 1800,
    total: 10800,
    headerNotes: headerNotes,
    footerNotes: footerNotes,
    termsAndConditions: termsAndConditions,
    showBankDetails: showBankDetails,
    bankDetails: {
      iban: bankDetails?.iban || "",
      bic: bankDetails?.bic || "",
      bankName: bankDetails?.bankName || "",
    },
    primaryColor: headerBgColor,
    appearance: {
      headerBgColor: headerBgColor,
      headerTextColor: headerTextColor,
      textColor: textColor,
    },
    quoteSettings: {
      ...quoteSettings,
      headerNotes: headerNotes,
      footerNotes: footerNotes,
      termsAndConditions: termsAndConditions,
      showBankDetails: showBankDetails,
      primaryColor: headerBgColor,
    },
    clientPositionRight: clientPositionRight,
  };
};

export function PurchaseOrderSettingsModal({ open, onOpenChange }) {
  const [isSaving, setIsSaving] = useState(false);
  const [organization, setOrganization] = useState(null);
  const [debouncedFormData, setDebouncedFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialValues, setInitialValues] = useState(null);

  // Charger les données de l'organisation dès l'ouverture
  useEffect(() => {
    if (open) {
      const loadOrganization = async () => {
        try {
          setIsLoading(true);
          const org = await getActiveOrganization();
          setOrganization(org);

          // Préparer les valeurs initiales depuis l'organisation (champs PO-spécifiques avec fallback)
          const formValues = {
            quoteSettings: {},
            bankDetails: {
              iban: org?.bankIban || "",
              bic: org?.bankBic || "",
              bankName: org?.bankName || "",
            },
            userBankDetails: {
              iban: org?.bankIban || "",
              bic: org?.bankBic || "",
              bankName: org?.bankName || "",
            },
            headerNotes: org?.purchaseOrderHeaderNotes || org?.documentHeaderNotes || "",
            footerNotes: org?.purchaseOrderFooterNotes || org?.documentFooterNotes || "",
            termsAndConditions: org?.purchaseOrderTermsAndConditions || org?.documentTermsAndConditions || "",
            showBankDetails: org?.showBankDetails || false,
            primaryColor: org?.documentHeaderBgColor || "#5b4fff",
            appearance: {
              textColor: org?.documentTextColor || "#000000",
              headerTextColor: org?.documentHeaderTextColor || "#ffffff",
              headerBgColor: org?.documentHeaderBgColor || "#5b4fff",
            },
            clientPositionRight: org?.purchaseOrderClientPositionRight || false,
          };

          setInitialValues(formValues);
          setDebouncedFormData(formValues);
          setIsLoading(false);
        } catch (error) {
          console.error("Erreur lors du chargement des paramètres:", error);
          setIsLoading(false);
        }
      };

      loadOrganization();
    } else {
      setIsLoading(true);
      setDebouncedFormData(null);
      setInitialValues(null);
    }
  }, [open]);

  // Initialiser le formulaire avec les valeurs de l'organisation
  const form = useForm({
    defaultValues: initialValues || {
      quoteSettings: {},
      bankDetails: {},
      userBankDetails: {},
      headerNotes: "",
      footerNotes: "",
      termsAndConditions: "",
      showBankDetails: false,
      primaryColor: "#5b4fff",
      appearance: {
        textColor: "#000000",
        headerTextColor: "#ffffff",
        headerBgColor: "#5b4fff",
      },
      clientPositionRight: false,
    },
  });

  // Réinitialiser le formulaire quand les valeurs initiales changent
  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);

  // Observer tous les changements du formulaire
  const formData = form.watch();

  // Debounce pour la preview
  useEffect(() => {
    if (!isLoading && formData) {
      const timer = setTimeout(() => {
        setDebouncedFormData(formData);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [formData, isLoading]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const formValues = form.getValues();

      if (!organization?.id) {
        toast.error("Aucune organisation active");
        setIsSaving(false);
        return;
      }

      // Préparer les données pour la mise à jour (champs PO-spécifiques)
      const updateData = {
        // Notes et conditions spécifiques aux bons de commande
        purchaseOrderHeaderNotes: formValues.headerNotes,
        purchaseOrderFooterNotes: formValues.footerNotes,
        purchaseOrderTermsAndConditions: formValues.termsAndConditions,

        // Couleurs du document (lues depuis appearance.*)
        documentHeaderBgColor: formValues.appearance?.headerBgColor || formValues.primaryColor || "#5b4fff",
        documentHeaderTextColor: formValues.appearance?.headerTextColor || "#ffffff",
        documentTextColor: formValues.appearance?.textColor || "#000000",

        // Position du client dans le PDF (bons de commande)
        purchaseOrderClientPositionRight: formValues.clientPositionRight || false,

        // Coordonnées bancaires
        bankIban: formValues.bankDetails?.iban || "",
        bankBic: formValues.bankDetails?.bic || "",
        bankName: formValues.bankDetails?.bankName || "",
        showBankDetails: formValues.showBankDetails,
      };

      await updateOrganization(organization.id, updateData);

      toast.success("Paramètres enregistrés avec succès");
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      toast.error("Erreur lors de l'enregistrement des paramètres");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  const demoData = debouncedFormData ? getDemoPurchaseOrderData(debouncedFormData, organization) : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] h-full">
        {/* Left Panel - Settings */}
        <div className="px-4 pt-6 pb-4 md:px-6 md:pt-6 flex flex-col h-full overflow-hidden">
          <div className="max-w-2xl mx-auto flex flex-col w-full h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Paramètres des bons de commande</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Settings Form */}
            <div className="flex-1 min-h-0 md:mr-2 flex flex-col">
              <div className="flex-1 min-h-0">
                <FormProvider {...form}>
                  <QuoteSettingsView
                    canEdit={true}
                    onCancel={() => onOpenChange(false)}
                    onSave={handleSave}
                    documentType="purchaseOrder"
                  />
                </FormProvider>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="border-l flex-col h-full overflow-hidden hidden lg:flex">
          <div className="flex-1 overflow-y-auto pl-18 pr-18 pt-22 pb-22 bg-[#F9F9F9] dark:bg-[#1a1a1a] h-full relative">
            {isLoading || !demoData ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#F9F9F9] dark:bg-[#1a1a1a]">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <UniversalPreviewPDF data={demoData} type="purchaseOrder" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
