"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Check, ArrowLeft, Gift, AlertCircle, Loader2 } from "lucide-react";
import { getAssetUrl } from "@/src/lib/image-utils";

const plans = [
  {
    key: "freelance",
    name: "Freelance",
    monthlyPrice: 17.99,
    annualPrice: 16.19,
    description: "Parfait pour les indépendants et freelances",
    features: [
      "1 utilisateur",
      "Facturation & Devis",
      "OCR des reçus (20/mois)",
      "Gestion de trésorerie",
      "CRM client",
      "1 comptable gratuit",
      "Catalogue produits",
      "1 signature mail",
      "Transfert jusqu'à 5Go",
      "Gestion des projets",
    ],
    featured: false,
    position: "left",
  },
  {
    key: "pme",
    name: "PME",
    monthlyPrice: 48.99,
    annualPrice: 44.09,
    description: "Idéal pour les petites et moyennes entreprises",
    features: [
      "Jusqu'à 10 utilisateurs",
      "Facturation & Devis",
      "OCR illimité",
      "Gestion de trésorerie",
      "CRM client",
      "3 comptables gratuits",
      "Support prioritaire",
      "Relances automatiques",
      "Jusqu'à 10 signatures",
      "Transfert jusqu'à 15Go",
      "Connexion jusqu'à 3 banques",
    ],
    featured: true,
    position: "center",
  },
  {
    key: "entreprise",
    name: "Entreprise",
    monthlyPrice: 94.99,
    annualPrice: 85.49,
    description: "Pour les grandes structures",
    features: [
      "Jusqu'à 25 utilisateurs",
      "Facturation & Devis",
      "OCR illimité",
      "Gestion de trésorerie",
      "CRM client",
      "5 comptables gratuits",
      "Support prioritaire",
      "Relances automatiques",
      "API access",
      "Jusqu'à 25 signatures",
      "Transfert jusqu'à 15Go",
    ],
    featured: false,
    position: "right",
  },
];

