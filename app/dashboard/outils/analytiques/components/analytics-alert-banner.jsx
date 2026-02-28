"use client";

import { AlertTriangle, AlertCircle, Info } from "lucide-react";
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
    text: "text-red-500/70 dark:text-red-400/60",
    iconColor: "text-red-400/60 dark:text-red-400/50",
  },
  warning: {
    icon: AlertTriangle,
    text: "text-amber-600/70 dark:text-amber-400/60",
    iconColor: "text-amber-500/60 dark:text-amber-400/50",
  },
  info: {
    icon: Info,
    text: "text-blue-500/70 dark:text-blue-400/60",
    iconColor: "text-blue-400/60 dark:text-blue-400/50",
  },
};

const ALERT_EXPLANATIONS = {
  MARGIN: "Le taux de marge brute mesure la rentabilité de votre activité : (CA HT net - Dépenses HT) / CA HT net. Un taux inférieur à 20% signale un risque pour la pérennité de l'entreprise.",
  DSO: "Le DSO (Days Sales Outstanding) mesure le délai moyen de paiement de vos clients en jours. Un DSO élevé signifie que vos clients mettent trop de temps à payer, ce qui impacte votre trésorerie.",
  CONCENTRATION: "La concentration client mesure la part de votre CA réalisée avec vos 3 plus gros clients. Au-delà de 70%, une perte de client majeur pourrait mettre en danger votre activité.",
  OVERDUE: "Les factures en retard sont celles dont la date d'échéance est dépassée et qui ne sont pas encore payées. Un suivi régulier des relances est recommandé.",
};

export function AnalyticsAlertBanner({ alerts }) {
  if (!alerts?.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {alerts.map((alert, i) => {
        const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
        const Icon = config.icon;
        const explanation = ALERT_EXPLANATIONS[alert.type];

        return (
          <TooltipProvider key={`${alert.type}-${i}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs cursor-default",
                    config.text
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", config.iconColor)} />
                  {alert.message}
                </span>
              </TooltipTrigger>
              {explanation && (
                <TooltipContent
                  side="bottom"
                  className="bg-[#202020] text-white border-0 max-w-xs"
                >
                  <p>{explanation}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}
