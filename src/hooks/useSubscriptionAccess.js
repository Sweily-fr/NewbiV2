"use client";

import { useMemo } from "react";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { usePermissions } from "@/src/hooks/usePermissions";

/**
 * Hook centralisé pour déterminer les droits d'accès en fonction du statut d'abonnement.
 *
 * Statuts Stripe gérés :
 *   trialing       → trial actif, accès complet
 *   active         → abonnement payant, accès complet
 *   past_due       → échec paiement, retries Stripe en cours (grace period)
 *   canceled       → résilié, accès jusqu'à periodEnd puis lecture seule
 *   unpaid         → échec définitif après retries → lecture seule
 *   incomplete     → premier paiement échoué → lecture seule
 *   expired        → canceled + periodEnd passé (calculé par l'API) → lecture seule
 *   null/undefined → pas d'abonnement → lecture seule
 */
export function useSubscriptionAccess() {
  const { subscription, isActive, loading, lastFetchOk } = useSubscription();
  const { getUserRole } = usePermissions();

  return useMemo(() => {
    const status = subscription?.status || null;
    const periodEnd = subscription?.periodEnd
      ? new Date(subscription.periodEnd)
      : null;
    const now = new Date();

    // ─── App-managed trial (feature-flagged via API) ───
    //
    // When ENABLE_APP_TRIAL is OFF, the API returns appTrialEnabled=false and
    // all trial-aware branches below are no-ops (zero behavioural change).
    const trialEndDate = subscription?.trialEndDate
      ? new Date(subscription.trialEndDate)
      : null;
    const isTrialApp =
      subscription?.appTrialEnabled === true &&
      subscription?.isTrialActive === true &&
      trialEndDate &&
      trialEndDate > now;

    // ─── Core states ───

    const isInTrial = status === "trialing" || isTrialApp;

    const isCanceled = status === "canceled" && periodEnd && periodEnd > now;

    const isPeriodEnded =
      status === "canceled" && periodEnd && periodEnd <= now;

    const isGracePeriod = status === "past_due";

    // Active app-trial short-circuits read-only. Without that guard, a user
    // whose org has a trial but no Stripe sub yet would land in (!loading && !status)
    // and be treated as expired.
    //
    // Lot 3 safety net: `lastFetchOk === false` means the subscription fetch
    // errored (network / 4xx / 5xx). Don't conclude "expired" from missing
    // data in that case — the server-side dashboard layout already vetted
    // access; an intermittent client fetch failure must not produce a red
    // banner.
    const fetchAuthoritative = lastFetchOk !== false;
    const isReadOnly =
      !isTrialApp &&
      fetchAuthoritative &&
      (status === "unpaid" ||
        status === "incomplete" ||
        status === "expired" ||
        isPeriodEnded ||
        (!loading && !status));

    const subscriptionIsActive = isActive();

    // ─── Trial info ───

    const trialDaysRemaining = isTrialApp
      ? Math.max(0, Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24)))
      : isInTrial && periodEnd
        ? Math.max(0, Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24)))
        : null;

    const trialEndsAt = isTrialApp
      ? trialEndDate
      : isInTrial && periodEnd
        ? periodEnd
        : null;

    // ─── Canceled info ───

    const canceledDaysRemaining =
      isCanceled && periodEnd
        ? Math.max(0, Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24)))
        : null;

    // ─── Permissions ───

    const userRole = getUserRole();
    const isOwner = userRole === "owner" || userRole === "admin";

    const canCreate = !isReadOnly;
    const canEdit = !isReadOnly;
    const canDelete = !isReadOnly;
    const canExport = true; // Toujours accessible (obligation légale FR 10 ans)

    // ─── Banner state ───
    // Détermine quel type de bannière afficher

    let bannerType = null;
    let bannerMessage = null;
    let bannerAction = null;

    if (isReadOnly && isOwner) {
      bannerType = "error";
      bannerMessage =
        "Votre abonnement a expiré. Vos données sont en lecture seule.";
      bannerAction = "Renouveler l'abonnement";
    } else if (isReadOnly && !isOwner) {
      bannerType = "error";
      bannerMessage =
        "L'abonnement de cet espace a expiré. Contactez l'administrateur pour le renouveler.";
      bannerAction = null;
    } else if (isGracePeriod && isOwner) {
      bannerType = "warning";
      bannerMessage =
        "Le paiement de votre abonnement a échoué. Mettez à jour vos informations de paiement.";
      bannerAction = "Mettre à jour";
    } else if (isGracePeriod && !isOwner) {
      bannerType = "warning";
      bannerMessage =
        "Un problème de paiement a été détecté sur cet espace. Contactez l'administrateur.";
      bannerAction = null;
    } else if (isCanceled && isOwner) {
      bannerType = "info";
      bannerMessage = `Votre abonnement prend fin le ${periodEnd?.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}. Vous pouvez le réactiver à tout moment.`;
      bannerAction = "Réactiver";
    } else if (isCanceled && !isOwner) {
      bannerType = "info";
      bannerMessage = `L'abonnement de cet espace prend fin le ${periodEnd?.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.`;
      bannerAction = null;
    }

    return {
      // Status
      status,
      loading,
      isActive: subscriptionIsActive,
      isInTrial,
      isTrialApp,
      isReadOnly,
      isGracePeriod,
      isCanceled,

      // Trial
      trialEndsAt,
      trialDaysRemaining,

      // Canceled
      canceledDaysRemaining,
      periodEnd,

      // Permissions
      isOwner,
      canCreate,
      canEdit,
      canDelete,
      canExport,

      // Banner
      bannerType,
      bannerMessage,
      bannerAction,

      // Subscription data
      plan: subscription?.plan || null,
    };
  }, [subscription, isActive, loading, lastFetchOk, getUserRole]);
}
