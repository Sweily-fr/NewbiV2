"use client";

import { useState } from "react";
import { AlertTriangle, LoaderCircle, Info } from "lucide-react";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { toast } from "@/src/components/ui/sonner";

export function SubscriptionExpiredBadgeHeader() {
  const { bannerType, bannerMessage, bannerAction, loading } =
    useSubscriptionAccess();
  const [isLoading, setIsLoading] = useState(false);

  if (loading || !bannerType) return null;

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
      {isLoading ? (
        <LoaderCircle className={`${c.icon} animate-spin`} size={14} />
      ) : (
        <Icon className={c.icon} size={14} />
      )}
      <span className={`text-[11px] font-normal ${c.text} hidden md:inline`}>
        {bannerMessage}
      </span>
      {bannerAction && (
        <button
          type="button"
          onClick={handleAction}
          disabled={isLoading}
          className={`text-[11px] font-medium ${c.text} hover:underline cursor-pointer disabled:opacity-50 shrink-0`}
        >
          {isLoading ? "Ouverture..." : bannerAction}
        </button>
      )}
    </div>
  );
}
