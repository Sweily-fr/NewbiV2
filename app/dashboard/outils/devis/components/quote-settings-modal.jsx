"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@/src/components/ui/button";
import { X, LoaderCircle } from "lucide-react";
import QuoteSettingsView from "./quote-settings-view";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import { toast } from "@/src/components/ui/sonner";
import { updateOrganization, getActiveOrganization } from "@/src/lib/organization-client";
import { generateQuotePrefix } from "@/src/utils/quoteUtils";

// Données de démonstration pour la preview
const getDemoQuoteData = (formData, organization) => {
  // Récupérer les paramètres depuis le formulaire
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

  const prefix = formData?.prefix || "";
  const number = formData?.number || "0001";
  const quoteNumber = prefix ? `${prefix}-${number}` : number;

  return {
    quoteNumber,
    prefix,
    number,
    issueDate: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "PENDING",
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
      name: formData?.companyName || organization?.companyName || "Votre Entreprise",
      email: formData?.companyEmail || organization?.companyEmail || "contact@entreprise.fr",
      phone: formData?.companyPhone || organization?.companyPhone || "+33 1 23 45 67 89",
      address: {
        street: formData?.addressStreet || organization?.addressStreet || "1 Rue de la République",
        postalCode: formData?.addressZipCode || organization?.addressZipCode || "75001",
        city: formData?.addressCity || organization?.addressCity || "Paris",
        country: formData?.addressCountry || organization?.addressCountry || "France",
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
    // Appliquer les paramètres du formulaire
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
    // Appliquer la couleur via appearance (utilisé par UniversalPreviewPDF)
    appearance: {
      headerBgColor: headerBgColor,
      headerTextColor: headerTextColor,
      textColor: textColor,
    },
    // Appliquer tous les autres paramètres de quote settings
    quoteSettings: {
      ...quoteSettings,
      headerNotes: headerNotes,
      footerNotes: footerNotes,
      termsAndConditions: termsAndConditions,
      showBankDetails: showBankDetails,
      primaryColor: headerBgColor,
    },
    // Position du client dans le PDF
    clientPositionRight: clientPositionRight,
  };
};

export function QuoteSettingsModal({ open, onOpenChange }) {
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
          
          // Préparer les valeurs initiales depuis l'organisation (même structure que l'éditeur)
          const formValues = {
            // Numérotation - préfixe par défaut (le numéro sera auto-rempli par le hook useQuoteNumber)
            prefix: org?.quotePrefix || generateQuotePrefix(),
            number: org?.quoteStartNumber || "",
            // Informations de l'entreprise
            companyName: org?.companyName || "",
            companyEmail: org?.companyEmail || "",
            companyPhone: org?.companyPhone || "",
            website: org?.website || "",
            addressStreet: org?.addressStreet || "",
            addressCity: org?.addressCity || "",
            addressZipCode: org?.addressZipCode || "",
            addressCountry: org?.addressCountry || "France",
            // Paramètres spécifiques aux devis
            quoteSettings: {},
            bankDetails: {
              iban: org?.bankIban || "",
              bic: org?.bankBic || "",
              bankName: org?.bankName || "",
            },
            // Ajouter userBankDetails pour que QuoteSettingsView puisse détecter les coordonnées bancaires
            userBankDetails: {
              iban: org?.bankIban || "",
              bic: org?.bankBic || "",
              bankName: org?.bankName || "",
            },
            headerNotes: org?.quoteHeaderNotes || org?.documentHeaderNotes || "",
            footerNotes: org?.quoteFooterNotes || org?.documentFooterNotes || "",
            termsAndConditions: org?.quoteTermsAndConditions || org?.documentTermsAndConditions || "",
            showBankDetails: org?.showBankDetails || false,
            primaryColor: org?.quoteHeaderBgColor || org?.documentHeaderBgColor || "#5b4fff",
            appearance: {
              textColor: org?.quoteTextColor || org?.documentTextColor || "#000000",
              headerTextColor: org?.quoteHeaderTextColor || org?.documentHeaderTextColor || "#ffffff",
              headerBgColor: org?.quoteHeaderBgColor || org?.documentHeaderBgColor || "#5b4fff",
            },
            clientPositionRight: org?.quoteClientPositionRight || false,
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
      // Réinitialiser l'état quand le modal se ferme
      setIsLoading(true);
      setDebouncedFormData(null);
      setInitialValues(null);
    }
  }, [open]);

  // Initialiser le formulaire avec les valeurs de l'organisation
  const form = useForm({
    defaultValues: initialValues || {
      prefix: generateQuotePrefix(),
      number: "",
      companyName: "",
      companyEmail: "",
      companyPhone: "",
      website: "",
      addressStreet: "",
      addressCity: "",
      addressZipCode: "",
      addressCountry: "France",
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

  // Debounce pour la preview (évite les saccades)
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
      
      // Préparer les données pour la mise à jour
      const updateData = {
        // Informations de l'entreprise
        companyName: formValues.companyName || "",
        companyEmail: formValues.companyEmail || "",
        companyPhone: formValues.companyPhone || "",
        website: formValues.website || "",
        addressStreet: formValues.addressStreet || "",
        addressCity: formValues.addressCity || "",
        addressZipCode: formValues.addressZipCode || "",
        addressCountry: formValues.addressCountry || "France",

        // Notes et conditions spécifiques aux devis
        quoteHeaderNotes: formValues.headerNotes,
        quoteFooterNotes: formValues.footerNotes,
        quoteTermsAndConditions: formValues.termsAndConditions,

        // Couleurs spécifiques aux devis
        quoteHeaderBgColor: formValues.appearance?.headerBgColor || formValues.primaryColor || "#5b4fff",
        quoteHeaderTextColor: formValues.appearance?.headerTextColor || "#ffffff",
        quoteTextColor: formValues.appearance?.textColor || "#000000",

        // Préfixe de numérotation
        quotePrefix: formValues.prefix || "",
        quoteStartNumber: formValues.number || "",

        // Position du client dans le PDF (devis)
        quoteClientPositionRight: formValues.clientPositionRight || false,

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
      console.error("❌ Erreur lors de l'enregistrement:", error);
      toast.error(error.message || "Erreur lors de l'enregistrement des paramètres");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  const demoData = debouncedFormData ? getDemoQuoteData(debouncedFormData, organization) : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] h-full">
        {/* Left Panel - Settings */}
        <div className="px-4 pt-6 pb-4 md:px-6 md:pt-6 flex flex-col h-full overflow-hidden">
          <div className="max-w-2xl mx-auto flex flex-col w-full h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-normal">Paramètres des devis</h2>
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
              <UniversalPreviewPDF data={demoData} type="quote" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
