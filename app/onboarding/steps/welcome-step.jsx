"use client";

import { Button } from "@/src/components/ui/button";
import {
  FileText,
  TrendingUp,
  Receipt,
  Kanban,
  Upload,
  PenTool,
  Sparkles,
} from "lucide-react";

const goals = [
  {
    id: "invoices",
    title: "Factures & Devis",
    description: "Créez et gérez vos documents",
    icon: FileText,
  },
  {
    id: "treasury",
    title: "Trésorerie",
    description: "Suivez votre situation financière",
    icon: TrendingUp,
  },
  {
    id: "expenses",
    title: "Dépenses",
    description: "Gérez vos frais et notes",
    icon: Receipt,
  },
  {
    id: "kanban",
    title: "Projets",
    description: "Organisez votre travail",
    icon: Kanban,
  },
  {
    id: "transfers",
    title: "Transferts",
    description: "Partagez vos fichiers",
    icon: Upload,
  },
  {
    id: "signatures",
    title: "Signatures",
    description: "Signez vos documents",
    icon: PenTool,
  },
];

export default function WelcomeStep({
  formData,
  updateFormData,
  onNext,
  onSkip,
}) {
  const toggleGoal = (goalId) => {
    const currentGoals = formData.goals || [];
    const newGoals = currentGoals.includes(goalId)
      ? currentGoals.filter((g) => g !== goalId)
      : [...currentGoals, goalId];
    updateFormData({ goals: newGoals });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium text-foreground">
          Que voulez-vous faire sur Newbi ?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Personnalisez votre expérience en sélectionnant vos outils préférés.
          Vous aurez accès à tous les outils, quel que soit votre choix.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-3 min-h-[400px]">
        {goals.map((goal) => {
          const Icon = goal.icon;
          const isSelected = formData.goals?.includes(goal.id);

          return (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`group relative p-4 rounded-xl border transition-all duration-200 text-left ${
                isSelected
                  ? "border-[#5A50FF] bg-[#5A50FF]/5"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-950"
              }`}
            >
              {/* Icône */}
              <div
                className={`mb-3 inline-flex p-2 rounded-lg transition-colors ${
                  isSelected
                    ? "bg-[#5A50FF]"
                    : "bg-gray-100 dark:bg-gray-900 group-hover:bg-gray-200 dark:group-hover:bg-gray-800"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isSelected
                      ? "text-white"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                />
              </div>

              {/* Contenu */}
              <div className="space-y-1">
                <h3
                  className={`text-sm font-medium transition-colors ${
                    isSelected ? "text-[#5A50FF]" : "text-foreground"
                  }`}
                >
                  {goal.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {goal.description}
                </p>
              </div>

              {/* Indicateur de sélection */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-2 h-2 rounded-full bg-[#5A50FF]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4">
        <div />
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onSkip}>
            Ignorer
          </Button>
          <Button onClick={onNext}>Continuer</Button>
        </div>
      </div>
    </div>
  );
}
