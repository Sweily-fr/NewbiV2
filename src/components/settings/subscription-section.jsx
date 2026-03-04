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
  X,
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
    description: "Parfait pour les indépendants et freelances",
    features: {
      users: "1 utilisateur",
      accountants: "1 comptable",
      extraUsers: false,
      invoicing: true,
      autoReminders: false,
      ocr: "20 reçus/mois",
      bankAccounts: "1 compte",
      cashFlow: true,
      projects: true,
      signatures: "1 signature",
      fileTransfer: "5 Go",
      crm: true,
      catalog: true,
      prioritySupport: false,
      api: false,
    },
  },
  {
    key: "pme",
    name: "PME",
    monthlyPrice: 48.99,
    annualPrice: 44.09,
    annualTotal: 529.08,
    popular: true,
    description: "Idéal pour les petites et moyennes entreprises",
    features: {
      users: "Jusqu'à 10",
      accountants: "3 comptables",
      extraUsers: "7,49 €/utilisateur",
      invoicing: true,
      autoReminders: true,
      ocr: "Illimité",
      bankAccounts: "3 comptes",
      cashFlow: true,
      projects: true,
      signatures: "10 signatures",
      fileTransfer: "15 Go",
      crm: true,
      catalog: true,
      prioritySupport: true,
      api: true,
    },
  },
  {
    key: "entreprise",
    name: "Entreprise",
    monthlyPrice: 94.99,
    annualPrice: 85.49,
    annualTotal: 1025.88,
    description: "Pour les grandes structures avec des besoins avancés",
    features: {
      users: "Jusqu'à 25",
      accountants: "5 comptables",
      extraUsers: "7,49 €/utilisateur",
      invoicing: true,
      autoReminders: true,
      ocr: "Illimité",
      bankAccounts: "5 comptes",
      cashFlow: true,
      projects: true,
      signatures: "25 signatures",
      fileTransfer: "15 Go",
      crm: true,
      catalog: true,
      prioritySupport: true,
      api: true,
    },
  },
];

