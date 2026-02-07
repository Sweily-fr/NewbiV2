"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { Switch } from "@/src/components/ui/switch";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  LoaderCircle,
  Check,
  AlertTriangle,
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
    features: [
      "Jusqu'à 25 utilisateurs",
      "Tout le plan PME",
      "5 comptes bancaires",
      "25 signatures email",
      "Accès API",
      "Support dédié",
    ],
  },
];

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
        // Gérer les états bloqués (past_due, unpaid, etc.)
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
        // Afficher le succès
        toast.success(data.message || "Plan changé avec succès !");

        // Afficher les warnings éventuels
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
        // Gérer les différents cas d'erreur
        if (data.requireNewPreview) {
          // Les données ont changé, rafraîchir la prévisualisation
          toast.error(data.message || "Les données ont changé, veuillez recharger");
          setPlanChangePreview(null);
          setShowPlanChangeModal(false);
          // Rouvrir automatiquement le modal avec les nouvelles données
          setTimeout(() => {
            openPlanChangeModal(selectedPlan);
          }, 500);
        } else if (data.subscriptionStatus) {
          // État bloqué de l'abonnement
          toast.error(data.message || "Votre abonnement présente un problème");
        } else if (data.paidSeats > 0) {
          // Sièges payants bloquants
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-medium">Abonnement</h3>
        <Separator className="hidden md:block" />
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

      {/* Toggle Mensuel/Annuel */}
      <div className="flex items-center justify-center gap-3">
        <span className={cn(
          "text-sm",
          !isAnnual ? "text-foreground font-medium" : "text-muted-foreground"
        )}>
          Mensuel
        </span>
        <Switch
          checked={isAnnual}
          onCheckedChange={setIsAnnual}
        />
        <span className={cn(
          "text-sm",
          isAnnual ? "text-foreground font-medium" : "text-muted-foreground"
        )}>
          Annuel
          <span className="ml-1.5 text-xs text-[#5b50fe]">-10%</span>
        </span>
      </div>

      {/* Grille des plans */}
      <Card className="shadow-none">
        <CardContent className="p-0 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
          {PLANS_CONFIG.map((plan) => {
            const isCurrentPlan = subscription?.plan === plan.key;
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.key}
                className={cn(
                  "flex flex-col gap-6 p-5",
                  plan.popular && "bg-muted/50 md:rounded-none first:rounded-t-xl last:rounded-b-xl md:first:rounded-l-xl md:last:rounded-r-xl md:first:rounded-tr-none md:last:rounded-bl-none"
                )}
              >
                {/* Header du plan */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-medium">{plan.name}</h4>
                    {plan.popular && (
                      <Badge className="bg-[#5b50fe] text-white text-xs font-normal rounded-md px-2 py-0.5">
                        Populaire
                      </Badge>
                    )}
                    {isCurrentPlan && !plan.popular && (
                      <Badge variant="outline" className="text-[#5b50fe] border-[#5b50fe]/30 text-xs font-normal">
                        Actuel
                      </Badge>
                    )}
                  </div>

                  {/* Prix */}
                  <div className="flex items-baseline">
                    <span className="text-muted-foreground text-sm">€</span>
                    <span className="text-3xl font-medium tabular-nums">
                      {formatPrice(price)}
                    </span>
                    <span className="text-muted-foreground text-sm ml-1">/mois</span>
                  </div>

                  {isAnnual && (
                    <p className="text-xs text-muted-foreground -mt-2">
                      {formatPrice(plan.annualTotal)} € facturé annuellement
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="flex flex-col gap-2">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[#5b50fe] mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">{feature}</p>
                    </div>
                  ))}
                </div>

                {/* Bouton */}
                <div className="flex flex-1 items-end pt-2">
                  {isCurrentPlan ? (
                    <Button
                      variant="outline"
                      className="w-full cursor-default"
                      disabled
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Plan actuel
                    </Button>
                  ) : (
                    <Button
                      variant={plan.popular ? "default" : "secondary"}
                      className={cn(
                        "w-full cursor-pointer",
                        plan.popular && "bg-[#5b50fe] hover:bg-[#4a3fe8]"
                      )}
                      onClick={() => openPlanChangeModal(plan.key)}
                      disabled={loadingPlan === plan.key || !canManageSubscription}
                    >
                      {loadingPlan === plan.key ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        "Choisir"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

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
