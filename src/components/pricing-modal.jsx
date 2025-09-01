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
import { Check, Crown, Loader2 } from "lucide-react";
import { authClient, useSession, organization } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";

export function PricingModal({ isOpen, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  const handleUpgrade = async (plan) => {
    setIsLoading(true);
    try {
      const { data: sessionData } = await authClient.getSession();
      
      if (!sessionData?.session?.activeOrganizationId) {
        toast.error("Aucune organisation active trouvée");
        return;
      }

      const activeOrgId = sessionData.session.activeOrganizationId;
      
      const upgradeParams = {
        plan: plan,
        referenceId: activeOrgId,
        successUrl: `${window.location.origin}/dashboard`,
        cancelUrl: `${window.location.origin}/dashboard`,
        disableRedirect: false,
      };

      const { data, error } = await authClient.subscription.upgrade(upgradeParams);

      if (error) {
        toast.error(`Erreur: ${error.message || "Erreur inconnue"}`);
      } else {
        if (data?.url) {
          window.location.href = data.url;
        }
      }

    } catch (error) {
      toast.error(`Exception: ${error.message || "Erreur inconnue"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const plans = [
    {
      name: "Gratuit",
      price: "0 € par membre et par mois",
      features: [
        "Formulaires de base",
        "Sites de base", 
        "Automatisations de base",
        "Bases de données personnalisées",
        "Notion Calendar",
        "Notion Mail"
      ]
    },
    {
      name: "Plus",
      price: "9,50 € par membre et par mois facturation annuelle",
      monthlyPrice: "11,50 € facturation mensuelle",
      features: [
        "Blocs illimités",
        "Graphiques illimités",
        "Formulaires personnalisés",
        "Sites personnalisés",
        "Intégrations de base"
      ]
    },
    {
      name: "Business",
      price: "19,50 € par membre et par mois facturation annuelle",
      monthlyPrice: "23,50 € facturation mensuelle",
      popular: true,
      features: [
        "IA de Notion incluse",
        "SSO SAML",
        "Vérifier n'importe quelle page",
        "Recherche Enterprise",
        "Intégrations Premium"
      ]
    },
    {
      name: "Enterprise",
      price: "25,50 € par membre et par mois facturation annuelle",
      monthlyPrice: "31,50 € facturation mensuelle",
      features: [
        "IA de Notion incluse",
        "Provisionnement des utilisateurs",
        "Journal d'audit",
        "Contrôles et sécurité avancés",
        "Recherche Enterprise"
      ]
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl bg-gray-900 text-white border-gray-700">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-medium text-white">
            Forfait actif
          </DialogTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">€</span>
            <span className="text-sm text-gray-400">EUR</span>
          </div>
        </DialogHeader>

        <div className="space-y-8">
          {/* Section Forfait actif */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold mb-2">Gratuit</h3>
                <p className="text-gray-300 mb-1">
                  Pour organiser tous les aspects de votre vie —
                </p>
                <p className="text-gray-300 mb-4">personnelle et professionnelle</p>
                <p className="text-sm text-gray-500">
                  Vous avez utilisé tous les blocs gratuits de cet espace de travail
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-sm">IA</span>
                  </div>
                  <span className="text-sm">IA de Notion</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Passez à un forfait supérieur pour rechercher n'importe où, automatiser les notes de réunion et plus encore
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Passer à un forfait supérieur
                </Button>
              </div>
            </div>
          </div>

          {/* Section Tous les forfaits */}
          <div>
            <h2 className="text-xl font-medium mb-6">Tous les forfaits</h2>
            
            <div className="grid grid-cols-4 gap-6">
              {plans.map((plan, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-6 relative">
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-4 bg-blue-600 text-white">
                      Populaire
                    </Badge>
                  )}
                  
                  <h3 className="text-xl font-semibold mb-4">{plan.name}</h3>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-300 mb-1">{plan.price}</p>
                    {plan.monthlyPrice && (
                      <p className="text-sm text-gray-500">{plan.monthlyPrice}</p>
                    )}
                  </div>

                  <Button 
                    className={`w-full mb-6 ${
                      plan.popular 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "bg-gray-700 hover:bg-gray-600 text-white"
                    }`}
                    onClick={() => handleUpgrade(plan.name.toLowerCase())}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Passer à un forfait supérieur"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Section Éléments clefs */}
          <div>
            <h2 className="text-xl font-medium mb-6">Éléments clefs</h2>
            
            <div className="grid grid-cols-5 gap-6">
              <div className="text-sm font-medium text-gray-400">
                {/* Colonne vide pour les labels */}
              </div>
              
              {plans.map((plan, index) => (
                <div key={index} className="text-center">
                  <h4 className="font-medium mb-4">{plan.name}</h4>
                </div>
              ))}
            </div>

            <div className="space-y-4 mt-4">
              {plans[0].features.map((feature, featureIndex) => (
                <div key={featureIndex} className="grid grid-cols-5 gap-6 py-2 border-b border-gray-700">
                  <div className="text-sm text-gray-300">{feature}</div>
                  {plans.map((plan, planIndex) => (
                    <div key={planIndex} className="text-center">
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    </div>
                  ))}
                </div>
              ))}
              
              {/* Features spécifiques aux plans payants */}
              <div className="grid grid-cols-5 gap-6 py-2 border-b border-gray-700">
                <div className="text-sm text-gray-300">Blocs illimités</div>
                <div className="text-center">-</div>
                <div className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></div>
                <div className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></div>
                <div className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></div>
              </div>
              
              <div className="grid grid-cols-5 gap-6 py-2 border-b border-gray-700">
                <div className="text-sm text-gray-300">IA de Notion incluse</div>
                <div className="text-center">-</div>
                <div className="text-center">-</div>
                <div className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></div>
                <div className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></div>
              </div>
              
              <div className="grid grid-cols-5 gap-6 py-2">
                <div className="text-sm text-gray-300">Intégrations Premium</div>
                <div className="text-center">-</div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs">🔗📧</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs">📊📋🔗</span>
                    <span className="text-xs text-gray-400">+5</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs">🔗📊📋</span>
                    <span className="text-xs text-gray-400">+4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PricingModal;
