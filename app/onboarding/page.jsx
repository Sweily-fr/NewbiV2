"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { useActiveOrganization } from "@/src/lib/organization-client";
import { toast } from "@/src/components/ui/sonner";
import { TrendingUp } from "lucide-react";
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
      router.push("/dashboard");
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
      router.push("/dashboard");
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
              src={getAssetUrl("newbiLetter.png")}
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

            {/* Contenu centré */}
            <div className="relative z-10 w-full max-w-md">
              {/* Icône et texte au-dessus du graphique */}
              <div className="flex items-center gap-3 px-6 mb-4">
                <div className="bg-white/20 rounded-full p-2.5">
                  <TrendingUp className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Trésorerie</p>
                  <p className="text-white/80 text-xs">
                    Suivez vos flux en temps réel
                  </p>
                </div>
              </div>

              <div className="pt-2 lg:px-6">
                <svg
                  className="w-full"
                  viewBox="0 0 386 123"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="386" height="123" rx="10" />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3 123C3 123 14.3298 94.153 35.1282 88.0957C55.9266 82.0384 65.9333 80.5508 65.9333 80.5508C65.9333 80.5508 80.699 80.5508 92.1777 80.5508C103.656 80.5508 100.887 63.5348 109.06 63.5348C117.233 63.5348 117.217 91.9728 124.78 91.9728C132.343 91.9728 142.264 78.03 153.831 80.5508C165.398 83.0716 186.825 91.9728 193.761 91.9728C200.697 91.9728 206.296 63.5348 214.07 63.5348C221.844 63.5348 238.653 93.7771 244.234 91.9728C249.814 90.1684 258.8 60 266.19 60C272.075 60 284.1 88.057 286.678 88.0957C294.762 88.2171 300.192 72.9284 305.423 72.9284C312.323 72.9284 323.377 65.2437 335.553 63.5348C347.729 61.8259 348.218 82.07 363.639 80.5508C367.875 80.1335 372.949 82.2017 376.437 87.1008C379.446 91.3274 381.054 97.4325 382.521 104.647C383.479 109.364 382.521 123 382.521 123"
                    fill="url(#paint0_linear_onboarding)"
                  />
                  <path
                    className="text-white"
                    d="M3 121.077C3 121.077 15.3041 93.6691 36.0195 87.756C56.7349 81.8429 66.6632 80.9723 66.6632 80.9723C66.6632 80.9723 80.0327 80.9723 91.4656 80.9723C102.898 80.9723 100.415 64.2824 108.556 64.2824C116.696 64.2824 117.693 92.1332 125.226 92.1332C132.759 92.1332 142.07 78.5115 153.591 80.9723C165.113 83.433 186.092 92.1332 193 92.1332C199.908 92.1332 205.274 64.2824 213.017 64.2824C220.76 64.2824 237.832 93.8946 243.39 92.1332C248.948 90.3718 257.923 60.5 265.284 60.5C271.145 60.5 283.204 87.7182 285.772 87.756C293.823 87.8746 299.2 73.0802 304.411 73.0802C311.283 73.0802 321.425 65.9506 333.552 64.2824C345.68 62.6141 346.91 82.4553 362.27 80.9723C377.629 79.4892 383 106.605 383 106.605"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <defs>
                    <linearGradient
                      id="paint0_linear_onboarding"
                      x1="3"
                      y1="60"
                      x2="3"
                      y2="123"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="white" stopOpacity="0.15" />
                      <stop offset="1" stopColor="white" stopOpacity="0.01" />
                    </linearGradient>
                    <clipPath id="clip0_0_106">
                      <rect
                        width="358"
                        height="30"
                        fill="white"
                        transform="translate(14 14)"
                      />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <div className="relative z-10 mt-14 space-y-2 text-center">
                <h2 className="text-xl font-medium text-white">
                  Configuration rapide
                </h2>
                <p className="text-white/80 text-sm px-4">
                  Configurez votre espace en quelques minutes et commencez à
                  gérer votre activité efficacement.
                </p>
              </div>
            </div>
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
