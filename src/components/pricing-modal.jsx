"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { LoaderCircle, CircleCheck } from "lucide-react";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { authClient } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";

export function PricingModal({ isOpen, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const { subscription } = useSubscription();

  const handleUpgrade = async (plan) => {
    setIsLoading(true);
    try {
      const { data: sessionData } = await authClient.getSession();

      if (!sessionData?.session?.activeOrganizationId) {
        toast.error("Aucune organisation active trouvée");
        return;
      }

      const activeOrgId = sessionData.session.activeOrganizationId;

      // Si pas d'abonnement, créer un nouvel abonnement
      if (!subscription || !subscription.stripeSubscriptionId) {
        const response = await fetch("/api/create-org-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            organizationData: {
              name: "Existing Organization",
              type: "existing",
              planName: plan,
              isAnnual: isAnnual,
            },
          }),
        });

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          toast.error(
            data.error || "Erreur lors de la création de l'abonnement"
          );
        }
        return;
      }

      // Sinon, changer de plan
      const response = await fetch("/api/change-subscription-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPlan: plan,
          isAnnual: isAnnual,
          organizationId: activeOrgId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || "Plan changé avec succès !");

        // Vider les caches
        try {
          localStorage.removeItem(`subscription-${activeOrgId}`);
          localStorage.removeItem("user-cache");
        } catch (e) {
          console.warn("Erreur vidage cache:", e);
        }

        // Recharger après un court délai
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        toast.error(
          data.error || data.message || "Erreur lors du changement de plan"
        );
      }
    } catch (error) {
      console.error("❌ Erreur changement de plan:", error);
      toast.error(`Erreur: ${error.message || "Erreur inconnue"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const plans = [
    {
      name: "Freelance",
      monthlyPrice: "14,59 €/mois",
      annualPrice: "13,13 €/mois",
      annualTotal: "157,56 € TTC/an",
      description: "Parfait pour les indépendants et freelances",
      features: [
        "1 utilisateur",
        "1 workspace inclus",
        "Facturation complète",
        "Gestion client",
        "OCR des reçus",
        "Catalogue produits",
      ],
      current: subscription?.plan === "freelance",
      planKey: "freelance",
      featured: false,
    },
    {
      name: "PME",
      monthlyPrice: "48,99 €/mois",
      annualPrice: "44,09 €/mois",
      annualTotal: "529,08 € TTC/an",
      description: "Idéal pour les petites et moyennes entreprises",
      features: [
        "Jusqu'à 10 utilisateurs",
        "Workspaces illimités",
        "Facturation complète",
        "Gestion client avancée",
        "OCR des reçus",
        "Catalogue produits",
        "Support prioritaire",
      ],
      current: subscription?.plan === "pme",
      planKey: "pme",
      featured: true,
    },
    {
      name: "Entreprise",
      monthlyPrice: "94,99 €/mois",
      annualPrice: "85,49 €/mois",
      annualTotal: "1 025,88 € TTC/an",
      description: "Pour les grandes équipes qui ont besoin d'évolutivité",
      features: [
        "Jusqu'à 25 utilisateurs",
        "Workspaces illimités",
        "Facturation complète",
        "Gestion client avancée",
        "OCR des reçus",
        "Catalogue produits",
        "Support prioritaire",
        "API access",
      ],
      current: subscription?.plan === "entreprise",
      planKey: "entreprise",
      featured: false,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold mb-1">
            Choisissez le plan qui vous convient
          </DialogTitle>
          <p className="text-muted-foreground text-xs">
            Sélectionnez l'offre adaptée à vos besoins
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Toggle Mensuel/Annuel */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 bg-muted p-0.5 rounded-lg">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  !isAnnual
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setIsAnnual(true)}
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
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`flex flex-col rounded-lg border p-6 text-left ${
                  plan.featured
                    ? "border-[#5b50fe] shadow-lg ring-1 ring-[#5b50fe]/10 relative"
                    : "border-gray-200 dark:border-[#313131]/90"
                } dark:bg-[#252525]`}
              >
                {/* Header */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2">
                    <Badge
                      variant={plan.featured ? "default" : "secondary"}
                      className={
                        plan.featured ? "bg-[#5b50fe] text-xs" : "text-xs"
                      }
                    >
                      <span className="font-normal">{plan.name}</span>
                    </Badge>
                    {plan.featured && (
                      <span className="rounded-full bg-[#5b50fe]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#5b50fe]">
                        Le plus populaire
                      </span>
                    )}
                  </div>
                  <h4 className="mb-1 mt-3 text-xl font-medium text-[#5b50fe]">
                    {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </h4>
                  {isAnnual && (
                    <p className="text-[10px] text-muted-foreground">
                      {plan.annualTotal} facturé annuellement
                    </p>
                  )}
                  {plan.description && (
                    <p className="text-[10px] text-muted-foreground">
                      {plan.description}
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="my-4 border-t border-gray-200 dark:border-[#313131]/90" />

                {/* Features - Afficher toutes les features */}
                <ul className="space-y-3 mb-6 flex-grow">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-center text-sm"
                    >
                      <CircleCheck className="mr-2 h-4 w-4 text-[#5b50fe] flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Bouton */}
                <div className="mt-auto pt-3">
                  {!plan.current && (
                    <Button
                      size="sm"
                      className={`w-full h-9 text-sm ${
                        plan.featured
                          ? "bg-[#5b50fe] hover:bg-[#4a3fe8]"
                          : "bg-secondary hover:bg-secondary/80"
                      }`}
                      variant={plan.featured ? "default" : "secondary"}
                      onClick={() => handleUpgrade(plan.planKey)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        `Choisir ${plan.name}`
                      )}
                    </Button>
                  )}
                  {plan.current && (
                    <Button
                      size="sm"
                      className="w-full h-9 text-sm"
                      variant="outline"
                      disabled
                    >
                      Plan actuel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PricingModal;
