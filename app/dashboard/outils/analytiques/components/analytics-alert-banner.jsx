"use client";

import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/src/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

const SEVERITY_CONFIG = {
  danger: {
    icon: AlertCircle,
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-800 dark:text-red-200",
    iconColor: "text-red-600 dark:text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-800 dark:text-amber-200",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-800 dark:text-blue-200",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
};

const ALERT_EXPLANATIONS = {
  MARGIN: "Le taux de marge brute mesure la rentabilité de votre activité : (CA HT net - Dépenses HT) / CA HT net. Un taux inférieur à 20% signale un risque pour la pérennité de l'entreprise.",
  DSO: "Le DSO (Days Sales Outstanding) mesure le délai moyen de paiement de vos clients en jours. Un DSO élevé signifie que vos clients mettent trop de temps à payer, ce qui impacte votre trésorerie.",
  CONCENTRATION: "La concentration client mesure la part de votre CA réalisée avec vos 3 plus gros clients. Au-delà de 70%, une perte de client majeur pourrait mettre en danger votre activité.",
  OVERDUE: "Les factures en retard sont celles dont la date d'échéance est dépassée et qui ne sont pas encore payées. Un suivi régulier des relances est recommandé.",
};

export function AnalyticsAlertBanner({ alerts }) {
  const [dismissed, setDismissed] = useState(new Set());

  if (!alerts?.length) return null;

  const visibleAlerts = alerts.filter((_, i) => !dismissed.has(i));
  if (!visibleAlerts.length) return null;

  const dismiss = (index) => {
    setDismissed((prev) => new Set([...prev, index]));
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => {
        if (dismissed.has(i)) return null;
        const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
        const Icon = config.icon;
        const explanation = ALERT_EXPLANATIONS[alert.type];

        return (
          <div
            key={`${alert.type}-${i}`}
            className={cn(
              "flex items-start gap-3 rounded-lg border px-4 py-3",
              config.bg,
              config.border
            )}
          >
            <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconColor)} />
            <p className={cn("text-sm flex-1", config.text)}>
              {alert.message}
              {explanation && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className={cn("inline-flex items-center justify-center h-4 w-4 rounded-full border ml-1.5 align-text-top cursor-help", config.border, config.text)}>
                        <span className="text-[10px] font-bold leading-none">!</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="bg-[#202020] text-white border-0 max-w-xs"
                    >
                      <p>{explanation}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </p>
            <button
              onClick={() => dismiss(i)}
              className={cn("shrink-0 p-0.5 rounded hover:bg-black/5", config.text)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
