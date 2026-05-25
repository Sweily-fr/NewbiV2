"use client";

import React from "react";
import { PricingCard } from "../components/PricingCard";

const PLANS = [
  {
    key: "freelance",
    name: "Freelance",
    monthlyPrice: "17,99 €/mois",
    annualPrice: "16,19 €/mois",
    annualTotal: "157,56 € TTC/an",
    description: "Pour les indépendants",
    features: [
      "Facturation & Devis illimités",
      "CRM client",
      "Un accès comptable gratuit",
    ],
    featured: false,
  },
  {
    key: "pme",
    name: "TPE",
    monthlyPrice: "48,99 €/mois",
    annualPrice: "44,09 €/mois",
    annualTotal: "529,08 € TTC/an",
    description: "Pour les équipes en croissance",
    features: [
      "Jusqu'à 10 utilisateurs",
      "E-signature & automatisations",
      "Support prioritaire",
    ],
    featured: true,
  },
  {
    key: "entreprise",
    name: "Entreprise",
    monthlyPrice: "94,99 €/mois",
    annualPrice: "85,49 €/mois",
    annualTotal: "1 025,88 € TTC/an",
    description: "Pour les structures avancées",
    features: [
      "Jusqu'à 25 utilisateurs",
      "Permissions avancées",
      "Archivage légal & API",
    ],
    featured: false,
  },
];

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
