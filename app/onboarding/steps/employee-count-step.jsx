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
  };

  const selectedValue = formData.employeeCount;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[#46464A]">
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
              className={`outline-none p-2 rounded-xl border transition-all duration-400 flex items-center gap-2.5 w-full ${
                isSelected
                  ? "border-[#5A50FF] bg-[#5A50FF]/[0.04] shadow-[0_0_0_2px_rgba(90,80,255,0.04)]"
                  : "bg-transparent border-[#EEEFF1] hover:bg-[#F8F9FA] cursor-pointer"
              }`}
            >
              {/* Icon */}
              <div
                className={`flex items-center justify-center size-10 shrink-0 rounded-lg border ${
                  isSelected
                    ? "bg-[#5A50FF]/[0.04] border-[#5A50FF]/20 text-[#5A50FF]"
                    : "bg-[#F8F9FA] border-black/5 text-[#959596]"
                }`}
              >
                <Icon className="size-4" />
              </div>

              {/* Text */}
              <div className="flex-1 text-left">
                <h3
                  className="text-sm font-medium leading-5 tracking-[-0.01em] text-[#505154]"
                >
                  {option.label}
                </h3>
                <p className="text-xs font-normal leading-4 tracking-[-0.01em] text-[#505154]">
                  {option.description}
                </p>
              </div>

              {/* Radio Indicator */}
              <div
                className={`size-[18px] rounded-full shrink-0 ml-auto border bg-white ${
                  isSelected
                    ? "border-[6px] border-[#5A50FF]"
                    : "border border-[#EEEFF1]"
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          Retour
        </Button>
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!selectedValue}
        >
          Continuer
        </Button>
      </div>
    </div>
  );
}
