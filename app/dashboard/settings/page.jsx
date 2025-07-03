"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { SettingsSidebar } from "@/src/components/settings-sidebar";
import { Separator } from "@/src/components/ui/separator";
import { Button } from "@/src/components/ui/button";
import { updateUser, useSession } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";

// Import des composants de section
import CompanySection from "./components/CompanySection";
import AddressSection from "./components/AddressSection";
import BankSection from "./components/BankSection";
import LegalSection from "./components/LegalSection";
import SecuritySection from "./components/SecuritySection";

// Configuration des onglets
const TABS_CONFIG = {
  entreprise: {
    title: "Informations de l'entreprise",
    description: "Gérez les informations générales de votre entreprise",
  },
  address: {
    title: "Adresse",
    description: "Configurez l'adresse de votre entreprise",
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
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
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

  // Fonction pour mettre à jour les informations
  const onSubmit = async (formData) => {
    try {
      await updateUser(
        { company: formData },
        {
          onSuccess: () => {
            toast.success("Informations mises à jour avec succès");
            refetch();
          },
          onError: (error) => {
            toast.error("Erreur lors de la mise à jour");
            console.error("Erreur de mise à jour:", error);
          },
        }
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Une erreur s'est produite lors de la mise à jour");
    }
  };

  // Charger les données de la session dans le formulaire
  useEffect(() => {
    if (session?.user?.company) {
      const company = session.user.company;
      reset({
        name: company.name || "",
        email: company.email || "",
        phone: company.phone || "",
        website: company.website || "",
        description: company.description || "",
        logo: company.logo || "",
        address: {
          street: company.address?.street || "",
          city: company.address?.city || "",
          postalCode: company.address?.postalCode || "",
          country: company.address?.country || "France",
        },
        bankDetails: {
          iban: company.bankDetails?.iban || "",
          bic: company.bankDetails?.bic || "",
          bankName: company.bankDetails?.bankName || "",
        },
        legal: {
          siret: company.legal?.siret || "",
          vatNumber: company.legal?.vatNumber || "",
          rcs: company.legal?.rcs || "",
          legalForm: company.legal?.legalForm || "",
          capital: company.legal?.capital || "",
          regime: company.legal?.regime || "",
          category: company.legal?.category || "",
        },
      });
    }
  }, [session, reset]);

  // Fonction pour rendre la section active
  const renderActiveSection = () => {
    const commonProps = {
      register,
      errors,
      watch,
      setValue,
      session,
    };

    switch (activeTab) {
      case "entreprise":
        return <CompanySection {...commonProps} />;
      case "address":
        return <AddressSection {...commonProps} />;
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
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-2">
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
                className="py-2 font-medium"
              >
                {isSubmitting ? "Mise à jour..." : "Sauvegarder"}
              </Button>
            )}
          </div>
          <Separator className="mt-6" />
        </div>
        {renderActiveSection()}
      </div>
    </form>
  );
}
