"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import {
  Loader2,
  Check,
  Crown,
  HelpCircle,
  Mail,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { useSession } from "@/src/lib/auth-client";
import { authClient } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Switch } from "@/src/components/ui/switch";

export function SubscriptionSection() {
  const [isLoading, setIsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const { isActive, loading, subscription } = useSubscription();
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
        annual: isAnnual,
        referenceId: activeOrgId,
        successUrl: `${window.location.origin}/dashboard`,
        cancelUrl: `${window.location.origin}/dashboard/subscribe`,
        disableRedirect: false,
      };

      const { data, error } =
        await authClient.subscription.upgrade(upgradeParams);

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

  const openCancelModal = () => {
    setShowCancelModal(true);
  };

  const handleCancellation = async () => {
    setIsLoading(true);
    try {
      const { data: sessionData } = await authClient.getSession();

      if (!sessionData?.session?.activeOrganizationId) {
        toast.error("Aucune organisation active trouvée");
        return;
      }

      if (!subscription?.id) {
        toast.error("Aucun abonnement actif trouvé");
        return;
      }
      const { data, error } = await authClient.subscription.cancel({
        subscriptionId: subscription.id,
        referenceId: sessionData.session.activeOrganizationId,
        returnUrl: `${window.location.origin}/dashboard/subscribe?cancel_success=true`,
      });

      if (error) {
        console.error("Erreur lors de la résiliation:", error);
        toast.error(
          `Erreur lors de la résiliation: ${error.message || "Erreur inconnue"}`
        );
        return;
      }

      setShowCancelModal(false);

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Exception lors de la résiliation:", error);
      toast.error("Erreur lors de la résiliation");
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    console.log(dateString);
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Fonction pour formater le prix
  const formatPrice = (amount, currency = "EUR") => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Récupérer le prix depuis Stripe (TTC)
  const getSubscriptionPrice = () => {
    return subscription?.plan === "pro" ? 17.99 : 0;
  };

  const plans = [
    {
      name: "Gratuit",
      price: "0 € par mois",
      description:
        "Pour organiser tous les aspects de votre vie personnelle et professionnelle",
      features: [
        "Kanban",
        "Signature d'e‑mail",
        "Newbi Calendar",
        "Accès communauté",
      ],
      current: !isActive(),
    },
    {
      name: "Pro",
      annualPrice: "12,95 € TTC",
      monthlyPrice: "14,39 € TTC",
      annualTotal: "155,42 € TTC la première année",
      monthlyTotal: "14,39 € TTC par mois la première année",
      annualPriceAfter: "16,19 € TTC",
      monthlyPriceAfter: "17,99 € TTC",
      annualTotalAfter: "194,28 € TTC par an",
      monthlyTotalAfter: "17,99 € TTC par mois",
      description: "Toutes les fonctionnalités pour développer votre activité",
      features: [
        "Facturation complète (devis → factures, TVA)",
        "Devis",
        "Connexion comptes bancaires",
        "Gestion de trésorerie",
        "OCR des reçus et factures",
        "Transfert de fichiers sécurisé",
        "Gestion client",
        "Catalogue produits et services",
      ],
      current: isActive(),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Titre */}
      <div>
        <h2 className="text-lg font-medium mb-1">
          {isActive()
            ? "Gestion de l'abonnement"
            : "Passer à un forfait supérieur"}
        </h2>
        <Separator className="hidden md:block" />
      </div>

      <div className="space-y-6">
        {/* Section Forfait actif */}
        <div className="border border-gray-200 dark:bg-[#252525] dark:border-[#313131]/90 rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">
                  {isActive() ? "Pro" : "Gratuit"}
                </h3>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    isActive()
                      ? "border-[#5b50fe] text-[#5b50fe]"
                      : "border-gray-300 text-gray-600"
                  }`}
                >
                  Actuel
                </Badge>
              </div>
              <p className="text-sm dark:text-gray-300 mb-3">
                {isActive()
                  ? "Toutes les fonctionnalités pour développer votre activité"
                  : "Pour organiser tous les aspects de votre vie personnelle et professionnelle"}
              </p>
              {isActive() && subscription && (
                <div className="space-y-1 text-xs text-gray-500">
                  <p>
                    {formatPrice(getSubscriptionPrice())} TTC / mois • EUR
                    {subscription.status === "trialing" && " (Période d'essai)"}
                  </p>
                  <p>
                    Période en cours : {formatDate(subscription.periodStart)} →{" "}
                    {formatDate(subscription.periodEnd)}
                  </p>
                  <p>
                    {subscription.status === "trialing"
                      ? `Fin de l'essai : ${formatDate(subscription.periodEnd)}`
                      : `Prochain prélèvement : ${formatDate(subscription.periodEnd)} - ${formatPrice(getSubscriptionPrice())} TTC`}
                  </p>
                  <p className="text-xs">Plan : {subscription.plan}</p>
                </div>
              )}
            </div>
            <div className="text-left md:text-right flex-shrink-0">
              {!isActive() ? (
                <>
                  <p className="text-xs text-gray-400 mb-3 md:max-w-sm">
                    Passez à un forfait supérieur pour débloquer plus de
                    fonctionnalités
                  </p>
                  <Button
                    size="sm"
                    className="bg-[#5b50fe] hover:bg-[#5b50fe] cursor-pointer text-white w-full md:w-auto"
                    onClick={() => handleUpgrade("pro")}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      "Passer à Pro"
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  className="font-normal cursor-pointer bg-red-100 border border-red-200 text-red-600 hover:bg-red-200 w-full md:w-auto"
                  onClick={openCancelModal}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    "Résilier votre abonnement"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Section Comparaison des forfaits */}
        <div>
          <h3 className="text-base font-medium mb-4">Tous les forfaits</h3>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`flex-1 border border-gray-200 dark:border-[#313131]/90 dark:bg-[#252525] rounded-lg p-4 flex flex-col ${
                  index === 1 ? "border-[#5b50fe] relative" : ""
                }`}
              >
                {index === 1 && (
                  <Badge className="absolute -top-3 right-6 bg-[#5b50fe] font-normal text-white text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Recommandé
                  </Badge>
                )}

                <div className="mb-3">
                  {/* Titre avec switch pour le plan Pro (seulement si pas d'abonnement actif) */}
                  {plan.name === "Pro" && !isActive() ? (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
                      <h4 className="text-lg font-semibold">{plan.name}</h4>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs ${!isAnnual ? "text-gray-900 dark:text-white font-medium" : "text-gray-500"}`}
                        >
                          Mensuel
                        </span>
                        <Switch
                          checked={isAnnual}
                          onCheckedChange={setIsAnnual}
                          className="data-[state=checked]:bg-[#5b50fe] scale-75"
                        />
                        <span
                          className={`text-xs ${isAnnual ? "text-gray-900 dark:text-white font-medium" : "text-gray-500"}`}
                        >
                          Annuel
                        </span>
                      </div>
                    </div>
                  ) : (
                    <h4 className="text-lg font-semibold mb-1">{plan.name}</h4>
                  )}

                  {/* Prix dynamique selon le switch */}
                  {plan.name === "Pro" ? (
                    <div>
                      <p className="text-sm text-[#5b50fe] font-medium">
                        {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isAnnual ? plan.annualTotal : plan.monthlyTotal}
                      </p>
                      <p className="text-xs text-gray-400">
                        Puis{" "}
                        {isAnnual
                          ? plan.annualTotalAfter
                          : plan.monthlyTotalAfter}
                      </p>
                      {isAnnual && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 text-xs mt-1"
                        >
                          Économisez 17% la première année
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-[#5b50fe] font-medium">
                      Gratuit
                    </p>
                  )}
                </div>

                <div className="space-y-2 mb-4 flex-grow">
                  {plan.features.slice(0, 4).map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs dark:text-gray-300 leading-tight">
                        {feature}
                      </span>
                    </div>
                  ))}
                  {plan.features.length > 4 && (
                    <p className="text-xs text-gray-500 ml-5">
                      +{plan.features.length - 4} autres fonctionnalités
                    </p>
                  )}
                </div>

                {index === 1 && !isActive() && (
                  <Button
                    className="w-full bg-[#5b50fe] hover:bg-[#5b50fe] text-white text-sm cursor-pointer mt-auto"
                    onClick={() => handleUpgrade("pro")}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      `Passer à Pro ${isAnnual ? "Annuel" : "Mensuel"}`
                    )}
                  </Button>
                )}

                {index === 0 && !isActive() && (
                  <Button
                    variant="outline"
                    className="w-full text-sm mt-auto font-normal"
                    disabled
                  >
                    Forfait actuel
                  </Button>
                )}

                {index === 1 && isActive() && (
                  <Button
                    variant="outline"
                    className="w-full text-sm mt-auto font-normal"
                    disabled
                  >
                    Forfait actuel
                  </Button>
                )}

                {index === 0 && isActive() && (
                  <Button
                    className="w-full text-sm mt-auto cursor-pointer font-normal"
                    onClick={openCancelModal}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      "Rétrograder vers Gratuit"
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de confirmation de résiliation */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmer la résiliation
            </DialogTitle>
            <DialogDescription className="text-left">
              Êtes-vous sûr de vouloir résilier votre abonnement Pro ? Cette
              action est irréversible et vous perdrez l'accès à toutes les
              fonctionnalités premium.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 my-4">
            <h4 className="font-medium text-sm mb-2">
              Fonctionnalités que vous perdrez :
            </h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Facturation complète (devis → factures, TVA, relances)</li>
              <li>• Connexion comptes bancaires</li>
              <li>• Gestion de trésorerie</li>
              <li>• OCR des reçus et factures</li>
              <li>• Transfert de fichiers sécurisé</li>
              <li>• Gestion client avancée</li>
              <li>• Catalogue produits et services</li>
            </ul>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancellation}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Résiliation...
                </>
              ) : (
                "Confirmer la résiliation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
