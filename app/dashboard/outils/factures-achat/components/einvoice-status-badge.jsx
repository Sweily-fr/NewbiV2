"use client";

import { Badge } from "@/src/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

// Libellés FR du cycle de vie e-invoicing côté destinataire (facture reçue).
const PI_EINVOICE_STATUS_LABELS = {
  RECEIVED: "Reçue",
  PENDING_VALIDATION: "En cours de validation",
  VALIDATED: "Validée",
  ACCEPTED: "Acceptée",
  PARTIALLY_ACCEPTED: "Acceptée partiellement",
  DISPUTED: "En litige",
  REJECTED: "Refusée",
  PAID: "Payée",
  ERROR: "Erreur",
};

const PI_EINVOICE_STATUS_VARIANT = {
  RECEIVED: "default",
  PENDING_VALIDATION: "warning",
  VALIDATED: "default",
  ACCEPTED: "success",
  PARTIALLY_ACCEPTED: "warning",
  DISPUTED: "warning",
  REJECTED: "destructive",
  PAID: "success",
  ERROR: "destructive",
};

/**
 * Badge du statut e-invoicing d'une facture d'achat reçue (cycle de vie SuperPDP).
 * Masqué pour les factures non électroniques (NOT_APPLICABLE / absent).
 */
export function PurchaseEInvoiceStatusBadge({ status, className }) {
  if (!status || status === "NOT_APPLICABLE") return null;

  const label = PI_EINVOICE_STATUS_LABELS[status] || status;
  const variant = PI_EINVOICE_STATUS_VARIANT[status] || "secondary";

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

/**
 * Badge d'alerte : le paiement n'a pas pu être signalé à la plateforme (SuperPDP).
 * Relancé automatiquement par le cron — affiché uniquement en erreur.
 */
export function PurchaseEInvoicePaymentErrorBadge({ status, className }) {
  if (status !== "ERROR") return null;

  const badge = (
    <Badge variant="warning" className={className}>
      Paiement non signalé
    </Badge>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>
        Le paiement n&apos;a pas pu être signalé à la plateforme — relance
        automatique en cours.
      </TooltipContent>
    </Tooltip>
  );
}

export default PurchaseEInvoiceStatusBadge;
