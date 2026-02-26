"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Pencil,
  Plus,
  Download,
  Users,
  FileText,
  Crown,
  ScanLine,
  AlertTriangle,
  LoaderCircle,
  Info,
  Eye,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { Progress } from "@/src/components/ui/progress";
import { Callout } from "@/src/components/ui/callout";
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
import { useStripeInvoices } from "@/src/hooks/useStripeInvoices";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { useSession } from "@/src/lib/auth-client";
import { authClient } from "@/src/lib/auth-client";
import { usePermissions } from "@/src/hooks/usePermissions";
import { useUserOcrQuota } from "@/src/graphql/importedInvoiceQueries";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { toast } from "@/src/components/ui/sonner";
import { PLAN_LIMITS } from "@/src/lib/plan-limits";

// Configuration des plans (prix et noms)
const PLANS_CONFIG = {
  freelance: { name: "Freelance", monthlyPrice: 17.99 },
  pme: { name: "PME", monthlyPrice: 48.99 },
  entreprise: { name: "Entreprise", monthlyPrice: 94.99 },
};

export default function FacturationSection({
  organization,
  session,
  canManageSubscription,
  onTabChange,
}) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelConfirmText, setCancelConfirmText] = useState("");
  const [seatsInfo, setSeatsInfo] = useState(null);
  const [billingPortalLoading, setBillingPortalLoading] = useState(false);

  const { invoices, loading: invoicesLoading, error: invoicesError, refetch: refetchInvoices, viewInvoice, downloadInvoice } =
    useStripeInvoices();
  const { subscription, isActive, loading: subLoading } = useSubscription();
  const { workspaceId } = useWorkspace();
  const { quota: ocrQuota, loading: ocrLoading } = useUserOcrQuota(workspaceId);

  const orgId = session?.user?.organization?.id || organization?.id;

  // Fetch seats info
  useEffect(() => {
    const fetchSeatsInfo = async () => {
      if (!orgId) return;
      try {
        const response = await fetch(`/api/organizations/${orgId}/seats-info`);
        if (response.ok) {
          const data = await response.json();
          setSeatsInfo(data);
        }
      } catch (error) {
        console.error("Erreur récupération sièges:", error);
      }
    };
    if (isActive()) {
      fetchSeatsInfo();
    }
  }, [orgId, isActive]);

  // Helpers
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

  const formatPrice = (amount) => {
    return amount?.toFixed(2).replace(".", ",") || "0,00";
  };

  const getDaysRemaining = () => {
    if (!subscription?.periodEnd) return 0;
    const now = new Date();
    const end = new Date(subscription.periodEnd);
    return Math.max(0, Math.ceil((end - now) / 86400000));
  };

  const planConfig = PLANS_CONFIG[subscription?.plan] || PLANS_CONFIG.freelance;
  const planLimits = PLAN_LIMITS[subscription?.plan] || PLAN_LIMITS.freelance;

  // Billing portal
  const handleOpenBillingPortal = async () => {
    if (!subscription?.stripeCustomerId) {
      toast.error("Aucun identifiant client Stripe trouvé");
      return;
    }
    setBillingPortalLoading(true);
    try {
      const response = await fetch("/api/stripe/billing-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: subscription.stripeCustomerId }),
      });
      const data = await response.json();
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        toast.error(data.error || "Erreur lors de l'ouverture du portail");
      }
    } catch (error) {
      toast.error("Erreur lors de l'ouverture du portail de facturation");
    } finally {
      setBillingPortalLoading(false);
    }
  };

  // Cancellation
  const handleCancellation = async () => {
    setIsCancelling(true);
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
        toast.error(`Erreur: ${error.message || "Erreur inconnue"}`);
        return;
      }
      setShowCancelDialog(false);
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error("Erreur lors de la résiliation");
    } finally {
      setIsCancelling(false);
    }
  };

  // Status badges for invoices
  const getStatusBadge = (status) => {
    const configs = {
      paid: { label: "Payée", className: "bg-green-50 text-green-600 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800" },
      open: { label: "En attente", className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800" },
      void: { label: "Annulée", className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800" },
      draft: { label: "Brouillon", className: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700" },
      uncollectible: { label: "Irrécupérable", className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800" },
    };
    const config = configs[status] || { label: status, className: "" };
    return (
      <Badge variant="secondary" className={`text-xs ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  // No subscription state
  if (!isActive() && !subLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-medium mb-1 hidden md:block">
            Facturation
          </h2>
          <p className="text-sm text-muted-foreground mb-4 hidden md:block">
            Gérez votre abonnement, vos moyens de paiement et consultez vos
            factures.
          </p>
          <Separator className="hidden md:block bg-[#eeeff1] dark:bg-[#232323]" />
        </div>
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Aucun abonnement actif
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Vous devez avoir un abonnement pour accéder à la facturation.
          </p>
          <Button
            onClick={() => onTabChange?.("subscription")}
            className="bg-[#5b50fe] hover:bg-[#4a3fe8] cursor-pointer"
          >
            <Crown className="h-4 w-4 mr-2" />
            Voir les plans
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium mb-1 hidden md:block">
          Facturation
        </h2>
        <p className="text-sm text-muted-foreground mb-4 hidden md:block">
          Gérez votre abonnement, vos moyens de paiement et consultez vos
          factures.
        </p>
        <Separator className="hidden md:block bg-[#eeeff1] dark:bg-[#232323]" />
      </div>

      {/* Permission warning */}
      {!canManageSubscription && (
        <Callout type="warning" noMargin>
          <p>
            Seul le <strong>propriétaire</strong> de l'organisation peut gérer
            la facturation.
          </p>
        </Callout>
      )}

      {/* Trial Banner */}
      {subscription?.status === "trialing" && (
        <div className="rounded-xl border border-[#5b50fe]/20 bg-[#5b50fe]/5 dark:bg-[#5b50fe]/10 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5b50fe]/10">
                <Calendar className="h-5 w-5 text-[#5b50fe]" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Il reste{" "}
                  <span className="text-[#5b50fe] font-semibold">
                    {getDaysRemaining()} jours
                  </span>{" "}
                  à votre essai
                </p>
                <p className="text-xs text-muted-foreground">
                  Ajoutez un moyen de paiement pour continuer après la période
                  d'essai.
                </p>
              </div>
            </div>
            <Button
              onClick={handleOpenBillingPortal}
              disabled={billingPortalLoading || !canManageSubscription}
              className="bg-[#5b50fe] hover:bg-[#4a3fe8] cursor-pointer shrink-0"
              size="sm"
            >
              {billingPortalLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                "Ajouter un moyen de paiement"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Current Plan */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">Abonnement actuel</h3>
          {subscription?.periodEnd && subscription?.status !== "trialing" && (
            <p className="text-xs text-muted-foreground">
              Prochaine facturation le {formatDate(subscription.periodEnd)}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-[#2c2c2c] p-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0 w-10 h-10 rounded-lg border border-gray-200 dark:border-[#2c2c2c] overflow-hidden">
                {/* Grid background */}
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0"><g clipPath="url(#clip0_plan_bg)"><rect width="40" height="40" fill="#FFFFFF" className="dark:fill-[#141414]"></rect><path d="M40 15.9494L0 15.9494" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10" strokeDasharray="1 1"></path><path d="M40 24.0506H0" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10" strokeDasharray="1 1"></path><path d="M12.9114 -4.17233e-07L12.9114 40" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10" strokeDasharray="1 1"></path><path d="M27.0886 0L27.0886 40" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10" strokeDasharray="1 1"></path><path d="M34.1423 -0.000732422V39.9993" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10"></path><path d="M5.85938 -0.000732422V39.9993" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10"></path><path d="M0.000976562 5.8577H40.001" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10"></path><path d="M0.000976562 34.4206H40.001" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeMiterlimit="10"></path></g><defs><clipPath id="clip0_plan_bg"><rect width="40" height="40" fill="#FFFFFF"></rect></clipPath></defs></svg>
                {/* Cube icon */}
                <svg width="30" height="25" viewBox="0 0 30 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"><path d="M7.99852 4.00541L14.0745 0.533435C14.3858 0.355535 14.768 0.355535 15.0793 0.533435L21.1553 4.00541C21.4708 4.1857 21.6655 4.52124 21.6655 4.88464V11.8106C21.6655 12.174 21.4708 12.5095 21.1553 12.6898L15.0793 16.1618C14.768 16.3397 14.3858 16.3397 14.0745 16.1618L7.99852 12.6898C7.683 12.5095 7.48828 12.174 7.48828 11.8106V4.88464C7.48828 4.52124 7.683 4.1857 7.99852 4.00541Z" fill="#FFFFFF" stroke="#CDCFD1" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M14.577 8.34722L7.70996 4.42317M14.577 8.34722L21.4765 4.40466M14.577 8.34722V16.1953" stroke="#CDCFD1" strokeWidth="0.506329" strokeLinecap="round" strokeLinejoin="round"></path><path d="M15.0874 8.0557L21.1633 4.58373C21.4747 4.40583 21.8569 4.40583 22.1682 4.58373L28.2441 8.0557C28.5596 8.236 28.7544 8.57153 28.7544 8.93493V15.8609C28.7544 16.2243 28.5596 16.5598 28.2441 16.7401L22.1682 20.2121C21.8569 20.39 21.4747 20.39 21.1633 20.2121L15.0874 16.7401C14.7719 16.5598 14.5771 16.2243 14.5771 15.8609V8.93493C14.5771 8.57153 14.7719 8.236 15.0874 8.0557Z" fill="#EEEDFF" stroke="#5A50FF" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"></path><path opacity="0.4" d="M21.6659 12.3976L14.7988 8.47358M21.6659 12.3976L28.5654 8.45508M21.6659 12.3976V20.2457" stroke="#5A50FF" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M0.910142 8.0557L6.98609 4.58373C7.29742 4.40583 7.67961 4.40583 7.99093 4.58373L14.0669 8.0557C14.3824 8.236 14.5771 8.57153 14.5771 8.93493V15.8609C14.5771 16.2243 14.3824 16.5598 14.0669 16.7401L7.99093 20.2121C7.67961 20.39 7.29741 20.39 6.98609 20.2121L0.910141 16.7401C0.594622 16.5598 0.399902 16.2243 0.399902 15.8609V8.93493C0.399902 8.57153 0.594623 8.236 0.910142 8.0557Z" fill="#EEEDFF" stroke="#5A50FF" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"></path><path opacity="0.4" d="M7.48867 12.3976L0.621582 8.47358M7.48867 12.3976L14.3881 8.45508M7.48867 12.3976V20.2457" stroke="#5A50FF" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7.99852 12.1061L14.0745 8.63414C14.3858 8.45624 14.768 8.45624 15.0793 8.63414L21.1553 12.1061C21.4708 12.2864 21.6655 12.6219 21.6655 12.9853V19.9113C21.6655 20.2747 21.4708 20.6102 21.1553 20.7905L15.0793 24.2625C14.768 24.4404 14.3858 24.4404 14.0745 24.2625L7.99852 20.7905C7.683 20.6102 7.48828 20.2747 7.48828 19.9113V12.9853C7.48828 12.6219 7.683 12.2864 7.99852 12.1061Z" fill="#EEEDFF" stroke="#5A50FF" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"></path><path opacity="0.4" d="M14.5766 16.4482L7.70947 12.5241M14.5766 16.4482L21.476 12.5056M14.5766 16.4482V24.2963" stroke="#5A50FF" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              </div>
              <div>
                <p className="text-sm font-medium">
                  Plan {planConfig.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(planConfig.monthlyPrice)} €/mois
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTabChange?.("subscription")}
              className="cursor-pointer"
            >
              Changer de plan
            </Button>
          </div>
        </div>
      </div>

      {/* Consumption - Seats & OCR */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Consommation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Seats Card */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2c2c2c] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#5b50fe]/10">
                  <Users className="h-3.5 w-3.5 text-[#5b50fe]" />
                </div>
                <span className="text-sm font-medium">Sièges</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {seatsInfo ? `${seatsInfo.currentMembers}/${seatsInfo.includedSeats}` : "–"}
              </span>
            </div>
            <Progress
              value={
                seatsInfo
                  ? Math.min(100, (seatsInfo.currentMembers / seatsInfo.includedSeats) * 100)
                  : 0
              }
              className="h-1 bg-[#5b50fe]/10 [&>[data-slot=progress-indicator]]:bg-[#5b50fe]"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {seatsInfo?.additionalSeats > 0
                  ? `${seatsInfo.additionalSeats} siège${seatsInfo.additionalSeats > 1 ? "s" : ""} supplémentaire${seatsInfo.additionalSeats > 1 ? "s" : ""}`
                  : `${seatsInfo?.availableSeats || 0} siège${(seatsInfo?.availableSeats || 0) > 1 ? "s" : ""} disponible${(seatsInfo?.availableSeats || 0) > 1 ? "s" : ""}`}
              </span>
              <button
                type="button"
                onClick={() => onTabChange?.("personnes")}
                className="text-xs text-[#5b50fe] hover:underline cursor-pointer"
              >
                Gérer les sièges
              </button>
            </div>
          </div>

          {/* OCR Credits Card */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2c2c2c] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-green-100 dark:bg-green-950/30">
                  <ScanLine className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-medium">Crédits OCR</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {ocrQuota
                  ? `${ocrQuota.usedQuota}/${ocrQuota.monthlyQuota}`
                  : ocrLoading
                    ? "..."
                    : "–"}
              </span>
            </div>
            <Progress
              value={
                ocrQuota
                  ? Math.min(100, (ocrQuota.usedQuota / ocrQuota.monthlyQuota) * 100)
                  : 0
              }
              className="h-1 bg-green-100 dark:bg-green-950/30 [&>[data-slot=progress-indicator]]:bg-green-500"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {ocrQuota
                  ? `${ocrQuota.remainingQuota} crédit${ocrQuota.remainingQuota > 1 ? "s" : ""} restant${ocrQuota.remainingQuota > 1 ? "s" : ""}`
                  : "Chargement..."}
              </span>
              {ocrQuota?.resetDate && (
                <span className="text-xs text-muted-foreground">
                  Réinitialisation le{" "}
                  {new Date(ocrQuota.resetDate).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Billing Details */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Détails de facturation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Address Card */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2c2c2c] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Adresse de facturation</p>
                <p className="text-xs text-muted-foreground">
                  Informations utilisées sur vos factures
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={() => onTabChange?.("generale")}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm divide-y divide-gray-100 dark:divide-[#2c2c2c]">
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground">Email</span>
                <span className="text-right truncate ml-2">
                  {organization?.companyEmail || session?.user?.email || "–"}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground">Entreprise</span>
                <span className="text-right truncate ml-2">
                  {organization?.companyName || "–"}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground">Adresse</span>
                <span className="text-right truncate ml-2">
                  {[
                    organization?.addressStreet,
                    organization?.addressZipCode,
                    organization?.addressCity,
                  ]
                    .filter(Boolean)
                    .join(", ") || "–"}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground">N° TVA</span>
                <span className="text-right truncate ml-2">
                  {organization?.vatNumber || "–"}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Card */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2c2c2c] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Moyen de paiement</p>
                <p className="text-xs text-muted-foreground">
                  Gérer via le portail Stripe
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={handleOpenBillingPortal}
                disabled={billingPortalLoading || !canManageSubscription}
              >
                {billingPortalLoading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <ExternalLink className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">
                Vos moyens de paiement sont gérés directement par Stripe.
              </p>
              <Button
                variant="link"
                size="sm"
                className="text-[#5b50fe] cursor-pointer mt-1 h-auto p-0 text-xs"
                onClick={handleOpenBillingPortal}
                disabled={billingPortalLoading || !canManageSubscription}
              >
                Ouvrir le portail de paiement
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Historique des factures</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={refetchInvoices}
            disabled={invoicesLoading}
            className="cursor-pointer h-8 text-xs"
          >
            {invoicesLoading ? (
              <LoaderCircle className="h-3 w-3 animate-spin mr-1" />
            ) : null}
            Actualiser
          </Button>
        </div>

        {/* Loading state */}
        {invoicesLoading && (
          <div className="rounded-xl border border-gray-200 dark:border-[#2c2c2c] overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border-b last:border-b-0 border-gray-100 dark:border-[#2c2c2c]"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-[#292929] rounded animate-pulse w-24" />
                  <div className="h-4 bg-gray-200 dark:bg-[#292929] rounded animate-pulse w-16" />
                  <div className="h-5 bg-gray-200 dark:bg-[#292929] rounded-full animate-pulse w-14" />
                </div>
                <div className="h-8 bg-gray-200 dark:bg-[#292929] rounded animate-pulse w-8" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {invoicesError && !invoicesLoading && (
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-700 dark:text-red-400">
                Erreur
              </span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">
              {invoicesError}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={refetchInvoices}
              className="text-red-700 border-red-300 hover:bg-red-50 cursor-pointer"
            >
              Réessayer
            </Button>
          </div>
        )}

        {/* Invoice table */}
        {!invoicesLoading && !invoicesError && invoices.length > 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-[#2c2c2c] overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[1fr_100px_120px_80px_48px] gap-4 px-4 py-2.5 bg-gray-50 dark:bg-[#141414] border-b border-gray-200 dark:border-[#2c2c2c]">
              <span className="text-xs font-medium text-muted-foreground">
                Référence
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                Total TTC
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                Date
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                Statut
              </span>
              <span className="text-xs font-medium text-muted-foreground" />
            </div>

            {/* Table Rows (max 5) */}
            {invoices.slice(0, 3).map((facture, index, arr) => (
              <div
                key={facture.id}
                className={`grid grid-cols-1 md:grid-cols-[1fr_100px_120px_80px_48px] gap-2 md:gap-4 px-4 py-3 items-center ${
                  index < arr.length - 1
                    ? "border-b border-gray-100 dark:border-[#2c2c2c]"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0 hidden md:block" />
                  <span className="text-sm truncate">
                    {facture.number || facture.description || `Facture`}
                  </span>
                </div>
                <span className="text-sm font-medium">{facture.amount}</span>
                <span className="text-sm text-muted-foreground">
                  {facture.date}
                </span>
                <div>{getStatusBadge(facture.status)}</div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => downloadInvoice(facture.stripeInvoiceId)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* Voir plus */}
            {invoices.length > 3 && (
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-[#2c2c2c] text-center">
                <button
                  type="button"
                  onClick={handleOpenBillingPortal}
                  className="text-xs text-[#5b50fe] hover:underline cursor-pointer"
                >
                  Voir les {invoices.length - 3} autres factures
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!invoicesLoading && !invoicesError && invoices.length === 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-[#2c2c2c] p-8 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Aucune facture
            </p>
            <p className="text-xs text-muted-foreground">
              Vos factures apparaîtront ici une fois générées.
            </p>
          </div>
        )}
      </div>

      {/* Cancel Subscription */}
      {isActive() &&
        subscription &&
        !subscription.cancelAtPeriodEnd &&
        subscription.status !== "canceled" && (
          <div className="pt-4 border-t border-gray-200 dark:border-[#2c2c2c]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Résilier l'abonnement
                </p>
                <p className="text-xs text-muted-foreground">
                  Vous conserverez l'accès jusqu'à la fin de la période en
                  cours.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
                disabled={!canManageSubscription || isCancelling}
                className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/20 cursor-pointer"
              >
                Résilier l'abonnement
              </Button>
            </div>
          </div>
        )}

      {/* Cancelled info */}
      {isActive() &&
        subscription &&
        (subscription.cancelAtPeriodEnd ||
          subscription.status === "canceled") && (
          <Callout type="warning" noMargin>
            <p>
              Votre abonnement est résilié. Vous conservez l'accès jusqu'au{" "}
              <strong>{formatDate(subscription.periodEnd)}</strong>.
            </p>
          </Callout>
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
              Êtes-vous sûr de vouloir résilier votre abonnement ? Vous
              conserverez l'accès jusqu'au{" "}
              {formatDate(subscription?.periodEnd)}.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="bg-muted rounded-lg p-4 my-2">
            <p className="text-sm font-medium mb-2">
              Vous perdrez l'accès à :
            </p>
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
            <AlertDialogCancel className="cursor-pointer">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancellation}
              disabled={isCancelling || cancelConfirmText.toLowerCase() !== "allow"}
              className="bg-red-600 hover:bg-red-700 cursor-pointer disabled:opacity-50"
            >
              {isCancelling && (
                <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
              )}
              Confirmer la résiliation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
