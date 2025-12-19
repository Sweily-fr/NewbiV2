"use client";

import React, { useState, useEffect } from "react";
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
  CircleCheck,
  Users,
} from "lucide-react";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { useSession } from "@/src/lib/auth-client";
import { authClient } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import { usePermissions } from "@/src/hooks/usePermissions";
import { Callout } from "@/src/components/ui/callout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Switch } from "@/src/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

export function SubscriptionSection({
  canManageSubscription: canManageSubscriptionProp,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
  const [planChangePreview, setPlanChangePreview] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [seatsInfo, setSeatsInfo] = useState(null);
  const { isActive, loading, subscription, refreshSubscription } =
    useSubscription();
  const { data: session } = useSession();
  const { isOwner } = usePermissions();

  // Utiliser la prop si fournie, sinon vérifier le rôle
  const canManageSubscription =
    canManageSubscriptionProp !== undefined
      ? canManageSubscriptionProp
      : isOwner();

  // Récupérer les informations sur les sièges
  useEffect(() => {
    const fetchSeatsInfo = async () => {
      if (!session?.user?.organization?.id) return;

      try {
        const response = await fetch(
          `/api/organizations/${session.user.organization.id}/seats-info`
        );
        if (response.ok) {
          const data = await response.json();
          setSeatsInfo(data);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des sièges:", error);
      }
    };

    if (isActive()) {
      fetchSeatsInfo();
    }
  }, [session, isActive]);

  // Ouvrir la modal de preview avant changement de plan
  const openPlanChangeModal = async (plan) => {
    // Si pas d'abonnement existant, créer directement
    if (!subscription || !subscription.stripeSubscriptionId) {
      handleDirectUpgrade(plan);
      return;
    }

    // Si c'est le même plan, ne rien faire
    if (subscription.plan === plan) {
      return;
    }

    setSelectedPlan(plan);
    setIsLoadingPreview(true);
    setShowPlanChangeModal(true);

    try {
      const { data: sessionData } = await authClient.getSession();
      const activeOrgId = sessionData?.session?.activeOrganizationId;

      if (!activeOrgId) {
        toast.error("Aucune organisation active trouvée");
        setShowPlanChangeModal(false);
        return;
      }

      const response = await fetch("/api/preview-plan-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPlan: plan,
          isAnnual: isAnnual,
          organizationId: activeOrgId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPlanChangePreview(data.preview);
      } else {
        toast.error(data.error || "Erreur lors de la prévisualisation");
        setShowPlanChangeModal(false);
      }
    } catch (error) {
      console.error("Erreur preview:", error);
      toast.error("Erreur lors de la prévisualisation");
      setShowPlanChangeModal(false);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Création directe d'abonnement (sans abonnement existant)
  const handleDirectUpgrade = async (plan) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/create-org-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        toast.error(data.error || "Erreur lors de la création de l'abonnement");
      }
    } catch (error) {
      toast.error(`Erreur: ${error.message || "Erreur inconnue"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmer le changement de plan
  const confirmPlanChange = async () => {
    if (!selectedPlan || !planChangePreview) return;

    setIsLoading(true);
    try {
      const { data: sessionData } = await authClient.getSession();
      const activeOrgId = sessionData?.session?.activeOrganizationId;

      const response = await fetch("/api/change-subscription-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPlan: selectedPlan,
          isAnnual: isAnnual,
          organizationId: activeOrgId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || "Plan changé avec succès !");
        setShowPlanChangeModal(false);

        // Vider les caches
        try {
          localStorage.removeItem(`subscription-${activeOrgId}`);
          localStorage.removeItem("user-cache");
        } catch (e) {
          console.warn("Erreur vidage cache:", e);
        }

        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        toast.error(
          data.error || data.message || "Erreur lors du changement de plan"
        );
      }
    } catch (error) {
      toast.error(`Erreur: ${error.message || "Erreur inconnue"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Ancienne fonction renommée pour compatibilité
  const handleUpgrade = async (plan) => {
    openPlanChangeModal(plan);
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

      if (!subscription?.stripeSubscriptionId) {
        toast.error("Aucun abonnement actif trouvé");
        return;
      }

      console.log("🔄 Résiliation de l'abonnement:", {
        subscriptionId: subscription.id, // ✅ Better Auth cherche par id interne, pas stripeSubscriptionId
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        referenceId: sessionData.session.activeOrganizationId,
        subscription: subscription,
      });

      const { data, error } = await authClient.subscription.cancel({
        subscriptionId: subscription.id, // ✅ Utiliser l'id interne Better Auth
        referenceId: sessionData.session.activeOrganizationId,
        returnUrl: `${window.location.origin}/dashboard/subscribe?cancel_success=true`,
      });

      if (error) {
        console.error(
          "Erreur lors de la résiliation:",
          error,
          JSON.stringify(error, null, 2)
        );
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
    const prices = {
      freelance: 14.59,
      pme: 48.99,
      entreprise: 94.99,
      pro: 17.99, // Legacy
    };
    return prices[subscription?.plan] || 0;
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
      limits: {
        users: 1,
        workspaces: 1,
      },
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
        "1 workspace inclus",
        "Toutes les fonctionnalités Freelance",
        "Connexion comptes bancaires",
        "Gestion de trésorerie",
        "Transfert de fichiers sécurisé",
      ],
      limits: {
        users: 10,
        workspaces: 1,
      },
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
        "1 workspace inclus",
        "Toutes les fonctionnalités PME",
        "Support prioritaire",
        "Rapports avancés",
        "API access",
      ],
      limits: {
        users: 25,
        workspaces: 1,
      },
      current: subscription?.plan === "entreprise",
      planKey: "entreprise",
      featured: false,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Titre */}
      <div>
        <h2 className="text-lg font-medium mb-1">
          {isActive() ? "Gestion de l'abonnement" : "Abonnement"}
        </h2>
        <Separator className="hidden md:block" />

        {/* Message de permission */}
        {!canManageSubscription && (
          <div className="mt-4">
            <Callout type="warning" noMargin>
              <p>
                Seul le <strong>propriétaire</strong> de l'organisation peut
                gérer l'abonnement (changement de plan, résiliation).
              </p>
            </Callout>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Section Forfait actif - Version compacte et épurée */}
        {isActive() && subscription && (
          <div
            className={`flex items-center justify-between py-2 px-3 rounded-md border ${
              subscription.cancelAtPeriodEnd
                ? "bg-orange-50/50 dark:bg-orange-950/10 border-orange-200 dark:border-orange-900/30"
                : "bg-gray-50/50 dark:bg-[#252525]/30 border-gray-100 dark:border-[#313131]/50"
            }`}
          >
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium">
                  {subscription?.plan === "freelance"
                    ? "Pack Freelance"
                    : subscription?.plan === "pme"
                      ? "Pack PME"
                      : subscription?.plan === "entreprise"
                        ? "Pack Entreprise"
                        : "Pack Pro"}
                </h3>
                {subscription.cancelAtPeriodEnd ||
                subscription.status === "canceled" ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4 border-orange-400 text-orange-600 dark:border-orange-600 dark:text-orange-400"
                  >
                    Résilié
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4 border-[#5b50fe] text-[#5b50fe]"
                  >
                    Actuel
                  </Badge>
                )}
              </div>
              <span className="text-xs text-gray-500">•</span>
              <p className="text-xs text-gray-500">
                {formatPrice(getSubscriptionPrice())} TTC / mois
                {subscription.status === "trialing" && " (Essai)"}
              </p>
              <span className="text-xs text-gray-500 hidden md:inline">•</span>
              <p className="text-xs text-gray-400 hidden md:block">
                {subscription.cancelAtPeriodEnd ||
                subscription.status === "canceled"
                  ? `Accès aux outils Pro jusqu'au ${formatDate(subscription.periodEnd)}`
                  : `Prochain prélèvement : ${formatDate(subscription.periodEnd)}`}
              </p>
            </div>
            {!subscription.cancelAtPeriodEnd &&
              subscription.status !== "canceled" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={openCancelModal}
                  disabled={isLoading || !canManageSubscription}
                  title={
                    !canManageSubscription
                      ? "Seul le propriétaire peut résilier l'abonnement"
                      : ""
                  }
                >
                  {isLoading ? (
                    <LoaderCircle className="h-3 w-3 animate-spin" />
                  ) : (
                    "Résilier"
                  )}
                </Button>
              )}
          </div>
        )}

        {/* Section Utilisation des sièges */}
        {isActive() && seatsInfo && (
          <div
            className={`py-3 px-4 rounded-md border ${
              seatsInfo.additionalSeats > 0
                ? "bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/30"
                : "bg-gray-50/50 dark:bg-[#252525]/30 border-gray-100 dark:border-[#313131]/50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4
                    className={`text-sm font-medium ${
                      seatsInfo.additionalSeats > 0
                        ? "text-blue-900 dark:text-blue-100"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {seatsInfo.additionalSeats > 0
                      ? "Sièges additionnels"
                      : "Utilisation des sièges"}
                  </h4>
                  {seatsInfo.additionalSeats > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300"
                    >
                      {seatsInfo.additionalSeats} siège
                      {seatsInfo.additionalSeats > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                <p
                  className={`text-xs mb-2 ${
                    seatsInfo.additionalSeats > 0
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Vous utilisez actuellement{" "}
                  <strong>
                    {seatsInfo.currentMembers} membre
                    {seatsInfo.currentMembers > 1 ? "s" : ""}
                  </strong>{" "}
                  sur les <strong>{seatsInfo.includedSeats} inclus</strong> dans
                  votre plan {seatsInfo.plan}.
                  {seatsInfo.availableSeats > 0 && (
                    <>
                      {" "}
                      Il vous reste{" "}
                      <strong>
                        {seatsInfo.availableSeats} siège
                        {seatsInfo.availableSeats > 1 ? "s" : ""} disponible
                        {seatsInfo.availableSeats > 1 ? "s" : ""}
                      </strong>
                      .
                    </>
                  )}
                </p>
                {seatsInfo.additionalSeats > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-blue-600 dark:text-blue-400">
                      Coût additionnel :{" "}
                      <strong>
                        {(
                          seatsInfo.additionalSeats * seatsInfo.seatCost
                        ).toFixed(2)}{" "}
                        €/mois
                      </strong>
                    </span>
                    <span className="text-blue-500">•</span>
                    <span className="text-blue-600/70 dark:text-blue-400/70">
                      {seatsInfo.seatCost} € par siège supplémentaire
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Alerte si proche de la limite */}
        {isActive() &&
          seatsInfo &&
          seatsInfo.availableSeats > 0 &&
          seatsInfo.availableSeats <= 2 && (
            <Callout type="warning" noMargin>
              <p className="text-xs">
                <strong>Attention !</strong> Il ne vous reste que{" "}
                <strong>
                  {seatsInfo.availableSeats} siège
                  {seatsInfo.availableSeats > 1 ? "s" : ""} disponible
                  {seatsInfo.availableSeats > 1 ? "s" : ""}
                </strong>
                . Au-delà, chaque membre supplémentaire sera facturé{" "}
                <strong>7,49€/mois</strong>.
              </p>
            </Callout>
          )}

        {/* Section Comparaison des forfaits */}
        <div>
          <div className="text-center mb-4 mt-8">
            <h3 className="text-xl font-semibold mb-1">
              Choisissez le plan qui vous convient
            </h3>
            <p className="text-muted-foreground mb-3 text-xs">
              Sélectionnez l'offre adaptée à vos besoins
            </p>

            {/* Switch Mensuel/Annuel */}
            <div className="inline-flex items-center gap-2 bg-muted p-0.5 rounded-lg mb-4">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`flex flex-col rounded-lg border p-4 text-left ${
                  plan.featured
                    ? "border-[#5b50fe] shadow-lg ring-1 ring-[#5b50fe]/10 relative"
                    : "border-gray-200 dark:border-[#313131]/90"
                } dark:bg-[#252525]`}
              >
                {/* Header de la carte */}
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
                <div className="my-3 border-t border-gray-200 dark:border-[#313131]/90" />

                {/* Liste des fonctionnalités - Afficher seulement 3 + tooltip */}
                <ul className="space-y-2 mb-4 flex-grow">
                  {plan.features.slice(0, 3).map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-center text-xs"
                    >
                      <CircleCheck className="mr-2 h-4 w-4 text-[#5b50fe] flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="flex items-center text-xs">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="flex items-center text-[#5b50fe] hover:text-[#4a3fe8] transition-colors">
                              <CircleCheck className="mr-2 h-4 w-4 flex-shrink-0" />
                              <span className="font-medium">
                                Et {plan.features.length - 3} autres...
                              </span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs p-3">
                            <ul className="space-y-1.5">
                              {plan.features.slice(3).map((feature, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start text-xs"
                                >
                                  <CircleCheck className="mr-2 h-3 w-3 text-[#5b50fe] flex-shrink-0 mt-0.5" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </li>
                  )}
                </ul>

                {/* Boutons selon le plan */}
                <div className="mt-auto pt-6">
                  {!plan.current && (
                    <Button
                      size="sm"
                      className={`w-full ${
                        plan.featured
                          ? "bg-[#5b50fe] hover:bg-[#4a3fe8]"
                          : "bg-secondary hover:bg-secondary/80"
                      }`}
                      variant={plan.featured ? "default" : "secondary"}
                      onClick={() => handleUpgrade(plan.planKey)}
                      disabled={isLoading || !canManageSubscription}
                      title={
                        !canManageSubscription
                          ? "Seul le propriétaire peut changer d'abonnement"
                          : ""
                      }
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
                      variant="outline"
                      className="w-full"
                      disabled
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Plan actuel
                    </Button>
                  )}
                </div>
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

      {/* Modal de confirmation de changement de plan - Style Qonto */}
      <Dialog
        open={showPlanChangeModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowPlanChangeModal(false);
            setPlanChangePreview(null);
            setSelectedPlan(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-16">
              <LoaderCircle className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : planChangePreview ? (
            <>
              {/* Header */}
              <div className="px-6 pt-6 pb-4">
                <DialogTitle className="text-base font-medium text-gray-900 dark:text-gray-100">
                  Modifier votre abonnement
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Vérifiez les détails avant de confirmer
                </DialogDescription>
              </div>

              {/* Contenu */}
              <div className="px-6 pb-6 space-y-4">
                {/* Changement de plan */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Plan actuel
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {planChangePreview.currentPlan.displayName}
                      </span>
                    </div>
                    <div className="text-gray-300 dark:text-gray-600">→</div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Nouveau plan
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {planChangePreview.newPlan.displayName}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      planChangePreview.change.isUpgrade
                        ? "border-green-200 text-green-700 dark:border-green-800 dark:text-green-400"
                        : "border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-400"
                    }`}
                  >
                    {planChangePreview.change.isUpgrade
                      ? "Upgrade"
                      : "Downgrade"}
                  </Badge>
                </div>

                {/* Détails de facturation */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Tarif mensuel
                    </span>
                    <div className="text-right">
                      <span className="text-sm text-gray-400 line-through mr-2">
                        {planChangePreview.currentPlan.price.toFixed(2)} €
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {planChangePreview.newPlan.price.toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Cycle de facturation
                    </span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {planChangePreview.billing.billingCycle}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Prise d'effet
                    </span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {planChangePreview.change.effectiveDate}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Prochaine facturation
                    </span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {planChangePreview.billing.nextBillingDate}
                    </span>
                  </div>
                </div>

                {/* Prorata */}
                {planChangePreview.proration && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Ajustement au prorata
                      </span>
                      <span className={`text-sm font-medium`}>
                        {planChangePreview.proration.prorationAmount >= 0
                          ? "+"
                          : ""}
                        {planChangePreview.proration.prorationAmount.toFixed(2)}{" "}
                        €
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {planChangePreview.proration.prorationAmount >= 0
                        ? "Ce montant sera ajouté à votre prochaine facture"
                        : "Ce crédit sera déduit de votre prochaine facture"}
                    </p>
                  </div>
                )}

                {/* Comparaison des limites */}
                <div className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Limites du plan
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    <div className="flex justify-between items-center px-4 py-2.5">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Utilisateurs
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                          {planChangePreview.currentPlan.limits.users}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">
                          →
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {planChangePreview.newPlan.limits.users}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2.5">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Comptes bancaires
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                          {planChangePreview.currentPlan.limits.bankAccounts}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">
                          →
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {planChangePreview.newPlan.limits.bankAccounts}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alerte downgrade si trop de membres */}
                {planChangePreview.change.memberCheck &&
                  !planChangePreview.change.memberCheck.canDowngrade && (
                    <div className="space-y-3">
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                              Action requise avant le changement
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                              Vous avez{" "}
                              {
                                planChangePreview.change.memberCheck
                                  .currentMembers
                              }{" "}
                              membres mais le plan{" "}
                              {planChangePreview.newPlan.displayName} est limité
                              à {planChangePreview.change.memberCheck.newLimit}.
                              Retirez{" "}
                              {
                                planChangePreview.change.memberCheck
                                  .membersToRemove
                              }{" "}
                              membre(s) pour continuer.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Liste des membres à retirer */}
                      {planChangePreview.change.memberCheck.membersList &&
                        planChangePreview.change.memberCheck.membersList
                          .length > 0 && (
                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                Membres suggérés à retirer (
                                {
                                  planChangePreview.change.memberCheck
                                    .membersToRemove
                                }
                                )
                              </span>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-40 overflow-y-auto">
                              {planChangePreview.change.memberCheck.membersList.map(
                                (member) => (
                                  <div
                                    key={member.id}
                                    className="flex items-center justify-between px-4 py-2.5"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                          {member.name
                                            ?.charAt(0)
                                            ?.toUpperCase() || "?"}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                          {member.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {member.email}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className="text-xs capitalize"
                                    >
                                      {member.role}
                                    </Badge>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Bouton vers gestion des membres */}
                      <Button
                        variant="outline"
                        className="w-full text-sm"
                        onClick={() => {
                          setShowPlanChangeModal(false);
                          window.location.href =
                            "/dashboard/settings?tab=access";
                        }}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Gérer les membres de l'équipe
                      </Button>
                    </div>
                  )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPlanChangeModal(false);
                    setPlanChangePreview(null);
                    setSelectedPlan(null);
                  }}
                  disabled={isLoading}
                  className="text-sm"
                >
                  Annuler
                </Button>
                <Button
                  onClick={confirmPlanChange}
                  disabled={
                    isLoading ||
                    (planChangePreview.change.memberCheck &&
                      !planChangePreview.change.memberCheck.canDowngrade)
                  }
                  className="text-sm bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  {isLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Modification...
                    </>
                  ) : (
                    "Confirmer le changement"
                  )}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
