"use client";

import React from "react";
import { PricingCard } from "../components/PricingCard";
import { PLANS_DISPLAY, getPlanPricingStrings } from "@/src/lib/plans-display";

// Features et "featured" sont spécifiques à cette UI ; les prix et le label
// viennent du module central pour garantir la cohérence avec landing/settings.
const PLAN_UI_EXTRA = {
  freelance: {
    features: [
      "Facturation & Devis illimités",
      "CRM client",
      "Un accès comptable gratuit",
    ],
    featured: false,
  },
  pme: {
    features: [
      "Jusqu'à 10 utilisateurs",
      "E-signature & automatisations",
      "Support prioritaire",
    ],
    featured: true,
  },
  entreprise: {
    features: [
      "Jusqu'à 25 utilisateurs",
      "Permissions avancées",
      "Archivage légal & API",
    ],
    featured: false,
  },
};

const PLANS = PLANS_DISPLAY.map((p) => {
  const strings = getPlanPricingStrings(p.key);
  return {
    key: p.key,
    name: strings.displayName,
    monthlyPrice: strings.monthly,
    annualPrice: strings.annualPerMonth,
    annualTotal: strings.annualTotal,
    description: p.description,
    ...PLAN_UI_EXTRA[p.key],
  };
});

export function PlanSelectionStep({
  selectedPlan,
  isAnnual,
  onPlanSelect,
  onAnnualToggle,
}) {
  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white">
          Choisissez le plan pour cette entreprise
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Chaque workspace possède son propre abonnement
        </p>
      </div>

      {/* Toggle Mensuel/Annuel */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 bg-muted p-0.5 rounded-lg">
          <button
            onClick={() => onAnnualToggle(false)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              !isAnnual
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => onAnnualToggle(true)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              isAnnual
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Annuel
            <span className="ml-2 text-xs text-[#5b50fe]">-10%</span>
          </button>
        </div>
      </div>

      {/* Cartes de pricing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <PricingCard
            key={plan.key}
            planKey={plan.key}
            name={plan.name}
            monthlyPrice={plan.monthlyPrice}
            annualPrice={plan.annualPrice}
            annualTotal={plan.annualTotal}
            description={plan.description}
            features={plan.features}
            featured={plan.featured}
            selected={
              selectedPlan === plan.key ? true : selectedPlan ? false : null
            }
            isAnnual={isAnnual}
            onSelect={onPlanSelect}
          />
        ))}
      </div>
    </div>
  );
}
