"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { SettingsSidebar } from "@/src/components/settings-sidebar";
import { Separator } from "@/src/components/ui/separator";
import { Button } from "@/src/components/ui/button";
import { useSession } from "@/src/lib/auth-client";
import { useActiveOrganization } from "@/src/lib/organization-client";
import { toast } from "@/src/components/ui/sonner";
import { validateSettingsForm, sanitizeInput } from "@/src/lib/validation";

// Import des composants de section
import CompanySection from "./components/CompanySection";
import BankSection from "./components/BankSection";
import LegalSection from "./components/LegalSection";
import SecuritySection from "./components/SecuritySection";

// Configuration des onglets
const TABS_CONFIG = {
  entreprise: {
    title: "Informations de l'entreprise",
    description: "Gérez les informations générales de votre entreprise",
  },
  bank: {
    title: "Coordonnées bancaires",
    description: "Gérez vos informations bancaires",
  },
  legal: {
    title: "Informations légales",
    description: "Configurez les informations légales de votre entreprise",
  },
  security: {
    title: "Sécurité",
    description: "Gérez la sécurité de votre compte",
  },
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState("entreprise");
  const { data: session, isPending, error, refetch } = useSession();
  const {
    organization,
    loading: orgLoading,
    error: orgError,
    refetch: refetchOrg,
    updateOrganization,
  } = useActiveOrganization();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
    getValues,
  } = useForm({
    defaultValues: {
      // Informations entreprise
      name: "",
      email: "",
      phone: "",
      website: "",
      description: "",
      logo: "",

      // Adresse
      address: {
        street: "",
        city: "",
        postalCode: "",
        country: "France",
      },

      // Informations bancaires
      bankDetails: {
        iban: "",
        bic: "",
        bankName: "",
      },

      // Informations légales
      legal: {
        siret: "",
        vatNumber: "",
        rcs: "",
        legalForm: "",
        capital: "",
        regime: "",
        category: "",
      },
    },
  });

  // Fonction pour mettre à jour les informations de l'organisation
  const onSubmit = async (formData) => {
    try {
      if (!organization?.id) {
        toast.error("Aucune organisation active trouvée");
        return;
      }

      // Validation et nettoyage des données côté frontend
      const validation = validateSettingsForm(formData);

      if (!validation.isValid) {
        // Afficher les erreurs spécifiques dans la console
        // Object.keys(validation.errors).forEach((field) => {
        //   console.error(`Erreur ${field}:`, validation.errors[field]);
        // });

        toast.error(
          `Erreurs de validation: ${Object.keys(validation.errors).join(", ")}`
        );
        return;
      }

      // Utiliser les données nettoyées
      const sanitizedFormData = validation.sanitizedData;

      // Récupérer les données existantes de l'organisation
      const existingOrgData = organization || {};

      // Transformer les données pour correspondre au schéma organization
      const transformedData = {
        // Informations de base de l'entreprise
        companyName:
          sanitizedFormData.name || existingOrgData.companyName || "",
        companyEmail:
          sanitizedFormData.email || existingOrgData.companyEmail || "",
        companyPhone:
          sanitizedFormData.phone || existingOrgData.companyPhone || "",
        website: sanitizedFormData.website || existingOrgData.website || "",
        logo:
          sanitizedFormData.logo !== undefined
            ? sanitizedFormData.logo
            : existingOrgData.logo || "",

        // Informations légales
        siret: sanitizedFormData.legal?.siret || existingOrgData.siret || "",
        vatNumber:
          sanitizedFormData.legal?.vatNumber || existingOrgData.vatNumber || "",
        rcs: sanitizedFormData.legal?.rcs || existingOrgData.rcs || "",
        legalForm:
          sanitizedFormData.legal?.legalForm || existingOrgData.legalForm || "",
        capitalSocial:
          sanitizedFormData.legal?.capital ||
          existingOrgData.capitalSocial ||
          "",
        fiscalRegime:
          sanitizedFormData.legal?.regime || existingOrgData.fiscalRegime || "",
        activityCategory:
          sanitizedFormData.legal?.category ||
          existingOrgData.activityCategory ||
          "",
        isVatSubject:
          sanitizedFormData.legal?.isVatSubject ||
          existingOrgData.isVatSubject ||
          false,
        hasCommercialActivity:
          sanitizedFormData.legal?.hasCommercialActivity ||
          existingOrgData.hasCommercialActivity ||
          false,

        // Adresse (champs aplatis)
        addressStreet:
          sanitizedFormData.address?.street ||
          existingOrgData.addressStreet ||
          "",
        addressCity:
          sanitizedFormData.address?.city || existingOrgData.addressCity || "",
        addressZipCode:
          sanitizedFormData.address?.postalCode ||
          existingOrgData.addressZipCode ||
          "",
        addressCountry:
          sanitizedFormData.address?.country ||
          existingOrgData.addressCountry ||
          "France",

        // Coordonnées bancaires (champs aplatis)
        bankName:
          sanitizedFormData.bankDetails?.bankName !== undefined
            ? sanitizedFormData.bankDetails.bankName
            : existingOrgData.bankName || "",
        bankIban:
          sanitizedFormData.bankDetails?.iban !== undefined
            ? sanitizedFormData.bankDetails.iban
            : existingOrgData.bankIban || "",
        bankBic:
          sanitizedFormData.bankDetails?.bic !== undefined
            ? sanitizedFormData.bankDetails.bic
            : existingOrgData.bankBic || "",
      };

      await updateOrganization(transformedData, {
        onSuccess: () => {
          toast.success("Informations mises à jour avec succès");
          // Ne pas refetch immédiatement pour éviter de remettre les anciennes valeurs
          // Le useEffect se chargera de la synchronisation quand les nouvelles données arriveront
        },
        onError: (error) => {
          toast.error("Erreur lors de la mise à jour");
        },
      });
    } catch (error) {
      toast.error("Une erreur s'est produite lors de la mise à jour");
    }
  };

  // Charger les données de l'organisation et du user dans le formulaire
  useEffect(() => {
    if (organization && session?.user) {
      reset({
        name: organization.companyName || "",
        email: organization.companyEmail || "",
        phone: organization.companyPhone || "",
        website: organization.website || "",
        description: organization.description || "",
        logo: organization.logo || "",
        address: {
          street: organization.addressStreet || "",
          city: organization.addressCity || "",
          postalCode: organization.addressZipCode || "",
          country: organization.addressCountry || "France",
        },
        bankDetails: {
          iban: organization.bankIban || "",
          bic: organization.bankBic || "",
          bankName: organization.bankName || "",
        },
        // Informations légales - mapper vers la structure legal.* pour cohérence avec LegalSection
        legal: {
          siret: organization.siret || "",
          vatNumber: organization.vatNumber || "",
          rcs: organization.rcs || "",
          legalForm: organization.legalForm || "",
          capital: organization.capitalSocial || "",
          regime: organization.fiscalRegime || "",
          category: organization.activityCategory || "",
          isVatSubject: organization.isVatSubject || false,
          hasCommercialActivity: organization.hasCommercialActivity || false,
        },
      });
    }
  }, [organization, session, reset]);

  // Fonction pour rendre la section active
  const renderActiveSection = () => {
    const commonProps = {
      register,
      errors,
      watch,
      setValue,
      getValues,
      session,
      organization,
    };

    switch (activeTab) {
      case "entreprise":
        return <CompanySection {...commonProps} />;
      case "bank":
        return <BankSection {...commonProps} />;
      case "legal":
        return <LegalSection {...commonProps} />;
      case "security":
        return <SecuritySection session={session} />;
      default:
        return <CompanySection {...commonProps} />;
    }
  };

  const currentTab = TABS_CONFIG[activeTab] || TABS_CONFIG.entreprise;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-6 px-6">
      <div className="w-64 pt-6">
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <Separator orientation="vertical" className="h-full w-px bg-border" />
      <div className="flex-1 pt-6 px-2">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-medium mb-2 text-gray-900 dark:text-gray-100">
                {currentTab.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {currentTab.description}
              </p>
            </div>
            {activeTab !== "security" && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="py-2 font-normal shadow-sm"
              >
                {isSubmitting ? "Mise à jour..." : "Sauvegarder"}
              </Button>
            )}
          </div>
          <Separator className="mt-6" />
        </div>
        <div className="pb-12">{renderActiveSection()}</div>
      </div>
    </form>
  );
}
