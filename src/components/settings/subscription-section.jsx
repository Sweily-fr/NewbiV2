"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import {
  LoaderCircle,
  Check,
  AlertTriangle,
  Users,
  Crown,
  FileText,
  Building2,
  Sparkles,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { cn } from "@/src/lib/utils";

// Configuration des plans
const PLANS_CONFIG = [
  {
    key: "freelance",
    name: "Freelance",
    monthlyPrice: 17.99,
    annualPrice: 16.19,
    annualTotal: 157.56,
    icon: FileText,
    features: [
      "1 utilisateur inclus",
      "Facturation & Devis illimités",
      "Gestion client (CRM)",
      "20 OCR reçus par mois",
      "1 signature email",
      "Transfert fichiers 5Go",
    ],
  },
  {
    key: "pme",
    name: "PME",
    monthlyPrice: 48.99,
    annualPrice: 44.09,
    annualTotal: 529.08,
    popular: true,
    icon: Building2,
    features: [
      "Jusqu'à 10 utilisateurs",
      "Tout le plan Freelance",
      "Relances automatiques",
      "OCR illimité",
      "3 comptes bancaires",
      "10 signatures email",
    ],
  },
  {
    key: "entreprise",
    name: "Entreprise",
    monthlyPrice: 94.99,
    annualPrice: 85.49,
    annualTotal: 1025.88,
    icon: Crown,
    features: [
      "Jusqu'à 25 utilisateurs",
      "Tout le plan PME",
      "5 comptes bancaires",
      "25 signatures email",
      "Accès API",
      "Support dédié",
    ],
  },
  {
    key: "surmesure",
    name: "Sur-mesure",
    isContactOnly: true,
    icon: Sparkles,
    features: [
      "Utilisateurs illimités",
      "Tout le plan Entreprise",
      "Comptes bancaires illimités",
      "Signatures email illimitées",
      "Accès API avancé",
      "Support dédié prioritaire",
    ],
  },
];

const PLAN_ORDER = ["freelance", "pme", "entreprise", "surmesure"];

// Tableau de comparaison par catégorie
const COMPARISON_CATEGORIES = [
  {
    name: "Utilisateurs",
    features: [
      { name: "Utilisateurs inclus", values: ["1", "10", "25", "Illimité"] },
      { name: "Comptables gratuits", values: ["1", "3", "5", "Illimité"] },
      { name: "Utilisateurs supplémentaires", values: [false, "7,49 €/mois", "7,49 €/mois", "Sur devis"] },
    ],
  },
  {
    name: "Facturation",
    features: [
      { name: "Factures & Devis", values: ["Illimité", "Illimité", "Illimité", "Illimité"] },
      { name: "Relances automatiques", values: [false, true, true, true] },
      { name: "OCR reçus", values: ["20/mois", "Illimité", "Illimité", "Illimité"] },
      { name: "Avoirs", values: [true, true, true, true] },
    ],
  },
  {
    name: "Connexions",
    features: [
      { name: "Comptes bancaires", values: ["1", "3", "5", "Illimité"] },
      { name: "Gestion de trésorerie", values: [true, true, true, true] },
    ],
  },
  {
    name: "Outils",
    features: [
      { name: "Projets Kanban", values: [true, true, true, true] },
      { name: "Signatures email", values: ["1", "10", "25", "Illimité"] },
      { name: "Transfert fichiers", values: ["5 Go", "20 Go", "50 Go", "Illimité"] },
      { name: "CRM client", values: [true, true, true, true] },
      { name: "Catalogue produits", values: [true, true, true, true] },
    ],
  },
  {
    name: "Support & Sécurité",
    features: [
      { name: "Support prioritaire", values: [false, true, true, true] },
      { name: "Accès API", values: [false, false, true, true] },
    ],
  },
];

