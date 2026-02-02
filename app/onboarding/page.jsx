"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { useActiveOrganization } from "@/src/lib/organization-client";
import { toast } from "@/src/components/ui/sonner";
import { TrendingUp, LoaderCircle } from "lucide-react";
import AccountTypeStep from "./steps/account-type-step";
import EmployeeCountStep from "./steps/employee-count-step";
import PlanSelectionStep from "./steps/plan-selection-step";
import CompanySearchStep from "./steps/company-search-step";
import { getAssetUrl } from "@/src/lib/image-utils";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    organization,
    updateOrganization,
    loading: orgLoading,
  } = useActiveOrganization();
  const [currentStep, setCurrentStep] = useState(1);
  const [isChecking, setIsChecking] = useState(true);

  // État pour savoir si c'est un utilisateur existant qui doit renouveler
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [existingOrgData, setExistingOrgData] = useState(null);

  // Vérifier si l'utilisateur a déjà complété l'onboarding ET a un abonnement actif
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const { data: session } = await authClient.getSession();
        const hasSeenOnboarding = session?.user?.hasSeenOnboarding;

        // ✅ Vérifier si l'utilisateur a une organisation
        let activeOrg = null;
        const { data: orgData } = await authClient.organization.getFullOrganization();
        activeOrg = orgData;

        if (!activeOrg) {
          console.log(
            "⚠️ [ONBOARDING] Aucune organisation active, tentative de définition...",
          );

          // Récupérer les organisations de l'utilisateur
          const { data: organizations } = await authClient.organization.list();

          if (organizations && organizations.length > 0) {
            // Définir la première organisation comme active
            await authClient.organization.setActive({
              organizationId: organizations[0].id,
            });
            activeOrg = organizations[0];
            console.log(
              `✅ [ONBOARDING] Organisation active définie: ${organizations[0].id}`,
            );
          } else {
            // ✅ NOUVEAU FLUX: Nouvel utilisateur sans organisation
            // C'est normal - l'organisation sera créée APRÈS le paiement via le webhook Stripe
            console.log(
              "✅ [ONBOARDING] Nouvel utilisateur sans organisation - flux normal, l'organisation sera créée après paiement",
            );
            setIsChecking(false);
            return; // Laisser l'utilisateur continuer l'onboarding normalement
          }
        } else {
          console.log(
            `✅ [ONBOARDING] Organisation active existante: ${activeOrg.id}`,
          );
        }

        // 🔒 IMPORTANT: Vérifier si l'utilisateur a un abonnement actif
        // Même si hasSeenOnboarding est true, on doit vérifier l'abonnement
        // car les anciens utilisateurs avec trial expiré n'ont plus accès
        if (hasSeenOnboarding && activeOrg) {
          try {
            const response = await fetch(
              `/api/organizations/${activeOrg.id}/subscription`
            );
            const subscriptionData = await response.json();

            // Vérifier si l'abonnement est actif
            const hasActiveSubscription =
              subscriptionData.status === "active" ||
              subscriptionData.status === "trialing" ||
              (subscriptionData.status === "canceled" &&
                subscriptionData.periodEnd &&
                new Date(subscriptionData.periodEnd) > new Date());

            if (hasActiveSubscription) {
              console.log(
                "✅ [ONBOARDING] Utilisateur a un abonnement actif, redirection vers /dashboard",
              );
              router.push("/dashboard");
              return;
            } else {
              console.log(
                "⚠️ [ONBOARDING] Utilisateur existant sans abonnement actif, affichage direct du choix de plan",
              );

              // ✅ C'est un utilisateur existant qui revient - on lui montre directement l'étape de paiement
              setIsReturningUser(true);
              setExistingOrgData({
                companyName: activeOrg.companyName || activeOrg.name,
                siret: activeOrg.siret,
                siren: activeOrg.siren,
                employeeCount: activeOrg.employeeCount,
                accountType: activeOrg.organizationType || "business",
                legalForm: activeOrg.legalForm,
                addressStreet: activeOrg.addressStreet,
                addressCity: activeOrg.addressCity,
                addressZipCode: activeOrg.addressZipCode,
                addressCountry: activeOrg.addressCountry || "France",
              });

              // Rediriger directement vers l'étape de choix du plan
              setCurrentStep(4);
              router.replace("/onboarding?step=4");
            }
          } catch (error) {
            console.error("❌ [ONBOARDING] Erreur vérification abonnement:", error);
            // En cas d'erreur, on laisse l'utilisateur sur l'onboarding par sécurité
          }
        }

        setIsChecking(false);
      } catch (error) {
        console.error("❌ [ONBOARDING] Erreur vérification onboarding:", error);
        setIsChecking(false);
      }
    };

    checkOnboardingStatus();
  }, [router]);

  // Si c'est un utilisateur existant, pré-remplir les données
  useEffect(() => {
    if (isReturningUser && existingOrgData) {
      setFormData((prev) => ({
        ...prev,
        ...existingOrgData,
      }));
    }
  }, [isReturningUser, existingOrgData]);

  // Synchroniser l'étape avec l'URL et gérer les erreurs
  useEffect(() => {
    const step = searchParams.get("step");
    const error = searchParams.get("error");
    const canceled = searchParams.get("canceled");

    // Gérer les erreurs de retour
    if (error === "subscription_timeout") {
      toast.error(
        "Le paiement est en cours de traitement. Veuillez réessayer dans quelques instants.",
        { duration: 5000 }
      );
    } else if (error === "unknown") {
      toast.error(
        "Une erreur est survenue. Veuillez réessayer.",
        { duration: 5000 }
      );
    }

    // Gérer l'annulation de paiement
    if (canceled === "true") {
      toast.info("Paiement annulé. Vous pouvez choisir un autre plan.", {
        duration: 4000,
      });
    }

    if (step) {
      const stepNumber = parseInt(step, 10);
      if (stepNumber >= 1 && stepNumber <= totalSteps) {
        setCurrentStep(stepNumber);
      }
    }
  }, [searchParams]);
  const [formData, setFormData] = useState({
    accountType: "", // 'business' ou 'accounting_firm'
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
    // Nouveaux champs pour le flux d'abonnement
    selectedPlan: "", // 'freelance' | 'pme' | 'entreprise'
    billingPeriod: "monthly", // 'monthly' | 'annual'
    promoCode: "", // Code promo optionnel
  });

  const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false);

  // Calculer le nombre total d'étapes
  // Étape 1: Choix du type de compte
  // Étape 2: Nombre d'employés
  // Étape 3: Recherche d'entreprise
  // Étape 4: Choix du plan (pleine page)
  // Étape 5: Redirection vers paiement Stripe
  const totalSteps = 5;

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

  // SUPPRIMÉ: handleSkip et handleComplete
  // L'utilisateur DOIT compléter le flux et payer pour accéder au dashboard
  // La complétion de l'onboarding (hasSeenOnboarding: true) est gérée par le webhook Stripe après paiement réussi

  // Redirection vers Stripe Checkout pour le paiement
  // selectedData est passé directement depuis PlanSelectionStep pour éviter le timing async
  const handlePaymentRedirect = async (selectedData = {}) => {
    setIsRedirectingToPayment(true);
    try {
      // Utiliser les données passées directement OU celles du formData
      const selectedPlan = selectedData.selectedPlan || formData.selectedPlan;
      const billingPeriod = selectedData.billingPeriod || formData.billingPeriod;

      console.log("💳 [ONBOARDING] Création de la session de paiement...");
      console.log(`📋 [ONBOARDING] Plan sélectionné: ${selectedPlan}, Période: ${billingPeriod}`);

      // Sauvegarder d'abord les informations de l'organisation
      if (organization) {
        const orgData = {
          organizationType: formData.accountType || "business",
          employeeCount: formData.employeeCount,
        };

        if (formData.companyName) orgData.companyName = formData.companyName;
        if (formData.siret) orgData.siret = formData.siret;
        if (formData.siren) orgData.siren = formData.siren;
        if (formData.legalForm) orgData.legalForm = formData.legalForm;
        if (formData.addressStreet)
          orgData.addressStreet = formData.addressStreet;
        if (formData.addressCity) orgData.addressCity = formData.addressCity;
        if (formData.addressZipCode)
          orgData.addressZipCode = formData.addressZipCode;
        if (formData.addressCountry)
          orgData.addressCountry = formData.addressCountry;

        await updateOrganization(orgData);
        console.log("✅ [ONBOARDING] Organisation mise à jour avant paiement");
      }

      const response = await fetch("/api/create-org-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationData: {
            name: formData.companyName || "Mon entreprise",
            type: "onboarding",
            planName: selectedPlan,
            isAnnual: billingPeriod === "annual",
            promoCode: formData.promoCode,
            // Données entreprise
            companyName: formData.companyName,
            siret: formData.siret,
            siren: formData.siren,
            legalForm: formData.legalForm,
            addressStreet: formData.addressStreet,
            addressCity: formData.addressCity,
            addressZipCode: formData.addressZipCode,
            addressCountry: formData.addressCountry || "France",
            employeeCount: formData.employeeCount,
            activitySector: formData.activitySector,
            activityCategory: formData.activityCategory,
          },
        }),
      });

      const data = await response.json();

      if (data.url) {
        console.log("✅ [ONBOARDING] Redirection vers Stripe Checkout");
        window.location.href = data.url;
      } else {
        console.error("❌ [ONBOARDING] Erreur création session:", data.error);
        toast.error(data.error || "Erreur lors de la création du paiement");
        setIsRedirectingToPayment(false);
      }
    } catch (error) {
      console.error("❌ [ONBOARDING] Erreur paiement:", error);
      toast.error("Erreur de connexion au service de paiement");
      setIsRedirectingToPayment(false);
    }
  };

  // Vérifier si on est sur l'étape du pricing (pleine page)
  const isFullPageStep = currentStep === 4;

  return (
    <main>
      {/* Full Page Layout pour l'étape Pricing */}
      {isFullPageStep && (
        <div className="hidden md:block min-h-screen bg-background">
          <PlanSelectionStep
            formData={formData}
            updateFormData={updateFormData}
            onNext={handlePaymentRedirect}
            onBack={isReturningUser ? null : handleBack}
            isReturningUser={isReturningUser}
          />
        </div>
      )}

      {/* Desktop Layout (étapes avec panneau gauche) */}
      <div className={`hidden ${isFullPageStep ? '' : 'md:flex'} h-screen`}>
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
              className="h-5"
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
              />
            )}

            {/* Étape 2: Nombre d'employés */}
            {currentStep === 2 && (
              <EmployeeCountStep
                formData={formData}
                updateFormData={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {/* Étape 3: Recherche d'entreprise */}
            {currentStep === 3 && (
              <CompanySearchStep
                formData={formData}
                updateFormData={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {/* Étape 4: Choix du plan - rendu en pleine page au-dessus */}

            {/* Étape 5: Redirection vers paiement (état de chargement) */}
            {currentStep === 5 && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <LoaderCircle className="w-8 h-8 animate-spin text-[#5A50FF]" />
                <p className="text-muted-foreground">
                  Redirection vers le paiement...
                </p>
              </div>
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
            />
          )}

          {/* Étape 2: Nombre d'employés */}
          {currentStep === 2 && (
            <EmployeeCountStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {/* Étape 3: Recherche d'entreprise */}
          {currentStep === 3 && (
            <CompanySearchStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {/* Étape 4: Choix du plan */}
          {currentStep === 4 && (
            <PlanSelectionStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={handlePaymentRedirect}
              onBack={isReturningUser ? null : handleBack}
              isReturningUser={isReturningUser}
            />
          )}

          {/* Étape 5: Redirection vers paiement (état de chargement) */}
          {currentStep === 5 && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <LoaderCircle className="w-8 h-8 animate-spin text-[#5A50FF]" />
              <p className="text-muted-foreground">
                Redirection vers le paiement...
              </p>
            </div>
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
