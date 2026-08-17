"use client";

import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  Play,
  Truck,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";
import { QUOTE_STATUS_LABELS } from "@/src/graphql/quoteQueries";
import { INVOICE_STATUS_LABELS } from "@/src/graphql/invoiceQueries";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/src/graphql/purchaseOrderQueries";

// Styles par statut identiques aux cellules "Statut" des tableaux
// (use-quote-table.js, use-invoice-table.js, use-purchase-order-table.js).
const STATUS_STYLES = {
  gray: "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  emerald:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  red: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  grayLight: "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400",
};

// Configuration par type de document : labels FR (les mêmes maps que les
// tableaux) + icône/couleur par statut.
const DOCUMENT_CONFIG = {
  quote: {
    labels: QUOTE_STATUS_LABELS,
    statuses: {
      DRAFT: { icon: FileText, style: STATUS_STYLES.gray },
      PENDING: { icon: Clock, style: STATUS_STYLES.amber },
      COMPLETED: { icon: CheckCircle, style: STATUS_STYLES.emerald },
      CANCELED: { icon: XCircle, style: STATUS_STYLES.red },
      IMPORTED: { icon: Upload, style: STATUS_STYLES.blue },
    },
  },
  invoice: {
    // OVERDUE existe côté backend mais pas dans les labels front
    labels: { ...INVOICE_STATUS_LABELS, OVERDUE: "En retard" },
    statuses: {
      DRAFT: { icon: FileText, style: STATUS_STYLES.gray },
      PENDING: { icon: Clock, style: STATUS_STYLES.amber },
      OVERDUE: { icon: Clock, style: STATUS_STYLES.red },
      COMPLETED: { icon: CheckCircle, style: STATUS_STYLES.emerald },
      CANCELED: { icon: XCircle, style: STATUS_STYLES.red },
    },
  },
  purchaseOrder: {
    labels: PURCHASE_ORDER_STATUS_LABELS,
    statuses: {
      DRAFT: { icon: FileText, style: STATUS_STYLES.gray },
      CONFIRMED: { icon: Clock, style: STATUS_STYLES.amber },
      VALIDATED: { icon: CheckCircle, style: STATUS_STYLES.emerald },
      IN_PROGRESS: { icon: Play, style: STATUS_STYLES.blue },
      DELIVERED: { icon: Truck, style: STATUS_STYLES.emerald },
      CANCELED: { icon: XCircle, style: STATUS_STYLES.red },
    },
  },
};

// Badge de statut identique à celui des tableaux : pastille arrondie avec
// icône + libellé, mêmes couleurs light/dark.
export function DocumentStatusBadge({ type, status, className }) {
  const config = DOCUMENT_CONFIG[type];
  if (!config || !status) return null;

  const statusConfig = config.statuses[status] || {
    icon: FileText,
    style: STATUS_STYLES.grayLight,
  };
  const Icon = statusConfig.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap",
        statusConfig.style,
        className,
      )}
    >
      <Icon className="w-3 h-3" />
      {config.labels[status] || status}
    </span>
  );
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount || 0);
};

export const formatDocumentReference = (document) => {
  if (!document) return "";
  return document.prefix
    ? `${document.prefix}-${document.number}`
    : document.number;
};

// Ligne cliquable d'un document lié (devis, facture ou bon de commande) :
// [label] référence [tag] + montant TTC optionnel + badge de statut.
export function LinkedDocumentRow({
  type,
  document,
  label,
  tag,
  onClick,
  className,
}) {
  if (!document) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 text-sm rounded px-2 py-1.5 -mx-2",
        onClick && "cursor-pointer hover:bg-muted/50 transition-colors",
        className,
      )}
      onClick={onClick}
    >
      <span className="flex items-center gap-2 min-w-0">
        <span className="text-muted-foreground truncate">
          {label ? `${label} ` : ""}
          {formatDocumentReference(document)}
        </span>
        {tag && (
          <Badge variant="outline" className="text-xs shrink-0">
            {tag}
          </Badge>
        )}
      </span>
      <span className="flex items-center gap-2 shrink-0">
        {document.finalTotalTTC !== undefined &&
          document.finalTotalTTC !== null && (
            <span className="font-normal">
              {formatCurrency(document.finalTotalTTC)}
            </span>
          )}
        <DocumentStatusBadge type={type} status={document.status} />
      </span>
    </div>
  );
}