const COMPARISON_ROWS = [
  { key: "users", label: "Utilisateurs" },
  { key: "accountants", label: "Comptable gratuit" },
  { key: "extraUsers", label: "Utilisateurs supplémentaires" },
  { key: "invoicing", label: "Facturation & Devis" },
  { key: "autoReminders", label: "Relances automatiques" },
  { key: "ocr", label: "OCR des reçus" },
  { key: "bankAccounts", label: "Connexion bancaire" },
  { key: "cashFlow", label: "Gestion de trésorerie" },
  { key: "projects", label: "Gestion des projets" },
  { key: "signatures", label: "Signatures email" },
  { key: "fileTransfer", label: "Transfert de fichier" },
  { key: "crm", label: "CRM client" },
  { key: "catalog", label: "Catalogue" },
  { key: "prioritySupport", label: "Support prioritaire" },
  { key: "api", label: "Accès API" },
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
  const [cancelConfirmText, setCancelConfirmText] = useState("");

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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || date.getFullYear() < 2000) return "N/A";
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getDaysRemaining = () => {
    if (!subscription?.periodEnd) return 0;
    const now = new Date();
    const end = new Date(subscription.periodEnd);
    return Math.max(0, Math.ceil((end - now) / 86400000));
  };

  // Ouvrir la preview de changement de plan
  const openPlanChangeModal = async (planKey) => {
    if (!subscription || !subscription.stripeSubscriptionId) {
      handleDirectUpgrade(planKey);
      return;
    }
    if (subscription.plan === planKey) return;

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
        }
        setTimeout(() => { window.location.reload(); }, 800);
      } else {
        if (data.requireNewPreview) {
          toast.error(data.message || "Les données ont changé, veuillez recharger");
          setPlanChangePreview(null);
          setShowPlanChangeModal(false);
          setTimeout(() => { openPlanChangeModal(selectedPlan); }, 500);
        } else if (data.subscriptionStatus) {
          toast.error(data.message || "Votre abonnement présente un problème");
        } else if (data.paidSeats > 0) {
          toast.error(data.message || "Retirez d'abord les sièges supplémentaires");
        } else {
          toast.error(data.error || data.message || "Erreur lors du changement de plan");
        }
      }
    } catch (error) {
      toast.error(`Erreur: ${error.message || "Erreur inconnue"}`);
    } finally {
      setIsLoading(false);
    }
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
      const { data, error } = await authClient.subscription.cancel({
        subscriptionId: subscription.id,
        referenceId: sessionData.session.activeOrganizationId,
        returnUrl: `${window.location.origin}/dashboard`,
      });
      if (error) {
        toast.error(`Erreur lors de la résiliation: ${error.message || "Erreur inconnue"}`);
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

  const formatPrice = (amount) => {
    return amount.toFixed(2).replace(".", ",");
  };

  const currentPlanConfig = PLANS_CONFIG.find((p) => p.key === subscription?.plan);
  const currentPlanIndex = PLANS_CONFIG.findIndex((p) => p.key === subscription?.plan);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium mb-1 hidden md:block">Abonnement</h2>
        <p className="text-sm text-muted-foreground mb-4 hidden md:block">
          Choisissez le plan adapté à vos besoins.
        </p>
        <Separator className="hidden md:block bg-[#eeeff1] dark:bg-[#232323]" />
      </div>

      {/* Permission warning */}
      {!canManageSubscription && (
        <Callout type="warning" noMargin>
          <p>
            Seul le <strong>propriétaire</strong> de l'organisation peut
            gérer l'abonnement.
          </p>
        </Callout>
      )}

      {/* Cancelled info */}
      {isActive() && subscription && (subscription.cancelAtPeriodEnd || subscription.status === "canceled") && (
        <Callout type="warning" noMargin>
          <p>
            Votre abonnement est résilié. Vous conservez l'accès jusqu'au{" "}
            <strong>{formatDate(subscription.periodEnd)}</strong>.
          </p>
        </Callout>
      )}

      {/* Current Plan Card */}
      {isActive() && subscription && currentPlanConfig && (
        <div className="rounded-xl border border-gray-200 dark:border-[#2c2c2c] p-3">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="secondary" className="text-xs font-normal bg-gray-100 dark:bg-[#1a1a1a] text-foreground rounded-md border border-gray-200 dark:border-[#2c2c2c]">
              Actuel
            </Badge>
            {subscription.status === "trialing" && (
              <span className="text-xs text-muted-foreground">
                Il reste {getDaysRemaining()} jours à l'essai
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Cube icon */}
            <div className="relative shrink-0 w-10 h-10 rounded-lg border border-gray-200 dark:border-[#2c2c2c] overflow-hidden">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0"><g clipPath="url(#clip0_sub_bg)"><rect width="40" height="40" fill="#FFFFFF" className="dark:fill-[#141414]"></rect><path d="M40 15.9494L0 15.9494" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10" strokeDasharray="1 1"></path><path d="M40 24.0506H0" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10" strokeDasharray="1 1"></path><path d="M12.9114 -4.17233e-07L12.9114 40" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10" strokeDasharray="1 1"></path><path d="M27.0886 0L27.0886 40" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10" strokeDasharray="1 1"></path><path d="M34.1423 -0.000732422V39.9993" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10"></path><path d="M5.85938 -0.000732422V39.9993" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10"></path><path d="M0.000976562 5.8577H40.001" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10"></path><path d="M0.000976562 34.4206H40.001" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10"></path></g><defs><clipPath id="clip0_sub_bg"><rect width="40" height="40" fill="#FFFFFF"></rect></clipPath></defs></svg>
              <svg width="30" height="25" viewBox="0 0 30 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"><path d="M7.99852 4.00541L14.0745 0.533435C14.3858 0.355535 14.768 0.355535 15.0793 0.533435L21.1553 4.00541C21.4708 4.1857 21.6655 4.52124 21.6655 4.88464V11.8106C21.6655 12.174 21.4708 12.5095 21.1553 12.6898L15.0793 16.1618C14.768 16.3397 14.3858 16.3397 14.0745 16.1618L7.99852 12.6898C7.683 12.5095 7.48828 12.174 7.48828 11.8106V4.88464C7.48828 4.52124 7.683 4.1857 7.99852 4.00541Z" fill="#FFFFFF" stroke="#CDCFD1" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M14.577 8.34722L7.70996 4.42317M14.577 8.34722L21.4765 4.40466M14.577 8.34722V16.1953" stroke="#CDCFD1" strokeWidth="0.506329" strokeLinecap="round" strokeLinejoin="round"></path><path d="M15.0874 8.0557L21.1633 4.58373C21.4747 4.40583 21.8569 4.40583 22.1682 4.58373L28.2441 8.0557C28.5596 8.236 28.7544 8.57153 28.7544 8.93493V15.8609C28.7544 16.2243 28.5596 16.5598 28.2441 16.7401L22.1682 20.2121C21.8569 20.39 21.4747 20.39 21.1633 20.2121L15.0874 16.7401C14.7719 16.5598 14.5771 16.2243 14.5771 15.8609V8.93493C14.5771 8.57153 14.7719 8.236 15.0874 8.0557Z" fill="#EEEDFF" stroke="#5A50FF" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"></path><path opacity="0.4" d="M21.6659 12.3976L14.7988 8.47358M21.6659 12.3976L28.5654 8.45508M21.6659 12.3976V20.2457" stroke="#5A50FF" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M0.910142 8.0557L6.98609 4.58373C7.29742 4.40583 7.67961 4.40583 7.99093 4.58373L14.0669 8.0557C14.3824 8.236 14.5771 8.57153 14.5771 8.93493V15.8609C14.5771 16.2243 14.3824 16.5598 14.0669 16.7401L7.99093 20.2121C7.67961 20.39 7.29741 20.39 6.98609 20.2121L0.910141 16.7401C0.594622 16.5598 0.399902 16.2243 0.399902 15.8609V8.93493C0.399902 8.57153 0.594623 8.236 0.910142 8.0557Z" fill="#EEEDFF" stroke="#5A50FF" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"></path><path opacity="0.4" d="M7.48867 12.3976L0.621582 8.47358M7.48867 12.3976L14.3881 8.45508M7.48867 12.3976V20.2457" stroke="#5A50FF" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7.99852 12.1061L14.0745 8.63414C14.3858 8.45624 14.768 8.45624 15.0793 8.63414L21.1553 12.1061C21.4708 12.2864 21.6655 12.6219 21.6655 12.9853V19.9113C21.6655 20.2747 21.4708 20.6102 21.1553 20.7905L15.0793 24.2625C14.768 24.4404 14.3858 24.4404 14.0745 24.2625L7.99852 20.7905C7.683 20.6102 7.48828 20.2747 7.48828 19.9113V12.9853C7.48828 12.6219 7.683 12.2864 7.99852 12.1061Z" fill="#EEEDFF" stroke="#5A50FF" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"></path><path opacity="0.4" d="M14.5766 16.4482L7.70947 12.5241M14.5766 16.4482L21.476 12.5056M14.5766 16.4482V24.2963" stroke="#5A50FF" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{currentPlanConfig.name}</span>
                {subscription.status === "trialing" && (
                  <Badge className="bg-[#5b50fe]/10 text-[#5b50fe] text-[10px] font-medium border border-[#5b50fe]/20 px-1.5 py-0">
                    Essai
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>
                  {formatPrice(isAnnual ? currentPlanConfig.annualPrice : currentPlanConfig.monthlyPrice)} €/mois
                  {isAnnual ? ", facturé annuellement" : ", facturé mensuellement"}
                </span>
                {!isAnnual && (
                  <>
                    <span className="mx-1">·</span>
                    <button
                      type="button"
                      onClick={() => setIsAnnual(true)}
                      className="text-[#5b50fe] hover:underline cursor-pointer"
                    >
                      Passer en annuel (Économisez 10%)
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="rounded-xl border border-gray-200 dark:border-[#2c2c2c] relative">
        {/* Purple column border overlay for current plan */}
        {currentPlanIndex >= 0 && (
          <div
            className="absolute top-0 bottom-0 border border-[#5b50fe]/30 rounded-xl z-10 pointer-events-none"
            style={{
              left: `${((1.2 + currentPlanIndex) / 4.2) * 100}%`,
              width: `${(1 / 4.2) * 100}%`,
              boxShadow: '0 0 0 3px rgba(91, 80, 254, 0.12)',
            }}
          />
        )}
        {/* Table Grid - Header */}
        <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr]">
          {/* Left column header */}
          <div className="p-4 space-y-4 bg-[#FBFBFB] dark:bg-[#111111] border-r border-gray-200 dark:border-[#2c2c2c]">
            <div>
              <p className="text-sm font-semibold">Comparer les plans</p>
              <p className="text-xs text-muted-foreground">Trouvez le plan adapté</p>
            </div>
            {/* Toggle */}
            <div className="inline-flex items-center rounded-lg border border-gray-200 dark:border-[#2c2c2c] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setIsAnnual(true)}
                className={cn(
                  "px-2.5 py-1 rounded-md cursor-pointer transition-colors flex items-center gap-1.5",
                  isAnnual ? "bg-white dark:bg-[#2c2c2c] font-medium" : "text-muted-foreground"
                )}
              >
                Annuel
                <span className="text-[10px] text-[#5b50fe] bg-[#5b50fe]/10 rounded px-1 py-0.5 font-medium">-10%</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAnnual(false)}
                className={cn(
                  "px-2.5 py-1 rounded-md cursor-pointer transition-colors",
                  !isAnnual ? "bg-white dark:bg-[#2c2c2c] font-medium" : "text-muted-foreground"
                )}
              >
                Mensuel
              </button>
            </div>
          </div>

          {/* Plan columns header */}
          {PLANS_CONFIG.map((plan) => {
            const isCurrentPlan = subscription?.plan === plan.key;
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.key}
                className={cn(
                  "p-4",
                  isCurrentPlan && "bg-[#5b50fe]/[0.02] dark:bg-[#5b50fe]/5"
                )}
              >
                {/* Name row - fixed height for alignment */}
                <div className="h-10 flex flex-col justify-center">
                  <p className="text-sm font-semibold">{plan.name}</p>
                  {plan.popular ? (
                    <p className="text-xs text-[#5b50fe] font-medium">Populaire</p>
                  ) : (
                    <p className="text-xs text-transparent select-none">&nbsp;</p>
                  )}
                </div>

                {/* Price */}
                <div className="mt-3">
                  <div className="flex items-baseline">
                    <span className="text-2xl font-semibold tabular-nums">€{formatPrice(price)}</span>
                    <span className="text-xs text-muted-foreground ml-1">/mois</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {isAnnual ? "facturé annuellement" : "facturé mensuellement"}
                  </p>
                </div>

                {/* Button */}
                <div className="mt-3">
                  {isCurrentPlan ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full cursor-default text-xs"
                      disabled
                    >
                      Plan actuel
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full cursor-pointer text-xs"
                      onClick={() => openPlanChangeModal(plan.key)}
                      disabled={loadingPlan === plan.key || !canManageSubscription}
                    >
                      {loadingPlan === plan.key ? (
                        <LoaderCircle className="h-3 w-3 animate-spin" />
                      ) : subscription?.plan ? (
                        PLANS_CONFIG.findIndex((p) => p.key === subscription.plan) >
                        PLANS_CONFIG.findIndex((p) => p.key === plan.key)
                          ? "Downgrade"
                          : "Choisir"
                      ) : (
                        "Choisir"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Rows */}
        <div className="relative before:content-[''] before:absolute before:top-0 before:left-4 before:right-4 before:h-px before:bg-gray-200 dark:before:bg-[#2c2c2c]">
          {/* Section title */}
          <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr] relative after:content-[''] after:absolute after:bottom-0 after:left-4 after:right-4 after:h-px after:bg-gray-200 dark:after:bg-[#2c2c2c]">
            <div className="px-4 py-2 bg-[#FBFBFB] dark:bg-[#111111] border-r border-gray-200 dark:border-[#2c2c2c]">
              <p className="text-xs font-semibold">Fonctionnalités</p>
            </div>
            {PLANS_CONFIG.map((plan) => {
              const isCurrentPlan = subscription?.plan === plan.key;
              return (
                <div
                  key={plan.key}
                  className={cn(
                    "px-4 py-2",
                    isCurrentPlan && "bg-[#5b50fe]/[0.02] dark:bg-[#5b50fe]/5"
                  )}
                />
              );
            })}
          </div>

          {/* Feature rows */}
          {COMPARISON_ROWS.map((row, index) => (
            <div
              key={row.key}
              className={cn(
                "grid grid-cols-[1.2fr_1fr_1fr_1fr]",
                index < COMPARISON_ROWS.length - 1 && "relative after:content-[''] after:absolute after:bottom-0 after:left-4 after:right-4 after:h-px after:bg-gray-100 dark:after:bg-[#2c2c2c]"
              )}
            >
              <div className="px-4 py-2.5 bg-[#FBFBFB] dark:bg-[#111111] border-r border-gray-200 dark:border-[#2c2c2c]">
                <span className="text-xs text-muted-foreground">{row.label}</span>
              </div>
              {PLANS_CONFIG.map((plan) => {
                const isCurrentPlan = subscription?.plan === plan.key;
                const value = plan.features[row.key];
                return (
                  <div
                    key={plan.key}
                    className={cn(
                      "px-4 py-2.5 flex items-center",
                      isCurrentPlan && "bg-[#5b50fe]/[0.02] dark:bg-[#5b50fe]/5"
                    )}
                  >
                    {value === true ? (
                      <Check className="h-3.5 w-3.5 text-[#5b50fe]" />
                    ) : value === false ? (
                      <X className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                    ) : (
                      <span className="text-xs font-medium">{value}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Cancel button */}
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

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={(open) => { setShowCancelDialog(open); if (!open) setCancelConfirmText(""); }}>
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

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Tapez <span className="font-semibold text-foreground">allow</span> pour confirmer la résiliation.
            </p>
            <input
              type="text"
              value={cancelConfirmText}
              onChange={(e) => setCancelConfirmText(e.target.value)}
              placeholder="allow"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#2c2c2c] rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancellation}
              disabled={isLoading || cancelConfirmText.toLowerCase() !== "allow"}
              className="bg-red-600 hover:bg-red-700 cursor-pointer disabled:opacity-50"
            >
              {isLoading && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Plan Change Modal */}
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