// Icône plan avec grille décorative
function PlanIcon({ icon: Icon, className }) {
  return (
    <div className={cn("relative h-10 w-10 flex items-center justify-center rounded-lg", className)}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

export function SubscriptionSection({
  canManageSubscription: canManageSubscriptionProp,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
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

  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Ouvrir la preview de changement de plan
  const openPlanChangeModal = async (planKey) => {
    if (!subscription || !subscription.stripeSubscriptionId) {
      handleDirectUpgrade(planKey);
      return;
    }

    if (subscription.plan === planKey) {
      return;
    }

    setSelectedPlan(planKey);
    setLoadingPlan(planKey);
    setIsLoadingPreview(true);
    setShowPlanChangeModal(true);

    try {
      const { data: sessionData } = await authClient.getSession();
      const activeOrgId = sessionData?.session?.activeOrganizationId;

      if (!activeOrgId) {
        toast.error("Aucune organisation active trouvée");
        setShowPlanChangeModal(false);
        setLoadingPlan(null);
        return;
      }

      const response = await fetch("/api/preview-plan-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPlan: planKey,
          isAnnual: isAnnual,
          organizationId: activeOrgId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPlanChangePreview(data.preview);
      } else {
        if (data.blockedState) {
          toast.error(data.message || "Votre abonnement présente un problème");
        } else if (data.paidSeatsBlocking) {
          toast.error(data.message || "Veuillez retirer les sièges supplémentaires d'abord");
        } else {
          toast.error(data.error || "Erreur lors de la prévisualisation");
        }
        setShowPlanChangeModal(false);
      }
    } catch (error) {
      console.error("Erreur preview:", error);
      toast.error("Erreur lors de la prévisualisation");
      setShowPlanChangeModal(false);
    } finally {
      setIsLoadingPreview(false);
      setLoadingPlan(null);
    }
  };

  // Création directe d'abonnement
  const handleDirectUpgrade = async (planKey) => {
    setLoadingPlan(planKey);
    try {
      const response = await fetch("/api/create-org-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationData: {
            name: "Existing Organization",
            type: "existing",
            planName: planKey,
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
      setLoadingPlan(null);
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
          validationToken: planChangePreview.validationToken,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || "Plan changé avec succès !");

        if (data.warnings && data.warnings.length > 0) {
          data.warnings.forEach((warning) => {
            toast.warning(warning.message, { duration: 5000 });
          });
        }

        setShowPlanChangeModal(false);

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
        if (data.requireNewPreview) {
          toast.error(data.message || "Les données ont changé, veuillez recharger");
          setPlanChangePreview(null);
          setShowPlanChangeModal(false);
          setTimeout(() => {
            openPlanChangeModal(selectedPlan);
          }, 500);
        } else if (data.subscriptionStatus) {
          toast.error(data.message || "Votre abonnement présente un problème");
        } else if (data.paidSeats > 0) {
          toast.error(data.message || "Retirez d'abord les sièges supplémentaires");
        } else {
          toast.error(
            data.error || data.message || "Erreur lors du changement de plan"
          );
        }
      }
    } catch (error) {
      toast.error(`Erreur: ${error.message || "Erreur inconnue"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion de la résiliation
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

      const { data, error } = await authClient.subscription.cancel({
        subscriptionId: subscription.id,
        referenceId: sessionData.session.activeOrganizationId,
        returnUrl: `${window.location.origin}/dashboard`,
      });

      if (error) {
        toast.error(
          `Erreur lors de la résiliation: ${error.message || "Erreur inconnue"}`
        );
        return;
      }

      setShowCancelDialog(false);

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error("Erreur lors de la résiliation");
    } finally {
      setIsLoading(false);
    }
  };

  // Formater le prix
  const formatPrice = (amount) => {
    return amount.toFixed(2).replace(".", ",");
  };

  // Helpers
  const currentPlanConfig = PLANS_CONFIG.find((p) => p.key === subscription?.plan);
  const currentPlanIndex = PLAN_ORDER.indexOf(subscription?.plan);

  const getButtonLabel = (planKey) => {
    if (!subscription?.plan) return "Choisir";
    if (planKey === subscription.plan) return "Plan actuel";
    const targetIndex = PLAN_ORDER.indexOf(planKey);
    if (targetIndex < currentPlanIndex) return "Downgrade";
    return "Choisir";
  };

  const getButtonVariant = (plan) => {
    if (plan.key === subscription?.plan) return "outline";
    if (plan.popular) return "default";
    return "outline";
  };

  const trialDaysRemaining = () => {
    if (subscription?.status !== "trialing" || !subscription?.trialEnd) return null;
    const now = new Date();
    const end = new Date(subscription.trialEnd);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="hidden md:flex flex-col gap-1">
        <h3 className="text-lg font-medium">Abonnement</h3>
        <Separator />
      </div>

      {/* Message de permission */}
      {!canManageSubscription && (
        <Callout type="warning" noMargin>
          <p>
            Seul le <strong>propriétaire</strong> de l'organisation peut
            gérer l'abonnement.
          </p>
        </Callout>
      )}

      {/* Info abonnement actuel si résilié */}
      {isActive() && subscription && (subscription.cancelAtPeriodEnd || subscription.status === "canceled") && (
        <Callout type="warning" noMargin>
          <p>
            Votre abonnement est résilié. Vous conservez l'accès jusqu'au{" "}
            <strong>{formatDate(subscription.periodEnd)}</strong>.
          </p>
        </Callout>
      )}

      {/* Sièges supplémentaires */}
      {seatsInfo && seatsInfo.additionalSeats > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/10 p-3">
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-blue-600" />
            <p className="text-sm">
              <span className="font-medium">{seatsInfo.additionalSeats} siège{seatsInfo.additionalSeats > 1 ? "s" : ""} supplémentaire{seatsInfo.additionalSeats > 1 ? "s" : ""}</span>
              <span className="text-muted-foreground"> · 7,49 €/siège/mois</span>
            </p>
          </div>
          <p className="text-sm font-medium text-blue-600">
            +{formatPrice(seatsInfo.additionalSeats * 7.49)} €/mois
          </p>
        </div>
      )}

      {/* ===================== SECTION 1: Carte du plan actif ===================== */}
      {isActive() && subscription && currentPlanConfig && (
        <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] p-5 flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-normal text-black/40 dark:text-white/40 border-black/[0.08] dark:border-white/[0.08]">
                Actuel
              </Badge>
              {subscription.status === "trialing" && (
                <Badge className="text-[10px] font-normal bg-[#5A50FF]/10 text-[#5A50FF] dark:bg-[#8b7fff]/10 dark:text-[#8b7fff] border-0">
                  Essai
                </Badge>
              )}
            </div>
            <h4 className="text-xl font-semibold text-[#242529] dark:text-white">
              {currentPlanConfig.name}
            </h4>
            {trialDaysRemaining() && (
              <p className="text-sm text-black/40 dark:text-white/40">
                {trialDaysRemaining()} jours restants d'essai
              </p>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-black/55 dark:text-white/55">
                {formatPrice(isAnnual ? currentPlanConfig.annualPrice : currentPlanConfig.monthlyPrice)} €/mois
              </span>
              {!isAnnual && currentPlanConfig.annualPrice && (
                <button
                  onClick={() => setIsAnnual(true)}
                  className="text-sm text-[#5A50FF] dark:text-[#8b7fff] hover:underline cursor-pointer"
                >
                  Passer en annuel (Économisez 10%)
                </button>
              )}
            </div>
          </div>
          <div className="hidden sm:flex">
            <PlanIcon
              icon={currentPlanConfig.icon}
              className="bg-[#5A50FF]/10 text-[#5A50FF] dark:bg-[#8b7fff]/10 dark:text-[#8b7fff]"
            />
          </div>
        </div>
      )}

      {/* ===================== SECTION 2: Comparer les plans ===================== */}
      <div className="space-y-5">
        {/* Titre + Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[#242529] dark:text-white">
              Comparer les plans
            </h3>
            <p className="text-sm text-black/55 dark:text-white/55">
              Trouvez le plan adapté à vos besoins
            </p>
          </div>

          {/* Toggle Annuel/Mensuel */}
          <div className="flex items-center bg-black/[0.04] dark:bg-white/[0.06] rounded-full p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full transition-all cursor-pointer",
                !isAnnual
                  ? "bg-white dark:bg-white/10 shadow-sm text-[#242529] dark:text-white"
                  : "text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60"
              )}
            >
              Mensuel
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full transition-all flex items-center gap-1.5 cursor-pointer",
                isAnnual
                  ? "bg-white dark:bg-white/10 shadow-sm text-[#242529] dark:text-white"
                  : "text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60"
              )}
            >
              Annuel
              <span className="text-[10px] font-semibold bg-[#5A50FF]/10 text-[#5A50FF] dark:bg-[#8b7fff]/10 dark:text-[#8b7fff] px-1.5 py-0.5 rounded-full">
                -10%
              </span>
            </button>
          </div>
        </div>

        {/* Grille des 4 plans */}
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="grid grid-cols-4 gap-0 min-w-[640px] rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
            {PLANS_CONFIG.map((plan) => {
              const isCurrentPlan = subscription?.plan === plan.key;
              const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;

              return (
                <div
                  key={plan.key}
                  className={cn(
                    "flex flex-col p-5 border-r border-black/[0.06] dark:border-white/[0.06] last:border-r-0",
                    isCurrentPlan && "border-[#5A50FF]/30 dark:border-[#8b7fff]/30 bg-[#5A50FF]/[0.02] dark:bg-[#8b7fff]/[0.02]"
                  )}
                >
                  {/* Nom du plan */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-[#242529] dark:text-white">
                      {plan.name}
                    </span>
                    {plan.popular && (
                      <span className="text-[10px] font-semibold text-[#864AFF] dark:text-[#a47bff]">
                        Populaire
                      </span>
                    )}
                  </div>

                  {/* Prix */}
                  {plan.isContactOnly ? (
                    <div className="mb-1">
                      <span className="text-2xl font-semibold text-[#242529] dark:text-white">Sur devis</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-0.5 mb-1">
                      <span className="text-2xl font-semibold text-[#242529] dark:text-white">
                        {formatPrice(price)} €
                      </span>
                      <span className="text-sm text-black/40 dark:text-white/40">/mois</span>
                    </div>
                  )}

                  {/* Sous-texte */}
                  <p className="text-xs text-black/40 dark:text-white/40 mb-5">
                    {plan.isContactOnly
                      ? "Adapté à vos besoins"
                      : isAnnual
                        ? "par utilisateur, facturé annuellement"
                        : "par utilisateur, facturé mensuellement"}
                  </p>

                  {/* Bouton */}
                  {plan.isContactOnly ? (
                    <Button
                      variant="outline"
                      className="w-full cursor-pointer border-black/[0.08] dark:border-white/[0.08]"
                      asChild
                    >
                      <a href="mailto:contact@newbi.fr">Nous contacter</a>
                    </Button>
                  ) : isCurrentPlan ? (
                    <Button
                      variant="outline"
                      className="w-full cursor-default border-black/[0.08] dark:border-white/[0.08]"
                      disabled
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Plan actuel
                    </Button>
                  ) : (
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className={cn(
                        "w-full cursor-pointer",
                        plan.popular && "bg-[#5A50FF] hover:bg-[#4a3fe8] text-white",
                        !plan.popular && "border-black/[0.08] dark:border-white/[0.08]"
                      )}
                      onClick={() => openPlanChangeModal(plan.key)}
                      disabled={loadingPlan === plan.key || !canManageSubscription}
                    >
                      {loadingPlan === plan.key ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        getButtonLabel(plan.key)
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ===================== SECTION 3: Tableau comparatif ===================== */}
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="min-w-[640px]">
            {COMPARISON_CATEGORIES.map((category, catIdx) => (
              <div key={category.name}>
                {/* En-tête de catégorie */}
                <div className="grid grid-cols-[1fr_repeat(4,minmax(120px,1fr))] border-b border-black/[0.06] dark:border-white/[0.06]">
                  <div className="py-3 px-3 sticky left-0 bg-white dark:bg-[#09090b] z-10">
                    <span className="text-xs font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                      {category.name}
                    </span>
                  </div>
                  {catIdx === 0 ? (
                    PLANS_CONFIG.map((plan) => (
                      <div
                        key={plan.key}
                        className={cn(
                          "py-3 px-3 text-center",
                          subscription?.plan === plan.key && "bg-[#5A50FF]/[0.02] dark:bg-[#8b7fff]/[0.02]"
                        )}
                      >
                        <span className="text-xs font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                          {plan.name}
                        </span>
                      </div>
                    ))
                  ) : (
                    PLANS_CONFIG.map((plan) => (
                      <div
                        key={plan.key}
                        className={cn(
                          "py-3 px-3",
                          subscription?.plan === plan.key && "bg-[#5A50FF]/[0.02] dark:bg-[#8b7fff]/[0.02]"
                        )}
                      />
                    ))
                  )}
                </div>

                {/* Features de la catégorie */}
                {category.features.map((feature, featureIdx) => (
                  <div
                    key={feature.name}
                    className={cn(
                      "grid grid-cols-[1fr_repeat(4,minmax(120px,1fr))] border-b border-black/[0.04] dark:border-white/[0.04] transition-colors hover:bg-black/[0.01] dark:hover:bg-white/[0.01]",
                    )}
                  >
                    {/* Nom de la feature */}
                    <div className="py-2.5 px-3 sticky left-0 bg-white dark:bg-[#09090b] z-10">
                      <span className="text-sm text-[#505154] dark:text-white/70">
                        {feature.name}
                      </span>
                    </div>

                    {/* Valeurs par plan */}
                    {feature.values.map((value, valIdx) => {
                      const planKey = PLAN_ORDER[valIdx];
                      const isCurrent = subscription?.plan === planKey;

                      return (
                        <div
                          key={valIdx}
                          className={cn(
                            "py-2.5 px-3 flex items-center justify-center",
                            isCurrent && "bg-[#5A50FF]/[0.02] dark:bg-[#8b7fff]/[0.02]"
                          )}
                        >
                          {value === true ? (
                            <svg className="h-4 w-4 text-[#5A50FF] dark:text-[#8b7fff]" viewBox="0 0 16 16" fill="none">
                              <path d="M13.25 4.75L6 12 2.75 8.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : value === false ? (
                            <span className="text-black/20 dark:text-white/20">—</span>
                          ) : (
                            <span className="text-sm text-[#505154] dark:text-white/70">{value}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bouton de résiliation */}
      {isActive() && subscription && !subscription.cancelAtPeriodEnd && subscription.status !== "canceled" && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCancelDialog(true)}
            disabled={!canManageSubscription || isLoading}
            className="text-xs text-muted-foreground hover:text-red-600 cursor-pointer"
          >
            Résilier l'abonnement
          </Button>
        </div>
      )}

      {/* Dialog de confirmation de résiliation */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Résilier l'abonnement
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir résilier votre abonnement ? Vous conserverez
              l'accès jusqu'au {formatDate(subscription?.periodEnd)}.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="bg-muted rounded-lg p-4 my-2">
            <p className="text-sm font-medium mb-2">Vous perdrez l'accès à :</p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="text-red-500 text-xs">✕</span>
                Facturation complète
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500 text-xs">✕</span>
                Connexion comptes bancaires
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500 text-xs">✕</span>
                OCR des reçus
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500 text-xs">✕</span>
                Gestion client avancée
              </li>
            </ul>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancellation}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 cursor-pointer"
            >
              {isLoading && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de changement de plan */}
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
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-16">
              <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : planChangePreview ? (
            <>
              <div className="px-6 pt-6 pb-4">
                <DialogTitle className="text-base font-medium">
                  Confirmer le changement
                </DialogTitle>
              </div>

              <div className="px-6 pb-6 space-y-4">
                {/* Changement de plan */}
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {planChangePreview.currentPlan.displayName}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">
                      {planChangePreview.newPlan.displayName}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-normal",
                      planChangePreview.change.isUpgrade
                        ? "border-green-200 text-green-600"
                        : "border-orange-200 text-orange-700"
                    )}
                  >
                    {planChangePreview.change.isUpgrade ? "Upgrade" : "Downgrade"}
                  </Badge>
                </div>

                {/* Détails */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nouveau tarif</span>
                    <span className="font-medium">
                      {formatPrice(planChangePreview.newPlan.price)} €/mois
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prise d'effet</span>
                    <span>{planChangePreview.change.effectiveDate}</span>
                  </div>
                </div>

                {/* Prorata */}
                {planChangePreview.proration && (
                  <div className={cn(
                    "rounded-lg p-3 text-sm",
                    planChangePreview.proration.isCredit
                      ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                      : "bg-muted"
                  )}>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        {planChangePreview.proration.isCredit ? "Crédit sur prochaine facture" : "Ajustement prorata"}
                      </span>
                      <span className={cn(
                        "font-medium",
                        planChangePreview.proration.isCredit && "text-green-600"
                      )}>
                        {planChangePreview.proration.prorationAmount >= 0 ? "+" : ""}
                        {formatPrice(planChangePreview.proration.prorationAmount)} €
                      </span>
                    </div>
                    {planChangePreview.proration.message && (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {planChangePreview.proration.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Alerte downgrade - membres */}
                {planChangePreview.change.memberCheck &&
                  !planChangePreview.change.memberCheck.canDowngrade && (
                    <Callout type="warning" noMargin>
                      <p className="text-sm">
                        {planChangePreview.change.memberCheck.pendingInvitations > 0 ? (
                          <>
                            Vous avez {planChangePreview.change.memberCheck.currentMembers} membre(s) actif(s) et{" "}
                            {planChangePreview.change.memberCheck.pendingInvitations} invitation(s) en attente,
                            soit {planChangePreview.change.memberCheck.totalAfterPending} au total.
                            Le plan est limité à {planChangePreview.change.memberCheck.newLimit}.
                            Retirez des membres ou annulez des invitations d'abord.
                          </>
                        ) : (
                          <>
                            Vous avez {planChangePreview.change.memberCheck.currentMembers} membres
                            mais ce plan est limité à {planChangePreview.change.memberCheck.newLimit}.
                            Retirez {planChangePreview.change.memberCheck.membersToRemove} membre(s) d'abord.
                          </>
                        )}
                      </p>
                    </Callout>
                  )}

                {/* Alerte sièges payants */}
                {planChangePreview.change.paidSeats > 0 && planChangePreview.change.isDowngrade && (
                  <Callout type="warning" noMargin>
                    <p className="text-sm">
                      Vous avez {planChangePreview.change.paidSeats} siège(s) supplémentaire(s) payant(s).
                      Retirez-les dans la section "Espaces" avant de changer de plan.
                    </p>
                  </Callout>
                )}
              </div>

              <div className="px-6 py-4 bg-muted/50 border-t flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPlanChangeModal(false);
                    setPlanChangePreview(null);
                    setSelectedPlan(null);
                  }}
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  Annuler
                </Button>
                <Button
                  onClick={confirmPlanChange}
                  disabled={
                    isLoading ||
                    (planChangePreview.change.memberCheck &&
                      !planChangePreview.change.memberCheck.canDowngrade) ||
                    (planChangePreview.change.paidSeats > 0 && planChangePreview.change.isDowngrade)
                  }
                  className="bg-[#5b50fe] hover:bg-[#4a3fe8] cursor-pointer"
                >
                  {isLoading && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                  Confirmer
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
