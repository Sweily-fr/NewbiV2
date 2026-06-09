"use client";

import { Badge } from "@/src/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { EINVOICE_STATUS_LABELS } from "@/src/graphql/invoiceQueries";

// Variante visuelle par statut du cycle de vie SuperPDP.
const EINVOICE_STATUS_VARIANT = {
  PENDING_VALIDATION: "warning",
  VALIDATED: "default",
  SENT_TO_RECIPIENT: "default",
  RECEIVED: "default",
  ACCEPTED: "success",
  PARTIALLY_ACCEPTED: "warning",
  DISPUTED: "warning",
  ON_HOLD: "warning",
  PAYMENT_SENT: "default",
  PAID: "success",
  REFUSED: "destructive",
  REJECTED: "destructive",
  ERROR: "destructive",
};

/**
 * Badge du statut de facturation électronique (cycle de vie SuperPDP).
 *
 * Affiché uniquement pour les factures réellement transmises en e-invoicing
 * (statut différent de NOT_SENT) — les flux e-reporting / brouillons restent
 * sans badge pour ne pas afficher un trompeur « Non envoyée ».
 *
 * @param {string} status - eInvoiceStatus de la facture
 * @param {string} [lastCode] - eInvoiceLastCode brut SuperPDP (api:* / fr:*), en infobulle
 */
export function EInvoiceStatusBadge({ status, lastCode, className }) {
  if (!status || status === "NOT_SENT") return null;

  const label = EINVOICE_STATUS_LABELS[status] || status;
  const variant = EINVOICE_STATUS_VARIANT[status] || "secondary";

  const badge = (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );

  if (!lastCode) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>Code SuperPDP : {lastCode}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Badge d'alerte e-reporting (B2C / international / exonéré).
 *
 * Contrairement à l'e-invoicing, un échec d'e-reporting ne bloque pas la
 * facturation (la facture est délivrée directement au client) : la déclaration
 * est simplement re-tentée par le cron de relance. Ce badge signale qu'une
 * déclaration n'est pas encore passée, pour que l'utilisateur le sache.
 *
 * Affiché uniquement quand la transaction OU le paiement e-reporting est en
 * erreur — sinon rien (les états REPORTED / en attente ne s'affichent pas ici).
 *
 * @param {string} status - eReportingStatus
 * @param {string} paymentStatus - eReportingPaymentStatus
 * @param {string} [error] - eReportingError (message brut, en infobulle)
 */
export function EReportingErrorBadge({
  status,
  paymentStatus,
  error,
  className,
}) {
  const inError = status === "ERROR" || paymentStatus === "ERROR";
  if (!inError) return null;

  const badge = (
    <Badge variant="destructive" className={className}>
      E-reporting en erreur
    </Badge>
  );

  if (!error) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>{error}</TooltipContent>
    </Tooltip>
  );
}

export default EInvoiceStatusBadge;
