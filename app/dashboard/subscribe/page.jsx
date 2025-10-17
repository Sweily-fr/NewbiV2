"use client";

import React, { useState, useEffect } from "react";
import Loading from "./loading.jsx";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import {
  LoaderCircle,
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

export default function SubscribePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const { isActive, loading, subscription } = useSubscription();
  const { data: session } = useSession();

  // Vérifier les paramètres URL pour afficher la notification de succès
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const cancelSuccess = urlParams.get("cancel_success");

    if (cancelSuccess === "true") {
      toast.success("Abonnement résilié avec succès");
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleUpgrade = async (plan) => {
    setIsLoading(true);
    try {
      const { data: sessionData } = await authClient.getSession();

      if (!sessionData?.session?.activeOrganizationId) {
        toast.error("Aucune organisation active trouvée");
        return;
      }

      const activeOrgId = sessionData.session.activeOrganizationId;

      // Vérifier si l'utilisateur essaie de s'abonner au même plan
      if (subscription && subscription.planName === plan) {
        toast.info("Vous êtes déjà abonné à ce plan");
        setIsLoading(false);
        return;
      }

      // Hardcoder temporairement les prix pour tester
      const monthlyPriceId = "price_1S3XtUGhXtlcZkhKIAiLVtjE";
      const yearlyPriceId = "price_1S3IT7GhXtlcZkhKnvOVR18y";

      const upgradeParams = {
        plan: plan,
        annual: isAnnual,
        referenceId: activeOrgId,
        successUrl: `${window.location.origin}/dashboard`,
        cancelUrl: `${window.location.origin}/dashboard/subscribe`,
        disableRedirect: false,
      };

      // Si l'utilisateur a déjà un abonnement, ajouter le subscriptionId
      if (subscription?.stripeSubscriptionId) {
        upgradeParams.subscriptionId = subscription.stripeSubscriptionId;
        console.log(
          `🔄 Mise à jour de l'abonnement existant: ${subscription.stripeSubscriptionId}`
        );
      } else {
        console.log(`➕ Création d'un nouvel abonnement`);
      }

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

      // La notification de succès sera affichée après la redirection depuis Stripe
      setShowCancelModal(false);

      // Redirection vers Stripe Customer Portal - la notification s'affichera au retour
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

  const applyPromoCode = () => {
    if (promoCode.trim()) {
      toast.success("Code promo appliqué avec succès");
    } else {
      toast.error("Le code promo est invalide ou expiré");
    }
  };

  // Attendre que toutes les données soient chargées avant d'afficher le contenu
  if (loading || (isActive() && !subscription)) {
    return <Loading />;
  }

  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Fonction pour formater le prix (pas besoin de diviser par 100, les données sont déjà en euros)
  const formatPrice = (amount, currency = "EUR") => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Récupérer le prix depuis Stripe (nécessite un appel à l'API Stripe)
  const getSubscriptionPrice = () => {
    // Pour l'instant, on utilise un prix par défaut
    // TODO: Récupérer le vrai prix depuis l'API Stripe avec le priceId
    return subscription?.plan === "pro" ? 14.99 : 0;
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
      annualPrice: "11,24 €",
      monthlyPrice: "12,49 €",
      annualTotal: "134,88 € la première année",
      monthlyTotal: "12,49 € par mois la première année",
      annualPriceAfter: "13,49 €",
      monthlyPriceAfter: "14,99 €",
      annualTotalAfter: "161,88 € par an",
      monthlyTotalAfter: "14,99 € par mois",
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
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-lg md:text-xl font-medium">
          Gestion de l'abonnement
        </h1>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Section Forfait actif */}
        <div className="border border-gray-200 dark:bg-[#252525] dark:border-[#313131]/90 rounded-lg p-3 md:p-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-base md:text-lg font-semibold">
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
                  {isActive() ? "Actuel" : "Actuel"}
                </Badge>
              </div>
              <p className="text-xs md:text-sm dark:text-gray-300 mb-3">
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
                  <p className="text-xs">
                    Plan : {subscription.plan}
                    {/* • ID: {subscription.stripeSubscriptionId} */}
                  </p>
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
                      <LoaderCircle className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      "Passer à Pro"
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  variant="destructive"
                  className="font-normal cursor-pointer bg-red-100 border border-red-200 text-red-600 hover:bg-red-200 w-full md:w-auto"
                  onClick={openCancelModal}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <LoaderCircle className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    "Résilier votre abonnement"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Section Tous les forfaits */}
        <div>
          <h2 className="text-base md:text-lg font-medium mb-3 md:mb-4">
            Tous les forfaits
          </h2>

          {/* Section Comparaison des forfaits */}
          <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-4 mb-4 md:mb-6">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`flex-1 border border-gray-200 dark:border-[#313131]/90 dark:bg-[#252525] rounded-lg p-3 md:p-4 flex flex-col ${
                  index === 1 ? "border-[#5b50fe] relative" : ""
                }`}
              >
                {index === 1 && (
                  <Badge className="absolute -top-3 right-3 md:right-6 bg-[#5b50fe] font-normal text-white text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Recommandé
                  </Badge>
                )}

                <div className="mb-3">
                  {/* Titre avec switch pour le plan Pro (seulement si pas d'abonnement actif) */}
                  {plan.name === "Pro" && !isActive() ? (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
                      <h3 className="text-base md:text-lg font-semibold">
                        {plan.name}
                      </h3>
                      <div className="flex items-center gap-1 md:gap-2">
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
                    <h3 className="text-base md:text-lg font-semibold mb-1">
                      {plan.name}
                    </h3>
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

                <div className="space-y-1 md:space-y-2 mb-3 md:mb-4 flex-grow">
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
                      <LoaderCircle className="mr-2 h-3 w-3 animate-spin" />
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
                      <LoaderCircle className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      "Rétrograder vers Gratuit"
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* <div className="flex justify-between gap-4">
          <div className="flex-1 basis-1/2 border border-gray-200 dark:border-[#313131]/90 dark:bg-[#252525] rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Promotions et crédits</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Code promo"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={applyPromoCode} size="sm">
                  Appliquer
                </Button>
              </div>
              <p className="text-xs">
                Crédits disponibles: 12,00 € TTC — appliqués automatiquement à
                la prochaine facture
              </p>
            </div>
          </div>

          <div className="flex-1 basis-1/2 border border-gray-200 dark:border-[#313131]/90 dark:bg-[#252525] rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Aide & conformité</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 justify-start"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Centre d'aide
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 justify-start"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contacter le support
                </Button>
              </div>

              <Separator />

              <div className="space-y-2 text-xs text-gray-500">
                <p>RGPD: export/suppression des données sur demande.</p>
                <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Contacter le DPO
                </Button>
              </div>
            </div>
          </div>
        </div> */}
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
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
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
