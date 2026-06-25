"use client";

import { AlertTriangle, Info } from "lucide-react";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";

export function SubscriptionExpiredBadgeHeader({ onSubscribe }) {
  const { bannerType, bannerMessage, bannerAction, loading } =
    useSubscriptionAccess();

  if (loading || !bannerType) return null;

  const handleAction = () => {
    if (onSubscribe) {
      onSubscribe();
      return;
    }
    // Le portail Stripe ne re-souscrit pas un abonnement expiré : on ouvre la
    // modale de paramètres sur l'onglet abonnement (listener sur `document`).
    if (typeof document !== "undefined") {
      document.dispatchEvent(
        new CustomEvent("openSettingsModal", {
          detail: { section: "subscription" },
        }),
      );
    }
  };

  const colors = {
    error: {
      icon: "text-red-600 dark:text-red-400",
      text: "text-red-600 dark:text-red-400",
    },
    warning: {
      icon: "text-amber-600 dark:text-amber-400",
      text: "text-amber-600 dark:text-amber-400",
    },
    info: {
      icon: "text-blue-600 dark:text-blue-400",
      text: "text-blue-600 dark:text-blue-400",
    },
  };

  const c = colors[bannerType] || colors.error;
  const Icon = bannerType === "info" ? Info : AlertTriangle;

  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <Icon className={c.icon} size={14} />
      <span className={`text-[11px] font-normal ${c.text} hidden md:inline`}>
        {bannerMessage}
      </span>
      {bannerAction && (
        <button
          type="button"
          onClick={handleAction}
          className={`text-[11px] font-medium ${c.text} hover:underline cursor-pointer shrink-0`}
        >
          {bannerAction}
        </button>
      )}
    </div>
  );
}
