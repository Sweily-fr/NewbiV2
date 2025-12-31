"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Send,
  FileCheck,
  Loader2,
  Zap,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

/**
 * Configuration des statuts e-invoicing
 */
const STATUS_CONFIG = {
  NOT_SENT: {
    label: "Non envoyée",
    icon: Clock,
    variant: "secondary",
    color: "text-gray-500",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    description: "La facture n'a pas encore été envoyée à la plateforme PDP",
  },
  PENDING_VALIDATION: {
    label: "En validation",
    icon: Loader2,
    variant: "outline",
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    description: "La facture est en cours de validation par SuperPDP",
    animate: true,
  },
  VALIDATED: {
    label: "Validée",
    icon: FileCheck,
    variant: "outline",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    description: "La facture a été validée et est prête à être envoyée",
  },
  SENT_TO_RECIPIENT: {
    label: "Envoyée",
    icon: Send,
    variant: "outline",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    description: "La facture a été envoyée au destinataire",
  },
  RECEIVED: {
    label: "Reçue",
    icon: CheckCircle2,
    variant: "outline",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    description: "Le destinataire a reçu la facture",
  },
  ACCEPTED: {
    label: "Acceptée",
    icon: CheckCircle2,
    variant: "default",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    description: "La facture a été acceptée par le destinataire",
  },
  REJECTED: {
    label: "Rejetée",
    icon: XCircle,
    variant: "destructive",
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    description: "La facture a été rejetée par le destinataire",
  },
  PAID: {
    label: "Payée",
    icon: CheckCircle2,
    variant: "default",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    description: "La facture a été marquée comme payée",
  },
  ERROR: {
    label: "Erreur",
    icon: AlertCircle,
    variant: "destructive",
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    description: "Une erreur est survenue lors de l'envoi",
  },
};

/**
 * Badge de statut e-invoicing pour les factures
 * @param {Object} props
 * @param {string} props.status - Statut e-invoicing (NOT_SENT, PENDING_VALIDATION, etc.)
 * @param {string} props.error - Message d'erreur (optionnel)
 * @param {string} props.sentAt - Date d'envoi (optionnel)
 * @param {boolean} props.showLabel - Afficher le label textuel (défaut: true)
 * @param {string} props.size - Taille du badge (sm, md, lg)
 */
export function EInvoiceStatusBadge({
  status,
  error,
  sentAt,
  showLabel = true,
  size = "sm",
}) {
  // Si pas de statut ou NOT_SENT, ne rien afficher
  if (!status || status === "NOT_SENT") {
    return null;
  }

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_SENT;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  const tooltipContent = (
    <div className="max-w-xs">
      <p className="font-medium">{config.label}</p>
      <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
      {error && <p className="text-xs text-red-500 mt-1">Erreur: {error}</p>}
      {sentAt && (
        <p className="text-xs text-muted-foreground mt-1">
          Envoyée le{" "}
          {new Date(sentAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`
              ${sizeClasses[size]} 
              ${config.bgColor} 
              ${config.color} 
              border-current/20
              font-medium
              cursor-help
              inline-flex items-center gap-1
            `}
          >
            <Icon
              className={`
                ${iconSizes[size]} 
                ${config.animate ? "animate-spin" : ""}
              `}
            />
            {showLabel && <span>{config.label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Indicateur compact e-invoicing (icône uniquement)
 * Pour les tableaux et listes compactes
 */
export function EInvoiceIndicator({ status, error }) {
  if (!status || status === "NOT_SENT") {
    return null;
  }

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_SENT;
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${config.bgColor}`}
          >
            <Icon
              className={`h-3 w-3 ${config.color} ${config.animate ? "animate-spin" : ""}`}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-amber-500" />
            <span>E-facture: {config.label}</span>
          </div>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Badge e-invoicing pour le header de facture
 * Affiche un badge plus visible avec l'icône Zap
 */
export function EInvoiceHeaderBadge({ status, superPdpInvoiceId }) {
  if (!status || status === "NOT_SENT") {
    return null;
  }

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_SENT;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgColor} border border-current/10`}
    >
      <Zap className="h-4 w-4 text-amber-500" />
      <div className="flex flex-col">
        <span className={`text-xs font-medium ${config.color}`}>
          E-facture {config.label.toLowerCase()}
        </span>
        {superPdpInvoiceId && (
          <span className="text-[10px] text-muted-foreground">
            ID: {superPdpInvoiceId.slice(0, 8)}...
          </span>
        )}
      </div>
    </div>
  );
}
