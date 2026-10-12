"use client";

import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { usePathname, useRouter } from "next/navigation";
import { useDashboardLayoutContext } from "@/src/contexts/dashboard-layout-context";
import { useOrgPaidByManager } from "@/src/hooks/useOrgPaidByManager";
import { cabinetActionFor } from "@/src/components/gestionnaire/paid-by-cabinet-notice";
import { AlertTriangle, Info } from "lucide-react";
import { Button } from "@/src/components/ui/button";

const BANNER_CONFIG = {
  error: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200/60 dark:border-red-800/40",
    icon: AlertTriangle,
    iconColor: "text-red-500 dark:text-red-400",
    text: "text-red-800 dark:text-red-200",
    actionText: "text-red-700 dark:text-red-300",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200/60 dark:border-amber-800/40",
    icon: AlertTriangle,
    iconColor: "text-amber-500 dark:text-amber-400",
    text: "text-amber-800 dark:text-amber-200",
    actionText: "text-amber-700 dark:text-amber-300",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200/60 dark:border-blue-800/40",
    icon: Info,
    iconColor: "text-blue-500 dark:text-blue-400",
    text: "text-blue-800 dark:text-blue-200",
    actionText: "text-blue-700 dark:text-blue-300",
  },
};

/**
 * Présentation pure du bandeau (sans hooks ni auth). Extraite pour pouvoir la
 * rendre dans un bac à sable / des tests avec des données contrôlées.
 *
 * @param {"error"|"warning"|"info"} bannerType
 * @param {string} bannerMessage
 * @param {string|null} bannerAction - libellé du bouton (null = pas de bouton)
 * @param {boolean} isOwner - le bouton n'apparaît que pour un owner/admin
 * @param {() => void} onAction - clic sur le bouton
 */
export function SubscriptionReadOnlyBannerView({
  bannerType,
  bannerMessage,
  bannerAction,
  isOwner,
  onAction,
}) {
  if (!bannerType) return null;

  const c = BANNER_CONFIG[bannerType] || BANNER_CONFIG.error;
  const Icon = c.icon;

  return (
    <div
      className={`${c.bg} border-b ${c.border} px-4 lg:px-6 py-2 flex items-center gap-3 animate-in slide-in-from-top-1 duration-200`}
    >
      <Icon className={`size-4 shrink-0 ${c.iconColor}`} />
      <p className={`text-[13px] ${c.text} flex-1 truncate`}>{bannerMessage}</p>
      {bannerAction && isOwner && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className={`shrink-0 h-7 text-xs cursor-pointer bg-transparent border-current/20 ${c.actionText} hover:bg-black/5 dark:hover:bg-white/5`}
        >
          {bannerAction}
        </Button>
      )}
    </div>
  );
}

/**
 * Bandeau persistant affiché sous le header quand l'abonnement est inactif.
 * Pousse le contenu vers le bas (pas overlay).
 * Ne s'affiche pas sur les pages billing/settings (évite le doublon).
 *
 * @param {() => void} [onSubscribe] - Ouvre la modale de paramètres sur
 *   l'onglet abonnement (fourni par le layout dashboard, cf. TrialBanner).
 *   Le portail Stripe ne permet pas de re-souscrire un abonnement expiré :
 *   on dirige l'utilisateur vers le flux de souscription (checkout) qui
 *   fonctionne dans tous les états (expiré, impayé, résilié).
 */
export function SubscriptionReadOnlyBanner({ onSubscribe }) {
  const { bannerType, bannerMessage, bannerAction, isOwner, loading } =
    useSubscriptionAccess();
  const pathname = usePathname();
  const router = useRouter();
  // Espace dont un cabinet paie l'abonnement : c'est lui qui le réactive
  // (vérifié seulement quand le bandeau doit s'afficher)
  const { organization } = useDashboardLayoutContext();
  const cabinet = useOrgPaidByManager(
    !loading && bannerType ? organization?.id : null,
  );
  // Bouton de souscription : « Gérer l'abonnement » (grille non chargée :
  // propriétaire)
  const { canDo, isReady: permissionsReady } = useMyPermissions();
  const canSubscribe = permissionsReady ? canDo("billing", "manage") : isOwner;

  // Don't show while loading
  if (loading || !bannerType) return null;
  // Prise en charge par un cabinet pas encore vérifiée
  if (cabinet === undefined) return null;

  // Don't show on billing/settings pages (they have their own messaging)
  if (pathname?.includes("/parametres") || pathname?.includes("/settings")) {
    return null;
  }

  if (cabinet) {
    const action = cabinetActionFor(cabinet);
    const unpaid = Boolean(cabinet.subscriptionStatus);
    return (
      <SubscriptionReadOnlyBannerView
        bannerType={bannerType}
        bannerMessage={
          cabinet.viewerIsManager
            ? unpaid
              ? "Cet espace est en lecture seule : le paiement de son abonnement n'est pas passé. Mettez à jour votre carte."
              : "Cet espace est en lecture seule : son essai est terminé. Choisissez son offre pour réactiver votre client."
            : unpaid
              ? `Espace en lecture seule : le paiement de l'abonnement n'est pas passé. C'est à votre cabinet ${cabinet.managerName} de le régulariser.`
              : `Espace en lecture seule : votre cabinet ${cabinet.managerName} doit choisir l'offre de cet espace.`
        }
        bannerAction={action?.label}
        isOwner={Boolean(action)}
        onAction={() => action && router.push(action.href)}
      />
    );
  }

  const handleAction = () => {
    if (onSubscribe) {
      onSubscribe();
      return;
    }
    // Fallback hors layout dashboard : ouvre la modale via l'event global.
    // Le listener est posé sur `document` (cf. comp-333.jsx) ; on dispatche
    // donc sur `document` pour que l'event l'atteigne réellement.
    if (typeof document !== "undefined") {
      document.dispatchEvent(
        new CustomEvent("openSettingsModal", {
          detail: { section: "subscription" },
        }),
      );
    }
  };

  return (
    <SubscriptionReadOnlyBannerView
      bannerType={bannerType}
      bannerMessage={bannerMessage}
      bannerAction={bannerAction}
      isOwner={canSubscribe}
      onAction={handleAction}
    />
  );
}
