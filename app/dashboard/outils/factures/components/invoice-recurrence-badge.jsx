"use client";

import { CalendarSync } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  formatRecurrenceDay,
  formatRecurrenceFrequency,
} from "@/src/graphql/invoiceRecurrenceQueries";

/**
 * Badge des factures récurrentes :
 * - facture modèle d'une récurrence active ou suspendue ;
 * - facture créée et envoyée automatiquement par une récurrence.
 */
export function InvoiceRecurrenceBadge({ recurrence, recurrenceOrigin }) {
  if (recurrence && ["ACTIVE", "PAUSED"].includes(recurrence.status)) {
    const isActive = recurrence.status === "ACTIVE";
    const frequency = formatRecurrenceFrequency(
      recurrence.frequency,
      recurrence.interval,
    );
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={isActive ? "info" : "secondary"} className="gap-1">
            <CalendarSync className="size-3" />
            {isActive ? "Récurrente" : "Récurrence suspendue"}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px]">
          {isActive
            ? `Prochaine facture le ${formatRecurrenceDay(recurrence.nextRunDate)}, puis ${frequency}`
            : recurrence.lastError || `Suspendue (${frequency})`}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (recurrenceOrigin?.recurrenceId) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="gap-1">
            <CalendarSync className="size-3" />
            Automatique
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          Créée et envoyée automatiquement par une facture récurrente
        </TooltipContent>
      </Tooltip>
    );
  }

  return null;
}

export default InvoiceRecurrenceBadge;
