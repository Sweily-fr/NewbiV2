"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import CompanyInfo from "./companyForm";
import { SettingsSidebar } from "@/src/components/settings-sidebar";
import { Separator } from "@/src/components/ui/separator";
import AdressInfo from "./adressInfo";
import BankForm from "./bankForm";
import LegalForm from "./legalForm";
import SecurityView from "./securityView";
import { Button } from "@/src/components/ui/button";
import { updateUser, useSession } from "@/src/lib/auth-client";
import { toast } from "sonner";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("entreprise");
  const [logoUrl, setLogoUrl] = useState("");
  const { data: session, isPending, error, refetch } = useSession();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
    reset,
  } = useForm({
    defaultValues: {
      email: "",
      name: "",
      lastName: "",
      phone: "",
      website: "",
      siret: "",
      vatNumber: "",
    },
  });

  // Fonction pour mettre à jour les informations de l'entreprise
  const updateCompanyInfo = async (formData) => {
    console.log(formData, "formData");
    try {
      await updateUser(
        { company: formData },
        {
          onSuccess: () => {
            toast.success(
              "Informations de l'entreprise mises à jour avec succès"
            );
            refetch(); // Rafraîchir la session
          },
          onError: (error) => {
            toast.error(
              "Erreur lors de la mise à jour des informations de l'entreprise"
            );
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
      reset({
        email: session.user.company.email || "",
        name: session.user.company.name || "",
        phone: session.user.company.phone || "",
        website: session.user.company.website || "",
        siret: session.user.company.siret || "",
        vatNumber: session.user.company.vatNumber || "",
        address: session.user.company.address || "",
        bankDetails: session.user.company.bankDetails || "",
      });
    }
  }, [session, reset]);

  // Fonction pour rendre la vue appropriée en fonction de l'onglet actif
  const renderActiveView = () => {
    switch (activeTab) {
      case "entreprise":
        return (
          <CompanyInfo
            register={register}
            session={session}
            handleSubmit={handleSubmit}
            updateCompanyInfo={updateCompanyInfo}
            setLogoUrl={setLogoUrl}
          />
        );
      case "address":
        return (
          <AdressInfo
            register={register}
            session={session}
            handleSubmit={handleSubmit}
            updateCompanyInfo={updateCompanyInfo}
          />
        );
      case "bank":
        return (
          <BankForm
            register={register}
            session={session}
            handleSubmit={handleSubmit}
            updateCompanyInfo={updateCompanyInfo}
          />
        );
      case "legal":
        return (
          <LegalForm
            register={register}
            session={session}
            handleSubmit={handleSubmit}
            updateCompanyInfo={updateCompanyInfo}
          />
        );
      case "security":
        return <SecurityView session={session} />;
      default:
        return (
          <CompanyInfo
            register={register}
            session={session}
            handleSubmit={handleSubmit}
            updateCompanyInfo={updateCompanyInfo}
            setLogoUrl={setLogoUrl}
          />
        );
    }
  };

  return (
    <div className="flex gap-6 p-8">
      <div className="w-64 pt-6">
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <Separator orientation="vertical" className="h-full w-px bg-border" />
      <div className="flex-1 pt-6">
        <div>
          <div className="flex align-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-2">
                Titre de la section
              </h1>
              <p className="text-sm text-muted-foreground">
                Sous-titre de la section
              </p>
            </div>
            <Button
              variant="default"
              type="button"
              className="py-2 font-medium cursor-pointer"
              disabled={isSubmitting}
              onClick={handleSubmit(updateCompanyInfo)}
            >
              Mettre à jour le profil
            </Button>
          </div>
          <Separator className="h-full w-px bg-border mb-6 mt-6" />
        </div>
        {renderActiveView()}
      </div>
    </div>
  );
}
