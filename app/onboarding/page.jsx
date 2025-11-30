"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { useActiveOrganization } from "@/src/lib/organization-client";
import { toast } from "@/src/components/ui/sonner";
import WelcomeStep from "./steps/welcome-step";
import CompanyStep from "./steps/company-step";
import CompletionStep from "./steps/completion-step";
import { getAssetUrl } from "@/src/lib/image-utils";

export default function OnboardingPage() {
  const router = useRouter();
  const { organization, updateOrganization } = useActiveOrganization();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    goals: [],
    name: "",
    lastName: "",
    activitySector: "",
    employeeCount: "",
    companyName: "",
    companyEmail: "",
    siret: "",
    legalForm: "",
    rcs: "",
    vatNumber: "",
    capitalSocial: "",
    fiscalRegime: "",
    activityCategory: "",
    isVatSubject: false,
    hasCommercialActivity: false,
    addressStreet: "",
    addressCity: "",
    addressZipCode: "",
    addressCountry: "France",
  });

  // Déterminer si on doit afficher l'étape entreprise
  const needsCompanyInfo = useMemo(() => {
    const businessGoals = ["invoices", "treasury"];
    return formData.goals.some((goal) => businessGoals.includes(goal));
  }, [formData.goals]);

  // Calculer le nombre total d'étapes (suppression de l'étape 3)
  const totalSteps = needsCompanyInfo ? 2 : 1;

  const updateFormData = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = async () => {
    try {
      // Marquer l'onboarding comme complété même si skip
      await authClient.updateUser({
        hasSeenOnboarding: true,
      });

      toast.success("Bienvenue sur Newbi !");
      router.push("/dashboard/outils");
    } catch (error) {
      console.error("Erreur lors du skip:", error);
      toast.error("Une erreur est survenue");
    }
  };

  const handleComplete = async () => {
    try {
      // Mettre à jour les informations utilisateur
      const updateData = {
        hasSeenOnboarding: true,
      };

      if (formData.name) updateData.name = formData.name;
      if (formData.lastName) updateData.lastName = formData.lastName;

      await authClient.updateUser(updateData);

      // Mettre à jour les informations entreprise si renseignées
      if (needsCompanyInfo && organization) {
        const orgData = {};
        if (formData.companyName) orgData.companyName = formData.companyName;
        if (formData.companyEmail) orgData.companyEmail = formData.companyEmail;
        if (formData.siret) orgData.siret = formData.siret;
        if (formData.legalForm) orgData.legalForm = formData.legalForm;
        if (formData.rcs) orgData.rcs = formData.rcs;
        if (formData.vatNumber) orgData.vatNumber = formData.vatNumber;
        if (formData.capitalSocial)
          orgData.capitalSocial = formData.capitalSocial;
        if (formData.fiscalRegime) orgData.fiscalRegime = formData.fiscalRegime;
        if (formData.activityCategory)
          orgData.activityCategory = formData.activityCategory;
        if (formData.isVatSubject !== undefined)
          orgData.isVatSubject = formData.isVatSubject;
        if (formData.hasCommercialActivity !== undefined)
          orgData.hasCommercialActivity = formData.hasCommercialActivity;
        if (formData.addressStreet)
          orgData.addressStreet = formData.addressStreet;
        if (formData.addressCity) orgData.addressCity = formData.addressCity;
        if (formData.addressZipCode)
          orgData.addressZipCode = formData.addressZipCode;
        if (formData.addressCountry)
          orgData.addressCountry = formData.addressCountry;

        if (Object.keys(orgData).length > 0) {
          await updateOrganization(orgData);
        }
      }

      toast.success("Bienvenue sur Newbi !");
      router.push("/dashboard/outils");
    } catch (error) {
      console.error("Erreur lors de la complétion:", error);
      toast.error("Une erreur est survenue");
    }
  };

  return (
    <main>
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        <div className="w-3/5 flex items-center justify-center p-4 relative">
          {/* Logo en haut à gauche */}
          <div className="absolute top-4 left-4">
            <img
              src={getAssetUrl("NewbiLetter.png")}
              alt="Newbi"
              className="h-9 w-auto"
            />
          </div>

          <div className="mx-auto max-w-2xl w-full">
            {/* Content */}
            {currentStep === 1 && (
              <WelcomeStep
                formData={formData}
                updateFormData={updateFormData}
                onNext={handleNext}
                onSkip={handleSkip}
              />
            )}

            {needsCompanyInfo && currentStep === 2 && (
              <CompanyStep
                formData={formData}
                updateFormData={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
                onSkip={handleSkip}
                onComplete={handleComplete}
              />
            )}

            {!needsCompanyInfo && currentStep === 2 && (
              <CompletionStep
                formData={formData}
                onComplete={handleComplete}
                onBack={handleBack}
              />
            )}
          </div>
        </div>

        {/* Right side - Background */}
        <div className="w-2/5 p-5 flex items-center min-h-screen justify-center">
          <div className="flex p-6 items-center justify-center w-full h-full rounded-lg relative overflow-hidden">
            {/* Dégradé de fond */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#7B6FFF] via-[#5A50FF] to-[#3D35CC] rounded-lg"></div>

            {/* Effet granuleux */}
            <div
              className="absolute inset-0 rounded-lg opacity-40"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                backgroundRepeat: "repeat",
                backgroundSize: "100px 100px",
                mixBlendMode: "overlay",
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden min-h-screen bg-background flex items-center justify-center pb-8">
        <div className="w-full max-w-sm px-6">
          <img src="/ni2.png" alt="Newbi Logo" className="mb-4" width={30} />

          {/* Progress */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              Étape {currentStep} sur {totalSteps}
            </p>
          </div>

          {/* Content */}
          {currentStep === 1 && (
            <WelcomeStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleNext}
              onSkip={handleSkip}
            />
          )}

          {needsCompanyInfo && currentStep === 2 && (
            <CompanyStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
              onComplete={handleComplete}
            />
          )}

          {!needsCompanyInfo && currentStep === 2 && (
            <CompletionStep
              formData={formData}
              onComplete={handleComplete}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </main>
  );
}