export default function PlanSelectionStep({
  formData,
  updateFormData,
  onNext,
  onBack,
  isReturningUser = false,
}) {
  const [isAnnual, setIsAnnual] = useState(formData.billingPeriod === "annual");
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleSelectPlan = (planKey) => {
    // Afficher le loader sur le bouton cliqué
    setLoadingPlan(planKey);

    // Mettre à jour le state ET passer les données directement à onNext
    // pour éviter le problème de timing avec les états asynchrones de React
    const selectedData = {
      selectedPlan: planKey,
      billingPeriod: isAnnual ? "annual" : "monthly",
    };
    updateFormData(selectedData);
    // Passer les données directement pour ne pas dépendre du state asynchrone
    onNext(selectedData);
  };

  const formatPrice = (price) => {
    return price.toFixed(2).replace(".", ",");
  };

  const getCardClasses = (position, featured) => {
    const base =
      "flex flex-col gap-4 border p-5 w-full md:flex-1 transition-all duration-300";

    if (featured) {
      return `${base} rounded-xl md:shadow-xl md:z-10 md:-my-4 md:py-8 bg-[#5A50FF]/90 text-white border-[#5A50FF]/90`;
    }

    if (position === "left") {
      return `${base} rounded-xl md:rounded-tl-xl md:rounded-tr-none md:rounded-br-none md:rounded-bl-xl md:border-r-0 bg-card text-card-foreground shadow-sm`;
    }

    if (position === "right") {
      return `${base} rounded-xl md:rounded-tl-none md:rounded-tr-xl md:rounded-br-xl md:rounded-bl-none md:border-l-0 bg-card text-card-foreground shadow-sm`;
    }

    return `${base} bg-card text-card-foreground shadow-sm`;
  };

  return (
    <section className="flex flex-col items-center gap-8 py-4 px-4 h-screen justify-center">
      {/* Logo */}
      <div className="absolute top-5 right-6">
        <img src={getAssetUrl("newbiLetter.png")} alt="Newbi" className="h-5" />
      </div>

      {/* Back Button - only show if onBack is provided */}
      {onBack && (
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {/* Retour */}
          </Button>
        </div>
      )}

      {/* Banner pour les utilisateurs existants */}
      {isReturningUser && (
        <div className="w-full max-w-3xl mb-2">
          <div className="flex items-center gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Votre abonnement a expiré
              </p>
              <p className="text-amber-700 dark:text-amber-300 text-xs mt-0.5">
                Choisissez un plan pour continuer à accéder à votre espace.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header - Title */}
      <div className="text-center max-w-2xl">
        <h1 className="text-3xl font-medium md:text-3xl tracking-tight">
          {isReturningUser ? "Renouvelez votre abonnement" : "Choisissez votre abonnement"}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Économisez 10% en optant pour la facturation annuelle
        </p>
      </div>
      {/* 30-day Free Trial Badge - only for new users */}
      {!isReturningUser && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
          <Gift className="w-3.5 h-3.5 text-primary" />
          Profitez de 30 jours d'essai gratuit, sans engagement
        </p>
      )}

      {/* Toggle Mensuel/Annuel */}
      <div className="flex w-fit rounded-full bg-muted p-1">
        <button
          onClick={() => setIsAnnual(false)}
          className={`relative w-fit px-3 py-1.5 text-sm font-medium transition-colors rounded-full ${
            !isAnnual ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <span className="relative z-10 text-xs">Mensuel</span>
          {!isAnnual && (
            <span className="absolute inset-0 z-0 rounded-full bg-background shadow-sm" />
          )}
        </button>
        <button
          onClick={() => setIsAnnual(true)}
          className={`relative w-fit px-3 py-1.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 rounded-full ${
            isAnnual ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <span className="relative z-10 text-xs">Annuel</span>
          <Badge
            variant="secondary"
            className="relative z-10 whitespace-nowrap text-xs bg-[#5A50FF]/80 text-white hover:bg-[#5A50FF]/80"
          >
            -10%
          </Badge>
          {isAnnual && (
            <span className="absolute inset-0 z-0 rounded-full bg-background shadow-sm" />
          )}
        </button>
      </div>

      {/* Plan Cards */}
      <div className="flex w-full flex-col items-center mt-6 gap-3 md:max-w-5xl md:flex-row md:items-stretch md:gap-0 md:px-4">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={getCardClasses(plan.position, plan.featured)}
          >
            <div className="flex flex-col gap-4 h-full">
              {/* Header */}
              <div className="flex flex-col gap-3">
                <div className="relative flex flex-col gap-1">
                  <h3
                    className={`text-base font-medium tracking-tight ${plan.featured ? "text-white" : ""}`}
                  >
                    {plan.name}
                    {plan.featured && (
                      <Badge className="ml-2 bg-white/20 text-white text-[10px] hover:bg-white/20">
                        Populaire
                      </Badge>
                    )}
                  </h3>
                  <p
                    className={`text-xs ${plan.featured ? "text-white/80" : "text-muted-foreground"}`}
                  >
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="flex items-end gap-0.5">
                  <span
                    className={`text-3xl font-semibold tracking-tight ${plan.featured ? "text-white" : ""}`}
                  >
                    {formatPrice(
                      isAnnual ? plan.annualPrice : plan.monthlyPrice,
                    )}
                    €
                  </span>
                  <span
                    className={`text-xs pb-1 ${plan.featured ? "text-white/70" : "text-muted-foreground"}`}
                  >
                    /mois
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-col gap-2 flex-1">
                <p
                  className={`text-xs font-medium ${plan.featured ? "text-white/90" : ""}`}
                >
                  Ce qui est inclus :
                </p>
                <div className="flex flex-col gap-1.5">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check
                        className={`w-3.5 h-3.5 flex-shrink-0 ${plan.featured ? "text-white" : "text-[#5A50FF]"}`}
                      />
                      <span
                        className={`text-xs ${plan.featured ? "text-white/90" : "text-muted-foreground"}`}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => handleSelectPlan(plan.key)}
                disabled={loadingPlan !== null}
                className={`w-full h-10 text-sm font-medium ${
                  plan.featured
                    ? "bg-white text-[#5A50FF] hover:bg-white/90"
                    : "bg-[#202020] hover:bg-[#303030] text-white"
                }`}
              >
                {loadingPlan === plan.key ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Choisir ce plan"
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
