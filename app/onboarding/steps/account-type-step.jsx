"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Lock } from "lucide-react";

const accountTypes = [
  {
    id: "business",
    title: "Entreprise",
    description: "Pour gérer votre activité professionnelle",
    illustration: "/undraw_finance_m6vw.svg",
  },
  {
    id: "accounting_firm",
    title: "Cabinet Comptable",
    description: "Pour gérer votre cabinet et vos clients",
    illustration: "/undraw_calculator_21hp.svg",
    locked: true,
  },
];

export default function AccountTypeStep({
  formData,
  updateFormData,
  onNext,
}) {
  const handleSelectType = (typeId) => {
    updateFormData({
      accountType: typeId,
      hasNoCompany: false,
    });
    // Transition automatique après sélection
    setTimeout(() => {
      onNext();
    }, 300);
  };

  // "Je n'ai pas d'entreprise" - Continue vers l'étape suivante (choix du plan)
  // L'utilisateur doit quand même s'abonner
  const handleNoCompany = () => {
    updateFormData({
      accountType: "business", // Type par défaut
      hasNoCompany: true,
    });
    // Continuer vers l'étape suivante
    setTimeout(() => {
      onNext();
    }, 300);
  };

  const selectedType = formData.accountType;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium text-foreground">
          Quel type de compte souhaitez-vous créer ?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choisissez le type de compte qui correspond à votre activité.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accountTypes.map((type) => {
          const isSelected = selectedType === type.id;
          const isLocked = type.locked;

          return (
            <button
              key={type.id}
              onClick={() => !isLocked && handleSelectType(type.id)}
              disabled={isLocked}
              className={`group relative p-8 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center min-h-[280px] ${
                isLocked
                  ? "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 opacity-60 cursor-not-allowed"
                  : isSelected
                    ? "border-[#5A50FF] bg-[#5A50FF]/2 shadow-lg shadow-[#5A50FF]/10"
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-250 dark:hover:border-gray-700 bg-white dark:bg-gray-950 hover:shadow-sm cursor-pointer"
              }`}
            >
              {/* Badge "Bientôt disponible" */}
              {isLocked && (
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-200 dark:bg-gray-800">
                    <Lock className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Bientôt
                    </span>
                  </div>
                </div>
              )}

              {/* Illustration */}
              <div className="mb-6 w-full flex items-center justify-center">
                <img
                  src={type.illustration}
                  alt={type.title}
                  className={`w-32 h-32 object-contain ${isLocked ? "grayscale" : ""}`}
                />
              </div>

              {/* Title */}
              <div className="text-center space-y-1">
                <h3
                  className={`text-xl font-normal transition-colors ${
                    isSelected ? "text-foreground" : "text-foreground"
                  }`}
                >
                  {type.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {type.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Option "Je n'ai pas d'entreprise" - Continue vers le flux normal */}
      <button
        onClick={handleNoCompany}
        className={`w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 ${
          formData.hasNoCompany
            ? "border-[#5A50FF] bg-[#5A50FF]/5"
            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-950"
        }`}
      >
        <div className="flex-shrink-0">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              formData.hasNoCompany
                ? "bg-[#5A50FF] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
        </div>
        <div className="flex-1 text-left">
          <h3
            className={`text-sm font-medium ${
              formData.hasNoCompany ? "text-[#5A50FF]" : "text-foreground"
            }`}
          >
            Je n'ai pas d'entreprise
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Continuer sans associer d'entreprise
          </p>
        </div>
        {formData.hasNoCompany && (
          <div className="ml-auto w-2 h-2 rounded-full bg-[#5A50FF]" />
        )}
      </button>

      <div className="flex items-center justify-end pt-4">
        <Button
          onClick={onNext}
          disabled={!selectedType && !formData.hasNoCompany}
          className="min-w-[120px]"
        >
          Continuer
        </Button>
      </div>
    </div>
  );
}
