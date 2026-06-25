"use client";

import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { usePathname } from "next/navigation";
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

  // Don't show while loading
  if (loading || !bannerType) return null;

  // Don't show on billing/settings pages (they have their own messaging)
  if (pathname?.includes("/parametres") || pathname?.includes("/settings")) {
    return null;
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
      isOwner={isOwner}
      onAction={handleAction}
    />
  );
}
