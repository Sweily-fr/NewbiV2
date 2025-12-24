"use client";

import { Button } from "@/src/components/ui/button";

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
  },
];

export default function AccountTypeStep({
  formData,
  updateFormData,
  onNext,
  onSkip,
}) {
  const handleSelectType = (typeId) => {
    updateFormData({ accountType: typeId });
    // Transition automatique après sélection
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

          return (
            <button
              key={type.id}
              onClick={() => handleSelectType(type.id)}
              className={`group relative p-8 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center min-h-[280px] ${
                isSelected
                  ? "border-[#5A50FF] bg-[#5A50FF]/2 shadow-lg shadow-[#5A50FF]/10"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-250 dark:hover:border-gray-700 bg-white dark:bg-gray-950 hover:shadow-sm cursor-pointer"
              }`}
            >
              {/* Illustration */}
              <div className="mb-6 w-full flex items-center justify-center">
                <img
                  src={type.illustration}
                  alt={type.title}
                  className="w-32 h-32 object-contain"
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

              {/* Selection Indicator */}
              {/* {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 rounded-full bg-[#5A50FF] flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
              )} */}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onSkip}>
          Passer cette étape
        </Button>
        <div className="flex items-center gap-2">
          <Button
            onClick={onNext}
            disabled={!selectedType}
            className="min-w-[120px]"
          >
            Continuer
          </Button>
        </div>
      </div>
    </div>
  );
}
