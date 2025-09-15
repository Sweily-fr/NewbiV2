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

      const { data, error } =
        await authClient.subscription.upgrade(upgradeParams);

      // Vérifier l'abonnement après upgrade
      if (!error && data) {
        // Attendre un peu pour laisser le temps aux webhooks
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const { data: subscriptions } = await authClient.subscription.list({
          referenceId: activeOrgId,
        });

        // Si aucun abonnement trouvé, essayer de synchroniser manuellement
        if (!subscriptions || subscriptions.length === 0) {
          try {
            // Appeler une API pour synchroniser l'abonnement depuis Stripe
            const syncResponse = await fetch("/api/auth/subscription/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ referenceId: activeOrgId }),
            });

            if (syncResponse.ok) {
              // Rafraîchir les abonnements
              const { data: updatedSubscriptions } =
                await authClient.subscription.list({
                  referenceId: activeOrgId,
                });
            }
          } catch (syncError) {
            console.error("Erreur synchronisation manuelle:", syncError);
          }
        }

        const activeSubscription = subscriptions?.find(
          (sub) => sub.status === "active" || sub.status === "trialing"
        );

        // if (activeSubscription) {
        //   console.log("STATUT:", activeSubscription.status);
        //   console.log("PLAN:", activeSubscription.planName);
        //   console.log("LIMITES:", activeSubscription.limits);
        // }
      }

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
        "Kanban",
        "Signature d’e‑mail",
        "Newbi Calendar",
        "Accès communauté ",
      ],
    },
    {
      name: "Pro",
      price: "13,99 € par mois facturation annuelle",
      monthlyPrice: "14,99 € facturation mensuelle",
      features: [
        "Facturation complète (devis → factures, TVA, relances)",
        "Devis",
        "Connexion comptes bancaires",
        "Gestion de trésorerie",
        "OCR des reçus et factures",
        "Transfert de fichiers sécurisé",
        "Gestion client",
        "Catalogue produits et services",
      ],
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl dark:bg-[#171717]">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">
            Forfait actif
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Section Forfait actif */}
          <div className="border border-gray-200 dark:bg-[#252525] dark:border-[#313131]/90 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">Gratuit</h3>
                  <Badge
                    variant="outline"
                    className="text-xs border-[#5b50fe] text-[#5b50fe]"
                  >
                    Actuel
                  </Badge>
                </div>
                <p className="text-sm dark:text-gray-300 mb-3">
                  Pour organiser tous les aspects de votre vie personnelle et
                  professionnelle
                </p>
                <p className="text-xs text-gray-500">
                  L’essentiel pour démarrer
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-400 mb-3 max-w-sm">
                  Passez à un forfait supérieur pour débloquer plus de
                  fonctionnalités
                </p>
                <Button
                  size="sm"
                  className="bg-[#5b50fe] hover:bg-[#5b50fe] cursor-pointer text-white"
                  onClick={() => handleUpgrade("pro")}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    "Passer à Pro"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Section Tous les forfaits */}
          <div>
            <h2 className="text-lg font-medium mb-4">Tous les forfaits</h2>

            {/* <div className="grid grid-cols-4 gap-6">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className="bg-gray-400 rounded-lg p-6 relative"
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-4 bg-blue-600 text-white">
                      Populaire
                    </Badge>
                  )}

                  <h3 className="text-xl font-semibold mb-4">{plan.name}</h3>

                  <div className="mb-4">
                    <p className="text-sm text-gray-300 mb-1">{plan.price}</p>
                    {plan.monthlyPrice && (
                      <p className="text-sm text-gray-500">
                        {plan.monthlyPrice}
                      </p>
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
            </div> */}
          </div>

          {/* Section Comparaison des forfaits */}
          <div className="flex justify-between gap-4">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`flex-1 border border-gray-200 dark:border-[#313131]/90 dark:bg-[#252525] rounded-lg p-4 flex flex-col ${
                  index === 1 ? "border-[#5b50fe] relative" : ""
                }`}
              >
                {index === 1 && (
                  <Badge className="absolute -top-3 right-6 bg-[#5b50fe] text-white text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Recommandé
                  </Badge>
                )}

                <div className="mb-3">
                  <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-[#5b50fe] font-medium">
                    {plan.price}
                  </p>
                </div>

                <div className="space-y-2 mb-4 flex-grow">
                  {plan.features.slice(0, 5).map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span className="text-xs dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                  {plan.features.length > 5 && (
                    <p className="text-xs text-gray-500 ml-5">
                      +{plan.features.length - 5} autres fonctionnalités
                    </p>
                  )}
                </div>

                {index === 1 && (
                  <Button
                    className="w-full bg-[#5b50fe] hover:bg-[#5b50fe] text-white text-sm cursor-pointer mt-auto"
                    onClick={() => handleUpgrade("pro")}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      "Passer à Pro"
                    )}
                  </Button>
                )}

                {index === 0 && (
                  <Button
                    variant="outline"
                    className="w-full text-sm mt-auto"
                    disabled
                  >
                    Forfait actuel
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PricingModal;
