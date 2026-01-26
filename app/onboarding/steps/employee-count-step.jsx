"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { User, Users, Building2, Factory, Warehouse } from "lucide-react";

const employeeOptions = [
  {
    id: "solo",
    label: "Juste moi",
    value: "1",
    description: "Travailleur indépendant",
    icon: User,
  },
  {
    id: "small",
    label: "2-5 employés",
    value: "2-5",
    description: "Petite équipe",
    icon: Users,
  },
  {
    id: "medium",
    label: "6-10 employés",
    value: "6-10",
    description: "Équipe en croissance",
    icon: Building2,
  },
  {
    id: "large",
    label: "11-50 employés",
    value: "11-50",
    description: "PME établie",
    icon: Factory,
  },
  {
    id: "enterprise",
    label: "Plus de 50 employés",
    value: "50+",
    description: "Grande entreprise",
    icon: Warehouse,
  },
];

export default function EmployeeCountStep({
  formData,
  updateFormData,
  onNext,
  onBack,
}) {
  const handleSelectOption = (option) => {
    updateFormData({
      employeeCount: option.value,
    });
    // Transition automatique après sélection
    setTimeout(() => {
      onNext();
    }, 300);
  };

  const selectedValue = formData.employeeCount;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium text-foreground">
          Quelle est la taille de votre entreprise ?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette information nous aide à personnaliser votre expérience.
        </p>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-3">
        {employeeOptions.map((option) => {
          const isSelected = selectedValue === option.value;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              onClick={() => handleSelectOption(option)}
              className={`group relative p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 ${
                isSelected
                  ? "border-[#5A50FF] bg-[#5A50FF]/5 shadow-sm"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-950 hover:shadow-sm cursor-pointer"
              }`}
            >
              {/* Icon */}
              <div
                className={`p-3 rounded-lg ${
                  isSelected
                    ? "bg-[#5A50FF] text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Text */}
              <div className="flex-1 text-left">
                <h3
                  className={`text-sm font-medium ${
                    isSelected ? "text-[#5A50FF]" : "text-foreground"
                  }`}
                >
                  {option.label}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-[#5A50FF]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          Retour
        </Button>
        <Button
          onClick={onNext}
          disabled={!selectedValue}
          className="min-w-[120px]"
        >
          Continuer
        </Button>
      </div>
    </div>
  );
}
