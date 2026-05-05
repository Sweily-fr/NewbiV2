"use client";

import { useState } from "react";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { usePathname } from "next/navigation";
import { AlertTriangle, Info, LoaderCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";

/**
 * Bandeau persistant affiché sous le header quand l'abonnement est inactif.
 * Pousse le contenu vers le bas (pas overlay).
 * Ne s'affiche pas sur les pages billing/settings (évite le doublon).
 */
export function SubscriptionReadOnlyBanner() {
  const { bannerType, bannerMessage, bannerAction, isOwner, loading } =
    useSubscriptionAccess();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  // Don't show while loading
  if (loading || !bannerType) return null;

  // Don't show on billing/settings pages (they have their own messaging)
  if (pathname?.includes("/parametres") || pathname?.includes("/settings")) {
    return null;
  }

  const handleAction = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/billing-portal", {
        method: "POST",
      });
      const data = await response.json();
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        toast.error("Impossible d'ouvrir le portail de facturation");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const config = {
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

  const c = config[bannerType] || config.error;
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
          onClick={handleAction}
          disabled={isLoading}
          className={`shrink-0 h-7 text-xs cursor-pointer bg-transparent border-current/20 ${c.actionText} hover:bg-black/5 dark:hover:bg-white/5`}
        >
          {isLoading ? (
            <LoaderCircle className="size-3 animate-spin" />
          ) : (
            bannerAction
          )}
        </Button>
      )}
    </div>
  );
}
