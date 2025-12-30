"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { useActiveOrganization } from "@/src/lib/organization-client";
import { toast } from "@/src/components/ui/sonner";
import { TrendingUp, LoaderCircle } from "lucide-react";
import AccountTypeStep from "./steps/account-type-step";
import CompanySearchStep from "./steps/company-search-step";
import { getAssetUrl } from "@/src/lib/image-utils";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organization, updateOrganization } = useActiveOrganization();
  const [currentStep, setCurrentStep] = useState(1);
  const [isChecking, setIsChecking] = useState(true);

  // Vérifier si l'utilisateur a déjà complété l'onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const { data: session } = await authClient.getSession();
        const hasSeenOnboarding = session?.user?.hasSeenOnboarding;

        if (hasSeenOnboarding) {
          console.log(
            "✅ [ONBOARDING] Utilisateur a déjà complété l'onboarding, redirection vers /dashboard"
          );
          router.push("/dashboard");
          return;
        }

        setIsChecking(false);
      } catch (error) {
        console.error("❌ [ONBOARDING] Erreur vérification onboarding:", error);
        setIsChecking(false);
      }
    };

    checkOnboardingStatus();
  }, [router]);

  // Synchroniser l'étape avec l'URL
  useEffect(() => {
    const step = searchParams.get("step");
    if (step) {
      const stepNumber = parseInt(step, 10);
      if (stepNumber >= 1 && stepNumber <= 2) {
        setCurrentStep(stepNumber);
      }
    }
  }, [searchParams]);
  const [formData, setFormData] = useState({
    accountType: "", // 'business' ou 'accounting_firm'
    hasNoCompany: false,
    siren: "",
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

  // Calculer le nombre total d'étapes
  // Étape 1: Choix du type de compte
  // Étape 2: Recherche d'entreprise et complétion
  const totalSteps = 2;

  const updateFormData = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  // Afficher un loader pendant la vérification
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoaderCircle className="animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      router.push(`/onboarding?step=${nextStep}`);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      router.push(`/onboarding?step=${prevStep}`);
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
      console.log("🎯 [ONBOARDING] Complétion de l'onboarding...");

      // Mettre à jour les informations utilisateur
      const updateData = {
        hasSeenOnboarding: true,
      };

      if (formData.name) updateData.name = formData.name;
      if (formData.lastName) updateData.lastName = formData.lastName;

      await authClient.updateUser(updateData);
      console.log("✅ [ONBOARDING] Utilisateur mis à jour");

      // Mettre à jour les informations entreprise si renseignées
      if (organization) {
        const orgData = {
          // ✅ IMPORTANT: Toujours sauvegarder le type d'organisation et marquer l'onboarding comme complété
          organizationType: formData.accountType || "business", // 'business' ou 'accounting_firm'
          onboardingCompleted: true,
        };

        // Informations entreprise
        if (formData.companyName) orgData.companyName = formData.companyName;
        if (formData.companyEmail) orgData.companyEmail = formData.companyEmail;
        if (formData.siret) orgData.siret = formData.siret;
        if (formData.siren) orgData.siren = formData.siren;
        if (formData.legalForm) orgData.legalForm = formData.legalForm;
        if (formData.rcs) orgData.rcs = formData.rcs;
        if (formData.vatNumber) orgData.vatNumber = formData.vatNumber;
        if (formData.capitalSocial)
          orgData.capitalSocial = formData.capitalSocial;
        if (formData.fiscalRegime) orgData.fiscalRegime = formData.fiscalRegime;
        if (formData.activityCategory)
          orgData.activityCategory = formData.activityCategory;
        if (formData.activitySector)
          orgData.activitySector = formData.activitySector;
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

        await updateOrganization(orgData);
        console.log(
          "✅ [ONBOARDING] Organisation mise à jour avec type:",
          formData.accountType
        );
      }

      // Gérer les invitations en attente (si l'utilisateur s'est inscrit via invitation)
      const pendingInvitation = localStorage.getItem("pendingInvitation");
      if (pendingInvitation) {
        try {
          const invitation = JSON.parse(pendingInvitation);
          const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

          if (Date.now() - invitation.timestamp < sevenDaysInMs) {
            console.log(
              `📋 [ONBOARDING] Acceptation de l'invitation ${invitation.invitationId}`
            );

            const response = await fetch(
              `/api/invitations/${invitation.invitationId}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ action: "accept" }),
              }
            );

            if (response.ok) {
              console.log("✅ [ONBOARDING] Invitation acceptée");
              toast.success("Bienvenue ! Vous avez rejoint l'organisation.");
            }
          }

          localStorage.removeItem("pendingInvitation");
        } catch (error) {
          console.error(
            "❌ [ONBOARDING] Erreur acceptation invitation:",
            error
          );
        }
      }

      toast.success("Bienvenue sur Newbi !");
      console.log("🚀 [ONBOARDING] Redirection vers /dashboard");
      router.push("/dashboard");
    } catch (error) {
      console.error("❌ [ONBOARDING] Erreur lors de la complétion:", error);
      toast.error("Une erreur est survenue");
    }
  };

  return (
    <main>
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        {/* Meft side - Background */}
        <div className="w-2/5 p-3 flex items-center min-h-screen justify-center">
          <div
            className="flex p-6 items-center justify-center w-full h-full rounded-xl relative"
            style={{
              background:
                "linear-gradient(135deg, #5a50ff 0%, #6b5cff 50%, #7c68ff 100%)",
            }}
          >
            {/* Contenu centré */}
            <div className="relative z-10 w-full max-w-md">
              {/* Icône et texte au-dessus du graphique */}
              {/* <div className="flex items-center gap-3 px-6 mb-4">
                <div className="bg-white/20 rounded-full p-2.5">
                  <TrendingUp className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Trésorerie</p>
                  <p className="text-white/80 text-xs">
                    Suivez vos flux en temps réel
                  </p>
                </div>
              </div> */}

              <div className="pt-2 lg:px-4 overflow-visible">
                <svg
                  className="w-full overflow-visible"
                  viewBox="0 0 420 240"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ overflow: "visible" }}
                >
                  <defs>
                    {/* Filtre d'ombre portée pour la card */}
                    <filter
                      id="cardShadow"
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="140%"
                    >
                      <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
                      <feOffset dx="0" dy="4" result="offsetblur" />
                      <feFlood floodColor="#000000" floodOpacity="0.08" />
                      <feComposite in2="offsetblur" operator="in" />
                      <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>

                    {/* Filtre d'ombre pour le cercle */}
                    <filter
                      id="circleShadow"
                      x="-50%"
                      y="-50%"
                      width="200%"
                      height="200%"
                    >
                      <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                      <feOffset dx="0" dy="2" result="offsetblur" />
                      <feFlood floodColor="#5A50FF" floodOpacity="0.3" />
                      <feComposite in2="offsetblur" operator="in" />
                      <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* 
                    TIMELINE 5.5s:
                    Phase 1: 0s-1s (0%-18%) - Expansion card
                    Phase 2: 1s-1.5s (18%-27%) - Pause
                    Phase 3: 1.5s-4s (27%-73%) - Tracé graphique
                    Phase 4: 4s-5s (73%-91%) - Rétractation trait
                    Phase 5: 5s-5.5s (91%-100%) - Fade out
                  */}

                  {/* Carte principale - Phase 1: expansion 0s-1s */}
                  <g filter="url(#cardShadow)">
                    <rect
                      x="30"
                      y="30"
                      width="360"
                      height="180"
                      fill="white"
                      rx="16"
                    >
                      {/* Expansion: 0-18% (0s-1s), reste jusqu'à 91%, puis fade */}
                      <animate
                        attributeName="width"
                        values="120;360;360;360;360"
                        dur="7s"
                        repeatCount="indefinite"
                        keyTimes="0;0.18;0.27;0.91;1"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1; 0 0 1 1; 0 0 1 1; 0 0 1 1"
                      />
                      <animate
                        attributeName="x"
                        values="150;30;30;30;30"
                        dur="7s"
                        repeatCount="indefinite"
                        keyTimes="0;0.18;0.27;0.91;1"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1; 0 0 1 1; 0 0 1 1; 0 0 1 1"
                      />
                      {/* Fade in au début, fade out à la fin */}
                      <animate
                        attributeName="opacity"
                        values="0;1;1;1;0"
                        dur="7s"
                        repeatCount="indefinite"
                        keyTimes="0;0.05;0.18;0.91;1"
                      />
                    </rect>
                  </g>

                  {/* Lignes de grille - s'étirent avec la card */}
                  <g>
                    <line
                      x1="50"
                      y1="80"
                      x2="370"
                      y2="80"
                      stroke="#e5e5e5"
                      strokeWidth="1"
                    >
                      <animate
                        attributeName="opacity"
                        values="0;0;0.3;0.3;0"
                        dur="7s"
                        repeatCount="indefinite"
                        keyTimes="0;0.15;0.18;0.91;1"
                      />
                      <animate
                        attributeName="x2"
                        values="140;370;370;370;370"
                        dur="7s"
                        repeatCount="indefinite"
                        keyTimes="0;0.18;0.27;0.91;1"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1; 0 0 1 1; 0 0 1 1; 0 0 1 1"
                      />
                    </line>
                    <line
                      x1="50"
                      y1="110"
                      x2="370"
                      y2="110"
                      stroke="#e5e5e5"
                      strokeWidth="1"
                    >
                      <animate
                        attributeName="opacity"
                        values="0;0;0.3;0.3;0"
                        dur="7s"
                        repeatCount="indefinite"
                        keyTimes="0;0.15;0.18;0.91;1"
                      />
                      <animate
                        attributeName="x2"
                        values="140;370;370;370;370"
                        dur="7s"
                        repeatCount="indefinite"
                        keyTimes="0;0.18;0.27;0.91;1"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1; 0 0 1 1; 0 0 1 1; 0 0 1 1"
                      />
                    </line>
                    <line
                      x1="50"
                      y1="140"
                      x2="370"
                      y2="140"
                      stroke="#e5e5e5"
                      strokeWidth="1"
                    >
                      <animate
                        attributeName="opacity"
                        values="0;0;0.3;0.3;0"
                        dur="7s"
                        repeatCount="indefinite"
                        keyTimes="0;0.15;0.18;0.91;1"
                      />
                      <animate
                        attributeName="x2"
                        values="140;370;370;370;370"
                        dur="7s"
                        repeatCount="indefinite"
                        keyTimes="0;0.18;0.27;0.91;1"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1; 0 0 1 1; 0 0 1 1; 0 0 1 1"
                      />
                    </line>
                    <line
                      x1="50"
                      y1="170"
                      x2="370"
                      y2="170"
                      stroke="#e5e5e5"
                      strokeWidth="1"
                    >
                      <animate
                        attributeName="opacity"
                        values="0;0;0.3;0.3;0"
                        dur="7s"
                        repeatCount="indefinite"
                        keyTimes="0;0.15;0.18;0.91;1"
                      />
                      <animate
                        attributeName="x2"
                        values="140;370;370;370;370"
                        dur="7s"
                        repeatCount="indefinite"
                        keyTimes="0;0.18;0.27;0.91;1"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1; 0 0 1 1; 0 0 1 1; 0 0 1 1"
                      />
                    </line>
                  </g>

                  {/* Logo Newbi - ancré en haut à gauche */}
                  <g>
                    <image
                      href="/newbiLetter.png"
                      x="40"
                      y="42"
                      width="65"
                      height="24"
                    >
                      <animate
                        attributeName="opacity"
                        values="0;0;1;1;0"
                        dur="7s"
                        repeatCount="indefinite"
                        keyTimes="0;0.15;0.18;0.91;1"
                      />
                    </image>
                  </g>

                  {/* Texte EUR - glisse vers la droite avec la card */}
                  <text
                    x="370"
                    y="58"
                    fontFamily="Arial, sans-serif"
                    fontSize="15"
                    fontWeight="500"
                    fill="#1d1d1b"
                    textAnchor="end"
                  >
                    EUR
                    <animate
                      attributeName="opacity"
                      values="0;0;1;1;0"
                      dur="7s"
                      repeatCount="indefinite"
                      keyTimes="0;0.15;0.18;0.91;1"
                    />
                    <animate
                      attributeName="x"
                      values="140;370;370;370;370"
                      dur="7s"
                      repeatCount="indefinite"
                      keyTimes="0;0.18;0.27;0.91;1"
                      calcMode="spline"
                      keySplines="0.4 0 0.2 1; 0 0 1 1; 0 0 1 1; 0 0 1 1"
                    />
                  </text>

                  {/* 
                    Ligne du graphique - Phase 3 & 4
                    Phase 3 (27%-73%): Tracé avec variation de vitesse
                    Phase 4 (73%-91%): Rétractation (le trait se mange depuis le début)
                  */}
                  <path
                    d="M10,190 L50,180 L90,185 L130,168 L170,175 L210,150 L250,158 L290,165 L330,148 L370,138 L410,122"
                    fill="none"
                    stroke="#202020"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="500"
                    strokeDashoffset="500"
                  >
                    {/* 
                      Tracé: 27%-73% (1.5s-4s) avec ralentissement mi-parcours
                      Rétractation: 73%-91% (le début du trait avance vers la fin)
                    */}
                    <animate
                      attributeName="stroke-dashoffset"
                      values="500;500;500;350;250;150;0;-500;-500"
                      dur="7s"
                      repeatCount="indefinite"
                      keyTimes="0;0.14;0.21;0.36;0.43;0.50;0.64;0.86;1"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0;1;1;1;0"
                      dur="7s"
                      repeatCount="indefinite"
                      keyTimes="0;0.20;0.21;0.85;0.86;1"
                    />
                  </path>

                  {/* Cercle guide - suit le bout du trait puis scale-out */}
                  <g filter="url(#circleShadow)">
                    {/* Cercle extérieur */}
                    <circle r="7" fill="#202020">
                      <animateMotion
                        dur="7s"
                        repeatCount="indefinite"
                        keyPoints="0;0;0;0.4;0.6;0.8;1;1;1"
                        keyTimes="0;0.14;0.21;0.36;0.43;0.50;0.64;0.86;1"
                        calcMode="linear"
                        path="M10,190 L50,180 L90,185 L130,168 L170,175 L210,150 L250,158 L290,165 L330,148 L370,138 L410,122"
                      />
                      <animate
                        attributeName="opacity"
                        values="0;0;1;1;1;0"
                        dur="7s"
                        repeatCount="indefinite"
                        keyTimes="0;0.20;0.21;0.85;0.86;1"
                      />
                      {/* Scale-out en Phase 5 */}
                      <animate
                        attributeName="r"
                        values="7;7;7;7;0"
                        dur="7s"
                        repeatCount="indefinite"
                        keyTimes="0;0.64;0.86;0.90;1"
                      />
                    </circle>
                    {/* Cercle intérieur blanc */}
                    <circle r="3.5" fill="white">
                      <animateMotion
                        dur="7s"
                        repeatCount="indefinite"
                        keyPoints="0;0;0;0.4;0.6;0.8;1;1;1"
                        keyTimes="0;0.14;0.21;0.36;0.43;0.50;0.64;0.86;1"
                        calcMode="linear"
                        path="M10,190 L50,180 L90,185 L130,168 L170,175 L210,150 L250,158 L290,165 L330,148 L370,138 L410,122"
                      />
                      <animate
                        attributeName="opacity"
                        values="0;0;1;1;1;0"
                        dur="7s"
                        repeatCount="indefinite"
                        keyTimes="0;0.20;0.21;0.85;0.86;1"
                      />
                      <animate
                        attributeName="r"
                        values="3.5;3.5;3.5;3.5;0"
                        dur="7s"
                        repeatCount="indefinite"
                        keyTimes="0;0.64;0.86;0.90;1"
                      />
                    </circle>
                  </g>
                </svg>
              </div>
              <div className="relative z-10 mt-14 space-y-3 text-center">
                <p className="text-white/90 font-normal text-sm">
                  Commencez en quelques clics
                </p>
                <h2 className="text-white font-bold text-2xl leading-tight px-4">
                  Configurez votre espace et gérez <br /> votre activité en
                  toute simplicité
                </h2>
              </div>
            </div>
          </div>
        </div>

        <div className="w-3/5 flex items-center justify-center p-4 relative">
          {/* Logo en haut à gauche */}
          <div className="absolute top-4 right-4">
            <img
              src={getAssetUrl("newbiLetter.png")}
              alt="Newbi"
              className="h-9 w-auto"
            />
          </div>

          <div className="mx-auto max-w-2xl w-full">
            {/* Content */}
            {/* Étape 1: Choix du type de compte */}
            {currentStep === 1 && (
              <AccountTypeStep
                formData={formData}
                updateFormData={updateFormData}
                onNext={handleNext}
                onSkip={handleSkip}
              />
            )}

            {/* Étape 2: Recherche d'entreprise et complétion */}
            {currentStep === 2 && (
              <CompanySearchStep
                formData={formData}
                updateFormData={updateFormData}
                onNext={handleComplete}
                onBack={handleBack}
                onSkip={handleSkip}
              />
            )}
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
          {/* Étape 1: Choix du type de compte */}
          {currentStep === 1 && (
            <AccountTypeStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleNext}
              onSkip={handleSkip}
            />
          )}

          {/* Étape 2: Recherche d'entreprise et complétion */}
          {currentStep === 2 && (
            <CompanySearchStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleComplete}
              onBack={handleBack}
              onSkip={handleSkip}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-muted-foreground">
            Chargement...
          </div>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
